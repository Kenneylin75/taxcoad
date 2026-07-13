import os

path = 'src/app/distributor/DistributorClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_content = """                                       <div className="flex items-center gap-2 justify-end">
                                          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-full shadow-inner"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">已完成核銷紀錄</span></div>
                                          {b.receiptUrl && (
                                             <button onClick={(e) => { e.stopPropagation(); setCurrentOrderId(b.id); setCurrentReceiptImage(b.receiptUrl); setCurrentOrderType('saas'); setB2bReceiptViewerOpen(true); }} className="text-xl hover:scale-110 transition-transform hover:opacity-80" title="查看匯款憑證">👁️</button>
                                          )}
                                       </div>\n"""

lines[925] = new_content

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Line replaced successfully!")
