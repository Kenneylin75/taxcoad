const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/settings/page.tsx', 'utf8');

const newSidebar = `

         {/* Sidebar: AI Assistant Manager */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm shadow-inner">🤖</div>
               <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI 智能香客管家</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SaaS AI Assistant Status</p>
               </div>
            </div>

            {!settings.modules.agi ? (
               <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-400">模組尚未啟用，請從左側開啟</p>
               </div>
            ) : aiInfo && (
               <div className="space-y-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>當前方案</span>
                     <span className="text-slate-800">{aiInfo.planName}</span>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-[11px] font-black italic">
                        <span className="text-slate-800">{aiInfo.isVip ? '免費無限' : \`\${aiInfo.usedCount} 次已使用\`}</span>
                        <span className="text-slate-400">{aiInfo.isVip ? '無限制' : \`配額 \${aiInfo.chatLimit} 次\`}</span>
                     </div>
                     {!aiInfo.isVip && (
                       <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div 
                             className={\`h-full rounded-full transition-all \${
                                (aiInfo.usedCount / aiInfo.chatLimit) * 100 >= 85 ? 'bg-rose-500 animate-pulse' : 'bg-fuchsia-500'
                             }\`}
                             style={{ width: \`\${Math.min((aiInfo.usedCount / aiInfo.chatLimit) * 100, 100)}%\` }}
                          ></div>
                       </div>
                     )}
                     <p className="text-[8px] font-bold text-slate-400 italic">
                        到期日: {aiInfo.isVip ? '永久有效' : new Date(aiInfo.expiryDate).toLocaleDateString()} 
                        {(!aiInfo.isVip && new Date(aiInfo.expiryDate).getTime() < Date.now()) && <span className="text-rose-500 ml-1">(已過期)</span>}
                     </p>
                  </div>

                  <button 
                     onClick={() => setIsAiModalOpen(true)}
                     className="w-full py-3 bg-slate-900 text-fuchsia-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                  >
                     升級與續約方案
                  </button>
               </div>
            )}
         </div>
`;

const aiModal = `

      {/* AI Upgrade Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border-4 border-white max-h-[90vh]">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute right-0 top-0 opacity-5 text-9xl -translate-y-10 translate-x-10">🤖</div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">AI 方案續約與升級</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">AI Assistant Plan Upgrade</p>
                 </div>
                 <button onClick={() => setIsAiModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center font-bold transition-all relative z-10">✕</button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiPlans.map(plan => (
                       <label key={plan.id} className={\`relative p-6 rounded-2xl border-2 cursor-pointer transition-all \${selectedAiPlanId === plan.id ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md translate-y-0' : 'border-slate-100 hover:border-slate-300 bg-white hover:-translate-y-1'}\`}>
                          <input type="radio" name="aiPlan" className="sr-only" checked={selectedAiPlanId === plan.id} onChange={() => setSelectedAiPlanId(plan.id)} />
                          {selectedAiPlanId === plan.id && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-fuchsia-500 shadow-sm flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>}
                          <h4 className="text-sm font-black text-slate-900 mb-1">{plan.name}</h4>
                          <p className="text-2xl font-black text-fuchsia-600 mb-4">NT$ {plan.monthlyFee}</p>
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="text-emerald-500">✓</span> 每月對話上限 {plan.chatLimit} 次</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="text-emerald-500">✓</span> 智慧上下文記憶</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="text-emerald-500">✓</span> 30天訂閱保障</div>
                          </div>
                       </label>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                 <button 
                    onClick={() => {
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
                    }}
                    disabled={isPaying || !selectedAiPlanId}
                    className="w-full py-5 bg-slate-900 text-fuchsia-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isPaying ? '處理金流中...' : '確認信用卡結帳並啟用'}
                 </button>
                 <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest italic">付款後將立即重置 30 天訂閱期與對話次數</p>
              </div>
           </div>
        </div>
      )}
`;

content = content.replace('         {/* Sidebar: Cloud Storage & Quota Manager */}', newSidebar + '         {/* Sidebar: Cloud Storage & Quota Manager */}');
content = content.replace('      {/* Upgrade Modal */}', aiModal + '\n      {/* Upgrade Modal */}');

fs.writeFileSync('src/app/[templeId]/admin/settings/page.tsx', content);
console.log('Modified settings/page.tsx for AI UI');
