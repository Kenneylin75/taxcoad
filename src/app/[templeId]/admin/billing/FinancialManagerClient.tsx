// @ts-nocheck
"use client";

import React, { useState, useTransition } from 'react';
import { 
  RevenueEntry, 
  ExpenseEntry, 
  initiatePayment, uploadTempleBillReceipt, approveTempleBill, 
  FreeAccountApplication, 
  approveFreeAccount, 
  rejectFreeAccount,
  updateRevenueRemark
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
  initialData?: FinancialOverview;
  freeApps?: FreeAccountApplication[];
  initialDataJson?: string;
  freeAppsJson?: string;
}

export default function FinancialManagerClient({ initialData, freeApps, initialDataJson, freeAppsJson }: FinancialManagerClientProps) {
  if (initialDataJson) initialData = JSON.parse(initialDataJson);
  if (freeAppsJson) freeApps = JSON.parse(freeAppsJson);
  const [view, setView] = useState<'revenue' | 'expenses' | 'approvals'>('revenue');
  const [apps, setApps] = useState<FreeAccountApplication[]>(freeApps || []);
  const [isPending, startTransition] = useTransition();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentPayingBill, setCurrentPayingBill] = useState<ExpenseEntry | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'linepay' | 'ecpay'>('linepay');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [editingRemarkText, setEditingRemarkText] = useState('');

  const handleSaveRemark = (revId: string, source: string) => {
    startTransition(async () => {
      const res = await updateRevenueRemark(revId, source, editingRemarkText);
      if (res.success) {
        setEditingRemarkId(null);
        window.location.reload();
      } else {
        alert(res.message || '?≤Â?Â§±Ê?');
      }
    });
  };

  React.useEffect(() => {
    // Intentionally left empty to prevent auto-popup of payment modal on page load.
  }, [initialData?.expenses]);

  const handleUploadReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitBankTransfer = async () => {
    if (!receiptImage || !currentPayingBill) return alert('Ë´ãÂ?‰∏äÂÇ≥?ØÊ¨æ?ëË?');
    startTransition(async () => {
      const res = await uploadTempleBillReceipt(currentPayingBill.id, receiptImage);
      if (res.success) {
        alert('Â∑≤Ê??ü‰??≥ÂåØÊ¨æÊ?Ë≠âÔ?Á≠âÂ?Á∂ìÈä∑?ÜÁ¢∫Ë™çÂ??≥Ê??™Â??∏Èä∑??);
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

  const sanitizedRevenue = (initialData?.revenue || []).map((rev: any) => ({
    ...rev,
    timestamp: typeof rev.timestamp === 'string' 
      ? rev.timestamp.split('T')[0] 
      : (rev.timestamp instanceof Date ? rev.timestamp.toISOString().split('T')[0] : new Date(rev.timestamp || Date.now()).toISOString().split('T')[0])
  }));

  const filteredRevenue = sanitizedRevenue.filter(rev => {
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
  const nearestDueDate = (initialData?.expenses || []).filter(e => e.status === 'Unpaid').sort((a,b) => a.dueDate.localeCompare(b.dueDate))[0]?.dueDate || '??;

  const handleExportCSV = () => {
    if (filteredRevenue.length === 0) return alert('?ÆÂ?Ê≤íÊ??ØÂåØ?∫Á?Ë≥áÊ?');
    const headers = ['?ÖÁõÆÈ°ûÂà•/‰æÜÊ?', '‰ø°Áúæ?çÁ®±', '?Ø‰??πÂ?', '?∏Â??ëÈ?', '?•Â∏≥?ÇÈ?', '?Ä??];
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
    link.setAttribute("download", `Â∏≥Â??±Ë°®_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const handleApprove = async (id: string) => {
    if (!confirm("Á¢∫Â??∏Â?Ê≠§ÂÆÆÂªü‰Ωø?®Â?Ë≤ªÂ∏≥?∂ÊñπÊ°àÂ?Ôº?)) return;
    const res = await approveFreeAccount(id);
    if (res.success) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved' } : a));
      alert("??Â∑≤Ê??üÈ??öÂ?Ë≤ªÂ∏≥?∂Ê??ôÔ?");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Á¢∫Â??íÁ?Ê≠§Â?Ë≤ªÂ∏≥?∂Áî≥Ë´ãÂ?Ôº?)) return;
    const res = await rejectFreeAccount(id);
    if (res.success) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected' } : a));
      alert("???≥Ë?Â∑≤È??û„Ä?);
    }
  };

  const handlePay = async (exp: ExpenseEntry) => {
    setCurrentPayingBill(exp);
    const pId = exp.payeeId || 'superadmin';
    const config = initialData?.payeeSettings?.[pId];
    if (config?.linePay?.enabled) {
      setPaymentMethod('linepay');
    } else if (config?.customTransfer?.enabled) {
      setPaymentMethod('bank');
    }
    setPaymentModalOpen(true);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Lamp': return '?èÆ';
      case 'Appointment': return '??';
      case 'Event': return '?ßß';
      case 'Queue': return '?ö∂';
      case 'Merit': return '??;
      default: return '?ßß';
    }
  };

  const getExpenseTypeLabel = (type: string) => {
    switch (type) {
      case 'SetupFee': return 'Á≥ªÁµ±?ãËæ¶Âª∫ÁΩÆË≤?;
      case 'MonthlyFee': 
      case 'MONTHFEE': return 'Á≥ªÁµ±?àÁ?Ë≤?;
      case 'YearlyFee': 
      case 'YEARFEE': return 'Á≥ªÁµ±Âπ¥Á?Ë≤?;
      case 'StorageUpgrade': return 'Á©∫È??¥Â?Ë≤?;
      case 'AgiService': return 'AGI ?∫ËÉΩÁÆ°ÂÆ∂ÊµÅÈ?';
      default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Â∏≥Â?Ê≤ªÁ?‰∏≠Â?</h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Enterprise Financial Governance Hub</p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <button 
            onClick={() => setView('revenue')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${view === 'revenue' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            ?∂ÂÖ•ÊµÅÊ∞¥
          </button>
          <button 
            onClick={() => setView('expenses')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${view === 'expenses' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Âπ≥Âè∞?ØÂá∫
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      {view === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-125 transition-transform duration-500">?í∞</div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">?¨Ê?Á∏ΩÊî∂??<span className="text-slate-900 underline decoration-amber-500 decoration-4 underline-offset-4">Á∏ΩË?</span></p>
              <div className="flex items-baseline gap-2">
                 <span className="text-sm font-black text-amber-600">NT$</span>
                 <h3 className="text-4xl font-black font-serif text-slate-900 tracking-tighter">{monthlyRevenue.toLocaleString()}</h3>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">?ßæ</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">?¨Ê?Ë®ÇÂñÆ??/p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-3xl font-black font-serif text-slate-800">{monthlyOrderCount}</h3>
                 <span className="text-sm font-bold text-slate-300">Á≠?/span>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">??</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Âπ≥Â?ÂÆ¢ÂñÆ??/p>
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
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-125 transition-transform duration-500">?í≥</div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">ÂæÖÊîØ‰ªòÂ∏≥??<span className="text-rose-500 underline decoration-rose-500 decoration-4 underline-offset-4">Á∏ΩË?</span></p>
              <div className="flex items-baseline gap-2">
                 <span className="text-sm font-black text-rose-600">NT$</span>
                 <h3 className={`text-4xl font-black font-serif tracking-tighter ${(initialData?.pendingExpense || 0) > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                   {(initialData?.pendingExpense || 0).toLocaleString()}
                 </h3>
              </div>
              <div className="mt-5">
                 <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border ${(initialData?.pendingExpense || 0) > 0 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {(initialData?.pendingExpense || 0) > 0 ? 'ÂæÖÁπ≥Ë≤? : 'Â∏≥Â?ÁµêÊ?'}
                 </span>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-125 transition-transform duration-500">??</div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ËøëÊ?Áπ≥Ê¨æ?üÈ?</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-2xl font-black font-serif text-slate-800">{nearestDueDate}</h3>
              </div>
           </div>

           <div className={`p-6 rounded-2xl border shadow-sm relative overflow-hidden group ${initialData?.isPermanentFree || initialData?.trialDaysRemaining !== undefined ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
              <div className="absolute top-0 right-0 p-4 opacity-10 text-5xl group-hover:scale-125 transition-transform duration-500">??</div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${initialData?.isPermanentFree || initialData?.trialDaysRemaining !== undefined ? 'text-emerald-600' : 'text-slate-400'}`}>Á≥ªÁµ±?àÊ??Ä??/p>
              <div className="flex flex-col gap-1 mt-2">
                 {initialData?.isPermanentFree ? (
                   <h3 className="text-2xl font-black font-serif text-emerald-700">Ê∞∏‰??çË≤ª</h3>
                 ) : initialData?.trialDaysRemaining !== undefined ? (
                   <>
                     <h3 className="text-2xl font-black font-serif text-emerald-700">?çË≤ªË©¶Áî®‰∏?/h3>
                     <p className="text-xs font-bold text-emerald-600">?©È? {initialData?.trialDaysRemaining} Â§?/p>
                   </>
                 ) : (
                   <h3 className="text-2xl font-black font-serif text-slate-700">Ê≠???πÊ?Ë®àË≤ª‰∏?/h3>
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
                   <span className="text-amber-500">?èÆ</span> ‰ø°Áúæ?∂ÂÖ•ÊµÅÊ∞¥ Registry
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                   <input
                     type="text"
                     placeholder="?úÈçµÂ≠óÊ?Â∞?‰ø°Áúæ/?ÖÁõÆ/‰æÜÊ?)..."
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
                      ?íæ ?ØÂá∫?±Ë°® EXPORT
                   </button>
                </div>
             </div>

             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?ÖÁõÆÈ°ûÂà• / ‰æÜÊ?</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?Ø‰??πÂ?</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?∏Â??ëÈ?</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?•Â∏≥?ÇÈ?</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">‰ªòÊ¨æÂ∏≥Êà∂(?´‰?Á¢?</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?ôË®ª</th>
                         <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">?Ä??/th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredRevenue.length === 0 ? (
                       <tr>
                         <td colSpan={7} className="px-6 py-12 text-center text-xs font-bold text-slate-400 bg-slate-50/20">
                           ?¨Ê?‰ªΩÂ??°Êî∂?•Á???
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
                        <td className="px-6 py-4">
                           <span className="text-xs font-bold text-slate-500 font-mono">{rev.paymentRef ? rev.paymentRef.slice(-5) : '??}</span>
                        </td>
                        <td className="px-6 py-4">
                           {editingRemarkId === rev.id ? (
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={editingRemarkText}
                                  onChange={(e) => setEditingRemarkText(e.target.value)}
                                  maxLength={25}
                                  className="border border-slate-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-amber-500 font-bold text-slate-700 bg-white"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveRemark(rev.id, rev.source)} className="text-emerald-600 hover:scale-110 transition-transform">??/button>
                                <button onClick={() => setEditingRemarkId(null)} className="text-rose-400 hover:scale-110 transition-transform">??/button>
                              </div>
                           ) : (
                              <div 
                                className="flex items-center gap-2 cursor-pointer group hover:bg-amber-50 px-2 py-1 rounded transition-colors w-fit"
                                onClick={() => { setEditingRemarkId(rev.id); setEditingRemarkText(rev.remarks || ''); }}
                              >
                                <span className={`text-xs font-bold ${rev.remarks ? 'text-slate-700' : 'text-slate-300'} truncate max-w-[200px]`} title={rev.remarks}>
                                  {rev.remarks ? (rev.remarks.length > 25 ? rev.remarks.slice(0, 25) + '...' : rev.remarks) : 'ÈªûÊ??∞Â??ôË®ª'}
                                </span>
                                <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">?èÔ?</span>
                              </div>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           {rev.status === 'PENDING_REVIEW' ? (
                             <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded border border-amber-100">
                               ??ÂæÖÂØ©??
                             </span>
                           ) : (
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                               ??Validated
                             </span>
                           )}
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
                      <span className="text-rose-500">?í≥</span> Á≥ªÁµ±?çÂ?Ë≥áË≤ª Registry
                   </h3>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ë≤ªÁî®?ÖÁõÆ / ?±Ê?</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?∏Â??ëÈ?</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?™Ê≠¢?üÈ?</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">?∂Ê¨æ?Æ‰?</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ê∏ÖÂ??Ä??/th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ÁÆ°Á??ç‰?</th>
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
                                     ??Â∑≤‰?Ê¨?
                                  </span>
                               ) : exp.status === 'PendingVerification' ? (
                                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                     ??ÂæÖÂØ©??
                                  </span>
                               ) : (
                                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded border border-rose-100">
                                     ! ?™‰?Ê¨?
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
                                     {isPending ? "???‰∏?.." : (exp.status === 'PendingVerification' ? "?•Á?ÂØ©Ê†∏?Ä?? : "?í≥ ?Ø‰?")}
                                  </button>
                               ) : (
                                  <button className="text-slate-300 hover:text-slate-600 transition-all">??</button>
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
              
              <button onClick={() => setPaymentModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">??/button>

              <h2 className="text-2xl font-black text-slate-800 mb-2">Âπ≥Âè∞Ë≥áË≤ª?Ø‰?</h2>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Payment Gateway</p>

              <div className="bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-500">{getExpenseTypeLabel(currentPayingBill.type)}</span>
                    <span className="text-xl font-black text-slate-900">NT$ {currentPayingBill.amount.toLocaleString()}</span>
                 </div>
                 <p className="text-[10px] text-slate-400">Áπ≥Ê¨æ?üÈ?: {currentPayingBill.dueDate}</p>
              </div>

              <div className="flex gap-2 mb-6 flex-wrap">
                 {initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.thirdParty?.enabled && (
                   <button onClick={() => setPaymentMethod('ecpay')} className={`flex-1 min-w-[100px] py-3 text-xs font-black rounded-xl border-2 transition-all ${paymentMethod === 'ecpay' ? 'border-[#333333] bg-[#333333]/10 text-[#333333]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      ECPay Á∂†Á?
                   </button>
                 )}
                 {initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.linePay?.enabled && (
                   <button onClick={() => setPaymentMethod('linepay')} className={`flex-1 min-w-[100px] py-3 text-xs font-black rounded-xl border-2 transition-all ${paymentMethod === 'linepay' ? 'border-[#00C300] bg-[#00C300]/10 text-[#00C300]' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      LINE Pay
                   </button>
                 )}
                 {initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.enabled && (
                   <button onClick={() => setPaymentMethod('bank')} className={`flex-1 min-w-[100px] py-3 text-xs font-black rounded-xl border-2 transition-all ${paymentMethod === 'bank' ? 'border-red-600 bg-red-50 text-red-600' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                      ?ÄË°åÂåØÊ¨?
                   </button>
                 )}
              </div>

              {paymentMethod === 'linepay' ? (
                 <div className="space-y-4 text-center">
                    <div className="w-full bg-[#00C300]/5 border border-[#00C300]/20 rounded-2xl p-6">
                       <p className="text-sm font-bold text-[#00C300] mb-2">Á≥ªÁµ±Â∞áËá™?ïÊ†∏??/p>
                       <p className="text-[10px] text-slate-500">?∂ÊÇ®ÂÆåÊ? LINE Pay ?Ø‰?ÂæåÔ?Á≥ªÁµ±?ÉËá™?ïÂ?Â∏≥ÂñÆ?Ä?ãÊîπ?∫„ÄåÂ∑≤‰ªòÊ¨æ?çÔ??°È?Á≠âÂ?‰∫∫Â∑•Á¢∫Ë???/p>
                    </div>
                    <button onClick={submitLinePay} disabled={isPending} className="w-full py-4 bg-[#00C300] text-white rounded-xl font-black shadow-lg shadow-[#00C300]/30 hover:bg-[#00A000] transition-all disabled:opacity-50">
                       {isPending ? '?ïÁ?‰∏?..' : '?çÂ? LINE Pay ÁµêÂ∏≥'}
                    </button>
                 </div>
              ) : paymentMethod === 'ecpay' ? (
                 <div className="space-y-4 text-center">
                    <div className="w-full bg-[#333333]/5 border border-[#333333]/20 rounded-2xl p-6">
                       <p className="text-sm font-bold text-[#333333] mb-2">Á≥ªÁµ±Â∞áËá™?ïÊ†∏??/p>
                       <p className="text-[10px] text-slate-500">?∂ÊÇ®ÂÆåÊ? ECPay (‰ø°Áî®??ATM/Ë∂ÖÂ?‰ª?¢º) ?Ø‰?ÂæåÔ?Á≥ªÁµ±?ÉËá™?ïÂ?Â∏≥ÂñÆ?Ä?ãÊîπ?∫„ÄåÂ∑≤‰ªòÊ¨æ?çÔ??°È?Á≠âÂ?‰∫∫Â∑•Á¢∫Ë???/p>
                    </div>
                    <button onClick={() => alert('?ãÁôº‰∏≠Ô?ECPay ‰∏≤Êé•')} disabled={isPending} className="w-full py-4 bg-[#333333] text-white rounded-xl font-black shadow-lg shadow-[#333333]/30 hover:bg-black transition-all disabled:opacity-50">
                       {isPending ? '?ïÁ?‰∏?..' : '?çÂ? ECPay ÁµêÂ∏≥'}
                    </button>
                 </div>
              ) : (
                 <div className="space-y-4">
                     <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 space-y-2">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">?∂Ê¨æ?πÈ?Ë°åÂ∏≥??/p>
                        <p className="text-sm font-bold text-slate-700">
                           ?ÄË°åÔ?{initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.bankCode ? `‰ª?¢º ${initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.bankCode}` : (initialData?.payeeInfo?.bankName || '?™Ê?‰æ?)}
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                           Â∏≥Ë?Ôºö{initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.accountNo || initialData?.payeeInfo?.account || '?™Ê?‰æ?}
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                           ?∂Â?Ôºö{initialData?.payeeSettings?.[currentPayingBill.payeeId || 'superadmin']?.customTransfer?.accountName || initialData?.payeeInfo?.name || '?™Ê?‰æ?}
                        </p>
                     </div>
                    
                    <div className="space-y-2">
                       <p className="text-xs font-bold text-slate-600">‰∏äÂÇ≥?ØÊ¨æ?ëË??™Â?</p>
                       <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all overflow-hidden relative">
                          {receiptImage ? (
                             <img src={receiptImage} alt="Receipt" className="absolute inset-0 w-full h-full object-contain p-2" />
                          ) : (
                             <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <span className="text-2xl mb-2">?ì§</span>
                                <p className="text-xs text-slate-500 font-bold">ÈªûÊ?‰∏äÂÇ≥?™Â?</p>
                             </div>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={handleUploadReceipt} />
                       </label>
                    </div>

                     {currentPayingBill.status === 'PendingVerification' ? (
                       <button disabled className="w-full py-4 bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-500/30 transition-all opacity-80">
                         ?ëË?Â∑≤ÈÄÅÂá∫ÔºåÂ??∂Ê¨æ?πÂØ©?∏‰∏≠...
                       </button>
                     ) : (
                       <button onClick={submitBankTransfer} disabled={isPending || !receiptImage} className="w-full py-4 bg-red-700 text-white rounded-xl font-black shadow-lg shadow-red-700/30 hover:bg-red-800 transition-all disabled:opacity-50 disabled:shadow-none">
                         {isPending ? '?ïÁ?‰∏?..' : '?ÅÂá∫?ëË?ÂØ©Ê†∏'}
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
