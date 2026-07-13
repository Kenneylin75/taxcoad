"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { fetchSystemConfig, requestPasswordReset, requestWithdrawal, fetchSuperSalesWithdrawals } from '@/app/actions';
import DistributorApplicationForm from '@/app/components/DistributorApplicationForm';

export default function SuperSalesClient({ 
  initialProfile, initialDistributors, initialTemples, initialCapacity 
}: { 
  initialProfile: any, initialDistributors: any[], initialTemples: any[], initialCapacity: any 
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'distributors' | 'temples' | 'analytics' | 'toolkit' | 'profile'>('overview');
  const [isPending, startTransition] = useTransition();

  // --- Modals ---
  const [isAddDistModalOpen, setIsAddDistModalOpen] = useState(false);
  const [isAddTempleModalOpen, setIsAddTempleModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);

  // --- Form States ---
  const [distForm, setDistForm] = useState({ name: "", taxId: "", phone: "", email: "", address: "", selectedPlan: "160萬/2年/100帳戶" });
  const [templeForm, setTempleForm] = useState({ name: "", address: "", phone: "", email: "", note: "", account: "", password: "", setupFee: 6000, monthlyPlan: "3600/月" });
  const [paymentCycle, setPaymentCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [config, setConfig] = useState<any>(null);

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemConfig().then(setConfig);
    fetchSuperSalesWithdrawals(initialProfile.name).then(setWithdrawals);
  }, []);

  // --- Financial Mock Data (Enhanced) ---
  const [revenueHistory] = useState<any[]>([]);
  const [withdrawHistory] = useState<any[]>([]);
  const [logs, setLogs] = useState([{ id: 1, action: "系統初始化", target: "超級業務權限", time: "15:34" }]);

  const addLog = (action: string, target: string) => {
    setLogs([{ id: Date.now(), action, target, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }, ...logs]);
  };

  const handleAction = (type: string, name: string) => {
    addLog(`提報${type}申請`, name);
    alert(`🚀 申請案 [${name}] 已成功提報至超級管理員！`);
    setIsAddDistModalOpen(false);
    setIsAddTempleModalOpen(false);
  };

  const handleSubmitWithdrawal = async () => {
    // 假設提領餘額為 $856,400 (依照原本介面寫死的值為例)
    if (confirm(`確定要提領您的帳戶餘額嗎？`)) {
      await requestWithdrawal(initialProfile.name, 856400);
      alert('提領申請已送出！');
      setIsWithdrawModalOpen(false);
      fetchSuperSalesWithdrawals(initialProfile.name).then(setWithdrawals);
    }
  };

  const handlePasswordResetRequest = async () => {
    if (!confirm("確定要向中央管理總部申請重設登入密碼嗎？這將啟動安全核定流程。")) return;
    
    setIsRequestingReset(true);
    try {
      await requestPasswordReset(initialProfile.name);
      alert("✅ 密碼重設申請已送達！請留意通知中心獲取核定結果與臨時密碼。");
      addLog("發起安全審核", "密碼重設申請");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans text-slate-900 pb-40 selection:bg-indigo-100">
      
      {/* 1. Header (Royal Platinum) */}
      <header className={`px-8 py-20 transition-all duration-1000 ${activeTab === 'overview' ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-b-[100px] shadow-2xl' : 'bg-white border-b border-slate-100 shadow-sm'}`}>
        <div className="max-w-md mx-auto flex justify-between items-center">
           <div className="animate-in slide-in-from-left-6 duration-700">
              <p className={`text-[11px] font-black uppercase tracking-[0.5em] mb-3 ${activeTab === 'overview' ? 'text-indigo-400' : 'text-indigo-600'}`}>Elite Financial Control</p>
              <h1 className={`text-4xl font-black tracking-tighter italic ${activeTab === 'overview' ? 'text-white' : 'text-slate-900'}`}>
                {activeTab === 'overview' && '總裁戰略主控台'}
                {activeTab === 'distributors' && '區域經銷'}
                {activeTab === 'temples' && '宮廟開發'}
                {activeTab === 'analytics' && '財務統計中心'}
                {activeTab === 'toolkit' && '工具與合約'}
                {activeTab === 'profile' && '個人中心'}
              </h1>
           </div>
           <div className="w-16 h-16 rounded-[24px] bg-indigo-600 p-[2px] shadow-2xl rotate-3">
              <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-2xl font-black text-indigo-600 italic">SS</div>
           </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 mt-12">
        
        {/* --- TAB: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <section className="bg-white p-12 rounded-[70px] shadow-[0_30px_70px_rgba(0,0,0,0.04)] relative overflow-hidden border border-white">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-50 rounded-full blur-[80px]"></div>
                <div className="relative z-10 space-y-12">
                   <div className="text-center space-y-4">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">累計合約產值 (TOTAL_VALUE)</p>
                      <h2 className="text-6xl font-black tracking-tighter italic text-indigo-950">$52,800,000</h2>
                   </div>
                   <div className="grid grid-cols-2 gap-5">
                      <button onClick={() => setIsAddDistModalOpen(true)} className="bg-indigo-600 p-8 rounded-[40px] text-white font-black text-center shadow-2xl shadow-indigo-600/20 active:scale-95 transition-all">
                         <p className="text-[9px] uppercase tracking-widest mb-1 opacity-60">ADD_DIST</p>
                         <p className="text-lg">+ 開經銷</p>
                      </button>
                      <button onClick={() => setIsAddTempleModalOpen(true)} className="bg-slate-900 p-8 rounded-[40px] text-white font-black text-center shadow-2xl shadow-slate-900/10 active:scale-95 transition-all">
                         <p className="text-[9px] uppercase tracking-widest mb-1 opacity-40">ADD_TEMPLE</p>
                         <p className="text-lg">+ 開宮廟</p>
                      </button>
                   </div>
                </div>
             </section>
          </div>
        )}

        {/* --- TAB: DISTRIBUTORS --- */}
        {activeTab === 'distributors' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-6 duration-500">
             <button onClick={() => setIsAddDistModalOpen(true)} className="w-full py-8 bg-white border-2 border-dashed border-indigo-200 rounded-[45px] text-indigo-600 font-black text-xs uppercase tracking-[0.4em] hover:bg-indigo-50 transition-all">+ 開設新經銷商帳戶</button>
             {initialDistributors.map((d: any) => (
               <div key={d.id} className="bg-white p-10 rounded-[60px] border border-white shadow-sm space-y-4 group hover:shadow-2xl transition-all">
                  <div className="flex items-center gap-5">
                     <div className="w-16 h-16 rounded-[28px] bg-indigo-50 flex items-center justify-center text-3xl text-indigo-600 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">🏢</div>
                     <div>
                        <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{d.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">旗下業務：12 位 | 方案：160萬/2年</p>
                     </div>
                  </div>
               </div>
             ))}
          </div>
        )}

        {/* --- TAB: TEMPLES --- */}
        {activeTab === 'temples' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
             <button onClick={() => setIsAddTempleModalOpen(true)} className="w-full py-8 bg-slate-900 text-white rounded-[45px] font-black text-xs uppercase tracking-[0.4em] shadow-xl">+ 增加直屬宮廟開發</button>
             <section className="bg-white p-10 rounded-[65px] border border-white shadow-sm space-y-8">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">開發拜訪進度追蹤</h3>
                <div className="space-y-4">
                   {['北港朝天宮：方案確認', '彰化南瑤宮：初步拜訪', '台北天后宮：準備簽約'].map((item, i) => (
                      <div key={i} className="flex items-center gap-6 p-7 bg-slate-50/50 rounded-[40px] border border-white">
                         <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-black shadow-lg shadow-indigo-600/20">{i+1}</div>
                         <div><p className="text-base font-black text-slate-900">{item}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">狀態：等待提報核定</p></div>
                      </div>
                   ))}
                </div>
             </section>
          </div>
        )}

        {/* --- TAB: ANALYTICS --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
             <div className="space-y-5">
                <section className="bg-indigo-600 p-12 rounded-[70px] text-white shadow-2xl relative overflow-hidden text-center">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                   <div className="relative z-10 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-60">當前未提領餘額 (BALANCE)</p>
                      <h2 className="text-7xl font-black tracking-tighter italic">$856,400</h2>
                   </div>
                </section>

                <div className="grid grid-cols-2 gap-5">
                   <div className="bg-white p-8 rounded-[45px] border border-white shadow-sm text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">收益總額 (TOTAL)</p>
                      <p className="text-xl font-black text-slate-900">$1,061,400</p>
                   </div>
                   <div className="bg-white p-8 rounded-[45px] border border-white shadow-sm text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">累計已提領 (WITHDRAWN)</p>
                      <p className="text-xl font-black text-rose-500">$205,000</p>
                   </div>
                </div>
             </div>

             <div className="flex justify-center -mt-8 relative z-20">
                <button onClick={()=>setIsWithdrawModalOpen(true)} className="bg-slate-900 text-white px-10 py-5 rounded-[35px] font-black text-xs uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                   🚀 申請餘額提領 (WITHDRAW)
                </button>
             </div>

             <div className="space-y-6">
                <div className="flex justify-between items-center px-4">
                   <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic underline decoration-indigo-200 decoration-4">收益流水明細 (REVENUE_LEDGER)</h3>
                   <span className="text-[9px] font-black text-slate-400">最近 30 天</span>
                </div>
                {revenueHistory.map(rev => (
                   <div key={rev.id} className="bg-white p-8 rounded-[48px] border border-white shadow-sm flex justify-between items-center group hover:shadow-xl transition-all">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-xl shadow-inner italic font-black text-indigo-600">￥</div>
                         <div>
                            <p className="text-base font-black text-slate-900">{rev.source}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{rev.type} | {rev.date}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-lg font-black text-emerald-600">+${rev.net.toLocaleString()}</p>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">總額: ${rev.total.toLocaleString()}</p>
                      </div>
                   </div>
                ))}
             </div>

              {/* 提領紀錄 */}
              <div className="space-y-6 pt-8">
                 <div className="flex justify-between items-center px-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest italic underline decoration-amber-200 decoration-4">提領紀錄 (WITHDRAWALS)</h3>
                 </div>
                 {withdrawals.length === 0 && <p className="text-center text-slate-400 font-bold text-sm">尚無提領紀錄</p>}
                 {withdrawals.map(w => (
                    <div key={w.id} className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl shadow-inner italic font-black text-amber-600">🏛️</div>
                             <div>
                                <p className="text-base font-black text-slate-900">${w.amount.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{w.date} | {w.id}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             {w.status === 'Approved' ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-black uppercase">已匯款</span>
                             ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-black uppercase">處理中</span>
                             )}
                          </div>
                       </div>
                       {(w.status === 'Approved') && w.receiptUrl && (
                          <button onClick={() => setViewingReceiptUrl(w.receiptUrl)} className="w-full py-4 bg-slate-50 text-slate-600 rounded-[24px] text-[10px] font-black tracking-widest hover:bg-slate-100 transition-all uppercase">
                             🖼️ 查看匯款憑證 (VIEW RECEIPT)
                          </button>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* --- TAB: TOOLKIT --- */}
        {activeTab === 'toolkit' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
             <div className="space-y-4 px-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic underline decoration-indigo-400 decoration-4">系統演示工具庫 (SYSTEM_DEMO_TOOLS)</p>
                <div className="bg-slate-200 aspect-video rounded-[60px] border-8 border-white flex flex-col items-center justify-center space-y-4 shadow-xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] opacity-40 bg-cover bg-center group-hover:scale-110 transition-all duration-1000"></div>
                   <button className="w-20 h-20 bg-white text-indigo-600 rounded-full flex items-center justify-center text-3xl shadow-2xl relative z-10 active:scale-90 transition-all">▶</button>
                   <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest relative z-10 px-4 py-2 bg-white/80 rounded-full">點擊播放 {new Date().getFullYear()} 產品全功能演示</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                {[
                   {n: "電子授權合約", icon: "📑", c: "bg-indigo-50 text-indigo-600"},
                   {n: "超級業務規章", icon: "💎", c: "bg-purple-50 text-purple-600"},
                   {n: "系統全功能手冊", icon: "📖", c: "bg-emerald-50 text-emerald-600"},
                   {n: "分潤結算細則", icon: "📊", c: "bg-slate-100 text-slate-900"}
                ].map(tool => (
                   <button key={tool.n} onClick={() => alert(`正在載入 [${tool.n}]...`)} className="bg-white p-10 rounded-[45px] border border-white flex flex-col items-center justify-center space-y-4 shadow-sm hover:shadow-xl active:scale-95 transition-all group">
                      <div className={`w-16 h-16 rounded-3xl ${tool.c} flex items-center justify-center text-3xl group-hover:scale-110 transition-all shadow-inner`}>{tool.icon}</div>
                      <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest text-center">{tool.n}</p>
                   </button>
                ))}
             </div>
          </div>
        )}

        {/* --- TAB: PROFILE --- */}
        {activeTab === 'profile' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700">
             <section className="bg-white p-12 rounded-[75px] shadow-sm border border-white space-y-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                <div className="w-28 h-28 bg-indigo-50 rounded-[45px] mx-auto flex items-center justify-center text-5xl font-black text-indigo-600 shadow-inner">👤</div>
                <div className="space-y-2">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter">超級業務：陳精英</h3>
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em]">由超級管理員授權開設</p>
                </div>
                <div className="space-y-6 text-left pt-10 border-t border-slate-50">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">聯繫電話</p><p className="text-sm font-black text-slate-900">0988-123-456</p></div>
                      <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">電子郵件</p><p className="text-sm font-black text-slate-900">elite@pivot.com</p></div>
                   </div>
                   <div className="space-y-1"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">登入帳號</p><p className="text-sm font-black text-indigo-600">supersales</p></div>
                </div>

                <div className="pt-8 space-y-4">
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">安全身分管理 (Identity Security)</p>
                   <button 
                     onClick={handlePasswordResetRequest}
                     disabled={isRequestingReset}
                     className="w-full py-5 bg-slate-50 border border-slate-200 rounded-[30px] text-[11px] font-black text-slate-500 uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                   >
                     {isRequestingReset ? "正在提交申請..." : "🔒 申請重設登入密碼"}
                   </button>
                </div>
             </section>
          </div>
        )}

      </main>

      {/* --- ELITE NAV --- */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-white/90 backdrop-blur-[60px] rounded-[55px] px-4 py-5 flex justify-between items-center shadow-[0_40px_100px_rgba(0,0,0,0.1)] z-[100] border border-white">
         {[
           {id: 'overview', icon: '⚜️', label: '主控'},
           {id: 'distributors', icon: '🏢', label: '經銷'},
           {id: 'temples', icon: '🏛️', label: '宮廟'},
           {id: 'analytics', icon: '📈', label: '財務'},
           {id: 'toolkit', icon: '⚒️', label: '工具'},
           {id: 'profile', icon: '👤', label: '個人'}
         ].map(t => (
           <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-500 w-14 ${activeTab === t.id ? 'text-indigo-600 scale-125 font-black' : 'text-slate-300'}`}>
              <span className="text-2xl drop-shadow-md">{t.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${activeTab === t.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{t.label}</span>
           </button>
         ))}
      </nav>

      {/* --- MODALS --- */}

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[300] flex items-center justify-center animate-in fade-in duration-500 p-4">
           <div className="bg-white w-full max-w-sm rounded-[50px] p-10 shadow-2xl space-y-8">
              <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">確認提領</h3>
              <p className="text-sm font-bold text-slate-500">將提領您目前所有可用餘額，審核通過後，中央總部會將款項匯入您綁定的帳戶。</p>
              <div className="flex gap-4">
                 <button onClick={() => setIsWithdrawModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-full text-xs font-black text-slate-500">取消</button>
                 <button onClick={handleSubmitWithdrawal} className="flex-1 py-4 bg-indigo-600 rounded-full text-xs font-black text-white shadow-lg">確認送出申請</button>
              </div>
           </div>
        </div>
      )}

      {viewingReceiptUrl && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={() => setViewingReceiptUrl(null)}>
            <div className="bg-white p-4 rounded-[40px] max-w-lg w-full" onClick={e => e.stopPropagation()}>
               <img src={viewingReceiptUrl} alt="Receipt" className="w-full h-auto rounded-[30px]" />
               <button onClick={() => setViewingReceiptUrl(null)} className="w-full mt-4 py-4 bg-slate-100 text-slate-600 rounded-full text-xs font-black hover:bg-slate-200 transition-all uppercase tracking-widest">關閉視窗</button>
            </div>
         </div>
      )}

      {/* 1. Modal: 開設新經銷商 */}
      {isAddDistModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[300] flex items-end animate-in fade-in duration-500">
           <DistributorApplicationForm 
      role="super-sales"
      submittedBy={initialProfile?.name || 'SuperSales'}
      onSuccess={() => {
         setIsAddDistModalOpen(false);
         alert('經銷商申請已送出，等待總裁審核！');
         window.location.reload();
      }}
      onCancel={() => setIsAddDistModalOpen(false)}
  />
        </div>
      )}


      {/* 2. Modal: 部署直屬宮廟 */}
      {isAddTempleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[300] flex items-end animate-in fade-in duration-500">
           <form onSubmit={(e)=>{e.preventDefault(); handleAction('直屬宮廟部署', templeForm.name);}} className="bg-white w-full rounded-t-[80px] p-12 pb-24 shadow-2xl space-y-10 animate-in slide-in-from-bottom-40 duration-700 max-w-md mx-auto max-h-[95vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center"><h3 className="text-2xl font-black text-slate-900 tracking-tighter italic underline decoration-indigo-200 decoration-4">部署直屬宮廟開發案</h3><button type="button" onClick={() => setIsAddTempleModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">✕</button></div>
              <div className="space-y-6">
                 <input type="text" placeholder="宮廟正式名稱" className="w-full bg-slate-50 rounded-[40px] p-8 text-lg font-black outline-none border-2 border-transparent focus:border-indigo-100 shadow-sm" required />
                 
                 <div className="bg-slate-50 rounded-[50px] p-10 space-y-6 border-2 border-white shadow-inner">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center italic">預設管理員帳號設定 (Admin Credential)</p>
                    <div className="space-y-4">
                       <input type="text" placeholder="管理員帳號" className="w-full bg-white rounded-[35px] p-7 text-sm font-black shadow-sm outline-none border-2 border-transparent focus:border-indigo-100 transition-all" required />
                       <input type="password" placeholder="登入密碼" className="w-full bg-white rounded-[35px] p-7 text-sm font-black shadow-sm outline-none border-2 border-transparent focus:border-indigo-100 transition-all" required />
                    </div>
                 </div>

                 <div className="space-y-8 p-10 bg-indigo-50/30 rounded-[50px] border border-indigo-100/50">
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">設定繳費週期 (Cycle)</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setPaymentCycle('Monthly')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentCycle === 'Monthly' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400'}`}>月繳模式</button>
                            <button type="button" onClick={() => setPaymentCycle('Yearly')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentCycle === 'Yearly' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>年繳優惠 (-{Number(config?.yearlyDiscountRate) || 20}%)</button>
                        </div>
                    </div>

                    <div className="p-8 bg-white rounded-[40px] shadow-sm flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">計算後租賃費用</p>
                            <p className="text-3xl font-black text-slate-900 italic">
                                ${(() => {
                                    const rent = Number(config?.fixedMonthlyRent) || 3600;
                                    const discount = Number(config?.yearlyDiscountRate) || 20;
                                    const amount = paymentCycle === 'Monthly' 
                                        ? rent 
                                        : (rent * 12 * (1 - discount / 100));
                                    return isNaN(amount) ? "3,600" : amount.toLocaleString();
                                })()}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{paymentCycle === 'Monthly' ? '/ MONTH' : '/ YEAR'}</span>
                        </div>
                    </div>
                 </div>

                 <div className="p-10 bg-white border-2 border-slate-100 rounded-[50px] shadow-sm flex justify-between items-center">
                    <div>
                       <p className="text-[11px] font-black text-slate-400 uppercase mb-1">自訂開辦費 (最低6000)</p>
                       <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-slate-200">$</span>
                          <input type="number" min="6000" className="bg-transparent text-3xl font-black outline-none w-32 text-slate-900" value={templeForm.setupFee} onChange={e=>setTempleForm({...templeForm, setupFee:Math.max(6000, parseInt(e.target.value))})} />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-10 bg-indigo-600 text-white rounded-[55px] font-black text-sm uppercase tracking-[0.6em] shadow-2xl shadow-indigo-600/30">提報超管核定開通 🚀</button>
              </div>
           </form>
        </div>
      )}

    </div>
  );
}
