const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);
const readFile = util.promisify(fs.readFile);

const stylesDir = path.resolve(__dirname, 'styles');
const bundlePath = path.resolve(__dirname, 'project-dist', 'bundle.css');

createBundle(stylesDir, bundlePath);

async function parseStyles(fromDir) {
  const items = await readdir(fromDir, {withFileTypes: true});
  const bundlesCollection = [];
  for (let item of items) {
    let currentPath = path.resolve(fromDir, item.name);
    if (item.isFile() && path.parse(currentPath).ext === '.css') {
      bundlesCollection.push((await readFile(currentPath)).toString());
    } 
  }
  return bundlesCollection;
}

async function createBundle (stylesPath, pathToBundle) {
  parseStyles(stylesPath)
    .then(async styleData => {
      await writeFile(pathToBundle, '');
      styleData.forEach(async item => {
        if (item.length) {
          await appendFile(pathToBundle, item);
        }
      });
    })
    .catch(err => console.log('Error writing bundle:' + err));
}
