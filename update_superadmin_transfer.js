const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// 1. Imports
if (!content.includes('transferTempleOwnership')) {
  content = content.replace(
    /createDistributorAccount,/g,
    "createDistributorAccount,\ntransferTempleOwnership,\ntransferDistributorOwnership,"
  );
}

// 2. States for Transfer Modal
if (!content.includes('isTransferModalOpen')) {
  content = content.replace(
    /const \[isAccountModalOpen, setIsAccountModalOpen\] = useState\(false\);/,
    `const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{id: string, type: 'Temple' | 'Distributor' | null}>({id: '', type: null});
  const [newSalesId, setNewSalesId] = useState('');
  const [newDistributorId, setNewDistributorId] = useState('');`
  );
}

// 3. Status column logic for Distributor Expiration Warning
const distributorStatusLogic = `<td className="px-12 py-8">
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[11px] font-black text-emerald-500 uppercase italic">Active</span></div>
    {acc.expirationDate && new Date(acc.expirationDate).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 && (
       <div className="bg-rose-100 text-rose-600 text-[9px] font-black px-2 py-1 rounded w-fit italic tracking-widest mt-1">⚠️ 將於 {acc.expirationDate} 到期</div>
    )}
  </div>
</td>`;

content = content.replace(
  /<td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"><\/div><span className="text-\[11px\] font-black text-emerald-500 uppercase italic">Active<\/span><\/div><\/td>/g,
  (match, offset, str) => {
     // only replace the second occurrence (which is for distributor), wait, the regex uses /g so it replaces all.
     // To be safe, we replace it inside the Distributor block.
     return match; // We'll do it specifically below
  }
);

content = content.replace(
  /\{accountType === 'Distributor' && \([\s\S]*?<tbody className="divide-y divide-slate-50">([\s\S]*?)<\/tbody>/,
  (match) => {
     return match.replace(
       /<td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"><\/div><span className="text-\[11px\] font-black text-emerald-500 uppercase italic">Active<\/span><\/div><\/td>/,
       distributorStatusLogic
     );
  }
);

// 4. Add Transfer Button in Action column for Distributor
content = content.replace(
  /\{accountType === 'Distributor' && \([\s\S]*?<tbody className="divide-y divide-slate-50">([\s\S]*?)<\/tbody>/,
  (match) => {
     return match.replace(
       /<td className="px-12 py-8 text-right"><button className="text-\[11px\] font-black text-slate-300 uppercase hover:text-slate-900 transition-all border-b-2 border-transparent hover:border-slate-900 italic">View Detail<\/button><\/td>/,
       `<td className="px-12 py-8 text-right flex items-center justify-end gap-4">
           <button onClick={() => { setTransferTarget({ id: acc.id, type: 'Distributor' }); setIsTransferModalOpen(true); }} className="text-[11px] font-black text-rose-500 uppercase hover:text-rose-700 transition-all border-b-2 border-transparent hover:border-rose-500 italic">🔄 轉移</button>
           <button className="text-[11px] font-black text-slate-300 uppercase hover:text-slate-900 transition-all border-b-2 border-transparent hover:border-slate-900 italic">View Detail</button>
        </td>`
     );
  }
);

// Add Transfer Button in Action column for Temple
content = content.replace(
  /\{accountType === 'Temple' && \([\s\S]*?<tbody className="divide-y divide-slate-50">([\s\S]*?)<\/tbody>/,
  (match) => {
     return match.replace(
       /<button onClick=\{.*?impersonateTemple.*? className="text-\[11px\] font-black text-indigo-500 uppercase hover:text-indigo-700 transition-all border-b-2 border-transparent hover:border-indigo-500 italic">Manage<\/button>/,
       `<button onClick={() => { setTransferTarget({ id: acc.id, type: 'Temple' }); setIsTransferModalOpen(true); }} className="text-[11px] font-black text-rose-500 uppercase hover:text-rose-700 transition-all border-b-2 border-transparent hover:border-rose-500 italic">🔄 轉移</button>
        <button onClick={() => handleImpersonate(acc.id)} className="text-[11px] font-black text-indigo-500 uppercase hover:text-indigo-700 transition-all border-b-2 border-transparent hover:border-indigo-500 italic">Manage</button>`
     );
  }
);

// 5. Transfer handle function
const handleTransferFn = `
  const handleExecuteTransfer = async () => {
     if (!transferTarget.id || !transferTarget.type) return;
     startTransition(async () => {
        if (transferTarget.type === 'Temple') {
           await transferTempleOwnership(transferTarget.id, newDistributorId || null, newSalesId || null);
        } else if (transferTarget.type === 'Distributor') {
           await transferDistributorOwnership(transferTarget.id, newSalesId || null);
        }
        setIsTransferModalOpen(false);
        setTransferTarget({ id: '', type: null });
        setNewSalesId('');
        setNewDistributorId('');
        alert('轉移操作已完成，全球節點權限更新完畢！');
        window.location.reload();
     });
  };
`;
content = content.replace(
  /const handleCreateAccount = async/,
  handleTransferFn + '\n  const handleCreateAccount = async'
);

// 6. Transfer Modal UI
const transferModalUI = `
      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 border-4 border-rose-50">
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase text-rose-600">🔄 跨階層轉移</h3>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">目前選擇: {transferTarget.type === 'Temple' ? '宮廟營運節點' : '經銷代理節點'} ({transferTarget.id})</p>
              </div>

              <div className="space-y-6 bg-rose-50/50 p-8 rounded-3xl border border-rose-100">
                 {transferTarget.type === 'Temple' && (
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">指派新經銷商 (留空則為總部直屬)</label>
                      <select value={newDistributorId} onChange={(e)=>setNewDistributorId(e.target.value)} className="w-full bg-white rounded-2xl p-4 text-sm font-black outline-none border border-slate-200">
                         <option value="">-- 直屬總部 (SuperAdmin) --</option>
                         {initialAccounts.filter((a:any) => a.role === 'Distributor').map((d:any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                         ))}
                      </select>
                   </div>
                 )}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">指派超級業務 (留空則無抽成業務)</label>
                    <select value={newSalesId} onChange={(e)=>setNewSalesId(e.target.value)} className="w-full bg-white rounded-2xl p-4 text-sm font-black outline-none border border-slate-200">
                       <option value="">-- 無超級業務 --</option>
                       {initialAccounts.filter((a:any) => a.role === 'SuperSales').map((s:any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={handleExecuteTransfer} disabled={isPending} className="flex-1 py-5 rounded-[20px] bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all active:scale-95">確認強制轉移</button>
                 <button onClick={() => setIsTransferModalOpen(false)} className="px-8 py-5 rounded-[20px] bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">取消</button>
              </div>
           </div>
        </div>
      )}
`;

content = content.replace(
  /\{isAccountModalOpen && \(/,
  transferModalUI + '\n      {isAccountModalOpen && ('
);


fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content, 'utf8');
console.log('SuperAdmin UI updated with Transfer functionality');
