"use client";
import React, { useState, useEffect } from 'react';
import { 
  fetchOrganizations, 
  Organization, 
  getCurrentRole, 
  AppRole, 
  fetchDistributorStats 
} from '@/app/actions';

export default function SalesView() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [o, r, s] = await Promise.all([
        fetchOrganizations(), 
        getCurrentRole(), 
        fetchDistributorStats()
      ]);
      setOrgs(o);
      setRole(r);
      setStats(s);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">載入網路數據中...</p>
      </div>
    );
  }

  const temples = orgs.filter(o => o.type === 'Temple');
  const quotaUsed = stats?.quotaUsed || 0;
  const quotaTotal = stats?.quotaTotal || 100;
  const quotaPercent = Math.round((quotaUsed / quotaTotal) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-800">
               {role === 'SuperAgent' ? '超級業務' : role === 'DistSales' ? '業務個人' : '經銷營運'} <span className="text-amber-600 italic">看板</span>
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
               {role === 'SuperAgent' ? 'Global Sales Network Intelligence' : role === 'DistSales' ? 'Performance & Bonus Tracking' : 'Distribution Center Infrastructure'}
            </p>
         </div>
      </div>

      {/* Quota Section */}
      {(role === 'Distributor' || role === 'DistSales') && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-[#0F172A] p-6 rounded-2xl text-white shadow-lg relative overflow-hidden group border border-slate-800">
              <div className="absolute top-0 right-0 p-6 opacity-10 text-4xl group-hover:scale-110 transition-transform">🏗️</div>
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">已購買授權方案</p>
                    <h2 className="text-2xl font-black">{stats.planInfo}</h2>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-end">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">帳號配額消耗</span>
                       <span className="text-2xl font-black font-serif">{quotaUsed} <span className="text-sm opacity-40">/ {quotaTotal} UNITS</span></span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                       <div className="bg-amber-500 h-full rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all duration-[2s]" style={{ width: `${quotaPercent}%` }}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 italic">※ 目前已消耗 {quotaPercent}% 的配額。剩餘 {quotaTotal - quotaUsed} 組帳號可供開發。</p>
                 </div>
              </div>
           </div>
           
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">營運體系規模</p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <p className="text-3xl font-black text-slate-800 font-serif">{stats.subTemples?.length || 0}</p>
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-tight">已上線宮廟</p>
                 </div>
                 <div className="space-y-1 border-l border-slate-100 pl-4">
                    <p className="text-3xl font-black text-slate-800 font-serif">{stats.salesCount || 0}</p>
                    <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-tight">旗下業務人員</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Bonus Section */}
      {role === 'DistSales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner text-amber-600 border border-slate-100">💰</div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">個人獎金結算詳情</h3>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累計開發獎金</p>
                 <p className="text-2xl font-black text-slate-800 font-serif">NT$ 24,000</p>
                 <p className="text-[10px] font-bold text-amber-600 uppercase">20% 開辦費分潤</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">預計月租分潤</p>
                 <p className="text-2xl font-black text-slate-800 font-serif">NT$ 3,240 <span className="text-xs opacity-50">/月</span></p>
                 <p className="text-[10px] font-bold text-amber-600 uppercase">10% 服務費分潤</p>
              </div>
              <div className="p-4 bg-[#0F172A] rounded-xl text-white space-y-1 shadow-lg border border-slate-800">
                 <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">獎金結算日</p>
                 <p className="text-2xl font-black font-serif">每月 5 號</p>
                 <p className="text-[10px] font-bold text-slate-500 uppercase">經銷商撥付</p>
              </div>
           </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服務宮廟總數</p>
              <p className="text-2xl font-black text-slate-800 font-serif mt-1">{temples.length} <span className="text-xs opacity-20">UNITS</span></p>
           </div>
           <div className="text-3xl opacity-20 group-hover:opacity-100 transition-all">🏛️</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">體系平均轉換率</p>
              <p className="text-2xl font-black text-slate-800 font-serif mt-1">8.5 <span className="text-xs opacity-20">%</span></p>
           </div>
           <div className="text-3xl opacity-20 group-hover:opacity-100 transition-all text-amber-600">📊</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
           <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本月活躍信眾</p>
              <p className="text-2xl font-black text-slate-800 font-serif mt-1">1,248 <span className="text-xs opacity-20">NAMES</span></p>
           </div>
           <div className="text-3xl opacity-20 group-hover:opacity-100 transition-all">👥</div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <div className="flex items-center gap-2">
                <span className="text-xl">📄</span>
                <h3 className="text-sm font-black text-slate-800">直屬宮廟開發監控</h3>
             </div>
             <a href="/admin/organizations" className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">完整清單 →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">宮廟名稱 / ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">開發類型</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">狀態</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {temples.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-all">{t.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {t.id}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg uppercase tracking-widest">
                          {t.parentId === 'ORG-HQ' ? '總部直營' : '經銷開發'}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                          ACTIVE
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-[#0F172A] p-6 rounded-2xl text-white shadow-lg flex flex-col justify-center text-center space-y-4 relative overflow-hidden border border-slate-800 group">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-all">📢</div>
           <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-2xl mx-auto text-amber-500">🔔</div>
           <div className="space-y-2 relative z-10">
              <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">系統重要通知</h3>
              <p className="text-xs font-medium text-slate-400 leading-relaxed">
                 Pivot 系統將於下週二進行升級，屆時經銷商端之配額連動功能將暫停維護 2 小時。請各級業務提前完成報件。
              </p>
           </div>
           <button className="text-[10px] font-black text-amber-500 uppercase tracking-widest hover:underline">READ ALL →</button>
        </div>
      </div>
    </div>
  );
}
