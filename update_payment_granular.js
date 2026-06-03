const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', 'utf8');

const oldCashUI = `                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">付款備註 INSTRUCTIONS</label>
                   <input 
                     type="text"
                     value={config.cash?.description || ''}
                     onChange={e => setConfig({...config, cash: { ...config.cash, description: e.target.value } as any})}
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"
                     placeholder="例如：請於辦理當日至廟宇櫃檯繳納現金"
                   />
                </div>
             </div>`;

const newCashUI = `                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">付款備註 INSTRUCTIONS</label>
                   <input 
                     type="text"
                     value={config.cash?.description || ''}
                     onChange={e => setConfig({...config, cash: { ...config.cash, description: e.target.value } as any})}
                     className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all mb-6"
                     placeholder="例如：請於辦理當日至廟宇櫃檯繳納現金"
                   />
                   
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">適用的服務模組</label>
                   <div className="grid grid-cols-2 gap-3">
                     {[
                       { id: 'allowBooking', label: '預約服務' },
                       { id: 'allowLamp', label: '點燈服務' },
                       { id: 'allowEvent', label: '法會活動' },
                       { id: 'allowQueue', label: '現場排隊' }
                     ].map(opt => (
                       <label key={opt.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-amber-200 cursor-pointer bg-white transition-colors">
                         <input
                           type="checkbox"
                           className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                           checked={(config.cash as any)?.[opt.id] !== false}
                           onChange={e => setConfig({...config, cash: { ...config.cash, [opt.id]: e.target.checked } as any})}
                         />
                         <span className="text-sm font-bold text-slate-700">{opt.label}</span>
                       </label>
                     ))}
                   </div>
                </div>
             </div>`;

content = content.replace(oldCashUI, newCashUI);

fs.writeFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', content, 'utf8');
console.log('Updated payment-setup page with granular cash options');
