const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(/let db_temples: any\[\] = initGlobal\('db_temples', \[\s*\{([\s\S]*?)temple-1([\s\S]*?)\},\s*\{([\s\S]*?)temple-2([\s\S]*?)\}\s*\]\);/, (match, p1, p2, p3, p4) => {
  return `let db_temples: any[] = initGlobal('db_temples', [
  { ${p1}temple-1${p2}, templeNo: 1 },
  { ${p3}temple-2${p4}, templeNo: 2 }
]);`;
});

content = content.replace(/const id = `temple-\$\{Date\.now\(\)\}`;/, 
  'const id = `temple-${Math.random().toString(36).substring(2, 10)}`;\n    const templeNo = (gStore.db_temples || db_temples).length + 1;');

content = content.replace(/const newTemple = \{\s+id,\s+templeName: data\.name,/, 
  'const newTemple = {\n      id,\n      templeNo,\n      templeName: data.name,');

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated db_temples and createTempleAccount');
