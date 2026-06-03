const fs = require('fs');

let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// 1. Update State Type
content = content.replace(/'dashboard' \| 'accounts' \| 'approvals' \| 'tools' \| 'finance' \| 'bridge' \| 'logs' \| 'settings' \| 'space'/, "'dashboard' | 'accounts' | 'approvals' | 'tools' | 'finance' | 'bridge' | 'logs' | 'settings' | 'space' | 'ai_settings'");

// 2. Add Tab Icon
content = content.replace(/{ id: 'settings', label: '系統參數', icon: '⚙️' }/g, `{ id: 'settings', label: '系統參數', icon: '⚙️' },\n             { id: 'ai_settings', label: 'AI 引擎設定', icon: '🤖' }`);

// 3. Add Header Title
content = content.replace(/{activeTab === 'settings' && 'Global Configurations'}/g, `{activeTab === 'settings' && 'Global Configurations'}\n                 {activeTab === 'ai_settings' && 'AI Core Engines'}`);

// 4. Add Tab Render Block
const activeTabBlock = `
        {activeTab === 'ai_settings' && (
          <div className="p-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div className="mb-12">
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">AI 核心介接設定</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest uppercase">Global AI Engine Endpoints</p>
            </div>
            
            <div className="space-y-12">
               {/* OCR */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                 <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><span className="text-2xl">👁️</span> 視知識別引擎 (OCR / 表單掃描)</h4>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API URL</label>
                       <input value={config?.aiEndpoints?.ocrApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiUrl: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="https://api.openai.com/v1/chat/completions" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API Key</label>
                       <input type="password" value={config?.aiEndpoints?.ocrApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiKey: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="sk-..." />
                    </div>
                 </div>
               </div>

               {/* Chat */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                 <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><span className="text-2xl">🧠</span> 對話大腦引擎 (信眾智能問答)</h4>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API URL</label>
                       <input value={config?.aiEndpoints?.chatApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiUrl: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="https://api.openai.com/v1/chat/completions" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API Key</label>
                       <input type="password" value={config?.aiEndpoints?.chatApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiKey: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="sk-..." />
                    </div>
                 </div>
               </div>

               <div className="flex justify-end">
                  <button 
                    onClick={async () => {
                       await import('@/app/actions').then(m => m.updateSystemConfig({ aiEndpoints: config.aiEndpoints }));
                       alert('AI 引擎設定已安全儲存生效！');
                    }}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl hover:-translate-y-1"
                  >
                     💾 儲存 AI 安全配置
                  </button>
               </div>
            </div>
          </div>
        )}
`;

content = content.replace(/<\/main>/g, `${activeTabBlock}\n      </main>`);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content, 'utf8');
console.log('SuperAdminClient AI settings added.');
