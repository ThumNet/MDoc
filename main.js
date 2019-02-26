var mDoc = {};
mDoc.settings = {
    version: '0.2-alpha', 
    startMdFile: 'index.md',
    debug: false
};

function init() {
    loadSettings();
}

function loadSettings() {
    fetch('settings.json')
        .then(function (response) { return response.json(); })
        .then(function (mySettings) {
            mDoc.settings = Object.assign(mDoc.settings, mySettings);
        })
        .finally(renderApp);
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

    marked.setOptions({
        renderer: renderer
    });
}



function renderApp() {
    var app = document.getElementById('app');
    app.innerHTML = `${renderNav()}
        <div class="container">
            <div class="row">
                <div class="col-3">
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
    mermaid.init('code.language-mermaid');
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
    error.response = response
    throw error;
}

function handleError(ex) {
    alert(ex);
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
}


function navigateToHashOrDefault() {
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


window.addEventListener('hashchange', navigateToHashOrDefault, false);
document.addEventListener('DOMContentLoaded', init, false);