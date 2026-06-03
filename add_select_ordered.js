const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/services/page.tsx', 'utf8');

// 1. Add select_ordered to options
content = content.replace(/<option value="select_multiple">複選標籤 \(可多選\)<\/option>/g, '<option value="select_multiple">複選標籤 (可多選)</option>\n                                         <option value="select_ordered">順序標籤 (依序點選)</option>');

// 2. Update options visibility condition
content = content.replace(/\(field.type === 'select_single' \|\| field.type === 'select_multiple' \|\| field.type === 'select'\) && \(/g, "(field.type === 'select_single' || field.type === 'select_multiple' || field.type === 'select_ordered' || field.type === 'select') && (");

// 3. Update simulator rendering
const oldSimRender = `                                   ) : f.type === 'select_multiple' ? (
                                      <div className="flex flex-wrap gap-2">
                                         {(f.options || ['複選A', '複選B', '複選C']).map((opt: string) => (
                                            <div key={opt} className="px-3 py-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 text-[9px] font-bold text-indigo-500 flex items-center gap-1.5">
                                               <div className="w-2 h-2 rounded-sm border border-indigo-300"></div> {opt}
                                            </div>
                                         ))}
                                      </div>`;

const newSimRender = `                                   ) : f.type === 'select_multiple' ? (
                                      <div className="flex flex-wrap gap-2">
                                         {(f.options || ['複選A', '複選B', '複選C']).map((opt: string) => (
                                            <div key={opt} className="px-3 py-1.5 rounded-md border border-indigo-100 bg-indigo-50/50 text-[9px] font-bold text-indigo-500 flex items-center gap-1.5">
                                               <div className="w-2 h-2 rounded-sm border border-indigo-300"></div> {opt}
                                            </div>
                                         ))}
                                      </div>
                                   ) : f.type === 'select_ordered' ? (
                                      <div className="flex flex-col gap-2">
                                         {(f.options || ['順序選項A', '順序選項B', '順序選項C']).map((opt: string, optIdx: number) => (
                                            <div key={opt} className="px-4 py-2.5 rounded-lg border border-amber-100 bg-amber-50/30 text-[10px] font-bold text-slate-600 flex items-center justify-between">
                                               <span>{opt}</span>
                                               {optIdx < 2 ? (
                                                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm">{optIdx + 1}</span>
                                               ) : (
                                                  <span className="w-5 h-5 rounded-full border border-slate-200"></span>
                                               )}
                                            </div>
                                         ))}
                                      </div>`;

content = content.replace(oldSimRender, newSimRender);

fs.writeFileSync('src/app/[templeId]/admin/services/page.tsx', content, 'utf8');
console.log('select_ordered added');
