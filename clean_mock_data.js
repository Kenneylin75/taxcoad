const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Remove mock data from initializers
const regexServices = /let db_services: any\[\] = initGlobal\('db_services', DEFAULT_SERVICES\.map[^\)]+\)\);/;
content = content.replace(regexServices, "let db_services: any[] = initGlobal('db_services', []);");

const regexPrintTemplates = /let db_print_templates: any\[\] = initGlobal\('db_print_templates', \[[\s\S]*?\]\);/;
content = content.replace(regexPrintTemplates, "let db_print_templates: any[] = initGlobal('db_print_templates', []);");

const regexForms = /let db_forms: any\[\] = initGlobal\('db_forms', \[[\s\S]*?\]\);/;
content = content.replace(regexForms, "let db_forms: any[] = initGlobal('db_forms', []);");

const regexLampCats = /let db_lamp_categories: any\[\] = initGlobal\('db_lamp_categories', \[[\s\S]*?\]\);/;
content = content.replace(regexLampCats, "let db_lamp_categories: any[] = initGlobal('db_lamp_categories', []);");

// 2. Remove fallback logic from fetchForms
const fbForms = /if \(mine\.length === 0 && templeId\) \{[\s\S]*?return defaults;\n  \}/;
content = content.replace(fbForms, '');

// 3. Remove fallback logic from fetchLampCategories
const fbLampCats = /if \(myCats\.length === 0 && templeId\) \{[\s\S]*?return defaultCats;\n  \}/;
content = content.replace(fbLampCats, '');

// 4. Remove fallback logic from fetchServiceDefinitions
const fbServices = /if \(myServices\.length === 0 && templeId\) \{[\s\S]*?return defaultServices;\n  \}/;
content = content.replace(fbServices, '');

// 5. Add deleteForm
if (!content.includes('export async function deleteForm(id: string)')) {
  content = content.replace('export async function saveForm', 'export async function deleteForm(id: string) {\n  const templeId = await getDynamicTempleId();\n  return withTempleSession(templeId, false, async (client) => {\n    if (!client) {\n      let currentForms = gStore.db_forms || db_forms;\n      gStore.db_forms = currentForms.filter((f: any) => !(f.id === id && f.templeId === templeId));\n      db_forms = gStore.db_forms;\n      revalidatePath("/temple/services");\n      return { success: true };\n    }\n    const { error } = await client.from("forms").delete().eq("id", id).eq("temple_id", templeId);\n    if (error) return { success: false, error: error.message };\n    revalidatePath("/temple/services");\n    return { success: true };\n  });\n}\n\nexport async function saveForm');
}

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('actions.ts updated successfully.');
