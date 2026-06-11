const fs = require('fs');

let code = fs.readFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', 'utf8');

// 1. Remove the old db_tools definition
code = code.replace(/let db_tools: any\[\] = initGlobal\('db_tools', \[\s*\{\s*id: 'tool-1', type: 'video', category: '系統教學', title: '快速上手指南', thumbnail: 'https:\/\/images\.unsplash\.com\/photo-1611162617474-5b21e879e113\?q=80&w=1000&auto=format&fit=crop' \}\s*\]\);/g, '');

// 2. Add the file-based storage helpers at the top of the file (after imports)
const fileHelperCode = `
import fsSync from 'fs';
import pathSync from 'path';

function getDbTools() {
  try {
    const p = pathSync.join(process.cwd(), 'db_tools.json');
    if (fsSync.existsSync(p)) {
      return JSON.parse(fsSync.readFileSync(p, 'utf8'));
    }
  } catch (e) {}
  return [{ id: 'tool-1', type: 'video', category: '系統教學', title: '快速上手指南', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop' }];
}

function saveDbTools(tools: any[]) {
  try {
    const p = pathSync.join(process.cwd(), 'db_tools.json');
    fsSync.writeFileSync(p, JSON.stringify(tools, null, 2));
  } catch (e) {}
}
`;

code = code.replace(/import \{ withTempleSession, dbQuery \} from "\.\.\/db\/db";/, 'import { withTempleSession, dbQuery } from "../db/db";\n' + fileHelperCode);

// 3. Rewrite fetchSalesTools
code = code.replace(/export async function fetchSalesTools\(dummy\?: number\) \{ noStore\(\); return \[\.\.\.db_tools\]; \}/g, 'export async function fetchSalesTools(dummy?: number) { noStore(); return getDbTools(); }');

// 4. Rewrite uploadTool
code = code.replace(/db_tools\.push\(\{ id: `tool-\$\{Date\.now\(\)\}`, uploadedAt, \.\.\.data \}\);/g, 'const t = getDbTools(); t.push({ id: `tool-${Date.now()}`, uploadedAt, ...data }); saveDbTools(t);');

// 5. Rewrite deleteTool
code = code.replace(/export async function deleteTool\(toolId: string\) \{\s*const idx = db_tools\.findIndex\(\(t: any\) => t\.id === toolId\);\s*if \(idx > -1\) \{\s*db_tools\.splice\(idx, 1\);\s*\}\s*\}/g, 'export async function deleteTool(toolId: string) { const t = getDbTools(); const idx = t.findIndex((item: any) => item.id === toolId); if (idx > -1) { t.splice(idx, 1); saveDbTools(t); } return { success: true }; }');

fs.writeFileSync('C:/Users/KenneyLin/Desktop/宮廟管理v10/src/app/actions.ts', code);
console.log('actions.ts file persistence patched successfully!');
