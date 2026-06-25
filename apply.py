import re

with open('src/app/super-admin/SuperAdminClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_jsx = """{activeTab === 'ai' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex justify-between items-end px-4">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">AI Core & Model Orchestration</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">AI 引擎與方案管理中心</h3>
                   </div>
                </div>

                {/* --- 1. Unified AI Engine & API Keys --- */}
                <div className="bg-slate-900 p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-indigo-500/30 transition-all duration-1000"></div>
                   <div className="relative z-10 max-w-5xl">
                      <div className="flex justify-between items-end mb-10">
                        <div>
                          <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">API 語言模型與核心引擎配置</h4>
                          <p className="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase">Global AI Endpoints & Model Pool</p>
                        </div>
                        <div className="flex gap-4">
                           <button onClick={async () => {
                              await import('@/app/actions').then(m => m.updateSystemConfig({ aiEndpoints: config.aiEndpoints }));
                              await saveAiApiModels(aiModels);
                              alert('✅ AI 引擎與模型設定已安全儲存生效！');
                           }} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                             💾 儲存所有 AI 配置
                           </button>
                        </div>
                      </div>

                      <div className="space-y-10">
                         {/* Core Engines */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Chat Engine */}
                            <div className="bg-white/10 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md space-y-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center text-2xl">🧠</div>
                                  <div>
                                     <h5 className="text-white font-black italic">對話大腦引擎 (主引擎)</h5>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Intelligent QA Chat</p>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">API URL</label>
                                     <input value={config?.aiEndpoints?.chatApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiUrl: e.target.value}})} className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-3 text-sm font-bold text-slate-300 outline-none focus:border-indigo-500 transition-colors" placeholder="https://api.openai.com/v1/chat/completions" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">API Key</label>
                                     <input type="password" value={config?.aiEndpoints?.chatApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiKey: e.target.value}})} className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-3 text-sm font-bold text-slate-300 outline-none focus:border-indigo-500 transition-colors" placeholder="sk-..." />
                                  </div>
                               </div>
                            </div>
                            
                            {/* OCR Engine */}
                            <div className="bg-white/10 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md space-y-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-2xl">👁️</div>
                                  <div>
                                     <h5 className="text-white font-black italic">視知識別引擎 (OCR)</h5>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vision & Scanning</p>
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">API URL</label>
                                     <input value={config?.aiEndpoints?.ocrApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiUrl: e.target.value}})} className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-3 text-sm font-bold text-slate-300 outline-none focus:border-emerald-500 transition-colors" placeholder="https://api.openai.com/v1/chat/completions" />
                                  </div>
                                  <div>
                                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">API Key</label>
                                     <input type="password" value={config?.aiEndpoints?.ocrApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiKey: e.target.value}})} className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-5 py-3 text-sm font-bold text-slate-300 outline-none focus:border-emerald-500 transition-colors" placeholder="sk-..." />
                                  </div>
                               </div>
                            </div>
                         </div>

                         {/* Fallback Models List */}
                         <div className="bg-slate-950/30 rounded-[2rem] p-8 border border-white/5 space-y-6">
                            <div className="flex justify-between items-center mb-2">
                               <h5 className="text-white font-black italic">擴充備用模型庫 (Fallback Models Pool)</h5>
                               <button onClick={() => setAiModels([...aiModels, { id: 'NEW-'+Date.now(), name: '', apiKey: '', isEnabled: false }])} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors">+ 新增備用模型</button>
                            </div>
                            <div className="space-y-4">
                               {aiModels.map((model, i) => (
                                  <div key={i} className="flex flex-col md:flex-row gap-4 items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <div className="w-full md:w-1/3">
                                      <input type="text" value={model.name} onChange={e => {
                                        const copy = [...aiModels]; copy[i].name = e.target.value; setAiModels(copy);
                                      }} placeholder="模型名稱 (e.g. Claude 3 Opus)" className="w-full bg-transparent border-b border-slate-700 px-2 py-2 text-sm font-bold text-slate-300 outline-none focus:border-indigo-500 placeholder-slate-600" />
                                    </div>
                                    <div className="w-full md:w-1/2">
                                      <input type="password" value={model.apiKey} onChange={e => {
                                        const copy = [...aiModels]; copy[i].apiKey = e.target.value; setAiModels(copy);
                                      }} placeholder="API Key" className="w-full bg-transparent border-b border-slate-700 px-2 py-2 text-sm font-bold text-slate-300 outline-none focus:border-indigo-500 placeholder-slate-600" />
                                    </div>
                                    <div className="w-full md:w-auto flex justify-end">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={model.isEnabled} onChange={e => {
                                          const copy = [...aiModels]; copy[i].isEnabled = e.target.checked; setAiModels(copy);
                                        }} />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                      </label>
                                    </div>
                                  </div>
                               ))}
                               {aiModels.length === 0 && (
                                  <p className="text-xs text-slate-500 font-bold italic text-center py-4">目前無備用模型</p>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* --- 2. AI Plans Pricing Redesign --- */}
                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="relative z-10">
                      <div className="flex justify-between items-end mb-10">
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">AI 助理定價方案配置</h4>
                          <p className="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase">SaaS Plan Pricing & Limits</p>
                        </div>
                        <button onClick={() => setAiPlans([...aiPlans, { id: 'NEW-'+Date.now(), name: '新方案', monthlyFee: 0, chatLimit: 0 }])} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-full text-[11px] font-black tracking-widest uppercase hover:bg-slate-900 hover:text-white transition-colors">
                           + 新增方案
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {aiPlans.map((plan, i) => (
                           <div key={i} className="group flex flex-col bg-slate-50 rounded-[2rem] border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 relative overflow-hidden">
                              {/* Hover gradient decoration */}
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 transition-colors duration-500"></div>
                              
                              <div className="relative z-10 flex-1 space-y-6">
                                 <div>
                                    <label className="block text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Plan Name</label>
                                    <input type="text" value={plan.name} onChange={e => {
                                      const copy = [...aiPlans]; copy[i].name = e.target.value; setAiPlans(copy);
                                    }} className="w-full bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 py-1 text-2xl font-black text-slate-900 italic tracking-tighter outline-none transition-colors" />
                                 </div>
                                 
                                 <div className="pt-2">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Fee (NT$)</label>
                                    <div className="flex items-end gap-1 border-b-2 border-slate-200 focus-within:border-indigo-500 transition-colors pb-1">
                                       <span className="text-slate-400 font-bold text-lg">$</span>
                                       <input type="number" value={plan.monthlyFee} onChange={e => {
                                         const copy = [...aiPlans]; copy[i].monthlyFee = Number(e.target.value); setAiPlans(copy);
                                       }} className="w-full bg-transparent text-3xl font-black text-slate-900 outline-none" />
                                    </div>
                                 </div>

                                 <div className="pt-2">
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Chat Limit (Tokens/Messages)</label>
                                    <input type="number" value={plan.chatLimit} onChange={e => {
                                      const copy = [...aiPlans]; copy[i].chatLimit = Number(e.target.value); setAiPlans(copy);
                                    }} className="w-full bg-transparent border-b-2 border-slate-200 focus:border-indigo-500 py-1 text-lg font-black text-slate-600 outline-none transition-colors" />
                                 </div>
                              </div>
                              
                              <div className="relative z-10 mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
                                 <button onClick={() => {
                                    if(confirm('確定要刪除這個方案嗎？')) {
                                       setAiPlans(aiPlans.filter((_, idx) => idx !== i));
                                    }
                                 }} className="text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest">
                                    Delete
                                 </button>
                                 <button onClick={async () => {
                                    await saveAiPlan(plan);
                                    alert(🚀 方案 [] 已更新儲存！);
                                 }} className="px-6 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-black tracking-widest uppercase hover:bg-indigo-600 shadow-md transition-all">
                                   Save
                                 </button>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>

                {/* --- 3. Temple AI Usage Analytics Table --- */}
                <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                   <div className="flex justify-between items-end mb-8">
                     <div>
                       <h4 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">宮廟 AI 使用狀況清單</h4>
                       <p className="text-[11px] font-bold text-slate-400 mt-2 tracking-widest uppercase">Real-time Usage Analytics</p>
                     </div>
                   </div>
                   
                   <div className="overflow-hidden rounded-3xl border border-slate-100 bg-slate-50/30">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100/50">
                           <tr className="border-b border-slate-200">
                              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">宮廟名稱</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">目前方案</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">本期用量進度</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">狀態</th>
                              <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">系統特權操作</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {allTempleAiUsage.map((u, i) => {
                              const isExpired = new Date(u.expiryDate).getTime() < Date.now();
                              const isExhausted = u.usedCount >= u.chatLimit;
                              const usagePercent = u.isVip ? 0 : Math.min(100, Math.round((u.usedCount / Math.max(1, u.chatLimit)) * 100));
                              
                              let statusBadge = <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md text-[10px] font-black tracking-widest uppercase">正常 (Active)</span>;
                              if (u.isVip) statusBadge = <span className="px-3 py-1 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 rounded-md text-[10px] font-black tracking-widest uppercase">永久免費 (VIP)</span>;
                              else if (!u.enabled) statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-md text-[10px] font-black tracking-widest uppercase">已關閉 (Disabled)</span>;
                              else if (isExpired) statusBadge = <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-md text-[10px] font-black tracking-widest uppercase">已過期 (Expired)</span>;
                              else if (isExhausted) statusBadge = <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded-md text-[10px] font-black tracking-widest uppercase">額度用盡 (Exhausted)</span>;

                              return (
                                 <tr key={i} className="hover:bg-white transition-colors">
                                    <td className="px-8 py-6 text-sm font-black text-slate-800 italic">{u.templeName}</td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-500">{u.planName}</td>
                                    <td className="px-8 py-6">
                                       <div className="flex justify-between items-end mb-2">
                                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{u.isVip ? '無上限' : 'Usage'}</span>
                                          <span className={	ext-[10px] font-black tracking-widest }>
                                             {u.isVip ? '∞' : ${u.usedCount} / }
                                          </span>
                                       </div>
                                       {!u.isVip && (
                                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                             <div className={h-full rounded-full transition-all duration-1000 } style={{ width: ${usagePercent}% }}></div>
                                          </div>
                                       )}
                                    </td>
                                    <td className="px-8 py-6">{statusBadge}</td>
                                    <td className="px-8 py-6 text-right">
                                       <button onClick={async () => {
                                          await grantTempleAiVip(u.templeId, !u.isVip);
                                          fetchAllTempleAiUsage().then(setAllTempleAiUsage);
                                       }} className={px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 }>
                                          {u.isVip ? '取消特權 (Revoke)' : '👑 設為無限免費'}
                                       </button>
                                    </td>
                                 </tr>
                              )
                           })}
                           {allTempleAiUsage.length === 0 && (
                              <tr><td colSpan={5} className="px-8 py-16 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 italic">目前沒有任何宮廟使用 AI 方案</td></tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
           )}"""

pattern = re.compile(r'\{activeTab === \'ai\' && \(\s*<div className="space-y-6">.*?</div>\s*\)\}', re.DOTALL)
content = pattern.sub(new_jsx.replace('\\', '\\\\'), content)

with open('src/app/super-admin/SuperAdminClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
