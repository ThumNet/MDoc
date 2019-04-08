import { isIE11, readHash } from "./helpers";

export default function initMarkedJs() {
  var marked = window.marked;

  if (marked.defaults.renderer.configured) {
    return;
  }

  console.log("Configuring marked.js");
  var renderer = new marked.Renderer();

  renderer.link = function(href, title, text) {
    // ensure any href to an .md file (eg. ends with '.md' or contains '.md#')
    // is routed through the hashbang!
    if (/(\.md$)|(\.md#)/.test(href)) {
      href = "/#/" + determineHref(href);
    }
    return marked.Renderer.prototype.link.call(this, href, title, text);
  };

  renderer.image = function(href, title, text) {
    return marked.Renderer.prototype.image.call(
      this,
      determineHref(href),
      title,
      text
    );
  };

  // custom table styling
  renderer.table = function(head, body) {
    if (body) body = `<tbody>${body}</tbody>`;
    return `<div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>${head}</thead>
                        ${body}
                    </table>
                </div>`;
  };

  renderer.code = function(code, infostring, escaped) {
    if (infostring === "mermaid") {
      if (isIE11()) {
        return `<div class="alert alert-danger" role="alert">Mermaid is not supported when using Internet Explorer!</div><pre class="language-mermaid"><code>${code}</code></pre>`;
      }
      return `<div class="mermaid">${code}</div>`;
    }
    if (infostring === "plantuml") {
      return `<img src="${createPlantUmlImgSource(code)}" />`;
    }

    return marked.Renderer.prototype.code.call(this, code, infostring, escaped);
  };

  renderer.configured = true;

  marked.setOptions({
    renderer: renderer
  });
}

function determineHref(href) {
  function dirName(path) {
    var ix = path.lastIndexOf("/");
    return ix === -1 ? null : path.substring(0, ix);
  }

  var isAbsoluteUrl = href && href.indexOf("://") !== -1;
  var isAbsolutePath = !isAbsoluteUrl && href.indexOf("/") === 0;
  var currentDir = dirName(readHash(location.hash).mdPath);

  if (isAbsoluteUrl || isAbsolutePath || !currentDir) {
    return href;
  }

  return currentDir + "/" + href;
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
        r += append3bytes(
          data.charCodeAt(i),
          data.charCodeAt(i + 1),
          data.charCodeAt(i + 2)
        );
      }
    }
    return r;
  }

  function append3bytes(b1, b2, b3) {
    var c1 = b1 >> 2;
    var c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    var c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
    var c4 = b3 & 0x3f;
    var r = "";
    r += encode6bit(c1 & 0x3f);
    r += encode6bit(c2 & 0x3f);
    r += encode6bit(c3 & 0x3f);
    r += encode6bit(c4 & 0x3f);
    return r;
  }

  function encode6bit(b) {
    if (b < 10) {
      return String.fromCharCode(48 + b);
    }
    b -= 10;
    if (b < 26) {
      return String.fromCharCode(65 + b);
    }
    b -= 26;
    if (b < 26) {
      return String.fromCharCode(97 + b);
    }
    b -= 26;
    if (b == 0) {
      return "-";
    }
    if (b == 1) {
      return "_";
    }
    return "?";
  }

  function compress(s) {
    //UTF8
    s = unescape(encodeURIComponent(s));
    return encode64(window.RawDeflate.deflate(s, 9));
  }

  return "http://www.plantuml.com/plantuml/img/" + compress(umlCode);
}