const fs = require('fs');

let clientContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

const modalCode = `
      {/* View Detail Modal */}
      {viewingAccountDetail && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 p-4">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-50 p-8 flex justify-between items-center border-b border-slate-100">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">{viewingAccountDetail.role === 'Temple' ? '宮廟基本信息' : '帳戶基本信息'}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{viewingAccountDetail.role} ACCOUNT DETAIL</p>
                 </div>
                 <button onClick={() => { setViewingAccountDetail(null); setNewPassword(''); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">✕</button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">ID / 編號</span>
                       <span className="text-sm font-black text-slate-900">{viewingAccountDetail.id}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">名稱 (Name)</span>
                       <span className="text-sm font-black text-slate-900">{viewingAccountDetail.name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">登入帳號 (Account)</span>
                       <span className="text-sm font-black text-slate-900">{viewingAccountDetail.account}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">狀態 (Status)</span>
                       <span className="text-sm font-black text-emerald-500 uppercase italic">{viewingAccountDetail.status}</span>
                    </div>
                 </div>

                 <div className="pt-4 space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">修改密碼 (Reset Password)</label>
                    <input 
                       type="text" 
                       placeholder="請輸入新密碼 (不修改請留空)" 
                       value={newPassword}
                       onChange={e => setNewPassword(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                 </div>
              </div>
              <div className="bg-slate-50 p-6 flex gap-4">
                 <button 
                    onClick={() => {
                       if (!newPassword) { alert('請輸入新密碼！'); return; }
                       startTransition(async () => {
                          await updateAccountPassword(viewingAccountDetail.id, newPassword, viewingAccountDetail.role);
                          alert('密碼修改成功！');
                          setViewingAccountDetail(null);
                          setNewPassword('');
                       });
                    }}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest"
                 >儲存密碼更新</button>
                 <button onClick={() => { setViewingAccountDetail(null); setNewPassword(''); }} className="px-8 py-4 text-slate-400 font-bold text-xs">關閉</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}`;

clientContent = clientContent.replace(/    <\/div>\s*  \);\s*\}\s*$/m, modalCode);
fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', clientContent, 'utf8');

console.log('Modal injected');
