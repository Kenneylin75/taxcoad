const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// Update AI payload mock data
content = content.replace(/{ label: '運勢路況', type: 'select'/g, "{ label: '運勢路況', type: 'select_single'");
content = content.replace(/{ label: '房子材質', type: 'select'/g, "{ label: '房子材質', type: 'select_multiple'");
content = content.replace(/{ label: '廚房灶火', type: 'select'/g, "{ label: '廚房灶火', type: 'select_single'");
content = content.replace(/{ label: '廚房灶水', type: 'select'/g, "{ label: '廚房灶水', type: 'select_single'");
content = content.replace(/{ label: '水缸存量', type: 'select'/g, "{ label: '水缸存量', type: 'select_single'");
content = content.replace(/{ label: '米缸存量', type: 'select'/g, "{ label: '米缸存量', type: 'select_single'");

// Update select options dropdown in the workspace
content = content.replace(/<option value="select">選擇 \(單選\/複選\)<\/option>/g, '<option value="select_single">單選選單</option>\n                                         <option value="select_multiple">複選標籤 (可多選)</option>');

// Update condition for showing the options input
content = content.replace(/{field.type === 'select' && \(/g, "{(field.type === 'select_single' || field.type === 'select_multiple' || field.type === 'select') && (");

// Update Mobile Simulator rendering to differentiate single vs multiple
const oldSimRender = `                                   {f.type === 'select' ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                         {(f.options || ['選項 A', '選項 B']).map(opt => (
                                            <div key={opt} className="px-3 py-2.5 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-400 flex items-center gap-2">
                                               <div className="w-2.5 h-2.5 rounded-full border border-slate-200"></div> {opt}
                                            </div>
                                         ))}
                                      </div>`;
                                      
const newSimRender = `                                   {f.type === 'select_single' || f.type === 'select' ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                         {(f.options || ['單選A', '單選B']).map((opt: string) => (
                                            <div key={opt} className="px-3 py-2.5 rounded-lg border border-slate-100 text-[9px] font-bold text-slate-400 flex items-center gap-2 bg-white">
                                               <div className="w-2.5 h-2.5 rounded-full border border-slate-200"></div> {opt}
                                            </div>
                                         ))}
                                      </div>
                                   ) : f.type === 'select_multiple' ? (
                                      <div className="flex flex-wrap gap-2">
                                         {(f.options || ['複選A', '複選B', '複選C']).map((opt: string) => (
                                            <div key={opt} className="px-3 py-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 text-[9px] font-bold text-indigo-500 flex items-center gap-1.5">
                                               <div className="w-2 h-2 rounded-sm border border-indigo-300"></div> {opt}
                                            </div>
                                         ))}
                                      </div>`;

content = content.replace(oldSimRender, newSimRender);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('Fixed single/multiple choice splitting');
