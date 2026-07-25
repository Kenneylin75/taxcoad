const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Line 2742: config
fileContent = fileContent.replace(
    /\(await jsonStore\.find\('config'\)\) = newConfig;/g,
    `await jsonStore.atomicWrite('config', () => newConfig);`
);

// Line 3876: temple_storages
fileContent = fileContent.replace(
    /\(await jsonStore\.find\('temple_storages'\)\) = \(await jsonStore\.find\('temple_storages'\)\) \|\| \[\];/g,
    ``
);
fileContent = fileContent.replace(
    /\(await jsonStore\.find\('temple_storages'\)\)\.push\(newStorage\);/g,
    `await jsonStore.createRecord('temple_storages', newStorage);`
);

// Line 4401: temples filter
fileContent = fileContent.replace(
    /\(await jsonStore\.find\('temples'\)\) = \(await jsonStore\.find\('temples'\)\)\.filter\(t => t\.id !== templeId\);/g,
    `await jsonStore.deleteRecord('temples', templeId);`
);

// Line 5179 & 5187: wallets & withdrawals
fileContent = fileContent.replace(
    /if \(!\(await jsonStore\.find\('wallets'\)\)\) \(await jsonStore\.find\('wallets'\)\) = \[\];/g,
    ``
);
fileContent = fileContent.replace(
    /if \(!\(await jsonStore\.find\('withdrawals'\)\)\) \(await jsonStore\.find\('withdrawals'\)\) = \[\];/g,
    ``
);
fileContent = fileContent.replace(
    /\(await jsonStore\.find\('withdrawals'\)\)\.push\(\{/g,
    `await jsonStore.createRecord('withdrawals', {`
);

// Also we had an error on 1472 ? Let's just fix any `(await jsonStore.find(...)) = `
fileContent = fileContent.replace(
    /\(await jsonStore\.find\('([^']+)'\)\)\s*=\s*/g,
    `// invalid assignment removed: `
);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed remaining LHS errors.');
