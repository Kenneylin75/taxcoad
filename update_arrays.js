const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(/let db_forms: any\[\] = initGlobal\('db_forms', \[([\s\S]*?)\]\);/, (match, p1) => {
  return `let db_forms: any[] = initGlobal('db_forms', [${p1}].map(x => ({...x, templeId: 'temple-1'})));`;
});

content = content.replace(/let db_personnel: any\[\] = initGlobal\('db_personnel', \[([\s\S]*?)\]\);/, (match, p1) => {
  return `let db_personnel: any[] = initGlobal('db_personnel', [${p1}].map(x => x.templeId ? x : ({...x, templeId: 'temple-1'})));`;
});

content = content.replace(/let db_lamp_categories: any\[\] = initGlobal\('db_lamp_categories', \[([\s\S]*?)\]\);/, (match, p1) => {
  return `let db_lamp_categories: any[] = initGlobal('db_lamp_categories', [${p1}].map(x => ({...x, templeId: 'temple-1'})));`;
});

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Done modifying arrays');
