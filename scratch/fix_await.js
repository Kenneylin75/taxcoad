const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// Line 3975: monthlyStats map
// We can just fetch temples before the map.
fileContent = fileContent.replace(
    /const monthlyStats = Array\.from\(\{ length: 12 \}\)\.map\(\(\_, i\) => \{/g,
    `const _allTemplesForStats = await jsonStore.find('temples');\n  const monthlyStats = Array.from({ length: 12 }).map((_, i) => {`
);
fileContent = fileContent.replace(
    /const count = \(await jsonStore\.find\('temples'\)\)\.filter\(/g,
    `const count = _allTemplesForStats.filter(`
);

// Line 4890 & 4912: temple_bills map
fileContent = fileContent.replace(
    /let expenses: ExpenseEntry\[\] = db_temple_bills\s*\.filter/g,
    `const _allTemplesForBills = await jsonStore.find('temples');\n  let expenses: ExpenseEntry[] = db_temple_bills\n    .filter`
);
fileContent = fileContent.replace(
    /const t = \(await jsonStore\.find\('temples'\)\)\?\.find/g,
    `const t = _allTemplesForBills?.find`
);

// Line 6014: apps.forEach in processQueue
fileContent = fileContent.replace(
    /apps\.forEach\(\(app: any\) => \{/g,
    `const _allSlotsForQueue = await jsonStore.find('slots');\n    apps.forEach((app: any) => {`
);
fileContent = fileContent.replace(
    /const slot = \(await jsonStore\.find\('slots'\)\)\.find/g,
    `const slot = _allSlotsForQueue.find`
);

// Line 7145: db_temple_ai_usage.map
fileContent = fileContent.replace(
    /return db_temple_ai_usage\.map\(usage => \{/g,
    `const _allTemplesForAi = await jsonStore.find('temples');\n  return db_temple_ai_usage.map(usage => {`
);
fileContent = fileContent.replace(
    /const temple = \(await jsonStore\.find\('temples'\)\)\.find/g,
    `const temple = _allTemplesForAi.find`
);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed await in non-async callbacks');
