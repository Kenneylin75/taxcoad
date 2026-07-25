const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix `(globalThis as any).(await jsonStore.find('...'))`
fileContent = fileContent.replace(/\(globalThis as any\)\.\(await jsonStore\.find\('([^']+)'\)\)/g, `(await jsonStore.find('$1'))`);
fileContent = fileContent.replace(/\(globalThis as any\)\.db_([a-z_]+)/g, `(await jsonStore.find('$1'))`); // just in case

// Fix `typeof window === 'undefined' ? (await jsonStore.find('temples')) : ...` if there are any errors.
// Wait, TS says "error TS1003: Identifier expected." at 5635, 7315, 7346, 8505.
fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed syntax errors.');
