const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// 1. Fix getRoleLabel sync/async issue
fileContent = fileContent.replace(/function getRoleLabel\(name: string\): string \{/g, 'async function getRoleLabel(name: string): Promise<string> {');
fileContent = fileContent.replace(/getRoleLabel\(data\.submittedBy\)/g, '(await getRoleLabel(data.submittedBy))');
fileContent = fileContent.replace(/getRoleLabel\(salesName\)/g, '(await getRoleLabel(salesName))');

// 2. Line 102 DEFAULT_SERVICES
fileContent = fileContent.replace(/DEFAULT_SERVICES\.forEach\(ds => \{/g, 'for (const ds of DEFAULT_SERVICES) {');
// The closing brace for forEach in DEFAULT_SERVICES
fileContent = fileContent.replace(/    existing\.color = ds\.color; \/\/ Force update color for demo consistency\s*\}\s*\}\);/g, '    existing.color = ds.color; // Force update color for demo consistency\n  }\n}');

// 3. Line 597 immediateStages.forEach
fileContent = fileContent.replace(/immediateStages\.forEach\(\(stage: any\) => \{/g, 'for (const stage of immediateStages) {');
fileContent = fileContent.replace(/\/\/ \(await jsonStore\.find\('audit_logs'\)\) synced\s*\}\);/g, '// (await jsonStore.find(\'audit_logs\')) synced\n  }');

// 4. Line 937 filtered.forEach
fileContent = fileContent.replace(/filtered\.forEach\(\(app: any\) => \{\s*if \(\!app\.serviceId\) \{/g, 
  `const allServices = await jsonStore.find('services');\n      for (const app of filtered) {\n        if (!app.serviceId) {`);
fileContent = fileContent.replace(/const svc = \(await jsonStore\.find\('services'\)\)\.find\(\(s: any\) => s\.id === app\.serviceId && s\.templeId === templeId\);/g, 
  `const svc = allServices.find((s: any) => s.id === app.serviceId && s.templeId === templeId);`);
fileContent = fileContent.replace(/if \(svc\) \{ app\.service = svc\.name; if \(app\.amount === undefined\) app\.amount = svc\.price; \}\s*\}\s*\}\);/g, 
  `if (svc) { app.service = svc.name; if (app.amount === undefined) app.amount = svc.price; }\n        }\n      }`);

fs.writeFileSync(filePath, fileContent, 'utf8');
console.log('Fixed part 3 awaits');
