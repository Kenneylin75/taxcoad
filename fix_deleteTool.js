const fs = require('fs');
let code = fs.readFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', 'utf8');

// The regex for deleteTool didn't match. Let's just find the function and replace it.
const startDelete = code.indexOf('export async function deleteTool(toolId: string) {');
const nextExport = code.indexOf('export async function', startDelete + 10);
if (startDelete > -1 && nextExport > -1) {
  const replacement = 'export async function deleteTool(toolId: string) { const t = getDbTools(); const idx = t.findIndex((item: any) => item.id === toolId); if (idx > -1) { t.splice(idx, 1); saveDbTools(t); } return { success: true }; }\n';
  code = code.substring(0, startDelete) + replacement + code.substring(nextExport);
}

fs.writeFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', code);
console.log('Fixed deleteTool');
