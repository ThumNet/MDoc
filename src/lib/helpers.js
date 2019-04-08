export function isIE11() {
  return !!window.MSInputMethodContext && !!document.documentMode;
}

export function readHash(hash) {
  var mDoc = window.mDoc;

  if (!hash || hash.indexOf("#") === -1) {
    return {
      mdPath: mDoc.settings.startMdFile,
      page: "#!"
    };
  }

  // if URL is given take only hash part!
  hash = hash.substring(hash.indexOf("#"));

  if (hash === "#!") {
    return {
      mdPath: mDoc.settings.startMdFile,
      page: "#!"
    };
  }

  var lastIndex = hash.lastIndexOf("#");
  if (lastIndex === 0) {
    return {
      mdPath: hash.substring(2),
      page: `#!${hash.substring(2)}`
    };
  }

  if (lastIndex === 2) {
    // #!#
    return {
      mdPath: mDoc.settings.startMdFile,
      page: `#!${hash.substring(2, lastIndex)}`,
      scrollTo: hash.substring(lastIndex + 1)
    };
  }

  return {
    mdPath: hash.substring(2, lastIndex),
    page: `#!${hash.substring(2, lastIndex)}`,
    scrollTo: hash.substring(lastIndex + 1)
  };
}
