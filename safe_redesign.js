const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');

// Find the start of the main return statement
const mainReturnMatch = '  return (\n    <div className="space-y-6 animate-in fade-in duration-500">';
const returnIndex = content.indexOf(mainReturnMatch);

if (returnIndex === -1) {
  console.log("Could not find main return statement");
  process.exit(1);
}

const beforeReturn = content.substring(0, returnIndex);

const newBeforeReturn = beforeReturn + `
  // Today's Agenda Logic
  const todayStr = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');
  const todayAgenda = useMemo(() => {
    return initialAppointments
      .filter(a => a.date === todayStr)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5); // Show top 5 upcoming
  }, [initialAppointments, todayStr]);

  const todayDisplay = new Date().toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });
`;

const newReturn = `  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-7xl mx-auto">
      
      {/* 1. Premium Obsidian Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] p-8 md:p-12 shadow-2xl overflow-hidden mt-2">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 backdrop-blur-md px-3 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <p className="text-slate-300 font-bold text-xs uppercase tracking-widest">系統運作正常 🟢</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {greeting}，<br className="hidden md:block" />歡迎回到營運主控台
            </h1>
            <p className="text-slate-400 font-medium text-sm mt-2">{todayDisplay} ． 宮廟管理系統 v10</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-xl">
              🏛️
            </div>
          </div>
        </div>
      </div>

      {/* 2. Floating Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 md:px-8 mt-[-3rem] relative z-20">
        
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">📅</div>
             <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-black border border-amber-100 uppercase">Live</span>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-1">今日預約數</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">{todayCount}</h3>
            <span className="text-xs font-semibold text-emerald-500">已完成 {analyticsData?.completedAppointments || 0}</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">🎫</div>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-1">排隊與人流</p>
          {queueSummary.length > 0 ? (
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-black text-slate-800">{queueSummary[0].waiting} <span className="text-sm text-slate-500 font-medium">候位</span></h3>
              <span className="text-xs font-semibold text-slate-400 truncate max-w-[80px]">({queueSummary[0].title})</span>
            </div>
          ) : (
            <h3 className="text-lg font-medium text-slate-400 mt-2">目前無活動</h3>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">👥</div>
          </div>
          <p className="text-xs font-bold text-slate-400 mb-1">總建檔信眾</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-800">{analyticsData?.totalGuests || 0}</h3>
            <span className="text-xs font-semibold text-slate-400">人</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
             <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl flex items-center justify-center text-slate-600 group-hover:scale-110 transition-transform">☁️</div>
             <button onClick={() => setShowUpgradeModal(true)} className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-black uppercase hover:bg-amber-100 transition-colors">升級容量</button>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs font-bold text-slate-400">雲端空間使用量</p>
              <p className="text-xs font-bold text-slate-700">{(storage?.used || 0).toFixed(1)} / {storage?.total || 100} GB</p>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000" style={{ width: \`\${((storage?.used || 0) / (storage?.total || 100)) * 100}%\` }}></div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Main Split Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:px-4">
        
        {/* LEFT COLUMN: Convenience & Operations (Col-7) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6">快速發射台 <span className="text-sm font-medium text-slate-400 ml-2">常用操作一鍵直達</span></h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[
                 { icon: '📝', label: '新增預約', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200' },
                 { icon: '📢', label: '現場叫號', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200' },
                 { icon: '🏮', label: '點燈樞紐', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 hover:border-amber-200' },
                 { icon: '💬', label: '系統廣播', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200' }
               ].map((btn, i) => (
                 <button key={i} className={\`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 active:scale-95 \${btn.color}\`}>
                    <span className="text-3xl mb-2">{btn.icon}</span>
                    <span className="text-xs font-bold">{btn.label}</span>
                 </button>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">今日行程動態</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">即將到來的預約與服務</p>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{todayAgenda.length} 筆待辦</span>
            </div>
            
            <div className="space-y-0 relative">
               {todayAgenda.length > 0 ? (
                 <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>
               ) : null}
               
               {todayAgenda.length > 0 ? todayAgenda.map((apt, i) => (
                 <div key={apt.id} className="relative z-10 flex gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="flex flex-col items-center shrink-0">
                       <span className="text-sm font-bold text-slate-700 w-12 text-right">{apt.time}</span>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-indigo-500 mt-1 ring-4 ring-white shrink-0"></div>
                    <div className="flex-1 pb-4 border-b border-slate-50 group-last:border-0">
                       <h4 className="text-base font-bold text-slate-800">{apt.service}</h4>
                       <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">信眾 ID: {apt.guestId.substring(0,6)}...</span>
                          <span className={\`text-[10px] font-bold px-2 py-0.5 rounded \${apt.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}\`}>{apt.status === 'Completed' ? '已完成' : '未完成'}</span>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="py-12 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl mb-3 opacity-50">☕</span>
                    <p className="text-sm font-bold text-slate-500">今日目前沒有待辦行程</p>
                    <p className="text-xs text-slate-400 mt-1">您可以稍作休息或處理其他行政事務</p>
                 </div>
               )}
            </div>
          </div>
          
        </div>

        {/* RIGHT COLUMN: Analytics & Tools (Col-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-8 h-full">
              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">點燈營運數據</h4>
                 <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-amber-100/50 flex items-center justify-center text-3xl shadow-sm border border-amber-100">🏮</div>
                      <div>
                        <h5 className="text-base font-bold text-slate-800">點燈安座概況</h5>
                        <p className="text-xs font-medium text-slate-500">系統即時連線資料</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-slate-500 mb-1 font-bold">總點燈次數</p>
                          <p className="text-2xl font-black text-amber-600">{analyticsData?.lampStats?.totalLamps || 0}</p>
                       </div>
                       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                          <p className="text-xs text-slate-500 mb-1 font-bold">安奉中燈位</p>
                          <p className="text-2xl font-black text-slate-800">{analyticsData?.lampStats?.activeLamps || 0}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-sm font-semibold text-slate-700">熱門服務項目</h4>
                 <div className="space-y-4 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                    {(analyticsData?.serviceHeat || []).map((item: any) => (
                      <div key={item.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium"><span className="text-slate-700">{item.label}</span><span className="text-slate-800 font-bold">{item.val}%</span></div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden"><div className={\`h-full \${item.color}\`} style={{ width: \`\${item.val}%\` }}></div></div>
                      </div>
                    ))}
                 </div>
              </div>
          </div>

        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-8 text-center space-y-2 bg-gradient-to-b from-slate-50 to-white relative">
                 <h3 className="text-2xl font-black text-slate-800">升級雲端空間</h3>
                 <p className="text-sm font-medium text-slate-500">選擇適合您的專屬儲存方案</p>
                 <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors">✕</button>
              </div>
              <div className="p-6 space-y-3 bg-white">
                 {[ 
                   { tier: 2, size: '20 GB', price: 'NT$ 150/月', desc: '適合中小型宮廟' }, 
                   { tier: 3, size: '100 GB', price: 'NT$ 500/月', desc: '適合信眾穩定成長' }, 
                   { tier: 4, size: '500 GB', price: 'NT$ 1,200/月', desc: '適合大量影音存檔' }
                 ].map(opt => (
                    <button key={opt.tier} onClick={() => handleUpgrade(opt.tier)} className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 hover:shadow-md transition-all group">
                       <div className="text-left">
                         <h4 className="font-bold text-slate-800 group-hover:text-amber-700">{opt.size}</h4>
                         <p className="text-xs font-medium text-slate-500 mt-1">{opt.desc}</p>
                       </div>
                       <span className="font-bold text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">{opt.price}</span>
                    </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
`;

content = newBeforeReturn + newReturn;

fs.writeFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', content, 'utf8');
console.log('Successfully applied safe redesign.');
