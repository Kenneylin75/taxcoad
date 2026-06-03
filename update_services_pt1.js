const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// 1. Imports
const oldImports = `  saveServiceDefinition, 
  saveForm,
  fetchAvailableSlots,
  createSlot,
  removeSingleSlot
} from '@/app/actions';`;

const newImports = `  saveServiceDefinition, 
  saveForm,
  fetchAvailableSlots,
  createSlot,
  removeSingleSlot,
  fetchPrintTemplates,
  savePrintTemplate,
  deletePrintTemplate
} from '@/app/actions';`;
content = content.replace(oldImports, newImports);

// 2. Add printTemplates to props and hooks
const oldDeskView = `const AdminDesktopView = ({ services, forms, staffList, availableSlots, loadData, activeTab, setActiveTab }: any) => {`;
const newDeskView = `const AdminDesktopView = ({ services, forms, printTemplates, staffList, availableSlots, loadData, activeTab, setActiveTab }: any) => {`;
content = content.replace(oldDeskView, newDeskView);

// 3. Add print-templates to tabs in Desktop
const oldTabs = `                   {[{id:'services', l:'服務配置', i:'⛩️'}, {id:'forms', l:'表單建模', i:'📑'}].map(t => (`;
const newTabs = `                   {[{id:'services', l:'服務配置', i:'⛩️'}, {id:'forms', l:'表單建模', i:'📑'}, {id:'print-templates', l:'列印版型設計', i:'🖨️'}].map(t => (`;
// Note: We need to replace it in both Desktop and Mobile view if Mobile has it.
content = content.replace(oldTabs, newTabs);
content = content.replace(oldTabs, newTabs); // Try again for mobile

// 4. Update the service modal to include the print template dropdown
const oldServiceForm = `                                   <select value={editingService.linkedFormId || ''} onChange={e => setEditingService({...editingService, linkedFormId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all">
                                      <option value="">不綁定表單</option>
                                      {forms.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                   </select>
                                </div>
                             </div>`;
const newServiceForm = `                                   <select value={editingService.linkedFormId || ''} onChange={e => setEditingService({...editingService, linkedFormId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all">
                                      <option value="">不綁定表單</option>
                                      {forms.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                   </select>
                                </div>
                                <div className="space-y-3">
                                   <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">🖨️</span> 列印/下載版型綁定
                                   </label>
                                   <select value={editingService.linkedPrintTemplateId || ''} onChange={e => setEditingService({...editingService, linkedPrintTemplateId: e.target.value})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-sm outline-none focus:border-indigo-600 focus:bg-white transition-all">
                                      <option value="">不綁定 (使用預設版型)</option>
                                      {printTemplates?.map((pt: any) => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                   </select>
                                </div>
                             </div>`;
content = content.replace(oldServiceForm, newServiceForm);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('page.tsx partially updated');
