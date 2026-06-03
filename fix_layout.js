const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');

const oldLayout = `<h4 className="text-sm font-semibold text-slate-700">點燈營運數據</h4>
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
                 <h4 className="text-sm font-semibold text-slate-700">真實熱門服務項目</h4>`;

const newLayout = `<h4 className="text-sm font-semibold text-slate-700">點燈營運數據</h4>
                 <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 h-full flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-3xl">🏮</div>
                      <div>
                        <h5 className="text-lg font-bold text-slate-800">點燈安座概況</h5>
                        <p className="text-xs text-slate-500">系統即時連線資料</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-slate-500 mb-1 font-bold">總點燈次數</p>
                          <p className="text-3xl font-black text-amber-600">{analyticsData?.lampStats?.totalLamps || 0}</p>
                       </div>
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-slate-500 mb-1 font-bold">安奉中燈位</p>
                          <p className="text-3xl font-black text-slate-800">{analyticsData?.lampStats?.activeLamps || 0}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">熱門服務項目</h4>`;

if (content.includes('aspect-square')) {
  content = content.replace(oldLayout, newLayout);
  fs.writeFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', content, 'utf8');
  console.log('Successfully fixed dashboard layout.');
} else {
  console.log('Could not find layout to fix.');
}
