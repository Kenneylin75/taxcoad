const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// The generic fix for `(await jsonStore.find('xxx')) = ...` invalid LHS.
// We must convert these to `await jsonStore.atomicWrite('xxx', async (data) => { return ... })`
// Or if it's `(await jsonStore.find('xxx')) = (await jsonStore.find('xxx'));`, we just delete it.
fileContent = fileContent.replace(/\(await jsonStore\.find\('([a-z0-9_]+)'\)\)\s*=\s*\(await jsonStore\.find\('\1'\)\);/g, '// array synced manually');
fileContent = fileContent.replace(/\(await jsonStore\.find\('([a-z0-9_]+)'\)\)\s*=\s*\(await jsonStore\.find\('\1'\)\)\s*=\s*\(await jsonStore\.find\('\1'\)\)\.filter\(([^\)]+)\);/g, "await jsonStore.atomicWrite('$1', (data) => data.filter($2));");

// Specific fix for forms:
// (await jsonStore.find('forms')) = current.map((f: any) => f.id === id ? { ...f, ...data } : f);
fileContent = fileContent.replace(
  /\(await jsonStore\.find\('forms'\)\)\s*=\s*current\.map\(\(f: any\) => f\.id === id \? \{ \.\.\.f, \.\.\.data \} : f\);/g,
  "await jsonStore.atomicWrite('forms', (data) => data.map((f: any) => f.id === id ? { ...f, ...data } : f));"
);
fileContent = fileContent.replace(
  /\(await jsonStore\.find\('forms'\)\)\s*=\s*\[\.\.\.current, \{ id: id \|\| Date\.now\(\)\.toString\(\), templeId, \.\.\.data \}\];/g,
  "await jsonStore.atomicWrite('forms', (data) => [...data, { id: id || Date.now().toString(), templeId, ...data }]);"
);

// Generic fix for: (await jsonStore.find('xxx')) = yyy; (if any remain)
fileContent = fileContent.replace(/\(await jsonStore\.find\('([a-z0-9_]+)'\)\)\s*=\s*([^;]+);/g, "await jsonStore.atomicWrite('$1', (data) => $2);");

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed LHS array assignment errors.');
