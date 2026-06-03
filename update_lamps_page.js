const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/lamps/page.tsx', 'utf8');

// First, make sure confirmPayment is imported
if (!content.includes('confirmPayment')) {
  content = content.replace(
    /deleteLampCategory,/,
    `deleteLampCategory,\n  confirmPayment,`
  );
}

// Then, update the rendering logic for the records list
const recordUIOld = /<span className=\{\`px-5 py-2 rounded-full text-\[10px\] font-black uppercase border-2 shadow-sm \$\{record\.status === 'Active' \? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'\}\`\}>\{record\.status === 'Active' \? '服務中' : '即將到期'\}<\/span>/;

const recordUINew = `
{record.paymentStatus === 'Pending' ? (
  <div className="flex flex-col items-end gap-2">
    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-sm bg-rose-50 text-rose-600 border-rose-200 animate-pulse">待確認對帳</span>
    {record.paymentRef && <span className="text-[10px] font-bold text-slate-400">對帳碼: {record.paymentRef}</span>}
  </div>
) : (
  <span className={\`px-5 py-2 rounded-full text-[10px] font-black uppercase border-2 shadow-sm \${record.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}\`}>{record.status === 'Active' ? '服務中' : '即將到期'}</span>
)}
`;

content = content.replace(recordUIOld, recordUINew);

// Add the approve button below the daysLeft/price section
const buttonOld = /<p className="text-2xl font-black text-slate-900 italic tracking-tight">NT\$ \{\(record\.price \|\| 0\)\.toLocaleString\(\)\}<\/p><\/div><\/div>/;
const buttonNew = `<p className="text-2xl font-black text-slate-900 italic tracking-tight">NT$ {(record.price || 0).toLocaleString()}</p></div></div>
                      {record.paymentStatus === 'Pending' && (
                        <button onClick={async () => {
                           if(confirm('確認已收到款項 (對帳碼: ' + record.paymentRef + ') 嗎？')) {
                             const res = await confirmPayment(record.id, 'Lamp');
                             if(res.success) { alert('✅ 服務已成功啟用！'); await loadData(); }
                           }
                        }} className="w-full mt-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-colors shadow-lg active:scale-95">
                           💵 核對收款並啟用服務
                        </button>
                      )}`;

content = content.replace(buttonOld, buttonNew);

fs.writeFileSync('src/app/[templeId]/admin/lamps/page.tsx', content, 'utf8');
console.log('Updated lamps/page.tsx for payment confirmation');
