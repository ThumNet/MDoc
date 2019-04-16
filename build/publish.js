const { inlineSource } = require('inline-source');
const fs = require('fs');
const path = require('path');
const htmlpath = path.resolve('./dist/index.html');

inlineSource(htmlpath, {
    compress: true,
    rootpath: path.resolve('./dist'),
    // Skip all css types and png formats
    ignore: ['png']
}).then(html => {
    // Do something with html
    //console.log(html);
    fs.copyFileSync('./dist/index.html', './dist/index-original.html');
    fs.writeFileSync('./dist/index.html', html, { encoding: 'utf8', flag: 'w' });
}).catch(err => {
    // Handle error
    console.error(err)
});