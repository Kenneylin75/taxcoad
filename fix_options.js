const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

const mapStartStr = "                          {(editingForm.fields || []).map((field: any, idx: number) => (";
const mapEndStr = "                             </div>\n                          ))}";

const startIndex = content.indexOf(mapStartStr);
const endIndex = content.indexOf(mapEndStr, startIndex) + mapEndStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `                          {(editingForm.fields || []).map((field: any, idx: number) => (
                             <div key={idx} className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl hover:border-indigo-100 transition-all relative">
                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                   <button 
                                     onClick={() => {
                                       if (idx === 0) return;
                                       const next = [...editingForm.fields];
                                       const temp = next[idx];
                                       next[idx] = next[idx - 1];
                                       next[idx - 1] = temp;
                                       setEditingForm({...editingForm, fields: next});
                                     }} 
                                     className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm \${idx === 0 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}\`}
                                     disabled={idx === 0}
                                   >
                                     ↑
                                   </button>
                                   <button 
                                     onClick={() => {
                                       if (idx === editingForm.fields.length - 1) return;
                                       const next = [...editingForm.fields];
                                       const temp = next[idx];
                                       next[idx] = next[idx + 1];
                                       next[idx + 1] = temp;
                                       setEditingForm({...editingForm, fields: next});
                                     }} 
                                     className={\`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm \${idx === editingForm.fields.length - 1 ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 'bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200'}\`}
                                     disabled={idx === editingForm.fields.length - 1}
                                   >
                                     ↓
                                   </button>
                                </div>
                                <div className="flex gap-6 items-end w-full">
                                   <div className="flex-1 space-y-2 ml-4">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">欄位標籤</label>
                                      <input value={field.label} onChange={e => {
                                         const next = [...editingForm.fields]; next[idx].label = e.target.value; setEditingForm({...editingForm, fields: next});
                                      }} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-600 transition-all" />
                                   </div>
                                   <div className="w-48 space-y-2">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">類型</label>
                                      <select value={field.type} onChange={e => {
                                         const next = [...editingForm.fields]; next[idx].type = e.target.value; setEditingForm({...editingForm, fields: next});
                                      }} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none cursor-pointer">
                                         <option value="text">標準文字</option>
                                         <option value="select">選擇 (單選/複選)</option>
                                         <option value="lunar">農曆日期</option>
                                         <option value="textarea">多行備註</option>
                                      </select>
                                   </div>
                                   <button onClick={() => {
                                      const next = editingForm.fields.filter((_: any, i: number) => i !== idx); setEditingForm({...editingForm, fields: next});
                                   }} className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all">✕</button>
                                </div>
                                {field.type === 'select' && (
                                   <div className="ml-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">選項設計 (請用逗號分隔)</label>
                                      <input value={(field.options || []).join(', ')} onChange={e => {
                                         const next = [...editingForm.fields]; 
                                         next[idx].options = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                         setEditingForm({...editingForm, fields: next});
                                      }} className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-600 transition-all text-indigo-600 placeholder:text-slate-300" placeholder="例如：柏油路, 水泥路, 石頭路, 爛泥路" />
                                   </div>
                                )}
                             </div>
                          ))}`;

  content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
  fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
  console.log('Fixed options editor');
} else {
  console.log('Could not find map block.');
}
