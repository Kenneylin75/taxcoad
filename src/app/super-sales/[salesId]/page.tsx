"use client";

import React, { useState, useEffect } from 'react';
import ContractTemplate from '@/components/ContractTemplate';
import TempleApplicationForm from '@/app/components/TempleApplicationForm';
import DistributorApplicationForm from '@/app/components/DistributorApplicationForm';
import { 
  fetchSuperSalesProfile, 
  fetchSuperSalesRegistry, 
  fetchSalesTools,
  submitDistributorApplication,
  fetchNotifications,
  fetchEarningsStats,
  requestWithdrawal,
  fetchSystemConfig,
  fetchCommissionHistory
} from '@/app/actions';

import { useParams } from "next/navigation";

export default function SuperSalesPage() {
  const params = useParams();
  const salesId = params.salesId as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'apply' | 'registry' | 'performance' | 'tools' | 'profile'>('overview');
  const [applyType, setApplyType] = useState<'temple' | 'distributor'>('temple');
  const [registryTab, setRegistryTab] = useState<'temples' | 'distributors'>('temples');
  const [performanceTab, setPerformanceTab] = useState<'monitor' | 'withdraw'>('monitor');
  const [submitted, setSubmitted] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const salesName = profile?.name || "超級精英業務";
  const [registry, setRegistry] = useState<any>({ temples: [], distributors: [] });
  const [tools, setTools] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({ balance: 0, pending: 0, totalWithdrawn: 0 });
  const [withdrawalAmount, setWithdrawalAmount] = useState<string>("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [activeToolPreview, setActiveToolPreview] = useState<any>(null);
  const [showContractGenerator, setShowContractGenerator] = useState(false);
  const [contractTarget, setContractTarget] = useState("");

  const [sysConfig, setSysConfig] = useState<any>(null);
  const [commissionHistory, setCommissionHistory] = useState<any>(null);
  const [viewingBillsTemple, setViewingBillsTemple] = useState<any>(null);

  useEffect(() => {
    fetchSuperSalesProfile(salesId).then(setProfile);
    fetchSuperSalesRegistry(salesId).then(setRegistry);
    fetchSalesTools().then(setTools);
    fetchNotifications("SuperSales").then(setNotifications);
    fetchEarningsStats(salesId).then(setEarnings);
    fetchSystemConfig().then(setSysConfig);
    fetchCommissionHistory(salesId, "2026", "05").then(setCommissionHistory);
  }, [salesId, activeTab]); 

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
         <div className="bg-white w-full max-w-md rounded-[40px] p-12 text-center space-y-8 shadow-sm border border-slate-200">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center text-3xl mx-auto border border-emerald-100">✓</div>
            <div className="space-y-2">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">申請已送達</h2>
               <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">您的提報案已進入中央審核程序，審核結果將即時更新於管理中心。</p>
            </div>
            <button onClick={() => { setSubmitted(false); setActiveTab('overview'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">返回主頁面</button>
         </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
       {/* Simple Header Summary */}
       <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">開發宮廟</p>
             <p className="text-3xl font-black text-slate-900">{registry.temples.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">經銷體系</p>
             <p className="text-3xl font-black text-slate-900">{registry.distributors.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">待審核</p>
             <p className="text-3xl font-black text-indigo-600">{registry.pendingCount || 0}</p>
          </div>
       </div>

       {/* Quick Action Cards */}
       <div className="grid grid-cols-2 gap-4">
          <button onClick={() => { setActiveTab('apply'); setApplyType('temple'); }} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-left space-y-6 hover:border-indigo-400 transition-all group">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">🏛️</div>
             <div>
                <h3 className="font-black text-slate-900">部署宮廟節點</h3>
                <p className="text-xs text-slate-400 font-medium">代開宮廟專屬雲端帳戶</p>
             </div>
          </button>
          <button onClick={() => { setActiveTab('apply'); setApplyType('distributor'); }} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-left space-y-6 hover:border-emerald-400 transition-all group">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">🏗️</div>
             <div>
                <h3 className="font-black text-slate-900">開設經銷體系</h3>
                <p className="text-xs text-slate-400 font-medium">授權區域經銷商管理權限</p>
             </div>
          </button>
       </div>

       {/* Notifications */}
       <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">最新系統通知</h4>
             <span className="text-[10px] font-bold text-slate-400">顯示最近 3 筆</span>
          </div>
          <div className="space-y-3">
             {notifications.slice(0, 3).map(n => (
                <div key={n.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex gap-4 items-start">
                   <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{n.date}</p>
                      <h5 className="text-sm font-black text-slate-900 leading-tight">{n.title}</h5>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{n.content}</p>
                   </div>
                </div>
             ))}
          </div>
       </section>
    </div>
  );

  const renderApply = () => (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 pb-20">
       <div className="bg-white rounded-[48px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-1 px-1 bg-slate-100 flex">
             <button onClick={() => setApplyType('temple')} className={`flex-1 py-4 rounded-[40px] text-[10px] font-black uppercase tracking-widest transition-all ${applyType === 'temple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>宮廟部署</button>
             <button onClick={() => setApplyType('distributor')} className={`flex-1 py-4 rounded-[40px] text-[10px] font-black uppercase tracking-widest transition-all ${applyType === 'distributor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>經銷商開設</button>
          </div>
          
          <div className="p-10 md:p-16 space-y-12">
             <div className="space-y-2 text-center md:text-left">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{applyType === 'temple' ? '宮廟開戶申請' : '經銷商授權申請'}</h2>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">請正確填寫以下資訊，提交後將由中央管理總部進行核定與節點配置。</p>
             </div>

             {applyType === 'temple' ? (
                <TempleApplicationForm 
                   role="super-sales"
                   submittedBy={salesName}
                   onSuccess={() => setSubmitted(true)}
                   onCancel={() => setActiveTab('overview')}
                />
             ) : (
                <DistributorApplicationForm 
                   role="super-sales"
                   submittedBy={salesName}
                   onSuccess={() => setSubmitted(true)}
                   onCancel={() => setActiveTab('overview')}
                />
             )}
          </div>
       </div>
    </div>
  );


  const renderRegistry = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
       <div className="flex justify-between items-center px-2">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">管理監控中心</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Node Monitor</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
             <button onClick={() => setRegistryTab('temples')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${registryTab === 'temples' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>宮廟節點</button>
             <button onClick={() => setRegistryTab('distributors')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${registryTab === 'distributors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>經銷體系</button>
          </div>
       </div>

       <div className="space-y-4">
          {(registryTab === 'temples' ? registry.temples : registry.distributors).map((item: any, idx: number) => (
             <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${item.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                         {registryTab === 'temples' ? '🏛️' : '🏗️'}
                      </div>
                      <div>
                         <h5 className="font-black text-slate-900 text-lg leading-tight">{item.name}</h5>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700 animate-pulse'}`}>
                               {item.status}
                            </span>
                         </div>
                      </div>
                   </div>
                   <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all">⋯</button>
                </div>
                
                {/* Detailed Monitor Info */}
                <div className="bg-slate-50/50 rounded-3xl p-6 space-y-4">
                   <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <span>{registryTab === 'temples' ? '服務方案' : '帳戶使用量'}</span>
                      <span className="text-slate-900">{item.plan}</span>
                   </div>
                   {registryTab === 'distributors' && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 group/card">
                            <div className="flex items-center gap-2 mb-3">
                               <span className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-sm group-hover/card:scale-110 transition-transform">🏛️</span>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">宮廟佈建規模</p>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{item.templeCount || 0} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Nodes</span></p>
                         </div>
                         <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 group/card">
                            <div className="flex items-center gap-2 mb-3">
                               <span className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-sm group-hover/card:scale-110 transition-transform">🧑‍💼</span>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">旗下業務團隊</p>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{item.salesCount || 0} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Staffs</span></p>
                         </div>
                         <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-rose-200 group/card">
                            <div className="flex items-center gap-2 mb-3">
                               <span className="w-7 h-7 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-sm group-hover/card:scale-110 transition-transform">💸</span>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">累計佣金支出</p>
                            </div>
                            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">${(item.expenses || 0).toLocaleString()}</p>
                         </div>
                         <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[24px] p-5 shadow-lg shadow-indigo-200/50 transition-all hover:shadow-xl hover:-translate-y-1 group">
                            <div className="flex items-center gap-2 mb-3">
                               <span className="w-7 h-7 bg-white/20 text-white rounded-xl flex items-center justify-center text-sm group-hover:scale-110 transition-transform shadow-inner">💰</span>
                               <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">總營收 / 淨利潤</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-3xl font-black text-white italic tracking-tighter leading-none">${(item.revenue || 0).toLocaleString()}</p>
                               <p className="text-[10px] font-bold text-indigo-200">淨利潤 <span className="text-white font-black">${(item.netRevenue || 0).toLocaleString()}</span></p>
                            </div>
                         </div>
                      </div>
                   )}
                   {registryTab === 'temples' && item.status === 'Active' && (
                      <div className="flex gap-4">
                         <div className="flex-1 text-center py-3 bg-white rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">年度貢獻</p>
                            <p className="text-sm font-black text-slate-900">${(item.annualContribution ?? (item.revenue * 12)).toLocaleString()}</p>
                         </div>
                         <div className="flex-1 text-center py-3 bg-white rounded-2xl border border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">合約狀態</p>
                            <p className="text-sm font-black text-emerald-600 uppercase">進行中</p>
                         </div>
                         <div 
                            onClick={(e) => { e.stopPropagation(); setViewingBillsTemple(item); }}
                            className="flex-1 text-center py-3 bg-white rounded-2xl border border-slate-100 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all"
                         >
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">支付狀況</p>
                            <p className={`text-sm font-black uppercase ${item.paymentStatus === '待繳費' ? 'text-rose-600' : 'text-emerald-600'}`}>{item.paymentStatus || '已繳清'}</p>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
       <div className="flex justify-between items-center px-2">
          <div className="space-y-1">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">業績數據矩陣</h2>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commission & Earnings</p>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
             <button onClick={() => setPerformanceTab('monitor')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${performanceTab === 'monitor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>收益監控</button>
             <button onClick={() => setPerformanceTab('withdraw')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${performanceTab === 'withdraw' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>提領中心</button>
          </div>
       </div>

       {performanceTab === 'monitor' ? (
          <div className="space-y-8">
             {/* Simple Metric Grid */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">可提領獎金餘額</p>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter">${earnings.balance.toLocaleString()}</h2>
                   <button onClick={() => setPerformanceTab('withdraw')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-100">前往提領</button>
                </div>
                <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">待結算中獎金</p>
                   <h2 className="text-4xl font-black text-slate-900 tracking-tighter">${(commissionHistory?.totalEarned || 0).toLocaleString()}</h2>
                   <div className="pt-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">依據宮廟年資精確結算</span>
                   </div>
                </div>
             </div>

             {/* Commission Breakdown Per Temple */}
             <section className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-6">
                <div className="flex justify-between items-center px-2">
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">宮廟分潤年資細目</h4>
                   <span className="text-[10px] font-bold text-slate-400">目前活躍點燈數: {commissionHistory?.records?.length || 0}</span>
                </div>
                <div className="space-y-3">
                   {commissionHistory?.records?.map((rec: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                         <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${rec.phase === 'Setup' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                               {rec.phase === 'Setup' ? '🎯' : '📈'}
                            </div>
                            <div>
                               <p className="text-xs font-black text-slate-900">{rec.templeName}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{rec.type}</p>
                               {rec.calculation && (
                                 <p className="text-[8px] text-indigo-500 font-black mt-1 bg-indigo-50/50 px-1.5 py-0.5 rounded-md inline-block">{rec.calculation}</p>
                               )}
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-sm font-black text-slate-900">${rec.amount.toLocaleString()}</p>
                            <p className="text-[8px] text-slate-400 font-bold">{rec.date}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </section>

             {/* Personal Rates Info (Light Theme) */}
             <section className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-8">
                <div className="flex items-center gap-3 px-2 border-l-4 border-indigo-600 pl-4">
                   <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">當前分潤協議內容</h4>
                </div>
                <div className="grid grid-cols-2 gap-8 px-2">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">經銷商授權費提成</p>
                      <p className="text-3xl font-black text-indigo-600 italic">{profile?.commissionRates?.distributorAuthRate ?? profile?.commissionRates?.distributor ?? 0}%</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">宮廟開辦費分潤</p>
                      <p className="text-3xl font-black text-emerald-600 italic">{profile?.commissionRates?.templeSetupRate ?? profile?.commissionRates?.setupFeePercent ?? 0}%</p>
                   </div>
                   <div className="col-span-2 pt-4 space-y-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">宮廟月租維護提成 (階梯制)</p>
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-3xl">
                         <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">第一年</p><p className="text-xl font-black text-slate-900">{profile?.commissionRates?.templeRentRates?.[0] ?? profile?.commissionRates?.rentYear1Percent ?? 0}%</p></div>
                         <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">第二年</p><p className="text-xl font-black text-slate-900">{profile?.commissionRates?.templeRentRates?.[1] ?? profile?.commissionRates?.rentYear2Percent ?? 0}%</p></div>
                         <div className="text-center"><p className="text-[8px] font-black text-slate-400 uppercase">長期</p><p className="text-xl font-black text-slate-900">{profile?.commissionRates?.templeRentRates?.[2] ?? profile?.commissionRates?.rentYear3PlusPercent ?? 0}%</p></div>
                      </div>
                   </div>
                </div>
             </section>
          </div>
       ) : (
          <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
             <div className="bg-white p-10 rounded-[48px] border border-slate-200 shadow-sm space-y-10">
                <div className="text-center space-y-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">可提領餘額</p>
                   <h2 className="text-5xl font-black text-slate-900 italic tracking-tighter">${earnings.balance.toLocaleString()}</h2>
                </div>

                <form onSubmit={async (e) => {
                   e.preventDefault();
                   setIsWithdrawing(true);
                   const res = await requestWithdrawal(salesName, parseInt(withdrawalAmount));
                   setIsWithdrawing(false);
                   if (res.success) {
                      setSubmitted(true);
                   } else {
                      alert("提領失敗：" + res.error);
                   }
                }} className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-4">申請提領金額 (TWD)</label>
                      <input 
                         type="number" 
                         placeholder="請輸入金額" 
                         value={withdrawalAmount}
                         onChange={(e) => setWithdrawalAmount(e.target.value)}
                         className="w-full bg-slate-50 rounded-[28px] p-8 text-3xl font-black outline-none border border-slate-100 focus:bg-white focus:border-indigo-500 text-center transition-all" 
                         required
                      />
                   </div>
                   
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase">指定撥款帳戶</p>
                         <p className="text-sm font-black text-slate-900">國泰世華 (013) • **** 8901</p>
                      </div>
                      <span className="text-[10px] font-black text-indigo-600 bg-white px-3 py-1 rounded-full border border-indigo-100 shadow-sm">Verified</span>
                   </div>

                   <button type="submit" disabled={isWithdrawing} className="w-full py-7 bg-slate-900 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50">
                      {isWithdrawing ? '處理中...' : '確認提交提領申請 📤'}
                   </button>
                </form>
             </div>
          </div>
       )}
    </div>
  );

  const renderTools = () => {
    const mediaTools = tools.filter(t => t.type === 'video' || t.type === 'photo');
    const docTools = tools.filter(t => t.type !== 'video' && t.type !== 'photo');

    return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-24">
       <div className="px-2 space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">資源與工具中心</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Support & Assets</p>
       </div>

       {/* --- SYNCED HQ DOCUMENTS --- */}
       {(docTools.length > 0 || tools.length === 0) && (
           <div className="space-y-6 px-4">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                 <h3 className="font-black text-slate-800 text-sm tracking-widest">電子契約與規範手冊</h3>
              </div>
              
              {docTools.length > 0 ? (
                  <div className="space-y-4">
                     {docTools.map((doc: any, idx: number) => (
                        <button key={idx} onClick={() => setActiveToolPreview(doc)} className="w-full flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[30px] hover:shadow-xl hover:border-indigo-100 transition-all group">
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                 {doc.type === 'contract' ? '📑' : '📄'}
                              </div>
                              <span className="font-black text-slate-800 text-lg">{doc.title}</span>
                           </div>
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-indigo-600 transition-all">DOWNLOAD &rarr;</span>
                        </button>
                     ))}
                  </div>
              ) : (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                     <span className="text-3xl mb-3 block opacity-30">📄</span>
                     <p className="text-sm font-black text-slate-400">目前沒有文件或合約</p>
                  </div>
              )}
           </div>
       )}

       {/* --- SYNCED HQ MEDIA --- */}
       {(mediaTools.length > 0) && (
           <div className="space-y-6 px-4 pt-6 border-t border-slate-100">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                 <h3 className="font-black text-slate-800 text-sm tracking-widest">影音與視覺資源</h3>
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mediaTools.map((tool: any, idx: number) => (
                     <div key={idx} onClick={() => setActiveToolPreview(tool)} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
                        <div className="aspect-video relative bg-slate-100 overflow-hidden">
                           <img src={tool.thumbnail || tool.url || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 opacity-80" />
                           <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                              <span className="text-4xl">
                                 {tool.type === 'video' ? '▶️' : '🖼️'}
                              </span>
                           </div>
                           <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                              {tool.type === 'video' ? '影片' : '照片'}
                           </div>
                        </div>
                        <div className="p-8 space-y-3">
                           <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{tool.category || '未分類'} • {tool.uploadedAt || '2026/05/19'}</p>
                           <h5 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{tool.title}</h5>
                           <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                              <span className="text-[9px] font-black text-slate-400 uppercase">HQ SYNCED</span>
                              <button onClick={() => setActiveToolPreview(tool)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">開啟檢視</button>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
           </div>
       )}

       
    </div>
    );
  };

  const renderProfile = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
       <div className="bg-white p-12 rounded-[48px] border border-slate-200 shadow-sm space-y-12">
          <div className="flex flex-col items-center text-center space-y-6">
             <div className="w-24 h-24 rounded-[36px] bg-indigo-600 text-white flex items-center justify-center text-5xl shadow-xl shadow-indigo-100">👤</div>
             <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{salesName}</h3>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-2">Global Elite Partner No. 001</p>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">基本資料 (Contact Info)</h4>
                 {isEditingContact ? (
                     <div className="flex gap-2">
                        <button onClick={() => setIsEditingContact(false)} className="text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all">取消</button>
                        <button onClick={async () => {
                           const phone = (document.getElementById('editPhone') as HTMLInputElement).value;
                           const email = (document.getElementById('editEmail') as HTMLInputElement).value;
                           const { updateSuperSalesBasicInfo } = await import('@/app/actions');
                           const res = await updateSuperSalesBasicInfo(salesId, { phone, email });
                           if (res.success) {
                              alert("基本資料已更新");
                              setProfile({...profile, phone, email});
                              setIsEditingContact(false);
                           } else {
                              alert("更新失敗：" + res.error);
                           }
                        }} className="text-[10px] font-black text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm">儲存變更</button>
                     </div>
                 ) : (
                     <button onClick={() => setIsEditingContact(true)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">編輯資料</button>
                 )}
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">行動電話 (Mobile)</p>
                   {isEditingContact ? (
                      <input id="editPhone" defaultValue={profile?.phone || ''} className="w-full bg-white border-2 border-indigo-200 rounded-xl p-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 mt-1 transition-all" />
                   ) : (
                      <p className="text-sm font-black text-slate-900">{profile?.phone || '未設定'}</p>
                   )}
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">登入帳號 (ID) <span className="text-[8px] text-slate-300 ml-1">唯讀</span></p>
                   <p className="text-sm font-black text-slate-900">{profile?.account || '未設定'}</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">電子郵件 (Email)</p>
                   {isEditingContact ? (
                      <input id="editEmail" defaultValue={profile?.email || ''} className="w-full bg-white border-2 border-indigo-200 rounded-xl p-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 mt-1 transition-all" />
                   ) : (
                      <p className="text-sm font-black text-slate-900">{profile?.email || '未設定'}</p>
                   )}
                </div>
                <div onClick={async () => {
                   if(confirm("確認要發起密碼重設申請嗎？申請後將由超級管理員核定並手動提供新密碼。")) {
                      const { requestPasswordReset } = await import('@/app/actions');
                      await requestPasswordReset(salesName);
                      alert("重設申請已送達管理員，請靜候通知。");
                   }
                }} className="p-6 bg-slate-50 rounded-[32px] space-y-1 flex justify-between items-center group cursor-pointer hover:bg-white border-2 border-transparent hover:border-indigo-200 transition-all">
                   <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">系統密碼 (Password)</p>
                      <p className="text-sm font-black text-slate-900">••••••••••••</p>
                   </div>
                   <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 shadow-sm">發起重設申請</span>
                </div>
             </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 space-y-6">
             <div className="flex justify-between items-center">
                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">收款帳戶資訊 (Bank Account)</h4>
                 {isEditingBank ? (
                     <div className="flex gap-2">
                        <button onClick={() => setIsEditingBank(false)} className="text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all">取消</button>
                        <button onClick={async () => {
                           const bankName = (document.getElementById('editBankName') as HTMLInputElement).value;
                           const accountName = (document.getElementById('editAccountName') as HTMLInputElement).value;
                           const accountNumber = (document.getElementById('editAccountNumber') as HTMLInputElement).value;
                           if (bankName && accountName && accountNumber) {
                              const { updateSuperSalesBankInfo } = await import('@/app/actions');
                              const res = await updateSuperSalesBankInfo(salesId, { bankName, accountName, accountNumber });
                              if (res.success) {
                                  alert("收款帳戶已更新");
                                  setProfile({...profile, bankInfo: { bankName, accountName, accountNumber }});
                                  setIsEditingBank(false);
                              } else {
                                  alert("更新失敗：" + res.error);
                              }
                           } else {
                               alert("所有欄位皆必填！");
                           }
                        }} className="text-[10px] font-black text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm">儲存變更</button>
                     </div>
                 ) : (
                     <button onClick={() => setIsEditingBank(true)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">修改帳戶</button>
                 )}
             </div>
             {isEditingBank ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">銀行名稱</p>
                         <input id="editBankName" defaultValue={profile?.bankInfo?.bankName || ''} className="w-full bg-white border-2 border-indigo-200 rounded-xl p-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 transition-all" placeholder="例如：中國信託" />
                     </div>
                     <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">戶名</p>
                         <input id="editAccountName" defaultValue={profile?.bankInfo?.accountName || ''} className="w-full bg-white border-2 border-indigo-200 rounded-xl p-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 transition-all" placeholder="例如：林精英" />
                     </div>
                     <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">帳號</p>
                         <input id="editAccountNumber" defaultValue={profile?.bankInfo?.accountNumber || ''} className="w-full bg-white border-2 border-indigo-200 rounded-xl p-2 text-sm font-black text-slate-900 outline-none focus:border-indigo-500 transition-all" placeholder="例如：1234567890" />
                     </div>
                 </div>
             ) : profile?.bankInfo ? (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">銀行名稱</p>
                         <p className="text-sm font-black text-slate-900">{profile.bankInfo.bankName}</p>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">戶名</p>
                         <p className="text-sm font-black text-slate-900">{profile.bankInfo.accountName}</p>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-[32px] space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">帳號</p>
                         <p className="text-sm font-black text-slate-900">{profile.bankInfo.accountNumber}</p>
                     </div>
                 </div>
             ) : (
                 <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center">
                     <p className="text-sm font-bold text-slate-400">尚未設定收款帳戶</p>
                 </div>
             )}
          </div>
          
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
             <span className="text-xl">⚠️</span>
             <p className="text-[10px] text-amber-700 font-bold leading-relaxed">安全提示：為了確保全球業務體系的帳戶安全，超級業務員無法自行更改密碼。如需變更，請點擊上方申請，系統將通知超級管理員進行人工審核與重配。</p>
          </div>
          
          <button onClick={async () => {
             const { logoutAccount } = await import('@/app/actions');
             await logoutAccount();
             window.location.href = '/login';
          }} className="w-full py-6 bg-slate-900 text-white rounded-[32px] font-black text-sm uppercase tracking-[0.4em] shadow-xl hover:bg-rose-600 transition-all active:scale-95">登出業務終端 ⏻</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-100">
      {/* Subtle Navbar */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-[100] px-10 py-8 shadow-sm">
         <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div onClick={() => setActiveTab('overview')} className="flex items-center gap-4 cursor-pointer">
               <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg font-black italic">S</div>
               <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Super Sales Elite</h1>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Certified Terminal</p>
               </div>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right hidden sm:block">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Active Partner</p>
                  <p className="text-sm font-black text-slate-900">{salesName}</p>
               </div>
               <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl border border-slate-200">💎</div>
            </div>
         </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-6 py-12">
         {(() => {
           switch (activeTab) {
             case 'overview': return renderOverview();
             case 'apply': return renderApply();
             case 'registry': return renderRegistry();
             case 'performance': return renderPerformance();
             case 'tools': return renderTools();
             case 'profile': return renderProfile();
             default: return renderOverview();
           }
         })()}
         
         <footer className="mt-20 pb-32 text-center space-y-4">
            <div className="w-8 h-px bg-slate-200 mx-auto"></div>
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">Global Business Cloud V6.5</p>
         </footer>
      </main>

      {/* Modern Bottom Navigation */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-white/90 backdrop-blur-2xl rounded-[40px] px-2 py-3 flex justify-between items-center shadow-2xl z-[100] border border-slate-200/50">
         {[
           {id: 'overview', icon: '💎', label: '首頁'},
           {id: 'apply', icon: '➕', label: '開戶'},
           {id: 'registry', icon: '📊', label: '管理'},
           {id: 'performance', icon: '💰', label: '績效'},
           {id: 'tools', icon: '⚒️', label: '工具'},
           {id: 'profile', icon: '👤', label: '個人'}
         ].map(t => (
           <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center gap-1 w-16 transition-all duration-300 ${activeTab === t.id ? 'text-indigo-600 scale-105' : 'text-slate-300'}`}>
              <span className="text-xl mb-0.5">{t.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>{t.label}</span>
           </button>
         ))}
      </nav>
    {/* --- TOOL PREVIEW MODAL --- */}
       {activeToolPreview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveToolPreview(null)}></div>
             <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                   <div>
                      <h3 className="font-black text-slate-900 text-lg">{activeToolPreview.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeToolPreview.category} • {activeToolPreview.type}</p>
                   </div>
                   <button onClick={() => setActiveToolPreview(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
                </div>
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center flex-col gap-6">
                   {activeToolPreview.type === 'photo' ? (
                      <img src={activeToolPreview.url || activeToolPreview.thumbnail} className="max-w-full max-h-full rounded-2xl shadow-sm" />
                   ) : activeToolPreview.type === 'video' ? (
                      <video src={activeToolPreview.url || activeToolPreview.thumbnail} controls className="w-full aspect-video bg-black rounded-2xl shadow-lg" />
                   ) : (
                      <div className="text-center space-y-4">
                         <span className="text-6xl block">📄</span>
                         <p className="text-sm font-black text-slate-900">{activeToolPreview.title}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">文件已被安全保護，請點擊下方按鈕下載檢閱</p>
                      </div>
                   )}
                   
                   <button 
                      className="px-8 py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-indigo-700 transition-all mt-4" 
                      onClick={() => {
                        const fileUrl = activeToolPreview.url || activeToolPreview.thumbnail;
                        if (!fileUrl) {
                          alert('檔案連結無效，無法下載。');
                          return;
                        }
                        try {
                          if (fileUrl.startsWith('data:')) {
                            const arr = fileUrl.split(',');
                            const mime = arr[0].match(/:(.*?);/)[1];
                            const bstr = atob(arr[1]);
                            let n = bstr.length;
                            const u8arr = new Uint8Array(n);
                            while (n--) {
                              u8arr[n] = bstr.charCodeAt(n);
                            }
                            const blob = new Blob([u8arr], { type: mime });
                            const blobUrl = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = activeToolPreview.title || 'download';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                          } else {
                            const a = document.createElement('a');
                            a.href = fileUrl;
                            a.download = activeToolPreview.title || 'download';
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }
                        } catch (err) {
                          alert('下載失敗，檔案可能已損壞或過大。');
                          console.error(err);
                        }
                      }}
                   >確認下載檔案 (Download)</button>
                </div>
             </div>
          </div>
       )}
</div>
  );
}
