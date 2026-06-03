const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');

// 1. Update handleSaveRecord
const oldSaveStr = `  const handleSaveRecord = async (values: any) => {
    if (!selectedGuest || !activeForm) return;
    setIsSaving(true);
    await saveDeepRecord(selectedGuest.phone, activeForm.eventId, activeForm.serviceType, '管理人員', values);
    await loadHistory(selectedGuest.phone);
    setActiveForm(null);
    setIsSaving(false);
  };`;

const newSaveStr = `  const handleSaveRecord = async (values: any) => {
    if (!selectedGuest || !activeForm) return;
    setIsSaving(true);
    await saveDeepRecord(selectedGuest.phone, activeForm.eventId, activeForm.serviceType, '管理人員', values);
    
    // Auto-save form into media
    try {
       const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
       const fileName = \`\${activeForm.serviceType}_\${dateStr}.pdf\`;
       await uploadCustomerMedia(selectedGuest.phone, \`/icons/form-pdf-icon.png\`, 'file', '系統自動歸檔', fileName);
    } catch (e) { console.error('Failed to auto-archive form:', e); }

    await loadHistory(selectedGuest.phone);
    setActiveForm(null);
    setIsSaving(false);
  };`;

content = content.replace(oldSaveStr, newSaveStr);

// 2. Update viewingRecord footer
const oldFooterStr = `                 <button onClick={() => setViewingRecord(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">關閉視窗</button>`;

const newFooterStr = `                 <div className="flex gap-2">
                   <button onClick={() => {
                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => \`\${k}:\\n\${v}\`).join('\\n\\n');
                     const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = \`\${viewingRecord.serviceType}_表單紀錄.txt\`;
                     a.click();
                     URL.revokeObjectURL(url);
                   }} className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-indigo-100 transition-all flex items-center gap-2">⬇️ 下載表單</button>
                   <button onClick={() => {
                     const printWindow = window.open('', '', 'width=800,height=600');
                     if (!printWindow) return;
                     const content = Object.entries(viewingRecord.values || {}).map(([k, v]) => \`<div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;"><strong>\${k}</strong><p style="margin-top: 5px;">\${v}</p></div>\`).join('');
                     printWindow.document.write(\`
                       <html>
                         <head>
                           <title>\${viewingRecord.serviceType} - 列印</title>
                           <style>body { font-family: sans-serif; padding: 40px; color: #333; } h1 { border-bottom: 2px solid #000; padding-bottom: 10px; }</style>
                         </head>
                         <body>
                           <h1>\${viewingRecord.serviceType}</h1>
                           <p>列印日期: \${new Date().toLocaleDateString()}</p>
                           <div style="margin-top: 30px;">\${content}</div>
                           <script>window.print(); setTimeout(() => window.close(), 500);</script>
                         </body>
                       </html>
                     \`);
                     printWindow.document.close();
                   }} className="bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center gap-2">🖨️ 列印表單</button>
                   <button onClick={() => setViewingRecord(null)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all">關閉視窗</button>
                 </div>`;

content = content.replace(oldFooterStr, newFooterStr);

fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', content, 'utf8');
console.log('Added auto-archive and print/download buttons');
