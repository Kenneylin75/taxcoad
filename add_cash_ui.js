const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', 'utf8');

const qrBlockStart = `{/* Custom QR Code Config */}`;

const cashBlock = `{/* Cash Payment Config */}\n` +
`        <div className={\`bg-white rounded-[40px] border-2 transition-all p-8 shadow-sm \${config.cash?.enabled ? 'border-amber-500' : 'border-slate-100 hover:border-slate-300'}\`}>\n` +
`           <div className="flex justify-between items-start mb-8">\n` +
`              <div className="flex items-center gap-4">\n` +
`                 <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-3xl">💵</div>\n` +
`                 <div>\n` +
`                    <h3 className="text-xl font-black text-slate-800">現場現金付款</h3>\n` +
`                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1">Cash Payment</p>\n` +
`                 </div>\n` +
`              </div>\n` +
`              <label className="relative inline-flex items-center cursor-pointer">\n` +
`                <input type="checkbox" className="sr-only peer" checked={config.cash?.enabled || false} onChange={e => setConfig({...config, cash: { ...config.cash, enabled: e.target.checked } as any})} />\n` +
`                <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>\n` +
`              </label>\n` +
`           </div>\n` +
`           \n` +
`           {config.cash?.enabled && (\n` +
`             <div className="space-y-6 animate-in fade-in slide-in-from-top-4">\n` +
`                <div>\n` +
`                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">付款備註 INSTRUCTIONS</label>\n` +
`                   <input \n` +
`                     type="text"\n` +
`                     value={config.cash?.description || ''}\n` +
`                     onChange={e => setConfig({...config, cash: { ...config.cash, description: e.target.value } as any})}\n` +
`                     className="w-full bg-slate-50 border-2 border-transparent focus:border-amber-500 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none transition-all"\n` +
`                     placeholder="例如：請於辦理當日至廟宇櫃檯繳納現金"\n` +
`                   />\n` +
`                </div>\n` +
`             </div>\n` +
`           )}\n` +
`        </div>\n\n        `;

content = content.replace(qrBlockStart, cashBlock + qrBlockStart);

fs.writeFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', content, 'utf8');
console.log('Successfully injected Cash module into payment-setup');
