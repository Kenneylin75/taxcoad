const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// 1. Add state to AdminDesktopView
const oldHooks = `const AdminDesktopView = ({ services, forms, staffList, availableSlots, loadData, activeTab, setActiveTab }: any) => {
  const [editingService, setEditingService] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [isAiScanning, setIsAiScanning] = useState(false);`;

const newHooks = `const AdminDesktopView = ({ services, forms, staffList, availableSlots, loadData, activeTab, setActiveTab }: any) => {
  const [editingService, setEditingService] = useState<any>(null);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const templeId = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'default';`;

content = content.replace(oldHooks, newHooks);

// 2. Replace Load Template button with Dropdown
const oldLoadBtn = `<button onClick={() => {
                        const savedTemplate = localStorage.getItem('temple_form_template');
                        if (savedTemplate) {
                           const template = JSON.parse(savedTemplate);
                           setEditingForm({id:'f-'+Date.now(), name: template.name + ' (套用預設)', fields: template.fields});
                        } else {
                           alert('目前尚未儲存任何預設模組！請先進入任何表單，點擊右下角的「存為預設模組」。');
                        }
                     }} className="bg-amber-50 border border-amber-200 text-amber-700 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all flex items-center gap-2">📂 套用預設模組</button>`;

const newLoadBtn = `<div className="relative">
                        <button onClick={() => setShowTemplateMenu(!showTemplateMenu)} className="bg-amber-50 border border-amber-200 text-amber-700 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all flex items-center gap-2">📂 套用預設模組</button>
                        {showTemplateMenu && (
                           <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
                              {(() => {
                                 const tpls = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(\`temple_form_templates_\${templeId}\`) || '[]') : [];
                                 if (tpls.length === 0) return <div className="p-4 text-xs text-slate-400 text-center font-bold">尚未儲存任何模組</div>;
                                 return tpls.map((t: any, i: number) => (
                                    <div key={i} onClick={() => {
                                       setEditingForm({id:'f-'+Date.now(), name: t.name + ' (套用預設)', fields: t.fields});
                                       setShowTemplateMenu(false);
                                    }} className="px-4 py-3 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center group">
                                       <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 truncate mr-2">{t.name}</span>
                                       <span className="text-[10px] text-slate-400 shrink-0">{t.fields?.length || 0} 欄位</span>
                                    </div>
                                 ));
                              })()}
                           </div>
                        )}
                     </div>`;

content = content.replace(oldLoadBtn, newLoadBtn);

// 3. Replace Save Template button
const oldSaveBtn = `<button onClick={() => {
                       localStorage.setItem('temple_form_template', JSON.stringify({ name: editingForm.name, fields: editingForm.fields }));
                       alert('✅ 已將目前設計儲存為預設模組！下次建立新表單時可直接套用。');
                    }} className="px-8 py-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all">存為預設模組</button>`;

const newSaveBtn = `<button onClick={() => {
                       const tName = prompt('請輸入此預設模組的名稱：', editingForm.name);
                       if (!tName) return;
                       const tpls = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(\`temple_form_templates_\${templeId}\`) || '[]') : [];
                       tpls.push({ name: tName, fields: editingForm.fields });
                       if (typeof window !== 'undefined') localStorage.setItem(\`temple_form_templates_\${templeId}\`, JSON.stringify(tpls));
                       alert('✅ 已將目前設計儲存為預設模組！');
                    }} className="px-8 py-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all">存為預設模組</button>`;

content = content.replace(oldSaveBtn, newSaveBtn);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Multiple templates feature added.');
