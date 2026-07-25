const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

const targets = {
    'db_finance_records': 'finance_records',
    'db_temple_bills': 'temple_bills',
    'db_bonuses': 'bonuses',
    'db_withdrawals': 'withdrawals',
};

// 1. Remove initGlobal declarations
for (const [varName, collName] of Object.entries(targets)) {
    const initRegex = new RegExp(`let ${varName}:?\\s*[^=]*\\s*=\\s*initGlobal\\(['"][^'"]*['"]\\s*,\\s*\\[\\]\\s*\\);`, 'g');
    fileContent = fileContent.replace(initRegex, `// migrated ${varName} to ${collName}`);
}

// 2. Handle specific push/unshift
for (const [varName, collName] of Object.entries(targets)) {
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName}\\.push\\(`, 'g'), `await jsonStore.createRecord('${collName}', `);
    fileContent = fileContent.replace(new RegExp(`${varName}\\.push\\(`, 'g'), `await jsonStore.createRecord('${collName}', `);
    fileContent = fileContent.replace(new RegExp(`${varName}\\.unshift\\(`, 'g'), `await jsonStore.createRecord('${collName}', `);
}

// 3. Handle `gStore.db_xxx = db_xxx`
for (const [varName, collName] of Object.entries(targets)) {
    fileContent = fileContent.replace(new RegExp(`if \\(typeof gStore !== 'undefined'\\) gStore\\.${varName} = ${varName};`, 'g'), `// ${varName} synced`);
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName} = ${varName};`, 'g'), `// ${varName} synced`);
}

// 4. Update specific bill mutations (we'll manually handle the common bill updates)
// Instead of mutating the array in-place, we'll replace the block.
// We will look for bill.status = 'Paid' and replace it with updateRecord.
// Let's do a generic replacement for the remaining `db_xxx` reads.
for (const [varName, collName] of Object.entries(targets)) {
    fileContent = fileContent.replace(new RegExp(`gStore\\.${varName}`, 'g'), `(await jsonStore.find('${collName}'))`);
    fileContent = fileContent.replace(new RegExp(`\\b${varName}\\b`, 'g'), `(await jsonStore.find('${collName}'))`);
}

// Fix `(await jsonStore.find(...)) = ` edge cases
fileContent = fileContent.replace(/\(await jsonStore\.find\('([^']+)'\)\)\s*=\s*\[\];/g, '// invalid array assignment');

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Phase 3 AST basic transform applied.');
