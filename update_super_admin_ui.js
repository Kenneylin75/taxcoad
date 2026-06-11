const fs = require('fs');
const file = 'src/app/super-admin/SuperAdminClient.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add transfer state variables
if (!code.includes('transferModalData')) {
    code = code.replace(
        `const [accountSubTab, setAccountSubTab] = useState<'Temple' | 'Distributor' | 'SuperSales'>('Temple');`,
        `const [accountSubTab, setAccountSubTab] = useState<'Temple' | 'Distributor' | 'SuperSales'>('Temple');
  const [transferModalData, setTransferModalData] = useState<{id: string, role: string, name: string} | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('HQ');
  const [selectedTransferTemples, setSelectedTransferTemples] = useState<string[]>([]);`
    );
}

// 2. Temple Table Header
code = code.replace(
    `<th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>`,
    `<th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">直屬單位</th>\n                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>`
);

// 3. Temple Table Body
code = code.replace(
    /({initialAccounts\.filter\(a => a\.role === 'Temple'\)\.map\(\(acc: any, idx: number\) => \(\n                             <tr key={acc\.id}[^>]+>\n                                <td[^>]+>[^<]+<\/td>\n                                <td[^>]+>[^<]+<\/td>\n                                <td[^>]+>[^<]+<\/td>\n)                                (<td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2\.5 h-2\.5 bg-emerald-500 rounded-full animate-pulse"><\/div><span className="text-\[11px\] font-black text-emerald-500 uppercase italic">Active<\/span><\/div><\/td>)/g,
    `$1                                <td className="px-12 py-8 text-[12px] font-bold text-slate-600">{acc.distributorId ? initialAccounts.find(a => a.id === acc.distributorId)?.name : (acc.salesId ? initialAccounts.find(a => a.id === acc.salesId)?.name : '系統總部 HQ')}</td>
                                <td className="px-12 py-8">
                                   <button 
                                      onClick={async () => {
                                         if(confirm(\`確定要\${!acc.status || acc.status==='Active' ? '關閉' : '開啟'}此帳戶嗎？\`)){
                                            const { updateAccountStatus } = await import('../actions');
                                            await updateAccountStatus(acc.id, 'Temple', (!acc.status || acc.status==='Active') ? 'Inactive' : 'Active');
                                            window.location.reload();
                                         }
                                      }}
                                      className={\`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all \${(!acc.status || acc.status==='Active') ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'}\`}
                                   >
                                      {(!acc.status || acc.status==='Active') ? '🟢 啟用中 (Active)' : '🔴 已停權 (Inactive)'}
                                   </button>
                                </td>`
);

// 4. SuperSales Table Body
code = code.replace(
    /({initialAccounts\.filter\(a => a\.role === 'SuperSales'\)\.map\(\(acc: any\) => \(\n                             <tr key={acc\.id}[^>]+>\n                                <td[^>]+><span[^>]+>[^<]+<\/span><\/td>\n                                <td[^>]+>[^<]+<\/td>\n                                <td[^>]+>[^<]+<\/td>\n)                                (<td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2\.5 h-2\.5 bg-emerald-500 rounded-full animate-pulse"><\/div><span className="text-\[11px\] font-black text-emerald-500 uppercase italic">Active<\/span><\/div><\/td>)\n                                (<td className="px-12 py-8 text-right flex justify-end gap-4">\n                                   <button onClick=\{\(\) => \{\n                                      window\.location\.href = `\/super-sales\/\$\{acc\.id\}`;\n                                   \}\} className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-\[10px\] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm">進入後台 \(Manage\)<\/button>)/g,
    `$1                                <td className="px-12 py-8">
                                   <button 
                                      onClick={async () => {
                                         if(confirm(\`確定要\${!acc.status || acc.status==='Active' ? '關閉' : '開啟'}此帳戶嗎？\`)){
                                            const { updateAccountStatus } = await import('../actions');
                                            await updateAccountStatus(acc.id, 'SuperSales', (!acc.status || acc.status==='Active') ? 'Inactive' : 'Active');
                                            window.location.reload();
                                         }
                                      }}
                                      className={\`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all \${(!acc.status || acc.status==='Active') ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'}\`}
                                   >
                                      {(!acc.status || acc.status==='Active') ? '🟢 啟用中 (Active)' : '🔴 已停權 (Inactive)'}
                                   </button>
                                </td>
$3
                                   <button onClick={() => setTransferModalData({id: acc.id, role: 'SuperSales', name: acc.name})} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm mr-2">轉移資產</button>`
);

// 5. Distributor Table Body
code = code.replace(
    /({initialAccounts\.filter\(a => a\.role === 'Distributor'\)\.map\(\(acc: any\) => \(\n                             <tr key={acc\.id}[^>]+>\n                                <td[^>]+><span[^>]+>[^<]+<\/span><\/td>\n                                <td[^>]+>[^<]+<\/td>\n                                <td[^>]+>[^<]+<\/td>\n)                                (<td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2\.5 h-2\.5 bg-emerald-500 rounded-full animate-pulse"><\/div><span className="text-\[11px\] font-black text-emerald-500 uppercase italic">Active<\/span><\/div><\/td>)\n                                (<td className="px-12 py-8 text-right flex justify-end gap-4">\n                                   <button onClick=\{\(\) => \{\n                                      window\.location\.href = `\/\$\{acc\.id\}`;\n                                   \}\} className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-\[10px\] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm">進入後台 \(Manage\)<\/button>)/g,
    `$1                                <td className="px-12 py-8">
                                   <button 
                                      onClick={async () => {
                                         if(confirm(\`確定要\${!acc.status || acc.status==='Active' ? '關閉' : '開啟'}此帳戶嗎？\`)){
                                            const { updateAccountStatus } = await import('../actions');
                                            await updateAccountStatus(acc.id, 'Distributor', (!acc.status || acc.status==='Active') ? 'Inactive' : 'Active');
                                            window.location.reload();
                                         }
                                      }}
                                      className={\`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all \${(!acc.status || acc.status==='Active') ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'}\`}
                                   >
                                      {(!acc.status || acc.status==='Active') ? '🟢 啟用中 (Active)' : '🔴 已停權 (Inactive)'}
                                   </button>
                                </td>
$3
                                   <button onClick={() => setTransferModalData({id: acc.id, role: 'Distributor', name: acc.name})} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm mr-2">轉移資產</button>`
);

// 6. Transfer Modal Component Injection
const transferModalJSX = `
      {/* 轉移資產 Modal */}
      {transferModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
           <div className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">資產轉移配置 (Asset Transfer)</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">來源：<span className="text-indigo-600">{transferModalData.name} ({transferModalData.role})</span></p>
                 </div>
              </div>
              <div className="p-10 overflow-y-auto bg-white flex-1">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">名下資產 (宮廟列表)</h4>
                 <div className="border border-slate-100 rounded-2xl overflow-hidden mb-8">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                          <tr>
                             <th className="p-4 w-12"><input type="checkbox" onChange={(e) => {
                                const relatedTemples = initialAccounts.filter(a => a.role === 'Temple' && (transferModalData.role === 'Distributor' ? a.distributorId === transferModalData.id : a.salesId === transferModalData.id));
                                setSelectedTransferTemples(e.target.checked ? relatedTemples.map(t => t.id) : []);
                             }} /></th>
                             <th className="p-4">宮廟名稱</th>
                             <th className="p-4">現有租金設定</th>
                          </tr>
                       </thead>
                       <tbody>
                          {initialAccounts.filter(a => a.role === 'Temple' && (transferModalData.role === 'Distributor' ? a.distributorId === transferModalData.id : a.salesId === transferModalData.id)).map(t => (
                             <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="p-4"><input type="checkbox" checked={selectedTransferTemples.includes(t.id)} onChange={(e) => {
                                   if(e.target.checked) setSelectedTransferTemples([...selectedTransferTemples, t.id]);
                                   else setSelectedTransferTemples(selectedTransferTemples.filter(id => id !== t.id));
                                }} /></td>
                                <td className="p-4 font-bold text-slate-800">{t.name || t.templeName}</td>
                                <td className="p-4 text-slate-500">{t.monthlyRent || 0} / 月</td>
                             </tr>
                          ))}
                          {initialAccounts.filter(a => a.role === 'Temple' && (transferModalData.role === 'Distributor' ? a.distributorId === transferModalData.id : a.salesId === transferModalData.id)).length === 0 && (
                             <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-bold">該帳戶名下無宮廟資產</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">轉移目標 (Target Allocation)</h4>
                 <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-indigo-500" value={transferTargetId} onChange={e => setTransferTargetId(e.target.value)}>
                    <option value="HQ">👑 系統總部 (收回直營)</option>
                    <optgroup label="經銷代理商">
                       {initialAccounts.filter(a => a.role === 'Distributor' && a.id !== transferModalData.id && (!a.status || a.status === 'Active')).map(d => (
                          <option key={d.id} value={\`Distributor|\${d.id}\`}>🏢 {d.name} ({d.id})</option>
                       ))}
                    </optgroup>
                    <optgroup label="超級業務">
                       {initialAccounts.filter(a => a.role === 'SuperSales' && a.id !== transferModalData.id && (!a.status || a.status === 'Active')).map(s => (
                          <option key={s.id} value={\`SuperSales|\${s.id}\`}>🚀 {s.name} ({s.id})</option>
                       ))}
                    </optgroup>
                 </select>
                 <p className="mt-4 text-[11px] text-rose-500 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100">⚠️ 轉移後，選定宮廟的後續月租費分潤將自動歸屬於新的目標帳戶，此動作無法撤銷，請審慎操作。</p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-4">
                 <button onClick={async () => {
                    if (selectedTransferTemples.length === 0) { alert('請先選擇要轉移的宮廟！'); return; }
                    if (confirm(\`確定要將 \${selectedTransferTemples.length} 間宮廟轉移給該目標嗎？\`)) {
                       const { transferTemples } = await import('../actions');
                       let tRole: 'HQ' | 'Distributor' | 'SuperSales' = 'HQ';
                       let tId: string | null = null;
                       if (transferTargetId !== 'HQ') {
                          const parts = transferTargetId.split('|');
                          tRole = parts[0] as any;
                          tId = parts[1];
                       }
                       await transferTemples(selectedTransferTemples, tId, tRole);
                       alert('資產轉移成功！');
                       setTransferModalData(null);
                       setSelectedTransferTemples([]);
                       window.location.reload();
                    }
                 }} className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-xl">確認轉移 (Confirm Transfer)</button>
                 <button onClick={() => { setTransferModalData(null); setSelectedTransferTemples([]); }} className="px-8 py-4 font-black text-xs text-slate-400">取消 (Cancel)</button>
              </div>
           </div>
        </div>
      )}
`;

// Insert the modal before the final closing div of the component
const lastDivIndex = code.lastIndexOf('</div>\n  );\n}');
if (lastDivIndex > -1) {
    code = code.slice(0, lastDivIndex) + transferModalJSX + code.slice(lastDivIndex);
}

fs.writeFileSync(file, code);
console.log('SuperAdminClient.tsx UI updated successfully');
