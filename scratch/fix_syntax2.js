const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix `gStore.(await jsonStore.find('...'))` for all collections
fileContent = fileContent.replace(/gStore\.\(await jsonStore\.find\('([^']+)'\)\)/g, `(await jsonStore.find('$1'))`);
fileContent = fileContent.replace(/\(\(await jsonStore\.find\('([^']+)'\)\) \|\| \(await jsonStore\.find\('([^']+)'\)\)\)/g, `(await jsonStore.find('$1'))`);

// Fix `(gStore.db_temples || (await jsonStore.find('temples')))`
fileContent = fileContent.replace(/\(gStore\.db_([a-z_]+) \|\| \(await jsonStore\.find\('([^']+)'\)\)\)/g, `(await jsonStore.find('$2'))`);
fileContent = fileContent.replace(/\(gStore\.\(await jsonStore\.find\('([^']+)'\)\) \|\| \(await jsonStore\.find\('([^']+)'\)\)\)/g, `(await jsonStore.find('$1'))`);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed syntax errors.');
