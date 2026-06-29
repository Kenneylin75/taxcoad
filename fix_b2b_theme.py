import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_content = """                    {/* 支付通道憑證設定 */}
                    <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                       
                       <div className="relative z-10">
                          <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                             <span className="text-3xl">🔐</span> 通道憑證配置 (Gateway Credentials)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* ECPay */}
                             <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 space-y-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                  <h5 className="font-black text-lg italic tracking-widest text-indigo-500">ECPay 綠界科技</h5>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={b2bPayment.thirdParty?.enabled} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, enabled: e.target.checked}})} />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                  </label>
                                </div>
                                <input type="text" placeholder="Merchant ID" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.thirdParty?.merchantId || ''} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, merchantId: e.target.value}})} />
                                <input type="text" placeholder="Hash Key" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.thirdParty?.hashKey || ''} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, hashKey: e.target.value}})} />
                                <input type="text" placeholder="Hash IV" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.thirdParty?.hashIV || ''} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, hashIV: e.target.value}})} />
                             </div>
                             
                             {/* LINE Pay */}
                             <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 space-y-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                  <h5 className="font-black text-lg italic tracking-widest text-emerald-500">LINE Pay</h5>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={b2bPayment.linePay?.enabled} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, enabled: e.target.checked}})} />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                  </label>
                                </div>
                                <input type="text" placeholder="Channel ID" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.linePay?.channelId || ''} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelId: e.target.value}})} />
                                <input type="text" placeholder="Channel Secret" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.linePay?.channelSecret || ''} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelSecret: e.target.value}})} />
                             </div>

                             {/* Bank Transfer */}
                             <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 space-y-4 md:col-span-2 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                  <h5 className="font-black text-lg italic tracking-widest text-amber-500">銀行匯款帳戶</h5>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={b2bPayment.customTransfer?.enabled} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, enabled: e.target.checked}})} />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                  </label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <input type="text" placeholder="銀行代碼" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.customTransfer?.bankCode || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, bankCode: e.target.value}})} />
                                   <input type="text" placeholder="帳戶名稱" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 md:col-span-2" value={b2bPayment.customTransfer?.accountName || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, accountName: e.target.value}})} />
                                   <input type="text" placeholder="銀行帳號" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 md:col-span-3" value={b2bPayment.customTransfer?.accountNo || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, accountNo: e.target.value}})} />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>"""

# Replace the specific section
content = re.sub(
    r'\{\/\* 支付通道憑證設定 \*\/\}.*?<\/div>.*?<\/div>',
    new_content,
    content,
    flags=re.DOTALL
)

with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
