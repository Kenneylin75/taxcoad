// @ts-nocheck
"use client";

import React, { useState, useTransition } from 'react';
import { AnalyticsSettings, updateAnalyticsSettings } from '@/app/actions';

export default function AnalyticsClient({ initialSettings, data }: { initialSettings: AnalyticsSettings, data: any }) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    setTimeout(() => {
      try {
        // Construct CSV Content
        let csv = '報表類型,項目,數值\n';
        
        // Overview
        if (data?.overview) {
          csv += `營運概況,總信眾人數,${data.overview.totalGuests || 0}\n`;
          csv += `營運概況,本月預約數,${data.overview.totalAppointments || 0}\n`;
          csv += `營運概況,點燈安座數,${data.overview.totalLamps || 0}\n`;
          csv += `營運概況,本月總收入,${data.overview.totalIncome || 0}\n`;
        }
        
        // Gender Ratio
        if (data?.genderRatio) {
          data.genderRatio.forEach((g: any) => {
            csv += `性別分佈,${g.label},${g.val}%\n`;
          });
        }
        
        // Age Groups
        if (data?.ageGroups) {
          data.ageGroups.forEach((a: any) => {
            csv += `年齡分佈,${a.range},${a.val}%\n`;
          });
        }
        
        // Services
        if (data?.serviceHeat) {
          data.serviceHeat.forEach((s: any) => {
            csv += `熱門服務,${s.label},${s.val}%\n`;
          });
        }

        // Add BOM for Excel UTF-8 compatibility
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `宮廟數據分析報表_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
        console.error("Export failed", e);
        alert('報表匯出失敗');
      } finally {
        setIsExporting(false);
      }
    }, 800); // simulate slight delay for UX
  };


  const handleToggleSetting = (key: keyof AnalyticsSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    startTransition(async () => {
      await updateAnalyticsSettings(newSettings);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">數據分析看板</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Enterprise Intelligence Hub</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button className="px-4 py-1.5 rounded-lg text-[10px] font-black bg-[#0F172A] text-white shadow-md">即時數據</button>
              <button 
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-1.5 rounded-lg text-[10px] font-black text-slate-400 hover:text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isExporting ? '匯出中...' : '📥 報表匯出 (CSV)'}
          </button>
           </div>
           <button className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">⚙️</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: '本季累計收支', value: `NT$ ${data.overview?.totalRevenue?.toLocaleString() || 0}`, growth: '即時', icon: '💎' },
            { label: '信眾成長數', value: `${data.overview?.totalGuests || 0} 位`, growth: '即時', icon: '👥' },
            { label: '轉換效能', value: `${data.overview?.conversionRate || 0}%`, growth: '即時', icon: '🤖' },
            { label: '平均處理時效', value: `${data.overview?.avgProcessingTime || 0} 分鐘`, growth: '即時', icon: '⌛' }
         ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm group hover:scale-[1.02] transition-all">
               <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <span className="text-xl opacity-20 group-hover:opacity-100 transition-all">{stat.icon}</span>
               </div>
               <h3 className="text-2xl font-black text-slate-800 font-serif">{stat.value}</h3>
               <div className="mt-2 text-[10px] font-black text-amber-600">
                  {stat.growth} ◉
               </div>
            </div>
         ))}
      </div>

      {/* AI Insights */}
      <div className="bg-[#0F172A] p-6 rounded-2xl text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-125 transition-transform duration-500">🏛️</div>
         <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="flex-1 space-y-2">
               <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">AGI 營運決策建議</p>
               <p className="text-sm font-medium leading-relaxed text-slate-300 italic border-l-2 border-amber-500/20 pl-4 py-1">
                 「數據拓撲顯示：週末午後時段需求已達飽和。建議提前 72 小時針對高頻信眾發送預約推播，優化全域流量轉化。」
               </p>
            </div>
            <button className="bg-amber-500 text-slate-900 px-6 py-2 rounded-xl font-black text-xs tracking-widest hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 shrink-0">
               套用策略 ↗
            </button>
         </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Main Chart */}
         <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <div className="flex justify-between items-center">
                  <div>
                     <h4 className="text-sm font-black text-slate-800">年度營運趨勢</h4>
                     <p className="text-[10px] text-slate-400 uppercase tracking-widest">Revenue Flow Matrix</p>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-500">固定營收</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-500">隨喜功德</span>
                     </div>
                  </div>
               </div>

               <div className="h-[300px] flex items-end justify-between gap-2 pt-4">
                  {data.revenueTrends.map((item: any) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-2 h-full group">
                       <div className="w-full flex flex-col justify-end gap-1 relative h-full">
                          <div 
                             className="w-full bg-amber-500 rounded-t opacity-20 group-hover:opacity-100 transition-all"
                             style={{ height: `${(item.amount / 400000) * 100}%` }}
                          ></div>
                          <div 
                             className="w-full bg-slate-900 rounded-t transition-all group-hover:brightness-125"
                             style={{ height: `${(item.amount / 450000) * 100}%` }}
                          ></div>
                       </div>
                       <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-800 transition-all">{item.month}</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Gender */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾客群結構 (新客 vs 回客)</h4>
                  {!data.genderDemographics?.hasData ? (
                     <div className="flex flex-col items-center justify-center h-48 text-center bg-slate-50 rounded-2xl">
                       <span className="text-2xl mb-2 grayscale opacity-50">👥</span>
                       <p className="text-xs font-bold text-slate-400">目前尚無足夠信眾資料</p>
                     </div>
                  ) : (
                     <div className="flex flex-col items-center justify-center gap-8 py-4">
                        <div className="w-32 h-32 rounded-full border-[20px] border-slate-900 relative flex items-center justify-center shadow-lg">
                           <div className="absolute inset-[-20px] rounded-full border-[20px] border-amber-500" style={{ clipPath: `polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${(data.genderDemographics.returning / 100) * 100}%)` }}></div>
                           <div className="text-center">
                              <p className="text-2xl font-black text-slate-800 font-serif leading-none">{data.genderDemographics.returning}%</p>
                              <p className="text-[8px] text-slate-400 font-black uppercase mt-1">回訪客</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-4">
                           <div className="bg-slate-50 p-3 rounded-xl text-center">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">新客首次來訪</p>
                              <p className="text-sm font-black text-slate-800">{data.genderDemographics.newGuest}%</p>
                           </div>
                           <div className="bg-slate-50 p-3 rounded-xl text-center">
                              <p className="text-[8px] font-black text-slate-400 uppercase mb-1">回訪客</p>
                              <p className="text-sm font-black text-amber-600">{data.genderDemographics.returning}%</p>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Service Heat */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服務熱度分佈</h4>
                  <div className="space-y-4">
                     {(data.serviceHeat || []).map((item: any) => (
                        <div key={item.label} className="space-y-1">
                           <div className="flex justify-between text-[10px] font-black">
                              <span className="text-slate-800">{item.label}</span>
                              <span className="text-amber-600">{item.val}%</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-white shadow-inner">
                              <div 
                                 className={`h-full rounded-full transition-all duration-1000 ${item.color}`} 
                                 style={{ width: `${item.val}%` }}
                              ></div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         {/* Right Sidebar */}
         <div className="lg:col-span-4 space-y-6">
            {/* Age Matrix */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾年齡分佈</h4>
               <div className="space-y-4">
                  {data.ageDemographics.map((item: any, idx: number) => (
                    <div key={item.range} className="space-y-1 p-2 hover:bg-slate-50 rounded-xl transition-all">
                       <div className="flex justify-between text-[10px] font-black">
                          <span className="text-slate-800 font-bold">{item.range}</span>
                          <span className="text-slate-900">{item.percentage}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-white">
                          <div 
                             className={`h-full rounded-full ${idx % 2 === 0 ? 'bg-slate-900' : 'bg-amber-500'}`} 
                             style={{ width: `${item.percentage}%` }}
                          ></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Queue Stats */}
            <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">🚶</div>
               <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  現場排隊效能 <span className="text-slate-900">Performance</span>
               </h4>
               <div className="space-y-6">
                  {[
                    { label: '平均等候時長', val: data.queueStats.avgWaitTime, unit: '分鐘 (MIN)', icon: '⌛' },
                    { label: '年度核銷總額', val: data.queueStats.totalTickets, unit: '節點 (NODES)', icon: '🎫' },
                    { label: '服務轉化效能', val: data.queueStats.completionRate, unit: '百分比 (%)', icon: '📈' }
                  ].map((stat, sidx) => (
                    <div key={sidx} className="group/item">
                       <div className="flex justify-between items-end mb-2">
                          <div className="flex items-center gap-2">
                             <span className="text-base">{stat.icon}</span>
                             <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{stat.label}</span>
                          </div>
                          <div className="text-right">
                             <span className="text-3xl font-black text-slate-900 font-serif tracking-tighter">{stat.val}</span>
                             <p className="text-[8px] font-black text-amber-600 uppercase mt-0.5">{stat.unit}</p>
                          </div>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-white">
                          <div 
                            className="h-full bg-slate-900 rounded-full transition-all duration-1000 group-hover/item:bg-amber-500" 
                            style={{ width: `${Math.min(parseInt(stat.val) || 0, 100)}%` }}
                          ></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

                     </div>
      </div>
    </div>
  );
}
