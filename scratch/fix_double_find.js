const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix nested jsonStore.find() due to double regex replacement
fileContent = fileContent.replace(/\(await jsonStore\.find\('\(await jsonStore\.find\('([a-z0-9_]+)'\)\)'\)\)/g, "(await jsonStore.find('$1'))");
fileContent = fileContent.replace(/\(await jsonStore\.readJson\('\(await jsonStore\.readJson\('([a-z0-9_]+)'\)\)'\)\)/g, "(await jsonStore.readJson('$1'))");

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed double jsonStore.find calls.');
