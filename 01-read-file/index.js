const fs = require('fs');
const path = require('path');

fs.createReadStream(path.resolve(__dirname,'text.txt')).pipe(process.stdout);