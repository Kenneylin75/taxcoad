const fs = require('fs');
let code = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');

const lampMatch = `<div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">圓滿屆期日</p><p className="text-sm font-bold text-slate-900 font-mono">{lamp.expiryDate}</p></div>
                                     <button onClick={async () => { if (confirm(\`確定續點 \${lamp.categoryName}？\`)) { const { renewLampRecord } = await import('@/app/actions'); await renewLampRecord(lamp.id, 365); await loadHistory(selectedGuest.phone); alert("🏮 續點成功！"); } }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">快速續點 ➔</button>`;

const newLampMatch = `<div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">圓滿屆期日</p><p className="text-sm font-bold text-slate-900 font-mono">{lamp.expiryDate}</p></div>
                                     <div className="flex gap-2">
                                     {lamp.paymentStatus === 'Pending' && (
                                        <button 
                                          onClick={async () => {
                                            if (confirm('確定已收取現金並標記為已付款？')) {
                                              await import('@/app/actions').then(m => m.confirmPayment(lamp.id, 'Lamp'));
                                              if (selectedGuest) await loadHistory(selectedGuest.phone);
                                            }
                                          }}
                                          className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors px-4 py-2 bg-red-50 rounded-lg border border-red-100"
                                        >
                                          💵 標記為已付款
                                        </button>
                                     )}
                                     {lamp.paymentStatus === 'Paid' && (
                                        <span className="text-xs font-medium text-emerald-600 px-4 py-2">✓ 已結帳</span>
                                     )}
                                     <button onClick={async () => { if (confirm(\`確定續點 \${lamp.categoryName}？\`)) { const { renewLampRecord } = await import('@/app/actions'); await renewLampRecord(lamp.id, 365); await loadHistory(selectedGuest.phone); alert("🏮 續點成功！"); } }} className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">快速續點 ➔</button>
                                     </div>`;

if (code.includes('確定續點')) {
  code = code.replace(lampMatch, newLampMatch);
  fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', code);
  console.log('Lamp replaced');
} else {
  console.log('Could not find match');
}
