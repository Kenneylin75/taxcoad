const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// 1. Add tab button
content = content.replace(
  "{ id: 'settings', label: '系統參數', icon: '⚙️' },",
  "{ id: 'settings', label: '系統參數', icon: '⚙️' },\n             { id: 'b2b_payment', label: 'B2B收款設定', icon: '💳' },"
);

// 2. Add header text
content = content.replace(
  "{activeTab === 'settings' && 'Global Configurations'}",
  "{activeTab === 'settings' && 'Global Configurations'}\n                  {activeTab === 'b2b_payment' && 'B2B Payment Gateway'}"
);

// 3. Add state for b2bPayment
content = content.replace(
  "const [aiModels, setAiModels] = useState<any[]>([]);",
  `const [aiModels, setAiModels] = useState<any[]>([]);
  const [b2bPayment, setB2bPayment] = useState<any>({
    enabledMethods: [],
    ecpay: { merchantId: '', hashKey: '', hashIV: '' },
    linePay: { channelId: '', channelSecret: '' },
    transfer: { bankCode: '', accountNumber: '', accountName: '' }
  });`
);

// 4. Update loadData
content = content.replace(
  "        setAiModels(aiModelsData);",
  `        setAiModels(aiModelsData);
        if (configData.b2bPayment) setB2bPayment(configData.b2bPayment);`
);

// 5. Add the tab content
const b2bTab = `
           {activeTab === 'b2b_payment' && (
              <div className="p-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
                 <div className="mb-12">
                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">超級管理員 B2B 收款設定</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest uppercase">System B2B Payment Gateway</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[30px] border-2 border-slate-100 shadow-2xl relative overflow-hidden">
                       <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">💳</span>
                          啟用之收款方式
                       </h4>
                       <div className="flex gap-4">
                          {['creditCard', 'linePay', 'transfer'].map(method => (
                             <label key={method} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" 
                                   checked={b2bPayment.enabledMethods.includes(method)}
                                   onChange={e => {
                                      const newMethods = e.target.checked 
                                         ? [...b2bPayment.enabledMethods, method]
                                         : b2bPayment.enabledMethods.filter((m: string) => m !== method);
                                      setB2bPayment({...b2bPayment, enabledMethods: newMethods});
                                   }}
                                />
                                <span className="font-bold text-slate-700">
                                   {method === 'creditCard' ? '信用卡 (ECPay)' : method === 'linePay' ? 'LINE Pay' : '銀行轉帳'}
                                </span>
                             </label>
                          ))}
                       </div>
                    </div>

                    {b2bPayment.enabledMethods.includes('creditCard') && (
                       <div className="bg-white p-10 rounded-[30px] border-2 border-indigo-100 shadow-xl relative overflow-hidden">
                          <h4 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl text-indigo-500">🔒</span>
                             ECPay 信用卡設定
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Merchant ID</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                   value={b2bPayment.ecpay.merchantId} onChange={e => setB2bPayment({...b2bPayment, ecpay: {...b2bPayment.ecpay, merchantId: e.target.value}})} />
                             </div>
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hash Key</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                   value={b2bPayment.ecpay.hashKey} onChange={e => setB2bPayment({...b2bPayment, ecpay: {...b2bPayment.ecpay, hashKey: e.target.value}})} />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hash IV</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                   value={b2bPayment.ecpay.hashIV} onChange={e => setB2bPayment({...b2bPayment, ecpay: {...b2bPayment.ecpay, hashIV: e.target.value}})} />
                             </div>
                          </div>
                       </div>
                    )}

                    {b2bPayment.enabledMethods.includes('linePay') && (
                       <div className="bg-white p-10 rounded-[30px] border-2 border-green-100 shadow-xl relative overflow-hidden">
                          <h4 className="text-xl font-black text-green-900 mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">📱</span>
                             LINE Pay 設定
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Channel ID</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-green-500/20 transition-all"
                                   value={b2bPayment.linePay.channelId} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelId: e.target.value}})} />
                             </div>
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Channel Secret</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-green-500/20 transition-all"
                                   value={b2bPayment.linePay.channelSecret} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelSecret: e.target.value}})} />
                             </div>
                          </div>
                       </div>
                    )}

                    {b2bPayment.enabledMethods.includes('transfer') && (
                       <div className="bg-white p-10 rounded-[30px] border-2 border-emerald-100 shadow-xl relative overflow-hidden">
                          <h4 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">🏦</span>
                             銀行轉帳設定
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">銀行代碼</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                   value={b2bPayment.transfer.bankCode} onChange={e => setB2bPayment({...b2bPayment, transfer: {...b2bPayment.transfer, bankCode: e.target.value}})} />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">收款帳號</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                   value={b2bPayment.transfer.accountNumber} onChange={e => setB2bPayment({...b2bPayment, transfer: {...b2bPayment.transfer, accountNumber: e.target.value}})} />
                             </div>
                             <div className="md:col-span-3">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">戶名</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                   value={b2bPayment.transfer.accountName} onChange={e => setB2bPayment({...b2bPayment, transfer: {...b2bPayment.transfer, accountName: e.target.value}})} />
                             </div>
                          </div>
                       </div>
                    )}

                    <button 
                       onClick={() => {
                          startTransition(async () => {
                             await updateSystemConfig({ b2bPayment });
                             alert('B2B 收款設定已儲存！');
                          });
                       }}
                       disabled={isPending}
                       className="w-full py-8 bg-slate-950 text-white rounded-[30px] font-black text-lg uppercase tracking-[0.4em] shadow-xl hover:bg-slate-800 transition-all"
                    >
                       {isPending ? '儲存中...' : '儲存收款設定'}
                    </button>
                 </div>
              </div>
           )}
`;

content = content.replace("        </div>\n      \n        {activeTab === 'ai_settings' && (", "        </div>\n      " + b2bTab + "\n        {activeTab === 'ai_settings' && (");
fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content);
console.log('Done modifying SuperAdminClient');
