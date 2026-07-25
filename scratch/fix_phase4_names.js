const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// The transform script accidentally used "db_xxx" as the collection name because of initGlobal string.
// Let's replace `jsonStore.find('db_xxx')` with `jsonStore.find('xxx')`.
fileContent = fileContent.replace(/jsonStore\.find\('db_([a-z0-9_]+)'\)/g, "jsonStore.find('$1')");
fileContent = fileContent.replace(/jsonStore\.readJson\('db_([a-z0-9_]+)'\)/g, "jsonStore.readJson('$1')");
fileContent = fileContent.replace(/jsonStore\.createRecord\('db_([a-z0-9_]+)'/g, "jsonStore.createRecord('$1'");
fileContent = fileContent.replace(/migrated db_([a-z0-9_]+) to db_([a-z0-9_]+)/g, "migrated db_$1 to $2");

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed db_ prefix in collections.');
