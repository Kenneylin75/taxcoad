const fs = require('fs');
let content = fs.readFileSync('src/app/distributor/DistributorClient.tsx', 'utf8');

const target = `                                    {b.status === 'Verified' || b.status === 'Paid' ? (
                                       <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-full shadow-inner"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">已完成核銷紀錄</span></div>
                                    ) : (`;

const replacement = `                                    {b.status === 'Verified' || b.status === 'Paid' ? (
                                       <div className="flex items-center gap-2">
                                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-full shadow-inner"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">已完成核銷紀錄</span></div>
                                          {b.receiptUrl && (
                                             <button onClick={(e) => { e.stopPropagation(); setCurrentOrderId(b.id); setCurrentReceiptImage(b.receiptUrl); setCurrentOrderType('saas'); setB2bReceiptViewerOpen(true); }} className="text-xl hover:scale-110 transition-transform hover:opacity-80" title="查看匯款憑證">👁️</button>
                                          )}
                                       </div>
                                    ) : (`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/app/distributor/DistributorClient.tsx', content);
  console.log("Replaced successfully!");
} else {
  console.log("Target not found!");
}
