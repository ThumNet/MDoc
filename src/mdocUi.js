import HashHelper from './helpers/hashHelper';

export default class MDocUI {

    constructor(config) {
        this.config = config;
    }

    renderApp() {
        return `${this.renderNav()}
            <div class="container-fluid">
                <div class="row flex-xl-nowrap">
                    <div class="col-12 col-md-3 col-xl-2 bd-sidebar" id="sidebar">                    
                    </div>
                    <div class="d-none d-xl-block col-xl-2 bd-toc" id="toc">
                    </div>                
                    <main class="col-12 col-md-9 col-xl-8 py-md-3 pl-md-5 bd-content" role="main" id="main">
                    </main>
                </div>
            </div>`;
    }

    renderNav() {
        var title = this.config.settings.title || document.title;
        return `
            <header class="navbar navbar-expand navbar-dark flex-column flex-md-row bd-navbar bg-primary">
                <a class="navbar-brand mr-0 mr-md-2" href="#!" aria-label="MDoc">${title}</a>
                <div class="navbar-nav-scroll">
                    <ul class="navbar-nav flex-row">
                        ${this.renderMenu()}
                    </ul>
                </div>
            </header>`;
    }

    renderMenu() {
        var items = this.config.settings.nav || [];
        if (items.length === 0) return '';

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

    renderPrint() {
        return `<div class="d-none d-print-block pb-3 text-muted">mDoc v${this.config.version} - Printed from <a href="${location.href}">${location.href}</a> on ${new Date().toLocaleString()}</div>`
    }

    renderGitLinks() {
        if (!this.config.settings.gitRepo) { return ''; }
        var repoUrl = this.config.settings.gitRepo;
        var mdPath = HashHelper.read(location.hash, this.config.settings).mdPath;
        var editLink, historyLink;

        if (repoUrl.indexOf('https://github.com/') === 0) {
            editLink = `${repoUrl}/blob/master/${mdPath}`;
            historyLink = `${repoUrl}/commits/master/${mdPath}`;
        } else {
            // only TFS for now...
            editLink = `${repoUrl}?path=%2F${encodeURIComponent(mdPath)}&_a=contents`;
            historyLink = `${repoUrl}?path=%2F${encodeURIComponent(mdPath)}&_a=history`;
        }

        return `<div class="gitlinks float-right">
            <a href="${editLink}">Edit</a> | <a href="${historyLink}">History</a>
        </div>`;
    }

    renderToc(headers) {
        if (!headers.length) { return ''; }

        var page = HashHelper.read(location.hash, this.config.settings).page;
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

    renderSidebar(tree) {
        if (!tree) { return ''; }

        var currentMd = HashHelper.read(location.hash, this.config.settings).mdPath;

        function renderFolderNav(path, children) {
            var html = path === '' ? '<ul>' : currentMd.indexOf(path) === 0 ? '<ul class="nested active">' : '<ul class="nested">';

            Object.keys(children).forEach(function (key) {
                if (children[key] === 'file') {
                    var className = currentMd === path + key ? 'current' : '';
                    html += `<li><a href="#!${path}${key}" class="${className}" tabindex="-1">${getNavText(key)}</a></li>`;
                } else {
                    var openList = currentMd.indexOf(path + key + '/') === 0;
                    html += `<li>
                        <span class="${openList ? 'caret caret-down' : 'caret'}">${getNavText(key)}</span>
                        <button class="admin-only" onclick="viewAll('${path + key + '/'}'); return false;">view all</button>
                        ${renderFolderNav(`${path}${key}/`, children[key])}
                    </li>`;
                }
            });
            html += '</ul>';
            return html;
        }

        return `<form class="bd-search d-flex align-items-center" onsubmit="performSearch(); return false;">
                        <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                    </form>
                    <nav class="collapse bd-links">
                        ${renderFolderNav('', tree)}
                    </nav>`;
    }

    renderSearch(term, items) {
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

}

function highlightTerm(term, content) {
    var ix = content.indexOf(term);
    return content.substring(0, ix) + '<strong>' + term + '</strong>' + content.substring(ix + term.length);
}

function getNavText(title) {
    if (title.lastIndexOf('.md') === title.length - 3) {
        title = title.slice(0, -3);
    }

    if (title.indexOf('/') !== -1) {
        title = title.slice(title.lastIndexOf('/') + 1);
    }

    if (title.length <= 3) return title.toUpperCase();

    return title.split("-").map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
}