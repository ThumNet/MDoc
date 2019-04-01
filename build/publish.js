const { inlineSource } = require('inline-source');
const fs = require('fs');
const path = require('path');
const htmlpath = path.resolve('./index.html');
const babel = require('babel-core');

const transformOptions = {
    compact: true,
    presets: ["env"]
};

function transpile(source, context) {
    
    if (source.extension === 'js' && source.props.transpile) {
        var transformed = babel.transform(source.fileContent, transformOptions);
        source.content = transformed.code;
    }

    return Promise.resolve();
}


inlineSource(htmlpath, {
    compress: true,
    rootpath: path.resolve('./'),
    // Skip all css types and png formats
    ignore: ['png'],
    handlers: [transpile]
}).then(html => {
    // Do something with html
    //console.log(html);
    fs.writeFileSync('./dist/index.html', html, { encoding: 'utf8', flag: 'w' });
    fs.copyFileSync('./dist/index.html', './sample/index.html');
}).catch(err => {
    // Handle error
    console.error(err)
});