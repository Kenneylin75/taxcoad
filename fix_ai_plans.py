import codecs

with codecs.open('src/app/super-admin/SuperAdminClient.tsx', 'r', 'utf-8') as f:
    content = f.read()

old_ai = '''                        {aiPlans.map((plan, i) => (
                           <div key={plan.id} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">方案名稱</label>
                               <input type="text" value={plan.name} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].name = e.target.value;
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">月租費 (NT$)</label>
                               <input type="number" value={plan.monthlyFee} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].monthlyFee = Number(e.target.value);
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">對話次數上限</label>
                               <input type="number" value={plan.chatLimit} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].chatLimit = Number(e.target.value);
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1 flex gap-2">
                               <button onClick={async () => {
                                  await saveAiPlan(plan);
                                  alert('🤖 AI 方案已更新！');
                               }} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-fuchsia-600 transition-colors shadow-lg shadow-fuchsia-500/20">
                                 儲存 💾
                               </button>
                             </div>
                           </div>
                        ))}'''

new_ai = '''                        {aiPlans.map((plan, i) => (
                           <div key={plan.id + i} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100 relative group">
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">代碼</label>
                               <input type="text" value={plan.id} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].id = e.target.value;
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" placeholder="如: VIP-1" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">方案名稱</label>
                               <input type="text" value={plan.name} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].name = e.target.value;
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">月租費 (NT$)</label>
                               <input type="number" value={plan.monthlyFee} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].monthlyFee = Number(e.target.value);
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">對話次數</label>
                               <input type="number" value={plan.chatLimit} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].chatLimit = Number(e.target.value);
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1 flex gap-2">
                               <button onClick={async () => {
                                  await saveAiPlan(plan);
                                  alert('🤖 AI 方案已儲存！');
                               }} className="w-full px-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-fuchsia-600 transition-colors shadow-lg shadow-fuchsia-500/20">
                                 儲存
                               </button>
                               <button onClick={async () => {
                                  if(confirm('確定刪除此AI方案？')) {
                                     await deleteAiPlan(plan.id);
                                     setAiPlans(aiPlans.filter(p => p.id !== plan.id));
                                  }
                               }} className="w-full px-2 py-3 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-rose-500 hover:text-white transition-colors">
                                 刪除
                               </button>
                             </div>
                           </div>
                        ))}'''

content = content.replace(old_ai, new_ai)

with codecs.open('src/app/super-admin/SuperAdminClient.tsx', 'w', 'utf-8') as f:
    f.write(content)
print('Done AI!')
