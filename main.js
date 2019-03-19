var mDoc = {};
mDoc.settings = {
    version: '0.6-beta',
    startMdFile: 'index.md',
    debug: false
};
mDoc.allContent = [];

function init() {
    loadSettings();
    loadContent();
}

function loadSettings() {
    initMarkedJs();

    fetch('settings.json')
        .then(function (response) { return response.json(); })
        .then(function (mySettings) {
            mDoc.settings = Object.assign(mDoc.settings, mySettings);
        })
        .finally(renderApp);
}

function loadContent() {
    fetch('content.json')
        .then(function (response) { return response.json(); })
        .then(function (content) {
            mDoc.allContent = content;
            var mdFiles = content.map(function (item) {
                return item.Path;
            });
            mDoc.tree = Treeify(mdFiles);
            // setTimeout(function () { 
            //     //displayDocs(content[1].Contents); 
            //     //searchDocs('pellentesque');
            //     //displaySidebar(mDoc.tree);
            // }, 10);
        });
}

function performSearch() {
    var termInput = document.querySelector('form input[type=search]');
    var term = termInput.value;
    if (term) {
        searchDocs(term);
        displayToc();
    }
}


function searchDocs(term) {

    var contentSubLength = 80;
    var found = [];

    mDoc.allContent.forEach(function (item) {
        var matchIndex = item.Contents.search(new RegExp(term, 'i'));
        if (matchIndex === -1) { return; }

        found.push({
            Path: item.Path,
            Contents: item.Contents.substring(matchIndex - contentSubLength, matchIndex + contentSubLength)
        });
    });

    var main = document.getElementById('main');
    main.innerHTML = renderSearch(term, found);
    location.hash = readHash(location.hash).page + '#mdoc-search';
}

function initMarkedJs() {
    var renderer = new marked.Renderer();

    renderer.link = function (href, title, text) {
        // ensure any href to an .md file (eg. ends with '.md' or contains '.md#') 
        // is routed through the hashbang!
        if (/(\.md$)|(\.md#)/.test(href)) {
            href = '#!' + href;
        }
        return marked.Renderer.prototype.link.call(this, href, title, text);
    };

    // custom table styling
    renderer.table = function (head, body) {
        if (body) body = `<tbody>${body}</tbody>`;
        return `<div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>${head}</thead>
                        ${body}
                    </table>
                </div>`;
    };

    renderer.code = function (code, infostring, escaped) {
        if (infostring === 'mermaid') { return `<div class="mermaid">${code}</div>`; }
        if (infostring === 'plantuml') { return `<img src="${createPlantUmlImgSource(code)}" />` }

        return marked.Renderer.prototype.code.call(this, code, infostring, escaped);
    };

    marked.setOptions({
        renderer: renderer
    });
}

function createPlantUmlImgSource(umlCode) {

    function encode64(data) {
        r = "";
        for (i = 0; i < data.length; i += 3) {
            if (i + 2 == data.length) {
                r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
            } else if (i + 1 == data.length) {
                r += append3bytes(data.charCodeAt(i), 0, 0);
            } else {
                r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1),
                    data.charCodeAt(i + 2));
            }
        }
        return r;
    }

    function append3bytes(b1, b2, b3) {
        c1 = b1 >> 2;
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
        c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
        c4 = b3 & 0x3F;
        r = "";
        r += encode6bit(c1 & 0x3F);
        r += encode6bit(c2 & 0x3F);
        r += encode6bit(c3 & 0x3F);
        r += encode6bit(c4 & 0x3F);
        return r;
    }

    function encode6bit(b) {
        if (b < 10) { return String.fromCharCode(48 + b); }
        b -= 10;
        if (b < 26) { return String.fromCharCode(65 + b); }
        b -= 26;
        if (b < 26) { return String.fromCharCode(97 + b); }
        b -= 26;
        if (b == 0) { return '-'; }
        if (b == 1) { return '_'; }
        return '?';
    }

    function compress(s) {
        //UTF8
        s = unescape(encodeURIComponent(s));
        return encode64(RawDeflate.deflate(s, 9));
    }

    return 'http://www.plantuml.com/plantuml/img/' + compress(umlCode);
}


function renderApp() {
    var app = document.getElementById('app');
    app.innerHTML = `${renderNav()}
        <div class="container-fluid">
            <div class="row flex-xl-nowrap">
                <div class="col-12 col-md-3 col-xl-2 bd-sidebar">
                    <form class="bd-search d-flex align-items-center" onsubmit="performSearch(); return false;">
                        <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                    </form>
                    <nav class="collapse bd-links" id="sidebar">

                    </nav>
                </div>
                <div class="d-none d-xl-block col-xl-2 bd-toc" id="toc">
                </div>
                <main class="col-12 col-md-9 col-xl-8 py-md-3 pl-md-5 bd-content" role="main" id="main">
                </main>
            </div>
        </div>`;

    setTimeout(function () {
        var hash = readHash(location.hash);
        loadMarkdown(hash.mdPath);
    }, mDoc.settings.debug ? 300 : 1);
}



function scrollToHash() {
    var hash = readHash(location.hash);
    if (!hash || !hash.scrollTo) { return; }

    scrollToElement(hash.scrollTo);
}

function scrollToElement(selector) {
    var elm = document.getElementById(selector);
    if (elm) {
        elm.scrollIntoView(true);
    }
}


function initMermaid() {
    var config = {
        startOnLoad: false
    };

    mermaid.init(config, 'div.mermaid');
}

function initPrism() {
    var main = document.getElementById('main');
    Prism.highlightAllUnder(main, false);
}

function loadMarkdown(mdPath) {
    fetch(mdPath)
        .then(fetchStatusHandler)
        .then(function (response) { return response.text() })
        .then(displayDocs)
        .catch(handleError)
}

function fetchStatusHandler(response) {
    if (response.status >= 200 && response.status < 300) {
        return response
    }

    var error = new Error(response.statusText || response.status)
    error.response = response;
    throw error;
}

function handleError(ex) {
    var app = document.getElementById('app');
    app.classList.add('loaded');

    var body = '';
    if (ex.response) {
        var res = ex.response;
        var url = res.url.replace(window.origin, '');

        body = `<p>The requested page <strong>${url}</strong> returned ${res.status} - ${res.statusText}</p>`;
    }
    else {
        body = `<p>${ex.message}<p><pre>${ex.stack}</pre>`;
    }

    var main = document.getElementById('main');
    main.innerHTML = `<div class="alert alert-danger"><h4 class="alert-heading">Oops something went wrong...</h4>${body}</div>`;
}

function displayDocs(mdContent) {
    var app = document.getElementById('app');
    app.classList.add('loaded');

    document.querySelector('form input[type=search]').value = '';
    var main = document.getElementById('main');
    main.innerHTML = renderGitLinks() + marked(mdContent);

    setTimeout(initPrism, 1);
    if (mdContent.indexOf('```mermaid') !== -1) {
        setTimeout(initMermaid, 1);
    }

    setTimeout(scrollToHash, 5);
    setTimeout(displayToc, 1);
    setTimeout(displaySidebar, 1);

    addFullScreen('div.mermaid');
}

function navigateToHash(e) {

    var oldHash = readHash(e.oldURL);
    var newHash = readHash(e.newURL);
    if (newHash && newHash.mdPath) {
        if (oldHash && oldHash.mdPath === newHash.mdPath && oldHash.scrollTo !== 'mdoc-search') {
            scrollToHash(newHash.scrollTo);
            return;
        }

        loadMarkdown(newHash.mdPath);
    }
}

function readHash(hash) {

    if (!hash || hash.indexOf('#') === -1) {
        return { mdPath: mDoc.settings.startMdFile, page: '#!' };
    }

    // if URL is given take only hash part!
    hash = hash.substring(hash.indexOf('#'));

    if (hash === '#!') {
        return { mdPath: mDoc.settings.startMdFile, page: '#!' };
    }

    var lastIndex = hash.lastIndexOf('#');
    if (lastIndex === 0) {
        return { mdPath: hash.substring(2), page: `#!${hash.substring(2)}` };
    }

    if (lastIndex === 2) { // #!#
        return { mdPath: mDoc.settings.startMdFile, page: `#!${hash.substring(2, lastIndex)}`, scrollTo: hash.substring(lastIndex + 1) };
    }

    return { mdPath: hash.substring(2, lastIndex), page: `#!${hash.substring(2, lastIndex)}`, scrollTo: hash.substring(lastIndex + 1) };
}

function displayToc() {
    var headers = document.querySelectorAll('#main h2, #main h3');
    document.getElementById('toc').innerHTML = renderToc(headers);
}

function displaySidebar() {
    document.getElementById('sidebar').innerHTML = renderSidebar(mDoc.tree);

    var toggler = document.getElementsByClassName("caret");
    var i;

    for (i = 0; i < toggler.length; i++) {
        toggler[i].addEventListener("click", function () {
            this.parentElement.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("caret-down");
        });
    }
}

function renderGitLinks() {
    if (!mDoc.settings.gitRepo) { return ''; }
    var repoUrl = mDoc.settings.gitRepo;
    var mdPath = readHash(location.hash).mdPath;
    var editLink, historyLink;

    if (repoUrl.indexOf('https://github.com/') === 0) {
        editLink = `${repoUrl}/blob/master/${mdPath}`;
        historyLink = `${repoUrl}/commits/master/${mdPath}`;
    } else {
        // only TFS for now...
        editLink = `${repoUrl}?path=%2F${encodeURIComponent(mdPath)}&_a=contents`;
        historyLink = `${repoUrl}?path=%2F${encodeURIComponent(mdPath)}&_a=history`;
    }

    return `<div class="float-right">
        <a href="${editLink}">Edit</a> | <a href="${historyLink}">History</a>
    </div>`;
}

function renderToc(headers) {
    if (!headers.length) { return ''; }

    var page = readHash(location.hash).page;
    var currentLevel = 2;
    var html = '<ul class="section-nav">';
    for (var i = 0, len = headers.length; i < len; i++) {
        var level = parseInt(headers[i].tagName.substring(1));
        var levelNext = i < len - 1 ? parseInt(headers[i + 1].tagName.substring(1)) : level;

        html += `<li class="toc-entry toc-h${level}">
                    <a href="${page}#${headers[i].id}" tabindex="-1">${headers[i].textContent}</a>`;

        if (level === levelNext) {
            html += '</li>';
        } else if (levelNext > level) {
            html += '<ul>';
        } else {
            html += '</li></ul>';
        }
        currentLevel = level;
    }

    if (currentLevel > 2) {
        html += '</ul>'.repeat(currentLevel - 2);
    }

    html += '</ul>';
    return html;
}

function renderSidebar(tree) {
    if (!tree) { return ''; }

    var currentMd = readHash(location.hash).mdPath;

    function renderFolderNav(path, children) {
        var html = path === '' ? '<ul>' : currentMd.indexOf(path) === 0 ? '<ul class="nested active">' : '<ul class="nested">';

        Object.keys(children).forEach(function (key) {
            if (children[key] === 'file') {
                var className = currentMd === path + key ? 'current' : '';
                html += `<li><a href="#!${path}${key}" class="${className}" tabindex="-1">${getNavText(key)}</a></li>`;
            } else {
                var openList = currentMd.indexOf(path+key+'/') === 0;
                html += `<li><span class="${openList ? 'caret caret-down' : 'caret'}">${getNavText(key)}</span>${renderFolderNav(`${path}${key}/`, children[key])}</li>`;
            }
        });
        html += '</ul>';
        return html;
    }

    var html = renderFolderNav('', tree);
    return html;
}

function addFullScreen(selector) {

    [].forEach.call(document.querySelectorAll(selector), function (el) {
        el.addEventListener('click', function () {
            // code…
            if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
                RunPrefixMethod(document, "CancelFullScreen");
            }
            else {
                RunPrefixMethod(el, "RequestFullScreen");
            }
        })
    });

}

function renderNav() {
    var title = mDoc.settings.title || document.title;
    return `
    <header class="navbar navbar-expand navbar-dark flex-column flex-md-row bd-navbar bg-primary">
        <a class="navbar-brand mr-0 mr-md-2" href="#!" aria-label="MDoc">${title}</a>
        <div class="navbar-nav-scroll">
            <ul class="navbar-nav flex-row">
            ${renderMenu()}
            </ul>
        </div>
    </header>`;
}

function renderMenu() {
    var items = mDoc.settings.nav || [];
    if (items.length === 0) return;

    var html = '';
    items.forEach(function (item) {
        var hashbang = '#!' + item.href;
        var active = location.hash === hashbang ? 'active' : '';
        html += `<li class="nav-item ${active}">
                    <a class="nav-link" href="${hashbang}">${item.title}</a>
                </li>`;
    });
    return html;
}

function renderSearch(term, items) {
    var html = `<h1>Search results</h1>
        <p><strong>${items.length}</strong> results where found for the search for <strong>${term}</strong><p>`;
    items.forEach(function (item) {
        html += `<div>
                <h4><a href="#!${item.Path}">${getNavText(item.Path)}</a></h4>
                <p>
                    ...${highlightTerm(term, item.Contents)}...
                    <br /><small><a href="#!${item.Path}" tabindex="-1" class="text-muted">${item.Path}</a></small>  
                </p>
            </div>`;
    });

    return html;
}

function highlightTerm(term, content) {
    var ix = content.indexOf(term);
    return content.substring(0, ix) + '<strong>' + term + '</strong>' + content.substring(ix + term.length);
}

function getNavText(title) {
    if (title.lastIndexOf('.md') === title.length -3) {
        title = title.slice(0, -3);
    }

    if (title.indexOf('/') !== -1){
        title = title.slice(title.lastIndexOf('/')+1);
    }

    if (title.length <= 3) return title.toUpperCase();

    return title.split("-").map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
}


var pfx = ["webkit", "moz", "ms", "o", ""];
function RunPrefixMethod(obj, method) {

    var p = 0, m, t;
    while (p < pfx.length && !obj[m]) {
        m = method;
        if (pfx[p] == "") {
            m = m.substr(0, 1).toLowerCase() + m.substr(1);
        }
        m = pfx[p] + m;
        t = typeof obj[m];
        if (t != "undefined") {
            pfx = [pfx[p]];
            return (t == "function" ? obj[m]() : obj[m]);
        }
        p++;
    }
}

function Treeify(files) {
    var fileTree = {};

    if (files instanceof Array === false) {
        throw new Error('Expected an Array of file paths, but saw ' + files);
    }

    function mergePathsIntoFileTree(prevDir, currDir, i, filePath) {

        if (i === filePath.length - 1) {
            prevDir[currDir] = 'file';
        }

        if (!prevDir.hasOwnProperty(currDir)) {
            prevDir[currDir] = {};
        }

        return prevDir[currDir];
    }

    function parseFilePath(filePath) {
        var fileLocation = filePath.split('/');

        // If file is in root directory, eg 'index.js'
        if (fileLocation.length === 1) {
            return (fileTree[fileLocation[0]] = 'file');
        }

        fileLocation.reduce(mergePathsIntoFileTree, fileTree);
    }

    files.forEach(parseFilePath);

    return fileTree;
}


window.addEventListener('hashchange', navigateToHash, false);
document.addEventListener('DOMContentLoaded', init, false);