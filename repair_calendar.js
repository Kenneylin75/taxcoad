const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/calendar/page.tsx', 'utf8');

const brokenStr = `{/* 付款與對帳狀態區塊 */}
                        <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100 mt-2">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase">結緣金狀態</span>
                              <div className="flex items-center gap-2">
                                <span className={\`text-xs font-black px-2 py-1 rounded-md \${
                                  app.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                }\`}>
                                  {app.paymentStatus === 'Paid' ? '✅ 已付款' : '⏳ 待付款 / 待確認'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600">
                                  {(!app.amount && app.paymentMethod !== 'Cash') ? '隨喜功德' : 
                                   (app.amount ? \`\${app.amount === 0 ? '隨喜功德' : 'NT
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2">`;

const fixedStr = `{/* 付款與對帳狀態區塊 */}
                        <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100 mt-2">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase">結緣金狀態</span>
                              <div className="flex items-center gap-2">
                                <span className={'text-xs font-black px-2 py-1 rounded-md ' + (app.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                  {app.paymentStatus === 'Paid' ? '✅ 已付款' : '⏳ 待付款 / 待確認'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600">
                                  {(!app.amount && app.paymentMethod !== 'Cash') ? '隨喜功德' : 
                                   (app.amount ? (app.amount === 0 ? '隨喜功德' : 'NT$ ' + app.amount) : '現場付現')}
                                </span>
                              </div>
                           </div>
                           
                           {app.paymentStatus === 'Pending' && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-bold text-slate-400">
                                  {app.paymentMethod === 'Transfer' ? ('匯款後五碼: ' + (app.paymentRef || '未提供')) : 
                                   app.paymentMethod === 'Cash' ? '信眾預計現場付現' : 
                                   app.paymentMethod === 'QR' ? '信眾掃描自訂 QR 碼' : '數位支付處理中...'}
                                </span>
                                {(app.paymentMethod === 'Transfer' || app.paymentMethod === 'Cash' || app.paymentMethod === 'QR') && (
                                  <button
                                    onClick={() => handleVerifyPayment(app.id, app.paymentMethod)}
                                    className="px-3 py-1 bg-slate-900 text-amber-500 rounded-lg text-[10px] font-black hover:bg-amber-500 hover:text-slate-900 transition-all shadow-sm"
                                  >
                                    {app.paymentMethod === 'Cash' ? '💰 現金結清' : '💵 核對收款'}
                                  </button>
                                )}
                              </div>
                           )}
                        </div>

                        {/* 報到操作區塊 */}
                        <div className="flex justify-end pt-2 border-t border-slate-50 mt-2">
                          {app.status === 'Arrived' ? (
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2">`;

content = content.split(brokenStr).join(fixedStr);

fs.writeFileSync('src/app/[templeId]/admin/calendar/page.tsx', content, 'utf8');
console.log('Successfully repaired the broken string');
