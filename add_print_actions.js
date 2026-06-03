const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// Add db_print_templates
const formsIdx = content.indexOf(`let db_forms: any[] = initGlobal('db_forms', [`);
const newTemplatesDb = `let db_print_templates: any[] = initGlobal('db_print_templates', [
  { id: '1', name: '預設標準版型', templeName: '大甲鎮瀾宮', watermarkUrl: '', watermarkOpacity: 0.1, borderStyle: 'border: 8px double #fcd34d; padding: 20px;', templeId: 'temple-1' }
].map(x => ({...x, templeId: 'temple-1'})));\n\n`;
content = content.substring(0, formsIdx) + newTemplatesDb + content.substring(formsIdx);

// Add API functions
const fetchFormsIdx = content.indexOf(`export async function fetchForms()`);
const newFns = `export async function fetchPrintTemplates() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return [...db_print_templates.filter(t => t.templeId === templeId)];
    }
    // DB impl omitted for now
    return [];
  });
}

export async function savePrintTemplate(template: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      template.templeId = templeId;
      const idx = db_print_templates.findIndex(t => t.id === template.id);
      if (idx !== -1) db_print_templates[idx] = template;
      else db_print_templates.push(template);
      return { success: true };
    }
    return { success: true };
  });
}

export async function deletePrintTemplate(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = db_print_templates.findIndex(t => t.id === id && t.templeId === templeId);
      if (idx !== -1) db_print_templates.splice(idx, 1);
      return { success: true };
    }
    return { success: true };
  });
}

`;
content = content.substring(0, fetchFormsIdx) + newFns + content.substring(fetchFormsIdx);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('actions.ts updated');
