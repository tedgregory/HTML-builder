const fs = require('fs');
const path = require('path');
const process = require('process');
const {stdin, stdout} = process;
const readline = require('readline');

const goodBye =  () => {
  console.log('Thanks! Good bye!');
};

let rl = readline.createInterface({input:stdin, output:stdout});
let wStream = fs.createWriteStream(path.resolve(__dirname,'text.txt'), {flags:'a'});
console.log('Please type anything:');
rl.on('line', data => {
  if (data.trim() === 'exit') return rl.close();
  wStream.write(`${data}\n`);
});
rl.on('SIGINT', () => process.exit());

process.on('exit', goodBye);
