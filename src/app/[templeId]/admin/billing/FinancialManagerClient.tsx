// @ts-nocheck
"use client";

import React, { useState, useTransition } from 'react';
import { 
  RevenueEntry, 
  ExpenseEntry, 
  initiatePayment, uploadTempleBillReceipt, approveTempleBill, 
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
  payeeInfo?: {
    bankName: string;
    account: string;
    name: string;
  };
  payeeSettings?: Record<string, any>;
  trialDaysRemaining?: number;
  isPermanentFree?: boolean;
}

interface FinancialManagerClientProps {
  initialData: FinancialOverview;
  freeApps: FreeAccountApplication[];
}

export default function FinancialManagerClient({ initialData, freeApps }: FinancialManagerClientProps) {
  const [view, setView] = useState<'revenue' | 'expenses' | 'approvals'>('revenue');
  const [apps, setApps] = useState<FreeAccountApplication[]>(freeApps);
  const [isPending, startTransition] = useTransition();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPayingBill, setCurrentPayingBill] = useState<ExpenseEntry | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'linepay' | 'ecpay'>('linepay');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  React.useEffect(() => {
    // Intentionally left empty to prevent auto-popup of payment modal on page load.
  }, [initialData?.expenses]);

  const handleUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setReceiptImage(url);
    }
  };

  const submitBankTransfer = async () => {
    if (!receiptImage || !currentPayingBill) return alert('請先上傳匯款憑證');
    startTransition(async () => {
      const res = await uploadTempleBillReceipt(currentPayingBill.id, receiptImage);
      if (res.success) {
        alert('已成功上傳匯款憑證，等待經銷商確認後即會自動核銷。');
        setPaymentModalOpen(false);
        window.location.reload();
      }
    });
  };

  const submitLinePay = async () => {
    if (!currentPayingBill) return;
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `/mock-gateway?orderId=TEMPLE_BILL_${currentPayingBill.id}&amount=${currentPayingBill.amount}&method=linePay&returnUrl=${returnUrl}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredRevenue = (initialData?.revenue || []).filter(rev => {
    const matchMonth = rev.timestamp.startsWith(selectedMonth);
    if (!searchTerm) return matchMonth;
    const term = searchTerm.toLowerCase();
    const matchSearch = (rev.title || '').toLowerCase().includes(term) ||
                        (rev.guestName || '').toLowerCase().includes(term) ||
                        (rev.source || '').toLowerCase().includes(term) ||
                        (rev.paymentMethod || '').toLowerCase().includes(term);
    return matchMonth && matchSearch;
  });
  const monthlyRevenue = filteredRevenue.reduce((sum, rev) => sum + rev.amount, 0);
  const monthlyOrderCount = filteredRevenue.length;
  const averageOrderValue = monthlyOrderCount > 0 ? Math.round(monthlyRevenue / monthlyOrderCount) : 0;

  const filteredExpenses = (initialData?.expenses || []);
  const nearestDueDate = (initialData?.expenses || []).filter(e => e.status === 'Unpaid').sort((a,b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate || '無';

  const handleExportCSV = () => {
    if (filteredRevenue.length === 0) return alert('目前沒有可匯出的資料');
    const headers = ['項目類別/來源', '信眾名稱', '支付方式', '核定金額', '入帳時間', '狀態'];
    const rows = filteredRevenue.map(r => [
      `"${r.source} - ${r.title}"`,
      `"${r.guestName}"`,
      `"${r.paymentMethod}"`,
      r.amount,
      `"${r.timestamp}"`,
      `"${r.status}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `帳務報表_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


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

  const handlePay = async (exp: ExpenseEntry) => {
    setCurrentPayingBill(exp);
    const pId = exp.payeeId || 'superadmin';
    const config = initialData.payeeSettings?.[pId];
    if (config?.linePay?.enabled) {
      setPaymentMethod('linepay');
    } else if (config?.customTransfer?.enabled) {
      setPaymentMethod('bank');
    }
    setPaymentModalOpen(true);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Lamp': return '🏮';
      case 'Appointment': return '📅';
      case 'Event': return '🧧';
      case 'Queue': return '🚶';
      case 'Merit': return '✨';
      default: return '🧧';
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'SetupFee': return '系統開辦建置費';
      case 'MonthlyFee': 
      case 'MONTHFEE': return '系統月租費';
      case 'YearlyFee': 
      case 'YEARFEE': return '系統年租費';
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

           <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group ${initialData?.isPermanentFree || initialData?.trialDaysRemaining !== undefined ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-125 transition-transform duration-500">🎁</div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${initialData?.isPermanentFree || initialData?.trialDaysRemaining !== undefined ? 'text-emerald-600' : 'text-slate-400'}`}>系統授權狀態</p>
              <div className="flex flex-col gap-1 mt-2">
                 {initialData?.isPermanentFree ? (
                   <h3 className="text-2xl font-black font-serif text-emerald-700">永久免費</h3>
                 ) : initialData?.trialDaysRemaining !== undefined ? (
                   <>
                     <h3 className="text-2xl font-black font-serif text-emerald-700">免費試用中</h3>
                     <p className="text-xs font-bold text-emerald-600">剩餘 {initialData.trialDaysRemaining} 天</p>
                   </>
                 ) : (
                   <h3 className="text-2xl font-black font-serif text-slate-700">正式方案計費中</h3>
                 )}
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
                <div className="flex items-center gap-3 flex-wrap">
                   <input
                     type="text"
                     placeholder="關鍵字搜尋(信眾/項目/來源)..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:border-amber-500 outline-none w-56 shadow-sm"
                   />
                   <input 
                     type="month" 
                     value={selectedMonth}
                     onChange={(e) => setSelectedMonth(e.target.value)}
                     className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white focus:border-slate-900 outline-none"
                   />
                   <button onClick={handleExportCSV} className="text-[10px] font-black text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-white transition-all shadow-sm">
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
                               <span className={`text-[10px] font-black px-2 py-1 rounded border ${exp.status === 'Unpaid' ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' : exp.status === 'PendingVerification' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                  {exp.dueDate}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               {exp.status === 'Paid' ? (
                                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                     ✓ Paid
                                  </span>
                               ) : exp.status === 'PendingVerification' ? (
                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                     ⏳ 待審核
                                  </span>
                               ) : (
                                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                     ! Unpaid
                                  </span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right">
                               {(exp.status === 'Unpaid' || exp.status === 'PendingVerification') ? (
                                  <button 
                                    onClick={() => handlePay(exp)}
                                    disabled={isPending}
                                    className="bg-slate-900 text-amber-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all disabled:opacity-20"
                                  >
                                     {isPending ? "連線中..." : (exp.status === 'PendingVerification' ? "查看審核狀態" : "💳 支付")}
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

      {/* Payment Modal */}
      {paymentModalOpen && currentPayingBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 to-amber-500"></div>
              
              <button onClick={() => setPaymentModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">✕</button>

              <h2 className="text-2xl font-black text-slate-800 mb-2">平台資費支付</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Payment Gateway</p>

              <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-500">{getExpenseTypeLabel(currentPayingBill.type)}</span>
                    <span className="text-xl font-black text-slate-900">NT$ {currentPayingBill.amount.toLocaleString()}</span>
                 </div>
                 <p className="text-[10px] text-slate-400">繳款期限: {currentPayingBill.dueDate}</p>
              </div>

              <div className="flex gap-2 mb-6 flex-wrap">
                 {initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.thirdParty?.enabled && (
                   <button onClick={() => setPaymentMethod('ecpay')} className={`flex-1 min-w-[100px] py-3 text-xs font-black rounded-xl border-2 transition-all ${paymentMethod === 'ecpay' ? 'border-[#333333] bg-[#333333]/10 text-[#333333]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      ECPay 綠界
                   </button>
                 )}
                 {initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.linePay?.enabled && (
                   <button onClick={() => setPaymentMethod('linepay')} className={`flex-1 min-w-[100px] py-3 text-xs font-black rounded-xl border-2 transition-all ${paymentMethod === 'linepay' ? 'border-[#00C300] bg-[#00C300]/10 text-[#00C300]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      LINE Pay
                   </button>
                 )}
                 {initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.enabled && (
                   <button onClick={() => setPaymentMethod('bank')} className={`flex-1 min-w-[100px] py-3 text-xs font-black rounded-xl border-2 transition-all ${paymentMethod === 'bank' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      銀行匯款
                   </button>
                 )}
              </div>

              {paymentMethod === 'linepay' ? (
                 <div className="space-y-4 text-center">
                    <div className="w-full bg-[#00C300]/5 border border-[#00C300]/20 rounded-2xl p-6">
                       <p className="text-sm font-bold text-[#00C300] mb-2">系統將自動核銷</p>
                       <p className="text-[10px] text-slate-500">當您完成 LINE Pay 支付後，系統會自動將帳單狀態改為「已付款」，無需等待人工確認。</p>
                    </div>
                    <button onClick={submitLinePay} disabled={isPending} className="w-full py-4 bg-[#00C300] text-white rounded-xl font-black shadow-lg shadow-[#00C300]/30 hover:bg-[#00A000] transition-all disabled:opacity-50">
                       {isPending ? '處理中...' : '前往 LINE Pay 結帳'}
                    </button>
                 </div>
              ) : paymentMethod === 'ecpay' ? (
                 <div className="space-y-4 text-center">
                    <div className="w-full bg-[#333333]/5 border border-[#333333]/20 rounded-2xl p-6">
                       <p className="text-sm font-bold text-[#333333] mb-2">系統將自動核銷</p>
                       <p className="text-[10px] text-slate-500">當您完成 ECPay (信用卡/ATM/超商代碼) 支付後，系統會自動將帳單狀態改為「已付款」，無需等待人工確認。</p>
                    </div>
                    <button onClick={() => alert('開發中：ECPay 串接')} disabled={isPending} className="w-full py-4 bg-[#333333] text-white rounded-xl font-black shadow-lg shadow-[#333333]/30 hover:bg-black transition-all disabled:opacity-50">
                       {isPending ? '處理中...' : '前往 ECPay 結帳'}
                    </button>
                 </div>
              ) : (
                 <div className="space-y-4">
                     <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 space-y-2">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">收款方銀行帳戶</p>
                        <p className="text-sm font-bold text-slate-700">
                           銀行：{initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.bankCode ? `代碼 ${initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.bankCode}` : (initialData.payeeInfo?.bankName || '未提供')}
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                           帳號：{initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.accountNo || initialData.payeeInfo?.account || '未提供'}
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                           戶名：{initialData.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.accountName || initialData.payeeInfo?.name || '未提供'}
                        </p>
                     </div>
                    
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-slate-600">上傳匯款憑證截圖</p>
                       <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden relative">
                          {receiptImage ? (
                             <img src={receiptImage} alt="Receipt" className="absolute inset-0 w-full h-full object-contain p-2" />
                          ) : (
                             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <span className="text-2xl mb-2">📤</span>
                                <p className="text-xs text-slate-500 font-bold">點擊上傳截圖</p>
                             </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleUploadReceipt} />
                       </label>
                    </div>

                     {currentPayingBill.status === 'PendingVerification' ? (
                       <button disabled className="w-full py-4 bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-500/30 transition-all opacity-80">
                         憑證已送出，待收款方審核中...
                       </button>
                     ) : (
                       <button onClick={submitBankTransfer} disabled={isPending || !receiptImage} className="w-full py-4 bg-red-700 text-white rounded-xl font-black shadow-lg shadow-red-700/30 hover:bg-red-800 transition-all disabled:opacity-50 disabled:shadow-none">
                         {isPending ? '處理中...' : '送出憑證審核'}
                       </button>
                     )}
                 </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
