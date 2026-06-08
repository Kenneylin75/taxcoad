const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

const newBlocks = `
                <div className="bg-white p-12 rounded-[2rem] border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">🧠</div>
                   <div className="relative z-10 max-w-4xl">
                      <div className="flex justify-between items-end mb-8">
                        <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-emerald-500 underline-offset-8">API 語言模型配置</h4>
                        <button onClick={async () => {
                           await saveAiApiModels(aiModels);
                           alert('✅ API 語言模型設定已儲存！');
                        }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                          儲存所有模型 💾
                        </button>
                      </div>
                      <div className="space-y-6">
                        {aiModels.map((model, i) => (
                           <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">模型名稱</label>
                               <input type="text" value={model.name} onChange={e => {
                                 const copy = [...aiModels];
                                 copy[i].name = e.target.value;
                                 setAiModels(copy);
                               }} placeholder="例如: OpenAI GPT-4" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-2">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Key</label>
                               <input type="password" value={model.apiKey} onChange={e => {
                                 const copy = [...aiModels];
                                 copy[i].apiKey = e.target.value;
                                 setAiModels(copy);
                               }} placeholder="sk-..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1 flex items-center justify-between h-[46px] px-4 bg-white border border-slate-200 rounded-xl">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">啟用狀態</span>
                               <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={model.isEnabled} onChange={e => {
                                   const copy = [...aiModels];
                                   copy[i].isEnabled = e.target.checked;
                                   setAiModels(copy);
                                 }} />
                                 <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                               </label>
                             </div>
                           </div>
                        ))}
                        <button onClick={() => setAiModels([...aiModels, { id: 'NEW-'+Date.now(), name: '', apiKey: '', isEnabled: false }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors uppercase tracking-widest">
                           + 新增 API 語言模型
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-12 rounded-[2rem] border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">📊</div>
                   <div className="relative z-10">
                      <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-8 underline decoration-4 decoration-blue-500 underline-offset-8">宮廟 AI 使用狀況清單</h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b-2 border-slate-100">
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">宮廟名稱</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">目前方案</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">本期用量</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">到期日</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">管理員特權</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {allTempleAiUsage.map((u, i) => {
                                 const isExpired = new Date(u.expiryDate).getTime() < Date.now();
                                 const isExhausted = u.usedCount >= u.chatLimit;
                                 let statusBadge = <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black tracking-widest">正常</span>;
                                 if (u.isVip) statusBadge = <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-600 rounded-full text-[10px] font-black tracking-widest">永久免費</span>;
                                 else if (!u.enabled) statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black tracking-widest">已關閉</span>;
                                 else if (isExpired) statusBadge = <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black tracking-widest">已過期</span>;
                                 else if (isExhausted) statusBadge = <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black tracking-widest">已用盡</span>;

                                 return (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-6 py-4 text-sm font-bold text-slate-800">{u.templeName}</td>
                                       <td className="px-6 py-4 text-xs font-bold text-indigo-600">{u.planName}</td>
                                       <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.isVip ? '無限' : \`\${u.usedCount} / \${u.chatLimit}\`}</td>
                                       <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.isVip ? '無期限' : new Date(u.expiryDate).toLocaleDateString()}</td>
                                       <td className="px-6 py-4">{statusBadge}</td>
                                       <td className="px-6 py-4">
                                          <button onClick={async () => {
                                             await grantTempleAiVip(u.templeId, !u.isVip);
                                             alert(u.isVip ? '已取消特權' : '已開通免費無限使用特權！');
                                             fetchAllTempleAiUsage().then(setAllTempleAiUsage);
                                          }} className={\`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-colors \${u.isVip ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' : 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:bg-fuchsia-600'}\`}>
                                             {u.isVip ? '取消 VIP' : '👑 設為 VIP'}
                                          </button>
                                       </td>
                                    </tr>
                                 )
                              })}
                              {allTempleAiUsage.length === 0 && (
                                 <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400">目前沒有任何宮廟使用 AI 方案</td></tr>
                              )}
                           </tbody>
                        </table>
                      </div>
                   </div>
                </div>
`;

content = content.replace(
  '                       </button>\n                      </div>\n                   </div>\n                </div>\n             </div>\n           )}',
  '                       </button>\n                      </div>\n                   </div>\n                </div>\n' + newBlocks + '             </div>\n           )}'
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content);
console.log('Modified SuperAdminClient.tsx AI blocks');
