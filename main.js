var mDoc = {};
mDoc.settings = {
    version: '0.2-alpha',
    startMdFile: 'index.md',
    debug: false
};
mDoc.allContent = [];

function init() {
    loadSettings();

    loadContent();
}

function loadSettings() {
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
            console.log(content);
            setTimeout(function () { 
                //displayDocs(content[1].Contents); 
                searchDocs('pellentesque');
            }, 1000);
        });
}

function searchDocs(term) {

    var contentSubLength = 80;
    var found = [];

    mDoc.allContent.forEach(function (item){
        var matchIndex = item.Contents.search(new RegExp(term, 'i'));
        if (matchIndex === -1) { return; }

        found.push({ 
            Path: item.Path, 
            Contents: item.Contents.substring(matchIndex-contentSubLength, matchIndex+contentSubLength) 
        });
    });

    console.log(found);

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
        if (infostring === 'mermaid') return `<div class="mermaid">${code}</div>`;

        return marked.Renderer.prototype.code.call(this, code, infostring, escaped);
    };

    marked.setOptions({
        renderer: renderer
    });
}



function renderApp() {
    var app = document.getElementById('app');
    app.innerHTML = `${renderNav()}
        <div class="container">
            <div class="row">
                <div id="sidebar" class="col-3">
                    <div class="is-position-fixed">
                        <p>Table of contents</p>
                        <nav class="toc js-toc "></nav>
                    </div>
                </div>
                <div id="doc" class="col-9"></div>
            </div>
        </div>`;

    setTimeout(function () {
        initMarkedJs();
        navigateToHashOrDefault();
    }, mDoc.settings.debug ? 1000 : 1);
}



function scrollToHash() {
    var hash = location.hash;
    if ((hash.match(/#/g) || []).length < 2) {
        return;
    }

    var elmSelector = hash.substring(hash.lastIndexOf('#') + 1);
    scrollToElement(elmSelector);
}

function scrollToElement(selector) {
    var elm = document.querySelector(selector);
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
    var doc = document.getElementById('doc');
    Prism.highlightAllUnder(doc, false);
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

    var doc = document.getElementById('doc');
    doc.innerHTML = `<div class="alert alert-danger"><h4 class="alert-heading">Oops something went wrong...</h4>${body}</div>`;

    document.getElementById('sidebar').classList.add('d-none');
}

function displayDocs(mdContent) {
    var app = document.getElementById('app');
    app.classList.add('loaded');

    var doc = document.getElementById('doc');
    doc.innerHTML = marked(mdContent);

    setTimeout(initPrism, 1);
    if (mdContent.indexOf('```mermaid') !== -1) {
        setTimeout(initMermaid, 1);
    }

    setTimeout(initToc, 1);
    setTimeout(scrollToHash, 5);

    addFullScreen('div.mermaid');
}


function navigateToHashOrDefault() {
    var app = document.getElementById('app');
    app.classList.remove('loaded');

    var hash = location.hash;
    if (hash.indexOf('#!') === 0 && hash.length > 2) {
        var path = hash.substring(2);
        loadMarkdown(path);
        return;
    }

    loadMarkdown(mDoc.settings.startMdFile);
}

function initToc() {
    //tocbot.destroy();
    tocbot.init({
        tocSelector: '.js-toc',
        contentSelector: '#doc',
        headingSelector: 'h1, h2, h3',
        collapseDepth: 3,
        onClick: function (e) {
            return false;
        }
    });
    document.getElementById('sidebar').classList.remove('d-none');
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

// var render = function (template, selector) {
//     var node = document.querySelector(selector);
//     if (!node) return;
//     node.innerHTML = template;
// } 

function renderNav() {
    var title = mDoc.settings.title || document.title;
    return `
    <nav class="navbar navbar-expand-sm navbar-dark bg-dark">
        <a class="navbar-brand" href="#!">${title}</a>
        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarMdoc" aria-controls="navbarMdoc" aria-expanded="true" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="navbar-collapse collapse show" id="navbarMdoc" style="">
            <ul class="navbar-nav mr-auto">
                ${renderMenu()}                
            </ul>
        </div>
    </nav>`;
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


window.addEventListener('hashchange', navigateToHashOrDefault, false);
document.addEventListener('DOMContentLoaded', init, false);