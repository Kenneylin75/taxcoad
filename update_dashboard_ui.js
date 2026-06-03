const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');

// 1. Replace "客服轉換率" (Conversion rate) with "所有信眾" (Total Guests)
const oldConversion = `<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">客服轉換率</p>
            <h3 className="text-2xl font-bold text-slate-800">{Math.round(((agiStats?.conversions || 0) / (agiStats?.totalQueries || 1)) * 100)}%</h3>
            <div className="mt-3 text-xs text-slate-500">總查詢次數：{agiStats?.totalQueries || 0} 次</div>
          </div>`;

const newTotalGuests = `<div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">目前所有信眾</p>
            <h3 className="text-2xl font-bold text-slate-800">{analyticsData?.totalGuests || 0}</h3>
            <div className="mt-3 text-xs text-slate-500">系統真實建檔人數</div>
          </div>`;

content = content.replace(oldConversion, newTotalGuests);

// 2. Update stats.completed for today's appointments
content = content.replace('已完成 {stats.completed} 筆預約', '已完成 {analyticsData?.completedAppointments || 0} 筆預約');

// 3. Data Decision Board: Replace "客戶性別比例" with "點燈營運數據" and make "熱門服務項目" dynamic
const oldBoard = `<div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">客戶性別比例</h4>
                 <div className="aspect-square bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-center relative">
                    <div className="w-32 h-32 rounded-full border-[12px] border-indigo-100 border-t-indigo-500 border-r-indigo-500 flex items-center justify-center">
                       <div className="text-center"><p className="text-xl font-bold text-slate-800">1,280</p><p className="text-xs text-slate-500">總人次</p></div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-3">
                       <div className="flex-1 bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-center"><p className="text-xs text-slate-500 mb-1">男性</p><p className="text-sm font-bold text-slate-800">38%</p></div>
                       <div className="flex-1 bg-white p-2 rounded-lg shadow-sm border border-slate-100 text-center"><p className="text-xs text-slate-500 mb-1">女性</p><p className="text-sm font-bold text-slate-800">62%</p></div>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">熱門服務項目</h4>
                 <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                    {[{ label: '專案諮詢', val: 45, color: 'bg-indigo-500' }, { label: '問題排解', val: 30, color: 'bg-blue-400' }, { label: '例行服務', val: 15, color: 'bg-sky-300' }].map((item) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium"><span className="text-slate-600">{item.label}</span><span className="text-slate-800">{item.val}%</span></div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={\`h-full \${item.color}\`} style={{ width: \`\${item.val}%\` }}></div></div>
                      </div>
                    ))}
                 </div>
              </div>`;

const newBoard = `<div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">點燈營運數據</h4>
                 <div className="aspect-square bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center relative p-6">
                    <div className="text-6xl mb-4 opacity-80">🏮</div>
                    <div className="text-center w-full space-y-4">
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1 font-bold">目前總點燈數</p>
                          <p className="text-3xl font-black text-amber-600">{analyticsData?.lampStats?.totalLamps || 0}</p>
                       </div>
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1 font-bold">安奉中燈位</p>
                          <p className="text-xl font-bold text-slate-800">{analyticsData?.lampStats?.activeLamps || 0}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">真實熱門服務項目</h4>
                 <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100 h-full">
                    {(analyticsData?.serviceHeat || []).map((item: any) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium"><span className="text-slate-600">{item.label}</span><span className="text-slate-800">{item.val}%</span></div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className={\`h-full \${item.color}\`} style={{ width: \`\${item.val}%\` }}></div></div>
                      </div>
                    ))}
                 </div>
              </div>`;

content = content.replace(oldBoard, newBoard);

fs.writeFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', content, 'utf8');
console.log('Successfully updated DashboardContainer UI.');
