import HashHelper from './hashHelper';

export default function configureMarked() {
    
    var renderer = new marked.Renderer();

    renderer.link = function (href, title, text) {
        // ensure any href to an .md file (eg. ends with '.md' or contains '.md#') 
        // is routed through the hashbang!
        if (/(\.md$)|(\.md#)/.test(href)) {
            href = '#!' + determineHref(href);
        }
        return marked.Renderer.prototype.link.call(this, href, title, text);
    };

    renderer.image = function (href, title, text) {
        return marked.Renderer.prototype.image.call(this, determineHref(href), title, text);
    }

    renderer.paragraph = function (text) {
        var alert = readAlert(text);
        if (alert) {
            return `<p class="alert ${alert.className}">${text}</p>\n`;
        }
        return marked.Renderer.prototype.paragraph.call(this, text);
    }

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
        if (infostring === 'mermaid') {
            if (isIE11()) {
                return `<div class="alert alert-danger" role="alert">Mermaid is not supported when using Internet Explorer!</div><pre class="language-mermaid"><code>${code}</code></pre>`;
            }
            return `<div class="mermaid">${code}</div>`;

        }
        if (infostring === 'plantuml') { return `<img src="${createPlantUmlImgSource(code)}" />` }

        return marked.Renderer.prototype.code.call(this, code, infostring, escaped);
    };

    marked.setOptions({
        renderer: renderer
    });
}

function determineHref(href) {

    function dirName(path) {
        var ix = path.lastIndexOf('/');
        return ix === -1 ? null : path.substring(0, ix);
    }

    var isAbsoluteUrl = href && href.indexOf('://') !== -1;
    var isAbsolutePath = !isAbsoluteUrl && href.indexOf('/') === 0;
    var currentDir = dirName(HashHelper.read(location.hash).mdPath);

    if (isAbsoluteUrl || isAbsolutePath || !currentDir) {
        return href;
    }

    return currentDir + '/' + href;
}

function createPlantUmlImgSource(umlCode) {

    function encode64(data) {
        var r = "";
        for (var i = 0; i < data.length; i += 3) {
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
        var c1 = b1 >> 2;
        var c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
        var c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
        var c4 = b3 & 0x3F;
        var r = "";
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

function readAlert(text) {

    var alertTypes = [ 
        { trigger: 'hint', className: 'alert-success' },
        { trigger: 'tip', className: 'alert-success' },
        { trigger: 'attention', className: 'alert-warning' },
        { trigger: 'warning', className: 'alert-warning' },
        { trigger: 'note', className: 'alert-info' },
        { trigger: 'danger', className: 'alert-danger' },
    ];

    for (var i=0, len=alertTypes.length; i<len; i++) {
        var r = new RegExp(`^${alertTypes[i].trigger}(:|!)+.*`, 'i');
        if (text.match(r)) {
            return alertTypes[i];
        }
    }

    return null;
}

function isIE11() {
    return !!window.MSInputMethodContext && !!document.documentMode;
}