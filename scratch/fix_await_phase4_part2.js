const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Line 2263: temple_storages inside forEach
fileContent = fileContent.replace(
  /\(await jsonStore\.find\('temples'\)\)\.forEach\(t => \{\s*if \(\!\(await jsonStore\.find\('temple_storages'\)\)\.some\(s => s\.templeId === t\.id\)\) \{/g,
  `for (const t of (await jsonStore.find('temples'))) {\n        if (!(await jsonStore.find('temple_storages')).some(s => s.templeId === t.id)) {`
);
fileContent = fileContent.replace(
  /planName: pName\s*\}\);\s*\}\s*\}\);/g,
  `planName: pName\n          });\n        }\n      }`
);

// 2. Line 2788: dist_sales inside filter
fileContent = fileContent.replace(
  /list = list\.filter\(\(t: any\) => \{\s*if \(t\.distributorId !== distId\) return false;\s*const sales = \(await jsonStore\.find\('dist_sales'\)\)\.find\(s => s\.id === t\.salesId\);\s*if \(sales && sales\.role === 'SuperSales'\) return false;\s*return true;\s*\}\);/g,
  `const allSales2 = await jsonStore.find('dist_sales');
     list = list.filter((t: any) => {
        if (t.distributorId !== distId) return false;
        const sales = allSales2.find(s => s.id === t.salesId);
        if (sales && sales.role === 'SuperSales') return false;
        return true;
     });`
);

// 3. Line 3247: super_sales_overrides inside forEach
fileContent = fileContent.replace(
  /Array\.from\(allSalesMap\.values\(\)\)\.forEach\(s => \{\s*if \(s\.role === 'SuperSales'\) \{\s*const overrides = \(await jsonStore\.readJson\('super_sales_overrides'\)\)\[s\.name\];/g,
  `const superOverrides = await jsonStore.readJson('super_sales_overrides');
  for (const s of Array.from(allSalesMap.values()) as any[]) {
    if (s.role === 'SuperSales') {
      const overrides = superOverrides[s.name];`
);
fileContent = fileContent.replace(
  /accounts\.push\(\{ \.\.\.s, id: s\.id, name: s\.name, role: 'SuperSales', account: s\.account, rules: mergedRules \}\);\s*\}\s*\}\);/g,
  `accounts.push({ ...s, id: s.id, name: s.name, role: 'SuperSales', account: s.account, rules: mergedRules });\n    }\n  }`
);

// 4. Line 3289: super_sales_overrides inside map
fileContent = fileContent.replace(
  /return Array\.from\(allSalesMap\.values\(\)\)\.filter\(\(s: any\) => s\.role === 'SuperSales'\)\.map\(ss => \(\{\s*\.\.\.ss,\s*rates: \(await jsonStore\.readJson\('super_sales_overrides'\)\)\[ss\.name\] \|\| \(await jsonStore\.readJson\('config'\)\)\.defaultSuperSalesRates\s*\}\)\);/g,
  `const superOverrides2 = await jsonStore.readJson('super_sales_overrides');
  const dbConfig2 = await jsonStore.readJson('config');
  return Array.from(allSalesMap.values()).filter((s: any) => s.role === 'SuperSales').map(ss => ({
    ...ss,
    rates: superOverrides2[(ss as any).name] || dbConfig2.defaultSuperSalesRates
  }));`
);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed await in non-async function issues part 2.');
