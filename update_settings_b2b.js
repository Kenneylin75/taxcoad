const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/settings/page.tsx', 'utf8');

// 1. Add states
content = content.replace(
  "const [selectedAiPlanId, setSelectedAiPlanId] = useState('');",
  `const [selectedAiPlanId, setSelectedAiPlanId] = useState('');
  
  const [b2bConfig, setB2bConfig] = useState<any>(null);
  const [b2bModalOpen, setB2bModalOpen] = useState(false);
  const [b2bTarget, setB2bTarget] = useState<any>(null); // { type: 'storage' | 'ai' }
  const [selectedB2bMethod, setSelectedB2bMethod] = useState('creditCard');
  const [transferLast5, setTransferLast5] = useState('');`
);

// 2. Fetch B2B Config
content = content.replace(
  "fetchTempleAiUsage().then(setAiInfo);",
  `fetchTempleAiUsage().then(setAiInfo);
    
    // We assume templeId is accessible via window.location or we can just pass dynamic ID
    const currentTempleId = window.location.pathname.split('/')[1];
    fetchB2BPaymentConfig(currentTempleId).then(setB2bConfig);`
);

// 3. Intercept existing "handleUpgrade" (Storage Upgrade)
content = content.replace(
  `const handleUpgrade = () => {
    setIsPaying(true);
    startTransition(async () => {
      const res = await upgradeTempleStorage('temple-1', selectedPlanId, selectedCycle);
      if (res.success) {
        alert('💳 付款成功！您的雲端空間已即時擴充！');
        setIsModalOpen(false);
        fetchTempleStorages().then(list => {
          const myStorage = list.find(s => s.templeId === 'temple-1');
          if (myStorage) setStorageInfo(myStorage);
        });
      }
      setIsPaying(false);
    });
  };`,
  `const handleUpgrade = () => {
    if (!b2bConfig || !b2bConfig.enabledMethods || b2bConfig.enabledMethods.length === 0) {
      alert('上層機構尚未設定收款方式，請聯繫代理商或系統客服。');
      return;
    }
    // Set target and open B2B modal instead of paying directly
    setB2bTarget({ type: 'storage' });
    setSelectedB2bMethod(b2bConfig.enabledMethods[0]);
    setIsModalOpen(false); // Close storage plan modal
    setB2bModalOpen(true);
  };`
);

// 4. Intercept AI payment (Currently inline)
content = content.replace(
  `onClick={() => {
                       if (!selectedAiPlanId) return alert('請選擇方案');
                       setIsPaying(true);
                       startTransition(async () => {
                          const res = await purchaseAiPlan(selectedAiPlanId);
                          if (res.success) {
                             alert('💳 AI 方案升級付款成功！');
                             setIsAiModalOpen(false);
                             fetchTempleAiUsage().then(setAiInfo);
                          }
                          setIsPaying(false);
                       });
                    }}`,
  `onClick={() => {
                       if (!selectedAiPlanId) return alert('請選擇方案');
                       if (!b2bConfig || !b2bConfig.enabledMethods || b2bConfig.enabledMethods.length === 0) {
                         alert('上層機構尚未設定收款方式，請聯繫代理商或系統客服。');
                         return;
                       }
                       setB2bTarget({ type: 'ai' });
                       setSelectedB2bMethod(b2bConfig.enabledMethods[0]);
                       setIsAiModalOpen(false); // Close AI plan modal
                       setB2bModalOpen(true);
                    }}`
);

// 5. Add B2B Modal Component
const b2bModal = `
      {/* B2B Payment Modal */}
      {b2bModalOpen && b2bConfig && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border-4 border-white max-h-[90vh]">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute right-0 top-0 opacity-5 text-8xl -translate-y-8 translate-x-8">💰</div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">B2B 安全金流閘道</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Secure Payment Gateway</p>
                 </div>
                 <button onClick={() => setB2bModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center font-bold transition-all relative z-10">✕</button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto">
                 <h4 className="text-sm font-black text-slate-800">選擇付款方式</h4>
                 <div className="grid grid-cols-1 gap-3">
                    {b2bConfig.enabledMethods.includes('creditCard') && (
                       <label className={\`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all \${selectedB2bMethod === 'creditCard' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}\`}>
                          <input type="radio" name="b2bMethod" className="sr-only" checked={selectedB2bMethod === 'creditCard'} onChange={() => setSelectedB2bMethod('creditCard')} />
                          <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">💳</span>
                          <div>
                             <p className="text-sm font-black text-slate-800">信用卡安全支付 (ECPay)</p>
                             <p className="text-[10px] font-bold text-slate-400">支援 VISA, MasterCard, JCB</p>
                          </div>
                          {selectedB2bMethod === 'creditCard' && <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">✓</div>}
                       </label>
                    )}
                    {b2bConfig.enabledMethods.includes('linePay') && (
                       <label className={\`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all \${selectedB2bMethod === 'linePay' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-300'}\`}>
                          <input type="radio" name="b2bMethod" className="sr-only" checked={selectedB2bMethod === 'linePay'} onChange={() => setSelectedB2bMethod('linePay')} />
                          <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">📱</span>
                          <div>
                             <p className="text-sm font-black text-slate-800">LINE Pay</p>
                             <p className="text-[10px] font-bold text-slate-400">使用 LINE Points 折抵</p>
                          </div>
                          {selectedB2bMethod === 'linePay' && <div className="ml-auto w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>}
                       </label>
                    )}
                    {b2bConfig.enabledMethods.includes('transfer') && (
                       <label className={\`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all \${selectedB2bMethod === 'transfer' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'}\`}>
                          <input type="radio" name="b2bMethod" className="sr-only" checked={selectedB2bMethod === 'transfer'} onChange={() => setSelectedB2bMethod('transfer')} />
                          <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">🏦</span>
                          <div>
                             <p className="text-sm font-black text-slate-800">銀行匯款 / ATM 轉帳</p>
                             <p className="text-[10px] font-bold text-slate-400">專屬虛擬帳號或實體轉帳</p>
                          </div>
                          {selectedB2bMethod === 'transfer' && <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>}
                       </label>
                    )}
                 </div>

                 {/* Transfer Details */}
                 {selectedB2bMethod === 'transfer' && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-4 animate-in fade-in zoom-in-95">
                       <h5 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-widest">請匯款至以下帳戶</h5>
                       <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-bold text-slate-500">銀行代碼</span>
                             <span className="text-sm font-black text-slate-800">{b2bConfig.transfer.bankCode}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-bold text-slate-500">收款帳號</span>
                             <span className="text-sm font-black text-slate-800 font-mono tracking-wider text-emerald-600">{b2bConfig.transfer.accountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-bold text-slate-500">戶名</span>
                             <span className="text-sm font-black text-slate-800">{b2bConfig.transfer.accountName}</span>
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">您的匯款帳號末五碼</label>
                          <input type="text" maxLength={5} placeholder="例如: 12345" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/50"
                             value={transferLast5} onChange={e => setTransferLast5(e.target.value)} />
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                 <button 
                    onClick={() => {
                       if (selectedB2bMethod === 'transfer' && transferLast5.length < 5) {
                          return alert('請輸入完整的帳號末五碼！');
                       }
                       setIsPaying(true);
                       startTransition(async () => {
                          const currentTempleId = window.location.pathname.split('/')[1];
                          const methodStr = selectedB2bMethod === 'creditCard' ? '信用卡' : selectedB2bMethod === 'linePay' ? 'LINE Pay' : \`轉帳(\${transferLast5})\`;
                          
                          if (b2bTarget.type === 'storage') {
                             const res = await upgradeTempleStorage(currentTempleId, selectedPlanId, selectedCycle);
                             if (res.success) {
                                alert(\`✅ [\${methodStr}] 付款/通報成功！雲端空間已即時擴充！\`);
                                fetchTempleStorages().then(list => {
                                  const myStorage = list.find(s => s.templeId === currentTempleId);
                                  if (myStorage) setStorageInfo(myStorage);
                                });
                             }
                          } else if (b2bTarget.type === 'ai') {
                             const res = await purchaseAiPlan(selectedAiPlanId, methodStr);
                             if (res.success) {
                                alert(\`✅ [\${methodStr}] 付款/通報成功！AI 方案已升級！\`);
                                fetchTempleAiUsage().then(setAiInfo);
                             }
                          }
                          setIsPaying(false);
                          setB2bModalOpen(false);
                       });
                    }}
                    disabled={isPaying || !selectedB2bMethod}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                 >
                    {isPaying ? '處理中...' : selectedB2bMethod === 'transfer' ? '確認已匯款並開通' : '前往支付閘道並開通'}
                 </button>
              </div>
           </div>
        </div>
      )}
`;

content = content.replace("{/* AI Upgrade Modal */}", b2bModal + "\n      {/* AI Upgrade Modal */}");

fs.writeFileSync('src/app/[templeId]/admin/settings/page.tsx', content);
console.log('Done settings/page.tsx modification');
