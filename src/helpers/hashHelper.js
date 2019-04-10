export default class HashHelper {

    static read(hash) {

        var startMdFile = window.mdoc.settings.startMdFile;

        if (!hash || hash.indexOf('#') === -1) {
            return { mdPath: startMdFile, page: '#!' };
        }

        // if URL is given take only hash part!
        hash = hash.substring(hash.indexOf('#'));

        if (hash === '#!') {
            return { mdPath: startMdFile, page: '#!' };
        }

        var lastIndex = hash.lastIndexOf('#');
        if (lastIndex === 0) {
            return { mdPath: hash.substring(2), page: `#!${hash.substring(2)}` };
        }

        if (lastIndex === 2) { // #!#
            return { mdPath: sstartMdFile, page: `#!${hash.substring(2, lastIndex)}`, scrollTo: hash.substring(lastIndex + 1) };
        }

        return { mdPath: hash.substring(2, lastIndex), page: `#!${hash.substring(2, lastIndex)}`, scrollTo: hash.substring(lastIndex + 1) };
    }
}