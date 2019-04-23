export default function Treeify(files) {
    var fileTree = {};

    if (files instanceof Array === false) {
        throw new Error('Expected an Array of file paths, but saw ' + files);
    }

    function mergePathsIntoFileTree(prevDir, currDir, i, filePath) {

        if (i === filePath.length - 1) {
            prevDir[currDir] = 'file';
        }

        if (!prevDir.hasOwnProperty(currDir)) {
            prevDir[currDir] = {};
        }

        return prevDir[currDir];
    }

    function parseFilePath(filePath) {
        var fileLocation = filePath.split('/');

        // If file is in root directory, eg 'index.js'
        if (fileLocation.length === 1) {
            return (fileTree[fileLocation[0]] = 'file');
        }

        fileLocation.reduce(mergePathsIntoFileTree, fileTree);
    }

    files.forEach(parseFilePath);

    return fileTree;
}