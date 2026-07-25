const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted string inside createRecord
fileContent = fileContent.replace(/await jsonStore\.createRecord\('\(await jsonStore\.find\('([a-z0-9_]+)'\)\)',/g, "await jsonStore.createRecord('$1',");
fileContent = fileContent.replace(/await jsonStore\.createRecord\('\(await jsonStore\.find\('db_([a-z0-9_]+)'\)\)',/g, "await jsonStore.createRecord('$1',");

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed corrupted createRecord calls.');
