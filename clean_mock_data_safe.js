const fs = require('fs');
let lines = fs.readFileSync('src/app/actions.ts', 'utf8').split('\n');

// 1. Remove mock initializers
lines = lines.map(line => {
  if (line.includes('initGlobal(\'db_services\', DEFAULT_SERVICES.map')) return "let db_services: any[] = initGlobal('db_services', []);";
  if (line.includes('initGlobal(\'db_print_templates\', [')) return "let db_print_templates: any[] = initGlobal('db_print_templates', []);";
  if (line.includes('initGlobal(\'db_forms\', [')) return "let db_forms: any[] = initGlobal('db_forms', []);";
  if (line.includes('initGlobal(\'db_lamp_categories\', [')) return "let db_lamp_categories: any[] = initGlobal('db_lamp_categories', []);";
  return line;
});

// Remove fallback blocks safely by finding the start and skipping until `return default`
function removeFallback(funcName, ifLineMatch) {
  const funcStart = lines.findIndex(l => l.includes(\`export async function \${funcName}\`));
  if (funcStart > -1) {
    const ifStart = lines.findIndex((l, i) => i > funcStart && i < funcStart + 20 && l.includes(ifLineMatch));
    if (ifStart > -1) {
      const ifEnd = lines.findIndex((l, i) => i > ifStart && i < ifStart + 20 && l.includes('return '));
      if (ifEnd > -1) {
        // Find the closing brace for this if statement
        let braceEnd = ifEnd + 1;
        while(braceEnd < lines.length && !lines[braceEnd].includes('  }')) {
          braceEnd++;
        }
        if (lines[braceEnd].includes('  }')) {
          // Remove the block
          lines.splice(ifStart, braceEnd - ifStart + 1);
        }
      }
    }
  }
}

removeFallback('fetchForms', 'if (mine.length === 0 && templeId) {');
removeFallback('fetchServiceDefinitions', 'if (myServices.length === 0 && templeId) {');
removeFallback('fetchLampCategories', 'if (myCats.length === 0 && templeId) {');

let content = lines.join('\n');

// 5. Add deleteForm
if (!content.includes('export async function deleteForm(id: string)')) {
  content = content.replace('export async function saveForm', 'export async function deleteForm(id: string) {\\n  const templeId = await getDynamicTempleId();\\n  return withTempleSession(templeId, false, async (client) => {\\n    if (!client) {\\n      let currentForms = gStore.db_forms || db_forms;\\n      gStore.db_forms = currentForms.filter((f: any) => !(f.id === id && f.templeId === templeId));\\n      db_forms = gStore.db_forms;\\n      revalidatePath("/temple/services");\\n      return { success: true };\\n    }\\n    const { error } = await client.from("forms").delete().eq("id", id).eq("temple_id", templeId);\\n    if (error) return { success: false, error: error.message };\\n    revalidatePath("/temple/services");\\n    return { success: true };\\n  });\\n}\\n\\nexport async function saveForm');
}

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('actions.ts updated SAFELY.');
