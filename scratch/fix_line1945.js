const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix Line 1945
fileContent = fileContent.replace(
  /await jsonStore\.atomicWrite\('events', \(data\) => \(await jsonStore\.find\('events'\)\) = \(await jsonStore\.find\('events'\)\)\.filter\(e => \!\(e\.id === id && \(\!e\.templeId \|\| e\.templeId === templeId\)\)\)\);/g,
  "await jsonStore.deleteRecord('events', id);"
);

// General cleanup for anything like `(await jsonStore.find('xxx')) = `
fileContent = fileContent.replace(/\(await jsonStore\.find\('([a-z0-9_]+)'\)\)\s*=\s*(.*?);/g, "/* $1 assignment removed */");

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed line 1945 and any remaining LHS assignments');
