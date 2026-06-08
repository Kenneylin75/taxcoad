// @ts-nocheck
"use client";

import React, { useState, useTransition } from 'react';
import { 
  RevenueEntry, 
  ExpenseEntry, 
  initiatePayment, 
  FreeAccountApplication, 
  approveFreeAccount, 
  rejectFreeAccount 
} from '@/app/actions';

interface FinancialOverview {
  revenue: RevenueEntry[];
  expenses: ExpenseEntry[];
  totalRevenue: number;
  pendingExpense: number;
  lastMonthGrowth: string;
}

interface FinancialManagerClientProps {
  initialData: FinancialOverview;
  freeApps: FreeAccountApplication[];
}

export default function FinancialManagerClient({ initialData, freeApps }: FinancialManagerClientProps) {
  const [view, setView] = useState<'revenue' | 'expenses' | 'approvals'>('revenue');
  const [apps, setApps] = useState<FreeAccountApplication[]>(freeApps);
  const [isPending, startTransition] = useTransition();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const filteredRevenue = (initialData?.revenue || []).filter(rev => rev.timestamp.startsWith(selectedMonth));
  const monthlyRevenue = filteredRevenue.reduce((sum, rev) => sum + rev.amount, 0);
  const monthlyOrderCount = filteredRevenue.length;
  const averageOrderValue = monthlyOrderCount > 0 ? Math.round(monthlyRevenue / monthlyOrderCount) : 0;

  const filteredExpenses = (initialData?.expenses || []).filter(exp => (exp.billingDate && exp.billingDate.startsWith(selectedMonth)) || exp.status === 'Unpaid');
  const nearestDueDate = (initialData?.expenses || []).filter(e => e.status === 'Unpaid').sort((a,b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate || '無';


  const handleApprove = async (id: string) => {
    if (!confirm("確定核准此宮廟使用免費帳戶方案嗎？")) return;
    const res = await approveFreeAccount(id);
    if (res.success) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
      alert("✅ 已成功開通免費帳戶服務！");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("確定拒絕此免費帳戶申請嗎？")) return;
    const res = await rejectFreeAccount(id);
    if (res.success) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected' } : a));
      alert("❌ 申請已駁回。");
    }
  };

  const handlePay = async (amount: number) => {
    startTransition(async () => {
      const res = await initiatePayment(amount);
      if (res.success) {
        alert("🛡️ 即將前往支付頁面...");
      }
    });
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Lamp': return '🏮';
      case 'Appointment': return '📅';
      case 'Event': return '🧧';
      case 'Queue': return '🚶';
      default: return '🧧';
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'SetupFee': return '系統開辦建置費';
      case 'MonthlyFee': return '服務運維資費';
      case 'StorageUpgrade': return '空間擴展費';
      case 'AgiService': return 'AGI 智能管家流量';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">帳務治理中心</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Enterprise Financial Governance Hub</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <button 
            onClick={() => setView('revenue')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${view === 'revenue' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            收入流水
          </button>
          <button 
            onClick={() => setView('expenses')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${view === 'expenses' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            平台支出
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      {view === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-125 transition-transform duration-500">💰</div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">本月總收入 <span className="text-slate-900 underline decoration-amber-500 decoration-4 underline-offset-4">總計</span></p>
              <div className="flex items-baseline gap-2">
                 <span className="text-sm font-black text-amber-600">NT$</span>
                 <h3 className="text-4xl font-black font-serif text-slate-900 tracking-tighter">{monthlyRevenue.toLocaleString()}</h3>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">🧾</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">本月訂單數</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-3xl font-black font-serif text-slate-800">{monthlyOrderCount}</h3>
                 <span className="text-sm font-bold text-slate-300">筆</span>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">📊</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">平均客單價</p>
              <div className="flex items-baseline gap-2">
                 <span className="text-sm font-bold text-slate-300">NT$</span>
                 <h3 className="text-3xl font-black font-serif text-slate-800">{averageOrderValue.toLocaleString()}</h3>
              </div>
           </div>
        </div>
      )}

      {view === 'expenses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-125 transition-transform duration-500">💳</div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">待支付帳單 <span className="text-rose-500 underline decoration-rose-500 decoration-4 underline-offset-4">總計</span></p>
              <div className="flex items-baseline gap-2">
                 <span className="text-sm font-black text-rose-600">NT$</span>
                 <h3 className={`text-4xl font-black font-serif tracking-tighter ${(initialData?.pendingExpense || 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                   {(initialData?.pendingExpense || 0).toLocaleString()}
                 </h3>
              </div>
              <div className="mt-5">
                 <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border ${(initialData?.pendingExpense || 0) > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {(initialData?.pendingExpense || 0) > 0 ? '待繳費' : '帳務結清'}
                 </span>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">📅</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">近期繳款期限</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-2xl font-black font-serif text-slate-800">{nearestDueDate}</h3>
              </div>
           </div>
        </div>
      )}

      <main>
        {view === 'revenue' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                   <span className="text-amber-500">🏮</span> 信眾收入流水 Registry
                </h3>
                <div className="flex items-center gap-3">
                   <input 
                     type="month" 
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:border-slate-900 outline-none"
                   />
                   <button className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-all shadow-sm">
                      💾 匯出報表 EXPORT
                   </button>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">項目類別 / 來源</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">支付方式</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">核定金額</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">入帳時間</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">狀態</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredRevenue.length === 0 ? (
                       <tr>
                         <td colSpan={5} className="px-6 py-12 text-center text-xs font-bold text-slate-400 bg-slate-50/20">
                           本月份尚無收入紀錄
                         </td>
                       </tr>
                     ) : filteredRevenue.map((rev) => (
                      <tr key={rev.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <span className="text-xl">{getSourceIcon(rev.source)}</span>
                              <div>
                                 <p className="font-black text-slate-800 text-sm">{rev.title}</p>
                                 <p className="text-[10px] font-bold text-slate-400">{rev.guestName}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 uppercase tracking-wider">
                              {rev.paymentMethod}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-baseline gap-1">
                              <span className="text-[10px] font-bold text-amber-600">NT$</span>
                              <span className="text-sm font-black text-slate-800 font-serif">{rev.amount.toLocaleString()}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-xs font-bold text-slate-400 font-mono">{rev.timestamp}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                              ✓ Validated
                           </span>
                        </td>
                      </tr>
                    ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {view === 'expenses' && (
          <div className="space-y-6">
             <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                   <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span className="text-rose-500">💳</span> 系統服務資費 Registry
                   </h3>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">費用項目 / 週期</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">核定金額</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">截止期限</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">收款單位</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">清償狀態</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">管理操作</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredExpenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4">
                               <div>
                                  <p className="font-black text-slate-800 text-sm">{getExpenseTypeLabel(exp.type)}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Period: {exp.billingDate}</p>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-baseline gap-1">
                                  <span className="text-[10px] font-bold text-slate-400">NT$</span>
                                  <span className="text-sm font-black text-slate-800 font-serif">{exp.amount.toLocaleString()}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`text-[10px] font-black px-2 py-1 rounded border ${exp.status === 'Unpaid' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {exp.dueDate}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               {exp.status === 'Paid' ? (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                     ✓ Paid
                                  </span>
                               ) : (
                                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                     ! Unpaid
                                  </span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right">
                               {exp.status === 'Unpaid' ? (
                                  <button 
                                    onClick={() => handlePay(exp.amount)}
                                    disabled={isPending}
                                    className="bg-slate-900 text-amber-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all disabled:opacity-20"
                                  >
                                     {isPending ? "連線中..." : "⚔️ 即刻清償"}
                                  </button>
                               ) : (
                                  <button className="text-slate-300 hover:text-slate-600 transition-all">📄</button>
                               )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
             
          </div>
        )}
      </main>
    </div>
  );
}
