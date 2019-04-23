export default class FullscreenHelper {
    static enableFor(selector, fullscreenSelector) {

        [].forEach.call(document.querySelectorAll(selector), function (el) {
            el.addEventListener('click', function () {
                if (RunPrefixMethod(document, "FullScreen") || RunPrefixMethod(document, "IsFullScreen")) {
                    RunPrefixMethod(document, "CancelFullScreen");
                }
                else {
                    var fullscreenElm = fullscreenSelector ? el.closest(fullscreenSelector) : el;
                    RunPrefixMethod(fullscreenElm, "RequestFullScreen");
                }
            })
        });
    
    }
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