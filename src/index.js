import MDoc from "./mdoc";

(function () {

    if (!window.HashChangeEvent) { // IE polyfill
        var lastURL = document.URL;
        window.addEventListener("hashchange", function (e) {
            var oldURL = lastURL;
            var newURL = document.URL;
            lastURL = newURL;
            Object.defineProperties(e, {
                oldURL: { enumerable: true, configurable: true, value: oldURL },
                newURL: { enumerable: true, configurable: true, value: newURL }
            });
        });
    }

    if (!String.prototype.repeat) { // IE polyfill
        String.prototype.repeat = function (num) {
            return new Array(isNaN(num) ? 1 : ++num).join(this);
        }
    }

})();

// Needs to be last otherwise the polyfill for HashChange doesnt work
window.mdoc = new MDoc();
