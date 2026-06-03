const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Fix loginAccount
content = content.replace(
  /cookieStore\.set\("admin_account", account\);/g,
  `cookieStore.set("admin_account", account);\n    if (person && person.templeId) cookieStore.set("templeId", person.templeId);`
);

// 2. Fix saveLampCategory
content = content.replace(
  /export async function saveLampCategory\(data: any\) \{[\s\S]*?db_lamp_categories\.push\(\{ id: \`cat-\$\{Date\.now\(\)\}\`, \.\.\.data, totalSlots: data\.totalSlots \|\| 500 \}\);\n  \}/,
  `export async function saveLampCategory(data: any) { 
  const id = data.id;
  const templeId = await getDynamicTempleId();
  if (id) {
    const idx = db_lamp_categories.findIndex(c => c.id === id);
    if (idx > -1) db_lamp_categories[idx] = { ...db_lamp_categories[idx], ...data, templeId };
  } else {
    db_lamp_categories.push({ id: \`cat-\${Date.now()}\`, ...data, totalSlots: data.totalSlots || 500, templeId });
  }`
);

// 3. Fix createLampRecord
content = content.replace(
  /const newRecord = \{[\s\S]*?id: \`LMP-\$\{Date\.now\(\)\}\`,/,
  `const templeId = await getDynamicTempleId();\n  const newRecord = {\n    id: \`LMP-\${Date.now()}\`,\n    templeId,`
);

// 4. Fix fetchLampRecords
content = content.replace(
  /export async function fetchLampRecords\(\) \{ \n  return \[\.\.\.db_lamp_records\]\.reverse\(\); \n\}/,
  `export async function fetchLampRecords() { \n  const templeId = await getDynamicTempleId();\n  return [...db_lamp_records].filter(r => !r.templeId || r.templeId === templeId).reverse(); \n}`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Fixed multitenant data leak and isolation');
