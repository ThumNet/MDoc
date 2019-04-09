import configureMarked from './helpers/markedHelper';
import checkStatus from './helpers/fetchHelper';
import MDocUI from './mdocUi';
import HashHelper from './helpers/hashHelper';
import FullscreenHelper from './helpers/fullscreenHelper';
import Treeify from './helpers/treeHelper';

const MDocConfig = {
    version: '0.7',
    settings: {
        startMdFile: 'index.md',
        settingsJson: 'settings.json',
        contentJson: 'content.json',
    },
    allContent: [],
    isIE11: !!window.MSInputMethodContext && !!document.documentMode
};

export default class MDoc {

    constructor() {

        window.addEventListener('hashchange', this.navigateToHash.bind(this), false);
        document.addEventListener('DOMContentLoaded', this.init.bind(this), false);
        document.addEventListener('keyup', this.listenKeyboard.bind(this), false);

        this.ui = new MDocUI(MDocConfig);
        this.$app = document.getElementById('app');
    }

    init() {
        console.log('init');

        configureMarked(MDocConfig.settings);
        this.loadSettings();

    }

    navigateToHash(e) {
        console.log('navigateToHash', e);

        var oldHash = HashHelper.read(e.oldURL, MDocConfig.settings);
        var newHash = HashHelper.read(e.newURL, MDocConfig.settings);
        if (newHash && newHash.mdPath) {
            if (oldHash && oldHash.mdPath === newHash.mdPath && oldHash.scrollTo !== 'mdoc-search') {
                this.scrollToHash(newHash.scrollTo);
                return;
            }

            this.loadMarkdown(newHash.mdPath);
        }
    }

    listenKeyboard(e) {
        console.log('listenKeyboard', e);
    }

    loadSettings() {
        fetch(MDocConfig.settings.settingsJson)
            .then(checkStatus)
            .then(response => response.json())
            .then(function (mySettings) {
                MDocConfig.settings = Object.assign(MDocConfig.settings, mySettings);
            })
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

    loadMarkdown(mdPath) {
        console.log('loadMarkdown', mdPath);
        fetch(mdPath)
            .then(checkStatus)
            .then(response => response.text())
            .then(this.displayMarkdown.bind(this))
            .catch(this.handleError.bind(this));
    }

    handleContent(content) {
        MDocConfig.allContent = content;
        var mdFiles = content.map(function (item) {
            return item.Path;
        });
        MDocConfig.tree = Treeify(mdFiles);
        this.displaySidebar();
    }

    displayApp() {
        console.log('displayApp');
        this.$app.innerHTML = this.ui.renderApp();

        this.$main = document.getElementById('main');
        this.$toc = document.getElementById('toc');
        this.$sidebar = document.getElementById('sidebar');

        var hash = HashHelper.read(location.hash, MDocConfig.settings);
        this.loadMarkdown(hash.mdPath);

        this.loadContent();
    }

    displayMarkdown(mdContent) {
        console.log('displayMarkdown');
        this.$app.classList.add('loaded');

        this.$main.innerHTML = this.ui.renderPrint()
            + this.ui.renderGitLinks()
            + marked(mdContent);

        if (mdContent.indexOf('```') !== -1) {
            Prism.highlightAllUnder(this.$main, false);
        }

        if (mdContent.indexOf('```mermaid') !== -1) {
            mermaid.init({ startOnLoad: false }, 'div.mermaid');
            FullscreenHelper.enableFor('div.mermaid');
        }

        this.scrollToHashOrTop();
        this.displaySidebar();
        this.displayToc();
    }

    displayToc() {
        var headers = document.querySelectorAll('#main h2, #main h3');
        this.$toc.innerHTML = this.ui.renderToc(headers);
    }

    displaySidebar() {
        this.$sidebar.innerHTML = this.ui.renderSidebar(MDocConfig.tree);

        var togglers = document.getElementsByClassName("caret");
        for (var i = 0; i < togglers.length; i++) {
            togglers[i].addEventListener("click", function () {
                this.parentElement.querySelector(".nested").classList.toggle("active");
                this.classList.toggle("caret-down");
            });
        }
    }

    handleError(error) {
        this.$app.classList.add('loaded');

        var body = '';
        if (error.response) {
            var res = error.response;
            var url = res.url.replace(window.origin, '');

            body = `<p>The requested page <strong>${url}</strong> returned ${res.status} - ${res.statusText}</p>`;
        }
        else {
            body = `<p>${error.message}<p><pre>${error.stack}</pre>`;
        }

        this.$main.innerHTML = `<div class="alert alert-danger"><h4 class="alert-heading">Oops something went wrong...</h4>${body}</div>`;
    }

    scrollToHashOrTop() {
        var hash = HashHelper.read(location.hash, MDocConfig.settings);
        var elm = this.$app;
        if (hash && hash.scrollTo) {
            elm = document.getElementById(hash.scrollTo);
        }

        elm.scrollIntoView(true);
    }
}