const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const appendFile = util.promisify(fs.appendFile);
const readFile = util.promisify(fs.readFile);
const mkdir = util.promisify(fs.mkdir);
const rm = util.promisify(fs.rm);
const copyFile = util.promisify(fs.copyFile);
// const readline = require('readline');

const distDirPath = path.resolve(__dirname, 'project-dist');
const stylesDir = path.resolve(__dirname, 'styles');
const cssBundlePath = path.resolve(distDirPath, 'style.css');
const entryTplPath = path.resolve(__dirname, 'template.html');
const htmlBundlePath = path.resolve(distDirPath, 'index.html');
const componentsDir = path.resolve(__dirname, 'components');
const TAB = ' ';


// Main steps
// Prepare dist dir
resetDestinationDir(distDirPath, true)
  .then(async () => {
    // move assets
    await copyFiles(path.resolve(__dirname, 'assets'), path.resolve(distDirPath, 'assets'));
    // merge styles into one css
    await createCssBundle(stylesDir, cssBundlePath);
    // builds template
    await templateBuilder(entryTplPath, componentsDir, htmlBundlePath); 
  })
  .catch((e) => console.log('ERROR: ' + e));

/** takes a root template, replaces all placeholders with respective component's content
 * 
 * @param {string} indexTplPath full path to entry html template 
 * @param {string} compDirName 
 * @param {string} distPath 
 */
async function templateBuilder (indexTplPath, compDirPath, htmlBundlePath){
  let componentsContent = await parseComponentTemplates(compDirPath);
  let indexTemplateContent =  (await readFile(indexTplPath)).toString();
  let placeholdersSet = indexTemplateContent.match(new RegExp(`[${TAB}]*.?{{.+}}`, 'g'));
  placeholdersSet
    .map(el => {
      return {
        tab: el.lastIndexOf(TAB) + 1, // to indent an inserted code according to placeholder's indent
        name: el.trim().slice(2,-2) // clean placeholder name
      };
    })
    .forEach(holder => {
      indexTemplateContent = indexTemplateContent
        .replace(
          `{{${holder.name}}}`, 
          componentsContent[holder.name]
            .split('\n')
            .map(line => TAB.repeat(holder.tab) + line)
            .join('\n')
            .trim()
        );
    });
  await writeFile(htmlBundlePath, indexTemplateContent);
}

/** non-recursively reads contents of html files into an object
 * 
 * @param {string} dir directory to search
 * @returns {Object} with key - file name without extension, value - it's content string
 */
async function parseComponentTemplates(dir) {
  let resTree = {};
  let files = await readdir(dir, {withFileTypes: true});
  for (let item of files) {
    let currentPath = path.resolve(dir, item.name);
    if(item.isFile() && path.parse(currentPath).ext === '.html') {
      resTree[path.parse(currentPath).name] = (await readFile(currentPath)).toString();
    }
  }
  return await resTree;
}

/**
 * Directory copy, works recursively
 * 
 * @param {string} fromDir 
 * @param {string} toDir 
 */
async function copyFiles(fromDir, toDir) {
  await resetDestinationDir(toDir);
  const items = await readdir(fromDir, {withFileTypes: true});
  for (let item of items) {
    let 
      newFrom = path.join(fromDir, item.name), 
      newTo = path.join(toDir, item.name);
    if (item.isFile()) {
      await copyFile(newFrom, newTo);
    } else if (item.isDirectory()) {
      await copyFiles(newFrom, newTo);
    }
  }
}
/** Clears the destination and recreates an ampty dir
 * 
 * @param {string} destinationPath 
 *
 */
async function resetDestinationDir (destinationPath, remake = false) {
  if (remake) {
    await rm(destinationPath, {recursive: true,  force: true}).catch(() => console.log('RM ERROR'));
  }
  await mkdir(destinationPath, {recursive: true}).catch(() => console.log('MKDIR ERROR'));
}
/** Reads css files from specified path and returns a list of their contents
 * 
 * @param {string} fromDir 
 * @returns {Array}
 */
async function parseStyles(fromDir) {
  const items = await readdir(fromDir, {withFileTypes: true});
  const bundleChunks = {};
  for (let item of items) {
    let currentPath = path.resolve(fromDir, item.name);
    if (item.isFile() && path.parse(currentPath).ext === '.css') {
      bundleChunks[item.name] = (await readFile(currentPath)).toString() + '\n';
    } 
  }
  return bundleChunks;
}

/** joins css files from first path into a single bundle with given name
 * 
 * @param {string} stylesPath 
 * @param {string} pathToBundle 
 */
async function createCssBundle (stylesPath, pathToBundle) {
  parseStyles(stylesPath)
    .then(async styleData => {
      let {['header.css']: header, ['main.css']: main, ['footer.css']: footer, ...restStyles} = styleData;
      // first clear existing text
      await writeFile(pathToBundle, '');
      // add components according to html markup
      await appendFile(pathToBundle, header);
      await appendFile(pathToBundle, main);
      await appendFile(pathToBundle, footer);
      for (let chunk in restStyles){
        if (restStyles[chunk].length){
          await appendFile(pathToBundle, restStyles[chunk]);
        }
      }
    })
    .catch(err => console.log('Error packing styles bundle:' + err));
}
