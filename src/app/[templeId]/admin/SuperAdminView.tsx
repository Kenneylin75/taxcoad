"use client";
import React, { useState, useEffect } from 'react';
import { fetchOrganizations, Organization } from '@/app/actions';

export default function SuperAdminView() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrganizations().then(data => {
      setOrgs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">初始化戰情系統中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800">
               雲端總部 <span className="text-amber-600 italic">戰情室</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pivot Global Infrastructure Audit & Intelligence</p>
         </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-[#0F172A] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group border border-slate-800">
            <div className="absolute top-0 right-0 p-6 opacity-10 text-4xl group-hover:scale-110 transition-transform">⛩️</div>
            <div className="relative z-10 space-y-4">
               <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">全台總組織數</p>
               <div className="flex flex-col">
                  <span className="text-4xl font-black font-serif tracking-tighter">{orgs.length}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Active Units</span>
               </div>
               <div className="h-0.5 w-8 bg-amber-500/30 rounded-full"></div>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl">🔱</div>
            <div className="relative z-10 space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活躍宮廟實體</p>
               <div className="flex flex-col">
                  <span className="text-4xl font-black font-serif tracking-tighter text-emerald-600">{orgs.filter(o => o.type === 'Temple').length}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Live Entities</span>
               </div>
               <div className="h-0.5 w-8 bg-emerald-500/20 rounded-full"></div>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-slate-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl text-amber-600">📈</div>
            <div className="relative z-10 space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統成交率</p>
               <div className="flex flex-col">
                  <span className="text-4xl font-black font-serif tracking-tighter">92%</span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-1">Efficiency</span>
               </div>
               <div className="h-0.5 w-8 bg-amber-500/20 rounded-full"></div>
            </div>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 text-4xl">🛡️</div>
            <div className="relative z-10 space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統穩定度</p>
               <div className="flex flex-col">
                  <span className="text-4xl font-black font-serif tracking-tighter text-slate-800">99.9%</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Optimal</span>
               </div>
               <div className="h-0.5 w-8 bg-emerald-500/20 rounded-full"></div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Announcement System */}
        <div className="lg:col-span-4 bg-[#0F172A] p-6 rounded-2xl text-white shadow-lg border border-slate-800 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">📢</div>
           <div className="relative z-10 space-y-6">
              <div className="space-y-1">
                 <h2 className="text-lg font-black text-amber-500 tracking-tight">全系統公告推播</h2>
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Broadcast To Infrastructure</p>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">公告標題</label>
                    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-amber-500 transition-all shadow-inner text-white" placeholder="輸入標題..." />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">內容描述</label>
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-amber-500 transition-all shadow-inner h-24 resize-none text-white" placeholder="輸入公告內容..."></textarea>
                 </div>
                 <button className="w-full bg-amber-500 text-slate-900 font-black py-3 rounded-xl text-xs tracking-widest shadow-lg shadow-amber-500/20 hover:bg-white transition-all uppercase mt-2">
                    發佈至所有終端
                 </button>
              </div>
           </div>
        </div>

        {/* Right: Organization Status Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm text-amber-600 border border-slate-100">⛩️</div>
                <div>
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">全台組織運行狀態</h3>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Entity Operational Audit</p>
                </div>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">組織名稱 / 位置</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">類型</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">運行狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orgs.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-all">{o.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Region: North Taiwan</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded-lg uppercase tracking-widest text-slate-600">
                          {o.type}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                          {o.status}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
