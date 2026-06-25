import codecs

with codecs.open('src/app/super-admin/SuperAdminClient.tsx', 'r', 'utf-8') as f:
    content = f.read()

# 1. Fix upload tool ID
old1 = '''        startTransition(async () => {
            const res = await uploadTool(formData);
            if (res && res.success) {
                setMediaList([{
                    id: Date.now().toString(), 
                    type: uploadMode,'''

new1 = '''        startTransition(async () => {
            const res = await uploadTool(formData);
            if (res && res.success) {
                setMediaList([{
                    id: res.id || Date.now().toString(), 
                    type: uploadMode,'''
content = content.replace(old1, new1)

# 2. Fix delete tool alert
old2 = '''                                       const res = await deleteTool(tool.id);
                                       if (res.success) {
                                          setMediaList(mediaList.filter(t => t.id !== tool.id));
                                       }'''
new2 = '''                                       const res = await deleteTool(tool.id);
                                       if (res.success) {
                                          setMediaList(mediaList.filter(t => t.id !== tool.id));
                                       } else {
                                          alert("移除失敗：" + (res.error || "找不到資源"));
                                       }'''
content = content.replace(old2, new2)

# 3. Fix dashboard metrics
old3 = '''                    {[
                      { label: '年度累計總營收', value: ${(analytics?.overview?.monthlyRevenue * 12).toLocaleString()}, change: '+12.5%', color: 'indigo' },
                      { label: '全球活動節點數', value: (analytics?.overview?.activeTemples || 0).toLocaleString(), change: '+42', color: 'emerald' },
                      { label: '授權經銷商數', value: (analytics?.overview?.totalDistributors || 0).toLocaleString(), change: '穩定', color: 'slate' },
                      { label: '系統運行健康度', value: ${analytics?.overview?.systemHealth}%, change: 'Optimal', color: 'rose' }
                    ].map((stat, i) => ('''
new3 = '''                    {[
                      { label: '真實累計總營收', value: ${(analytics?.overview?.monthlyRevenue || 0).toLocaleString()}, change: '即時同步', color: 'indigo' },
                      { label: '全球活躍宮廟數', value: (analytics?.overview?.activeTemples || 0).toLocaleString(), change: '即時同步', color: 'emerald' },
                      { label: '授權經銷體系', value: (analytics?.overview?.totalDistributors || 0).toLocaleString(), change: '即時同步', color: 'slate' },
                      { label: '超級業務員總數', value: (analytics?.overview?.totalSuperSales || 0).toLocaleString(), change: '即時同步', color: 'rose' }
                    ].map((stat, i) => ('''
content = content.replace(old3, new3)

# 4. Fix zero division
old4 = '''                                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                     <div className={h-full bg-indigo-500 rounded-full} style={{ width: ${(item.count/initialStats.temples)*100}% }}></div>
                                  </div>'''
new4 = '''                                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                     <div className={h-full bg-indigo-500 rounded-full} style={{ width: ${(item.count/Math.max(1, analytics?.overview?.totalTemples || 1))*100}% }}></div>
                                  </div>'''
content = content.replace(old4, new4)

# 5. Fix storage plans
old5 = '''                        {storagePlans.map((plan) => (
                           <div key={plan.id} className="p-8 bg-slate-50/50 rounded-[40px] border border-white shadow-inner space-y-6 hover:bg-white hover:shadow-xl transition-all duration-300">
                              <div className="flex justify-between items-center">
                                 <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">{plan.id}</span>
                                 <input 
                                    type="text" 
                                    defaultValue={plan.name} 
                                    onChange={(e) => {
                                       const updated = storagePlans.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p);
                                       setStoragePlans(updated);
                                    }}
                                    className="bg-transparent text-sm font-black text-slate-800 text-right outline-none border-b border-transparent focus:border-slate-300"
                                 />
                              </div>
                              <div className="flex items-center gap-4 justify-between">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">方案容量 (GB)</label>
                                    <input 
                                       type="number" 
                                       defaultValue={plan.sizeGb} 
                                       onChange={(e) => {
                                          const updated = storagePlans.map(p => p.id === plan.id ? { ...p, sizeGb: Number(e.target.value) || 0 } : p);
                                          setStoragePlans(updated);
                                       }}
                                       className="w-20 bg-transparent text-xl font-black text-slate-900 outline-none border-b border-transparent focus:border-slate-300"
                                    />
                                 </div>
                                 <div className="space-y-1 text-right">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">月繳費用 (NT$)</label>
                                    <div className="flex items-center gap-1 justify-end">
                                       <span className="text-xs font-black text-slate-400">$</span>
                                       <input 
                                          type="number" 
                                          defaultValue={plan.priceMonthly} 
                                          onChange={(e) => {
                                             const updated = storagePlans.map(p => p.id === plan.id ? { ...p, priceMonthly: Number(e.target.value) || 0 } : p);
                                             setStoragePlans(updated);
                                          }}
                                          className="w-20 bg-transparent text-xl font-black text-slate-900 text-right outline-none border-b border-transparent focus:border-slate-300"
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}'''

new5 = '''                        {storagePlans.map((plan, index) => (
                           <div key={plan.id + index} className="p-8 bg-slate-50/50 rounded-[40px] border border-white shadow-inner space-y-6 hover:bg-white hover:shadow-xl transition-all duration-300 relative group">
                              <button 
                                 onClick={() => {
                                    if(confirm('確定要刪除此方案嗎？')) {
                                       setStoragePlans(storagePlans.filter(p => p.id !== plan.id));
                                    }
                                 }}
                                 className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-rose-100 text-rose-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500 hover:text-white"
                                 title="刪除方案"
                              >✕</button>
                              <div className="flex justify-between items-center pr-8">
                                 <input
                                    type="text"
                                    value={plan.id}
                                    placeholder="代碼 (如 SP-50)"
                                    onChange={(e) => {
                                       const updated = [...storagePlans];
                                       updated[index] = { ...updated[index], id: e.target.value };
                                       setStoragePlans(updated);
                                    }}
                                    className="text-[10px] w-24 font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-full uppercase outline-none border border-transparent focus:border-indigo-300"
                                 />
                                 <input 
                                    type="text" 
                                    value={plan.name} 
                                    placeholder="方案名稱"
                                    onChange={(e) => {
                                       const updated = [...storagePlans];
                                       updated[index] = { ...updated[index], name: e.target.value };
                                       setStoragePlans(updated);
                                    }}
                                    className="bg-transparent text-sm font-black text-slate-800 text-right outline-none border-b border-transparent focus:border-slate-300 flex-1 ml-2"
                                 />
                              </div>
                              <div className="flex items-center gap-4 justify-between">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">方案容量 (GB)</label>
                                    <input 
                                       type="number" 
                                       value={plan.sizeGb} 
                                       onChange={(e) => {
                                          const updated = [...storagePlans];
                                          updated[index] = { ...updated[index], sizeGb: Number(e.target.value) || 0 };
                                          setStoragePlans(updated);
                                       }}
                                       className="w-20 bg-transparent text-xl font-black text-slate-900 outline-none border-b border-transparent focus:border-slate-300"
                                    />
                                 </div>
                                 <div className="space-y-1 text-right">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">月繳費用 (NT$)</label>
                                    <div className="flex items-center gap-1 justify-end">
                                       <span className="text-xs font-black text-slate-400">$</span>
                                       <input 
                                          type="number" 
                                          value={plan.priceMonthly} 
                                          onChange={(e) => {
                                             const updated = [...storagePlans];
                                             updated[index] = { ...updated[index], priceMonthly: Number(e.target.value) || 0 };
                                             setStoragePlans(updated);
                                          }}
                                          className="w-20 bg-transparent text-xl font-black text-slate-900 text-right outline-none border-b border-transparent focus:border-slate-300"
                                       />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                        
                        <div 
                           onClick={() => {
                              setStoragePlans([...storagePlans, { id: 'SP-NEW', name: '新儲存方案', sizeGb: 0, priceMonthly: 0 }]);
                           }}
                           className="p-8 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all duration-300 min-h-[160px]"
                        >
                           <span className="text-3xl mb-2">+</span>
                           <span className="text-xs font-black uppercase tracking-widest">新增方案</span>
                        </div>'''
content = content.replace(old5, new5)

with codecs.open('src/app/super-admin/SuperAdminClient.tsx', 'w', 'utf-8') as f:
    f.write(content)
print('Done!')
