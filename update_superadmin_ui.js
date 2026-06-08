const fs = require('fs');
let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

content = content.replace('fetchStoragePlans,', 'fetchStoragePlans, fetchAiPlans, saveAiPlan, deleteAiPlan,');
content = content.replace('const [storagePlans, setStoragePlans] = useState<any[]>([]);', 'const [storagePlans, setStoragePlans] = useState<any[]>([]);\n  const [aiPlans, setAiPlans] = useState<any[]>([]);');
content = content.replace('fetchStoragePlans().then(setStoragePlans);', 'fetchStoragePlans().then(setStoragePlans);\n    fetchAiPlans().then(setAiPlans);');

const oldTab = "{ id: 'space', label: '雲端空間管理', icon: '☁️' },";
const newTab = "{ id: 'space', label: '雲端空間管理', icon: '☁️' },\n             { id: 'ai', label: 'AI 方案管理', icon: '🤖' },";
content = content.replace(oldTab, newTab);

const aiPanel = `           {activeTab === 'ai' && (
             <div className="space-y-6">
                <div className="bg-white p-12 rounded-[2rem] border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">🤖</div>
                   <div className="relative z-10 max-w-4xl">
                      <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-8 underline decoration-4 decoration-fuchsia-500 underline-offset-8">AI 助理定價方案配置</h4>
                      <div className="space-y-6">
                        {aiPlans.map((plan, i) => (
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
                        ))}
                        <button onClick={() => setAiPlans([...aiPlans, { id: 'NEW', name: '新方案', monthlyFee: 0, chatLimit: 0 }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors uppercase tracking-widest">
                           + 新增 AI 方案 ADD PLAN
                        </button>
                      </div>
                   </div>
                </div>
             </div>
           )}`;

content = content.replace("{activeTab === 'finance' && (", aiPanel + "\n\n           {activeTab === 'finance' && (");

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content);
