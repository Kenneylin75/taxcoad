const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// 1. Add 'Load Template' button next to 'Manual Create'
const oldCreateBtn = `<button onClick={() => setEditingForm({id:'f-'+Date.now(), name:'新表單設計', fields:[]})} className="bg-white border border-slate-200 text-slate-900 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">＋ 手動創建表單</button>`;
const newCreateBtn = `<button onClick={() => setEditingForm({id:'f-'+Date.now(), name:'新表單設計', fields:[]})} className="bg-white border border-slate-200 text-slate-900 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">＋ 手動創建表單</button>
                     <button onClick={() => {
                        const savedTemplate = localStorage.getItem('temple_form_template');
                        if (savedTemplate) {
                           const template = JSON.parse(savedTemplate);
                           setEditingForm({id:'f-'+Date.now(), name: template.name + ' (套用預設)', fields: template.fields});
                        } else {
                           alert('目前尚未儲存任何預設模組！請先進入任何表單，點擊右下角的「存為預設模組」。');
                        }
                     }} className="bg-amber-50 border border-amber-200 text-amber-700 px-8 py-3.5 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all flex items-center gap-2">📂 套用預設模組</button>`;

content = content.replace(oldCreateBtn, newCreateBtn);

// 2. Add 'Save as Template' button next to 'Save Form'
const oldSaveBtn = `<button onClick={async () => { await saveForm(editingForm); await loadData(); setEditingForm(null); }} className="flex-1 bg-slate-900 text-white py-6 rounded-2xl font-bold text-sm shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest">發布建模並儲存</button>`;
const newSaveBtn = `<button onClick={async () => { await saveForm(editingForm); await loadData(); setEditingForm(null); }} className="flex-1 bg-slate-900 text-white py-6 rounded-2xl font-bold text-sm shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest">發布建模並儲存</button>
                    <button onClick={() => {
                       localStorage.setItem('temple_form_template', JSON.stringify({ name: editingForm.name, fields: editingForm.fields }));
                       alert('✅ 已將目前設計儲存為預設模組！下次建立新表單時可直接套用。');
                    }} className="px-8 py-6 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all">存為預設模組</button>`;

content = content.replace(oldSaveBtn, newSaveBtn);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Template buttons added successfully.');
