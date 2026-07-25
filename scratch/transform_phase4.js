const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Find all initGlobal arrays/objects
const initRegex = /let (db_[a-z0-9_]+):?\s*[^=]*\s*=\s*initGlobal\(['"]([^'"]*)['"]\s*,\s*(\[\]|\{[^\}]*\})\s*\);/g;
let match;
const entities = [];
const objectEntities = [];

while ((match = initRegex.exec(fileContent)) !== null) {
    const varName = match[1];
    let collName = match[2];
    const defaultVal = match[3]; // '[]' or '{...}'
    
    // Fix the empty string collection bug for db_wallets
    if (collName === '') {
        collName = varName.replace('db_', '');
    }
    
    // Skip if it was already migrated (our comments might be matched if I didn't write regex carefully, but I am matching `let db_... = initGlobal`)
    if (defaultVal.startsWith('{')) {
        objectEntities.push({ varName, collName });
    } else {
        entities.push({ varName, collName });
    }
}

console.log("Found Array Entities:", entities.map(e => e.collName));
console.log("Found Object Entities:", objectEntities.map(e => e.collName));

// Generate the script to modify actions.ts
for (const { varName, collName } of entities) {
    // Remove initGlobal
    fileContent = fileContent.replace(new RegExp(`let ${varName}:?\\s*[^=]*\\s*=\\s*initGlobal\\([^\\)]+\\);`, 'g'), `// migrated ${varName} to ${collName}`);
    
    // Replace push
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName}\\.push\\(`, 'g'), `await jsonStore.createRecord('${collName}', `);
    fileContent = fileContent.replace(new RegExp(`${varName}\\.push\\(`, 'g'), `await jsonStore.createRecord('${collName}', `);
    fileContent = fileContent.replace(new RegExp(`${varName}\\.unshift\\(`, 'g'), `await jsonStore.createRecord('${collName}', `);
    
    // Replace sync assignments
    fileContent = fileContent.replace(new RegExp(`if \\(typeof gStore !== 'undefined'\\) gStore\\.${varName} = ${varName};`, 'g'), `// ${varName} synced`);
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName} = ${varName};`, 'g'), `// ${varName} synced`);
    
    // Replace general reads
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName}`, 'g'), `(await jsonStore.find('${collName}'))`);
    fileContent = fileContent.replace(new RegExp(`\\b${varName}\\b`, 'g'), `(await jsonStore.find('${collName}'))`);
}

for (const { varName, collName } of objectEntities) {
    // Remove initGlobal
    fileContent = fileContent.replace(new RegExp(`let ${varName}:?\\s*[^=]*\\s*=\\s*initGlobal\\([^\\)]+\\);`, 'g'), `// migrated ${varName} to ${collName}`);
    
    // Object mutations: db_config = newConfig -> atomicWrite
    // This is tricky via regex, so we'll just replace the read and we have to manually fix writes if there are any.
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName}`, 'g'), `(await jsonStore.readJson('${collName}'))`);
    fileContent = fileContent.replace(new RegExp(`\\b${varName}\\b`, 'g'), `(await jsonStore.readJson('${collName}'))`);
}

// Fix invalid LHS assignments 
fileContent = fileContent.replace(/\(await jsonStore\.find\('([^']+)'\)\)\s*=\s*\[\];/g, '// invalid array assignment');

fs.writeFileSync(filePath, fileContent, 'utf8');

// Generate updates for jsonStore.ts and storageInit.ts
const allCollNames = [...entities, ...objectEntities].map(e => e.collName);
console.log("All collections:", JSON.stringify(allCollNames));

