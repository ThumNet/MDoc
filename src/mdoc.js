import configureMarked from './helpers/markedHelper';
import checkStatus from './helpers/fetchHelper';
import MDocUI from './mdocUi';
import HashHelper from './helpers/hashHelper';
import FullscreenHelper from './helpers/fullscreenHelper';
import Treeify from './helpers/treeHelper';

const MDocConfig = {
    version: '1.2',
    settings: {
        startMdFile: 'index.md',
        settingsJson: 'settings.json',
        contentJson: 'content.json',
        defaultTheme: 'flatly',
    },
    allContent: [],
};

export default class MDoc {

    constructor() {

        window.addEventListener('hashchange', this.navigateToHash.bind(this), false);
        document.addEventListener('DOMContentLoaded', this.init.bind(this), false);
        document.addEventListener('keyup', this.listenKeyboard.bind(this), false);

        this.settings = MDocConfig.settings;
        this.$app = document.getElementById('app');
    }

    init() {
        configureMarked();
        this.loadSettings();
        this.loadTheme();
    }

    navigateToHash(e) {
        var oldHash = HashHelper.read(e.oldURL);
        var newHash = HashHelper.read(e.newURL);
        if (newHash && newHash.mdPath) {
            if (oldHash && oldHash.mdPath === newHash.mdPath && oldHash.scrollTo !== 'mdoc-search') {
                this.scrollToHashOrTop(newHash.scrollTo);
                return;
            }

            this.loadMarkdown(newHash.mdPath);
        }
    }

    listenKeyboard(e) {
        if (e.shiftKey && e.ctrlKey && e.which === 65) { // CTRL + SHIFT + A
            this.$app.classList.toggle('admin-mode');
        }
    }

    loadSettings() {
        fetch(MDocConfig.settings.settingsJson)
            .then(checkStatus)
            .then(response => response.json())
            .then(mySettings => MDocConfig.settings = Object.assign(MDocConfig.settings, mySettings))
            .finally(this.displayApp.bind(this));
    }

    loadContent() {
        fetch(MDocConfig.settings.contentJson)
            .then(checkStatus)
            .then(response => response.json())
            .then(this.handleContent.bind(this))
            .catch(function (error) {
                console.error('Unabled to load contentJson', error);
            });
    }

    loadTheme() {
        var themeName = localStorage.getItem('themeName') || MDocConfig.settings.defaultTheme;
        
        var link = document.getElementById('themeLink');
        if (link)
        {
            // TODO validate themeName against constant
            link.href = this.getThemeUrl(themeName);
            return;
        }

        var link = document.createElement('link');
        link.id = 'themeLink';
        link.rel = 'stylesheet';
        link.href = this.getThemeUrl(themeName);
        var afterNode = document.querySelector('link[rel="icon"]');
        afterNode.parentNode.insertBefore(link, afterNode.nextSibling);
    }

    loadMarkdown(mdPath) {
        console.log('loadMarkdown', mdPath);
        fetch(mdPath)
            .then(checkStatus)
            .then(response => response.text())
            .then(this.displayMarkdown.bind(this))
            .catch(this.displayError.bind(this));
    }

    handleContent(content) {
        MDocConfig.allContent = content;
        var mdFiles = content.map(item => item.Path);
        MDocConfig.tree = Treeify(mdFiles);
        this.displaySidebar();
    }

    performSearch() {
        var termInput = document.querySelector('form input[type=search]');
        var term = termInput.value;
        if (term) {
            this.searchDocs(term);
            this.displayToc();
        }
    }

    searchDocs(term) {
        var contentSubLength = 80;
        var found = [];
    
        MDocConfig.allContent.forEach(function (item) {
            var matchIndex = item.Contents.search(new RegExp(term, 'i'));
            if (matchIndex === -1) { return; }
    
            found.push({
                Path: item.Path,
                Contents: item.Contents.substring(matchIndex - contentSubLength, matchIndex + contentSubLength)
            });
        });
    
        this.$main.innerHTML = MDocUI.renderSearch(term, found);
        location.hash = HashHelper.read(location.hash).page + '#mdoc-search';
    }

    displayApp() {
        this.$app.innerHTML = MDocUI.renderApp(MDocConfig.settings.title, 
            MDocConfig.settings.nav, MDocConfig.version);

        this.$main = document.getElementById('main');
        this.$toc = document.getElementById('toc');
        this.$sidebar = document.getElementById('sidebar');

        var hash = HashHelper.read(location.hash);
        this.loadMarkdown(hash.mdPath);

        this.loadContent();
    }

    displayMarkdown(mdContent) {
        this.$app.classList.add('loaded');

        this.$main.innerHTML = MDocUI.renderPrint(MDocConfig.version)
            + MDocUI.renderGitLinks(MDocConfig.settings.gitRepo)
            + marked(mdContent);
            
        this.triggerMarkownRenderers();
    }

    displayToc() {
        var headers = document.querySelectorAll('#main h2, #main h3');
        this.$toc.innerHTML = MDocUI.renderToc(headers);
    }

    displaySidebar() {
        this.$sidebar.innerHTML = MDocUI.renderSidebar(MDocConfig.tree);

        var togglers = document.getElementsByClassName("caret");
        for (var i = 0; i < togglers.length; i++) {
            togglers[i].addEventListener("click", function () {
                this.parentElement.querySelector(".nested").classList.toggle("active");
                this.classList.toggle("caret-down");
            });
        }
    }

    displayUnderPath(path) {
        var files = MDocConfig.allContent.filter(file => file.Path.indexOf(path) === 0);

        var html = `<h1>Showing all files under: ${path}</h1>`;
        files.forEach(function (file) {
            // html += `<p class="text-muted">${file.Path}</p>
            //         <hr>
            //          ${marked(file.Contents)}`;
            html += marked(file.Contents);
        });
        this.$main.innerHTML = html;

        this.triggerMarkownRenderers();
    }

    displayError(error) {
        this.$app.classList.add('loaded');
        this.$main.innerHTML = MDocUI.renderError(error);
    }

    scrollToHashOrTop() {
        var hash = HashHelper.read(location.hash);
        var elm = this.$app;
        if (hash && hash.scrollTo) {
            elm = document.getElementById(hash.scrollTo);
        }

        elm.scrollIntoView(true);
    }

    setTheme(themeName) {
        localStorage.setItem('themeName', themeName);
        this.loadTheme();        
    }

    resetTheme() {
        localStorage.removeItem('themeName');
        this.loadTheme();
    }

    getThemeUrl(themeName) {
        return `https://netdna.bootstrapcdn.com/bootswatch/4.3.1/${themeName.toLowerCase()}/bootstrap.min.css`;        
    }

    triggerMarkownRenderers() {
        if (this.$main.innerHTML.indexOf('<code class="') !== -1) {
            Prism.highlightAllUnder(this.$main, false);
        }

        if (this.$main.innerHTML.indexOf('<div class="mermaid"') !== -1) {
            mermaid.init({ startOnLoad: false }, 'div.mermaid');
            FullscreenHelper.enableFor('div.mermaid');
        }

        FullscreenHelper.enableFor('table.table-striped thead', 'table.table-striped')

        this.scrollToHashOrTop();
        this.displaySidebar();
        this.displayToc();
    }
}