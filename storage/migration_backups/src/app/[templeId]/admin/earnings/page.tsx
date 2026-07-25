// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { fetchEarningsStats, requestWithdrawal } from '@/app/actions';

export default function EarningsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    setLoading(true);
    fetchEarningsStats().then(data => {
      setStats({
        ...data,
        totalEarned: data?.totalEarned ?? ((data?.balance || 0) + (data?.totalWithdrawn || 0) + (data?.pending || 0)) ?? 158000,
        pendingAmount: data?.pendingAmount ?? data?.pending ?? 0,
        history: data?.history ?? [],
        withdrawals: data?.withdrawals ?? []
      });
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWithdraw = async () => {
    const amt = stats?.pendingAmount || stats?.pending || 0;
    if (amt <= 0) return alert("目前餘額不足，無法申請提領。");
    if (confirm(`確定要提領 NT$ ${amt.toLocaleString()} 嗎？`)) {
      setIsSubmitting(true);
      await requestWithdrawal(amt);
      setIsSubmitting(false);
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">載入收益數據中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">收益與提領管理</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Sacred Commissions Monitoring</p>
        </div>

        <button 
          onClick={handleWithdraw}
          disabled={isSubmitting || (stats?.pendingAmount || stats?.pending || 0) <= 0}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-sm tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-emerald-600/10 flex items-center gap-2 disabled:opacity-20"
        >
          {isSubmitting ? "處理中..." : `💰 申請提領 NT$ ${(stats?.pendingAmount || stats?.pending || 0).toLocaleString()}`}
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累計總收益</p>
               <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs font-bold text-amber-600">NT$</span>
                  <p className="text-2xl font-black text-slate-800 font-serif">{stats.totalEarned.toLocaleString()}</p>
               </div>
            </div>
            <div className="text-3xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">📊</div>
         </div>

         <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-125 transition-transform duration-500">⏳</div>
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">可提領餘額</p>
            <div className="flex items-baseline gap-2">
               <span className="text-sm font-bold text-amber-500 opacity-60">NT$</span>
               <h3 className="text-3xl font-black font-serif text-white">{stats.pendingAmount.toLocaleString()}</h3>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 border-l-2 border-slate-800 pl-2">每週五結算撥款</p>
         </div>

         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group">
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已完成提領</p>
               <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xs font-bold text-slate-300">NT$</span>
                  <p className="text-2xl font-black text-slate-800 font-serif">{(stats.totalEarned - stats.pendingAmount).toLocaleString()}</p>
               </div>
            </div>
            <div className="text-3xl opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">✅</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Earnings History */}
        <div className="lg:col-span-8 space-y-4">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-sm font-black text-slate-800">分潤收益明細</h3>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                   <thead>
                     <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">來源宮廟</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">類別</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">獎金金額</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">時間</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {stats.history.map((c: any) => (
                       <tr key={c.id} className="hover:bg-slate-50/50 transition-all group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                               <span className="text-lg">⛩️</span>
                               <span className="text-sm font-black text-slate-800">{c.orgId}</span>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${c.type === 'SetupFee' ? 'bg-slate-900 text-amber-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                             {c.type === 'SetupFee' ? '開辦費分潤' : '月租費分潤'}
                           </span>
                         </td>
                         <td className="px-6 py-4 font-black font-serif text-slate-800 text-sm">
                            NT$ {c.amount.toLocaleString()}
                         </td>
                         <td className="px-6 py-4 text-right text-xs font-mono text-slate-400">
                            {c.date}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
           </div>
        </div>

        {/* Withdrawal History */}
        <div className="lg:col-span-4 space-y-4">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-sm font-black text-slate-800">提領紀錄</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {stats.withdrawals.map((w: any) => (
                  <div key={w.id} className="p-4 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                    <div>
                       <p className="text-sm font-black text-slate-800 font-serif">NT$ {w.amount.toLocaleString()}</p>
                       <p className="text-[10px] text-slate-400 font-mono mt-0.5">{w.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${w.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                      {w.status === 'Paid' ? '已入帳' : '處理中'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                 <p className="text-[10px] text-slate-400 font-bold leading-relaxed italic">
                   * 獎金撥款約需 7 個工作天，請確保您的銀行帳戶資料正確無誤。
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
