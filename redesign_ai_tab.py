import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# We want to replace everything from            {activeTab === 'ai' && ( to            {activeTab === 'finance' && (() => {

new_content = """           {activeTab === 'ai' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex justify-between items-end px-4">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">AI Core & Model Orchestration</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">AI 引擎與方案管理</h3>
                   </div>
                </div>

                {/* --- 1. Unified AI Engine & API Keys (Redesigned - Light Theme) --- */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
                   
                   <div className="relative z-10">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">API 端點與備用模型池</h4>
                          <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Global AI Endpoints & Model Pool</p>
                        </div>
                        <button onClick={async () => {
                           await import('@/app/actions').then(m => m.updateSystemConfig({ aiEndpoints: config.aiEndpoints }));
                           await saveAiApiModels(aiModels);
                           alert('✨ AI 參數設定已成功儲存！');
                        }} className="px-8 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                           💾 儲存所有 AI 設定
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                         {/* Core Engines (Combined into a cleaner layout) */}
                         <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-slate-100">🧠</div>
                               <div>
                                  <h5 className="text-slate-800 font-black italic text-lg">對話大腦引擎 (主對話)</h5>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Intelligent QA Chat</p>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API URL</label>
                                  <input value={config?.aiEndpoints?.chatApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiUrl: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="https://api.openai.com/v1/chat/completions" />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API Key</label>
                                  <input type="password" value={config?.aiEndpoints?.chatApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiKey: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="sk-..." />
                               </div>
                            </div>
                         </div>
                         
                         <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-slate-100">👁️</div>
                               <div>
                                  <h5 className="text-slate-800 font-black italic text-lg">視覺識別引擎 (OCR)</h5>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Vision & Scanning</p>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API URL</label>
                                  <input value={config?.aiEndpoints?.ocrApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiUrl: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="https://api.openai.com/v1/chat/completions" />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API Key</label>
                                  <input type="password" value={config?.aiEndpoints?.ocrApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiKey: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="sk-..." />
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Fallback Models List */}
                      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                         <div className="flex justify-between items-center bg-slate-50/80 border-b border-slate-200 px-6 py-4">
                            <h5 className="text-slate-700 font-black italic text-sm">🔄 備用模型池 (Fallback Models Pool)</h5>
                            <button onClick={() => setAiModels([...aiModels, { id: 'NEW-'+Date.now(), name: '', apiKey: '', isEnabled: false }])} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">+ 新增備用模型</button>
                         </div>
                         <div className="p-4 space-y-3">
                            {aiModels.map((model, i) => (
                               <div key={i} className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                 <div className="w-full md:w-1/3">
                                   <input type="text" value={model.name} onChange={e => {
                                     const copy = [...aiModels]; copy[i].name = e.target.value; setAiModels(copy);
                                   }} placeholder="模型名稱 (e.g. Claude 3 Opus)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                                 </div>
                                 <div className="w-full md:w-1/2">
                                   <input type="password" value={model.apiKey} onChange={e => {
                                     const copy = [...aiModels]; copy[i].apiKey = e.target.value; setAiModels(copy);
                                   }} placeholder="API Key" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                                 </div>
                                 <div className="w-full md:w-auto flex justify-end">
                                   <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={model.isEnabled} onChange={e => {
                                       const copy = [...aiModels]; copy[i].isEnabled = e.target.checked; setAiModels(copy);
                                     }} />
                                     <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                   </label>
                                 </div>
                                 <button onClick={() => {
                                    if(confirm('確定要刪除此備用模型嗎？')) setAiModels(aiModels.filter((_, idx) => idx !== i));
                                 }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                 </button>
                               </div>
                            ))}
                            {aiModels.length === 0 && (
                               <p className="text-xs text-slate-400 font-bold italic text-center py-6">目前尚無備用模型</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                {/* --- 2. AI Plans Pricing Redesign (Light Theme) --- */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-fuchsia-500/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-fuchsia-50 to-pink-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">AI 方案定價與配置</h4>
                          <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">SaaS Plan Pricing & Limits</p>
                        </div>
                        <button onClick={() => setAiPlans([...aiPlans, { id: 'NEW-'+Date.now(), name: '新方案', monthlyFee: 0, chatLimit: 0 }])} className="px-6 py-2.5 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-fuchsia-600 hover:text-white transition-colors shadow-sm">
                           + 新增方案
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {aiPlans.map((plan, i) => (
                           <div key={i} className="group flex flex-col bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:shadow-fuchsia-500/10 hover:border-fuchsia-200 transition-all duration-300 relative overflow-hidden">
                              <div className="relative z-10 flex-1 space-y-5">
                                 <div>
                                    <label className="block text-[9px] font-black text-fuchsia-500 uppercase tracking-widest mb-1.5">Plan Name</label>
                                    <input type="text" value={plan.name} onChange={e => {
                                      const copy = [...aiPlans]; copy[i].name = e.target.value; setAiPlans(copy);
                                    }} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xl font-black text-slate-800 italic tracking-tighter outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500/10 transition-colors" />
                                 </div>
                                 
                                 <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monthly Fee (NT$)</label>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 focus-within:border-fuchsia-300 focus-within:ring-2 focus-within:ring-fuchsia-500/10 transition-colors">
                                       <span className="text-slate-400 font-bold text-sm">$</span>
                                       <input type="number" value={plan.monthlyFee} onChange={e => {
                                         const copy = [...aiPlans]; copy[i].monthlyFee = Number(e.target.value); setAiPlans(copy);
                                       }} className="w-full bg-transparent py-2 text-2xl font-black text-slate-800 outline-none" />
                                    </div>
                                 </div>

                                 <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monthly Chat Limit</label>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 focus-within:border-fuchsia-300 focus-within:ring-2 focus-within:ring-fuchsia-500/10 transition-colors">
                                       <span className="text-slate-400 font-bold text-xs">Tokens</span>
                                       <input type="number" value={plan.chatLimit} onChange={e => {
                                         const copy = [...aiPlans]; copy[i].chatLimit = Number(e.target.value); setAiPlans(copy);
                                       }} className="w-full bg-transparent py-2 text-lg font-black text-slate-600 outline-none" />
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
                                 <button onClick={() => {
                                    if(confirm('確定要刪除這個方案嗎？')) setAiPlans(aiPlans.filter((_, idx) => idx !== i));
                                 }} className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest px-2 py-1 rounded hover:bg-rose-50">
                                    Delete
                                 </button>
                                 <button onClick={async () => {
                                    await saveAiPlan(plan);
                                    alert(✨ 方案 [] 已更新儲存！);
                                 }} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black tracking-widest uppercase hover:bg-fuchsia-600 shadow-md hover:shadow-fuchsia-500/30 transition-all">
                                   Save
                                 </button>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>

                {/* --- 3. Temple AI Usage Analytics Table (Light Theme) --- */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-500/5">
                   <div className="flex justify-between items-end mb-6">
                     <div>
                       <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">宮廟 AI 使用狀況監控</h4>
                       <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Real-time Usage Analytics</p>
                     </div>
                   </div>
                   
                   <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">宮廟名稱</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">目前方案</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">當月使用額度</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">狀態</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">系統設定權</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {allTempleAiUsage.map((u, i) => {
                              const isExpired = new Date(u.expiryDate).getTime() < Date.now();
                              const isExhausted = u.usedCount >= u.chatLimit;
                              const usagePercent = u.isVip ? 0 : Math.min(100, Math.round((u.usedCount / Math.max(1, u.chatLimit)) * 100));
                              
                              let statusBadge = <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black tracking-widest uppercase">啟用中 (Active)</span>;
                              if (u.isVip) statusBadge = <span className="px-2.5 py-1 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 rounded text-[9px] font-black tracking-widest uppercase">無限免費 (VIP)</span>;
                              else if (!u.enabled) statusBadge = <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] font-black tracking-widest uppercase">已停用 (Disabled)</span>;
                              else if (isExpired) statusBadge = <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-black tracking-widest uppercase">已過期 (Expired)</span>;
                              else if (isExhausted) statusBadge = <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black tracking-widest uppercase">額度耗盡 (Exhausted)</span>;

                              return (
                                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-5 text-sm font-black text-slate-700">{u.templeName}</td>
                                    <td className="px-6 py-5 text-xs font-bold text-slate-500">{u.planName}</td>
                                    <td className="px-6 py-5">
                                       <div className="flex justify-between items-end mb-1.5">
                                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{u.isVip ? '無限制' : 'Usage'}</span>
                                          <span className={	ext-[10px] font-black tracking-widest }>
                                             {u.isVip ? '∞' : ${u.usedCount} / }
                                          </span>
                                       </div>
                                       {!u.isVip && (
                                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                             <div className={h-full rounded-full transition-all duration-1000 } style={{ width: ${usagePercent}% }}></div>
                                          </div>
                                       )}
                                    </td>
                                    <td className="px-6 py-5">{statusBadge}</td>
                                    <td className="px-6 py-5 text-right">
                                       <button onClick={async () => {
                                          await grantTempleAiVip(u.templeId, !u.isVip);
                                          fetchAllTempleAiUsage().then(setAllTempleAiUsage);
                                       }} className={px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 }>
                                          {u.isVip ? '取消特權 (Revoke)' : '✨ 設為無限免費'}
                                       </button>
                                    </td>
                                 </tr>
                              )
                           })}
                           {allTempleAiUsage.length === 0 && (
                              <tr><td colSpan={5} className="px-6 py-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 italic">目前沒有任何宮廟使用 AI 助理</td></tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
           )}"""

content = re.sub(r'\{\s*activeTab === \'ai\' && \([\s\S]*?\{\s*activeTab === \'finance\' && \(\(\) => \{', new_content + "\n\n           {activeTab === 'finance' && (() => {", content)

with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
