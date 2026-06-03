const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add fetchPaymentConfig import
pageContent = pageContent.replace(
  /fetchServiceDefinitions,/,
  `fetchServiceDefinitions,\n  fetchPaymentConfig,`
);

// 2. Add paymentConfig state
pageContent = pageContent.replace(
  /const \[paymentIntent, setPaymentIntent\] = useState<\{ amount: number, onPaid: \(gateway: 'ecpay' \| 'linepay'\) => void \} \| null>\(null\);/,
  `const [paymentIntent, setPaymentIntent] = useState<{ amount: number, onPaid: (method: string, ref: string) => void } | null>(null);\n  const [paymentConfig, setPaymentConfig] = useState<any>(null);\n  const [paymentMethod, setPaymentMethod] = useState<string>('');\n  const [paymentRef, setPaymentRef] = useState<string>('');`
);

// 3. Load paymentConfig
pageContent = pageContent.replace(
  /const loadData = async \(\) => \{/,
  `const loadData = async () => {\n      const pConf = await fetchPaymentConfig();\n      if(pConf) setPaymentConfig(pConf);`
);

// 4. Update the renderPaymentGateway UI
const newPaymentUI = `
  const renderPaymentGateway = () => {
    if (!paymentIntent) return null;
    return (
      <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="bg-white rounded-[40px] shadow-2xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter">選擇付款方式</h2>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Select Payment Method</p>
            <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <span className="text-sm font-bold text-slate-400 mr-1">NT$</span>
              <span className="text-4xl font-black text-slate-900">{paymentIntent.amount}</span>
            </div>
          </div>

          <div className="space-y-4">
            {!paymentMethod && paymentConfig ? (
               <div className="grid grid-cols-2 gap-4">
                 {paymentConfig.thirdParty?.enabled && (
                    <button onClick={() => { setPaymentMethod('ThirdPartyApi'); paymentIntent.onPaid('ThirdPartyApi', ''); setPaymentIntent(null); setIsDetailModalOpen(false); }} className="col-span-2 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                      💳 信用卡 / 超商
                    </button>
                 )}
                 {paymentConfig.linePay?.enabled && (
                    <button onClick={() => { setPaymentMethod('LinePayApi'); paymentIntent.onPaid('LinePayApi', ''); setPaymentIntent(null); setIsDetailModalOpen(false); }} className="py-4 bg-[#06C755] text-white rounded-2xl font-black text-xs shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2">
                      LINE Pay
                    </button>
                 )}
                 {paymentConfig.customTransfer?.enabled && (
                    <button onClick={() => setPaymentMethod('Transfer')} className="py-4 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl font-black text-xs shadow-sm border border-slate-200 active:scale-95 transition-transform flex flex-col items-center justify-center gap-1">
                      <span className="text-base">🏦</span> 轉帳匯款
                    </button>
                 )}
                 {paymentConfig.customQR?.enabled && (
                    <button onClick={() => setPaymentMethod('QR')} className="col-span-2 py-4 bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-2xl font-black text-xs shadow-sm border border-pink-100 active:scale-95 transition-transform flex items-center justify-center gap-2">
                      🔗 個人 QR 收款碼
                    </button>
                 )}
                 {(!paymentConfig.thirdParty?.enabled && !paymentConfig.linePay?.enabled && !paymentConfig.customTransfer?.enabled && !paymentConfig.customQR?.enabled) && (
                    <button onClick={() => { setPaymentMethod('Cash'); paymentIntent.onPaid('Cash', ''); setPaymentIntent(null); setIsDetailModalOpen(false); }} className="col-span-2 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs shadow-sm border border-slate-200 active:scale-95 transition-transform">
                      現金 / 臨櫃繳費
                    </button>
                 )}
               </div>
            ) : paymentMethod === 'Transfer' ? (
               <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-800 text-xs font-bold leading-relaxed">
                     <p>請將款項匯入以下帳戶：</p>
                     <p className="mt-1 font-black">銀行：{paymentConfig.customTransfer.bankCode} {paymentConfig.customTransfer.bankName}</p>
                     <p>戶名：{paymentConfig.customTransfer.accountName}</p>
                     <p className="text-sm font-black text-slate-900 mt-2 bg-white px-2 py-1 inline-block rounded">{paymentConfig.customTransfer.accountNo}</p>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">匯款帳戶後 5 碼 (必填)</label>
                     <input type="text" maxLength={5} value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-amber-500 transition-colors" placeholder="輸入後五碼以便對帳" />
                  </div>
                  <button disabled={paymentRef.length < 5} onClick={() => { paymentIntent.onPaid('Transfer', paymentRef); setPaymentIntent(null); setPaymentMethod(''); setPaymentRef(''); setIsDetailModalOpen(false); }} className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 hover:bg-amber-600 transition-all">
                     ✅ 已經完成匯款
                  </button>
               </div>
            ) : paymentMethod === 'QR' ? (
               <div className="space-y-4 animate-in slide-in-from-right-4">
                  <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 text-pink-800 text-center">
                     <img src={paymentConfig.customQR.qrImageUrl} alt="QR Code" className="max-h-40 mx-auto rounded-xl shadow-sm mb-3" />
                     <p className="text-xs font-bold">{paymentConfig.customQR.description}</p>
                  </div>
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">交易序號 / 備註</label>
                     <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-pink-500 transition-colors" placeholder="請輸入序號或您設定的備註" />
                  </div>
                  <button disabled={!paymentRef} onClick={() => { paymentIntent.onPaid('QR', paymentRef); setPaymentIntent(null); setPaymentMethod(''); setPaymentRef(''); setIsDetailModalOpen(false); }} className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 hover:bg-pink-600 transition-all">
                     ✅ 已經掃碼付款
                  </button>
               </div>
            ) : null}
          </div>
          <button onClick={() => { setPaymentMethod(''); setPaymentRef(''); setPaymentIntent(null); }} className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest">取消返回</button>
        </div>
      </div>
    );
  };
`;

// Replace the old renderPaymentGateway
pageContent = pageContent.replace(
  /const renderPaymentGateway = \(\) => \{[\s\S]*?<\/div>\s*\);\s*\};/,
  newPaymentUI
);

// Fix handleBooking
pageContent = pageContent.replace(
  /setPaymentIntent\(\{ amount: cost, onPaid: async \(gateway\) => \{/,
  `setPaymentIntent({ amount: cost, onPaid: async (paymentMethod, paymentRef) => {`
);

// Fix fd.append
pageContent = pageContent.replace(
  /if \(guestUser\) \{[\s\S]*?fd\.append\('guestName', guestUser\.name\);/,
  `if (guestUser) {\n          fd.append('phone', guestUser.phone);\n          fd.append('guestName', guestUser.name);\n        }\n        fd.append('paymentMethod', paymentMethod);\n        fd.append('paymentRef', paymentRef);`
);

fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');
console.log('Updated page.tsx for checkout UI');
