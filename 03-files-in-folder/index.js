const fs = require('fs');
const path = require('path');
const util = require('util');

const stat = util.promisify(fs.stat);
const readdir = util.promisify(fs.readdir);

async function readFiles(dir){
  let resTree = {};
  let files = await readdir(path.resolve(__dirname, dir), {withFileTypes: true});
  for (let item of files) {
    if(item.isFile()){
      resTree[item.name] = [];
      resTree[item.name].push(path.parse(item.name).name);
      resTree[item.name].push(path.parse(item.name).ext.slice(1));
      let fStats = await stat(path.resolve(__dirname, dir, item.name));
      //file size converted from bytes to kB by 1024 with 3 digits after point
      resTree[item.name].push(Number(fStats.size / 1024).toFixed(3));
    }
  }
  return resTree;
} 

readFiles('secret-folder').then(data => {
  Object.keys(data).forEach(key =>{
    console.log(data[key].join(' - ')+'kb');
  });
});
