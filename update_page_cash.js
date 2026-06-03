const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add fetchPaymentConfig call in init()
const initBlock = `      const user = await getGuestUser();`;
const initBlockReplacement = `      const pc = await fetchPaymentConfig();
      if (pc) setPaymentConfig(pc);
      
      const user = await getGuestUser();`;
content = content.replace(initBlock, initBlockReplacement);

// 2. Add the Cash Payment button in renderPaymentModal()
const modalBtnsStart = `<button onClick={async () => { if (paymentIntent.onPaid) { await paymentIntent.onPaid('ecpay'); } setPaymentIntent(null); setIsDetailModalOpen(false); }} className="py-4 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl font-black text-xs shadow-sm border border-slate-200 active:scale-95 transition-transform">
               轉帳匯款
             </button>`;

const modalBtnsReplacement = `<button onClick={async () => { if (paymentIntent.onPaid) { await paymentIntent.onPaid('ecpay'); } setPaymentIntent(null); setIsDetailModalOpen(false); }} className="py-4 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-2xl font-black text-xs shadow-sm border border-slate-200 active:scale-95 transition-transform">
               轉帳匯款
             </button>
             {paymentConfig?.cash?.enabled !== false && (
               <button onClick={async () => { if (paymentIntent.onPaid) { await paymentIntent.onPaid('Cash'); } setPaymentIntent(null); setIsDetailModalOpen(false); }} className="col-span-2 py-4 bg-amber-500 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2">
                 💵 現場現金付款
               </button>
             )}`;

content = content.replace(modalBtnsStart, modalBtnsReplacement);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Updated page.tsx for cash payment module');
