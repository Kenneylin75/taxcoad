const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');

const targetBlock = `            {/* Dashboard Config */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">看板視角設定</h4>
               <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'showGenderRatio', label: '性別特徵', icon: '🚻' },
                    { key: 'showServiceDistribution', label: '服務熱度', icon: '📊' },
                    { key: 'showPeakHours', label: '尖峰分析', icon: '🕒' },
                    { key: 'showCashFlow', label: '金流資產', icon: '💎' }
                  ].map((item) => (
                    <button 
                      key={item.key}
                      onClick={() => setLocalSettings({ ...localSettings, [item.key]: !localSettings[item.key as keyof AnalyticsSettings] })}
                      className={\`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all \${localSettings[item.key as keyof AnalyticsSettings] ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400 grayscale'}\`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
               </div>
               <button 
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full mt-2 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all"
               >
                 {isSaving ? '儲存中...' : '套用並發布設定'}
               </button>
            </div>`;

content = content.replace(targetBlock, '');
fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', content, 'utf8');
console.log('Removed Dashboard Config block.');
