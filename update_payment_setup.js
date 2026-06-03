const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', 'utf8');

// Update initial state
content = content.replace(
  `customQR: { enabled: false, qrImageUrl: '', description: '' }`,
  `customQR: { enabled: false, qrImageUrl: '', description: '' },
    cash: { enabled: true, description: '請於辦理當日至廟宇櫃檯繳納現金' }`
);

// Add the Cash Payment UI block before customQR
const qrBlockStart = `{/* 4. 自訂 QR Code 付款 (如台灣Pay, 街口等) */}`;

const cashBlock = `{/* 5. 現場現金付款 */}\n` +
`            <div className="bg-slate-50 border border-slate-100 rounded-[30px] p-8 space-y-6 hover:shadow-xl transition-all duration-300">\n` +
`              <div className="flex justify-between items-center">\n` +
`                 <div className="flex items-center gap-4">\n` +
`                    <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl shadow-inner">💵</div>\n` +
`                    <div>\n` +
`                       <h3 className="text-xl font-black text-slate-800 tracking-tight">現場現金付款</h3>\n` +
`                       <p className="text-xs font-bold text-slate-500 mt-1">Cash Payment</p>\n` +
`                    </div>\n` +
`                 </div>\n` +
`                 <label className="relative inline-flex items-center cursor-pointer scale-110">\n` +
`                    <input \n` +
`                      type="checkbox" \n` +
`                      className="sr-only peer" \n` +
`                      checked={config.cash?.enabled || false}\n` +
`                      onChange={e => setConfig({...config, cash: { ...config.cash, enabled: e.target.checked } as any})}\n` +
`                    />\n` +
`                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>\n` +
`                 </label>\n` +
`              </div>\n` +
`              {config.cash?.enabled && (\n` +
`                 <div className="pt-4 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-4 space-y-4">\n` +
`                    <div>\n` +
`                       <label className="block text-xs font-black text-slate-600 mb-2 uppercase tracking-widest">付款備註顯示給信眾 (Description)</label>\n` +
`                       <input \n` +
`                         type="text" \n` +
`                         value={config.cash?.description || ''}\n` +
`                         onChange={e => setConfig({...config, cash: { ...config.cash, description: e.target.value } as any})}\n` +
`                         className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:border-amber-500 focus:ring-0 transition-colors"\n` +
`                         placeholder="例如：請於辦理當日至廟宇櫃檯繳納現金"\n` +
`                       />\n` +
`                    </div>\n` +
`                 </div>\n` +
`              )}\n` +
`            </div>\n\n            `;

content = content.replace(qrBlockStart, cashBlock + qrBlockStart);

fs.writeFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', content, 'utf8');
console.log('Updated payment setup page');
