const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix `gStore.(await jsonStore.find('...'))`
fileContent = fileContent.replace(/gStore\.\(await jsonStore\.find\('([^']+)'\)\)/g, `(await jsonStore.find('$1'))`);
fileContent = fileContent.replace(/\(\(await jsonStore\.find\('([^']+)'\)\) \|\| \(await jsonStore\.find\('([^']+)'\)\)\)/g, `(await jsonStore.find('$1'))`);
fileContent = fileContent.replace(/let pData = \(await jsonStore\.find\('personnel'\)\);/g, `let pData = await jsonStore.find('personnel');`);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed syntax errors.');
