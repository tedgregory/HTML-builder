const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const mkdir = util.promisify(fs.mkdir);
const rm = util.promisify(fs.rm);
const copyFile = util.promisify(fs.copyFile);

const originalDir = path.resolve(__dirname, 'files');
const destinationDir = path.resolve(__dirname, 'files-copy');

copyFiles(originalDir, destinationDir);

// works recursively
async function copyFiles(fromDir, toDir) {
  await resetDestinationDir(toDir);
  const items = await readdir(fromDir, {withFileTypes: true});
  for (let item of items) {
    let 
      newFrom = path.join(fromDir, item.name), 
      newTo = path.join(toDir, item.name);
    if (item.isFile()) {
      await copyFile(newFrom, newTo);
    } else {
      await copyFiles(newFrom, newTo);
    }
  }
}

async function resetDestinationDir (destinationPath) {
  await rm(destinationPath, {recursive: true}).catch(err => console.log('rm ERROR:' + err)).then(() => mkdir(destinationPath, {recursive: true}));
}
