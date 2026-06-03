
const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// fetchAvailableSlots
content = content.replace(/if \(!client\) return \[\.\.\.\(gStore\.db_slots \|\| db_slots\)\];/, 
  'if (!client) return [...(gStore.db_slots || db_slots)].filter(x => x.templeId === templeId);');

// fetchAppointments
content = content.replace(/if \(!client\) return \[\.\.\.\(gStore\.db_appointments \|\| db_appointments\)\];/, 
  'if (!client) return [...(gStore.db_appointments || db_appointments)].filter(x => x.templeId === templeId);');

// fetchServiceDefinitions
content = content.replace(/export async function fetchServiceDefinitions\(\) \{\s+return \[\.\.\.\(gStore\.db_services \|\| db_services\)\];\s+\}/,
  'export async function fetchServiceDefinitions() {\n  const templeId = await getDynamicTempleId();\n  return [...(gStore.db_services || db_services)].filter(x => x.templeId === templeId);\n}');

// fetchForms
content = content.replace(/export async function fetchForms\(\) \{\s+return \[\.\.\.\(gStore\.db_forms \|\| db_forms\)\];\s+\}/,
  'export async function fetchForms() {\n  const templeId = await getDynamicTempleId();\n  return [...(gStore.db_forms || db_forms)].filter(x => x.templeId === templeId);\n}');

// fetchLampCategories
content = content.replace(/export async function fetchLampCategories\(\) \{ return \[\.\.\.db_lamp_categories\]; \}/,
  'export async function fetchLampCategories() { const templeId = await getDynamicTempleId(); return [...db_lamp_categories].filter(x => x.templeId === templeId); }');

// fetchEvents
content = content.replace(/export async function fetchEvents\(\) \{ return \[\.\.\.db_events\]; \}/,
  'export async function fetchEvents() { const templeId = await getDynamicTempleId(); return [...db_events].filter(x => x.templeId === templeId); }');

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Done fetchers');

