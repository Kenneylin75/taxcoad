"use client";

import React, { useState, useTransition, useMemo, useEffect } from 'react';
import TempleApplicationForm from '@/app/components/TempleApplicationForm';
import { fetchDistributorFinancials, fetchDistributorSalesPerformance, updateDistributorBankInfo } from '@/app/actions';

/**
 * Aurora Background Component - Enhanced with more vibrant but subtle blobs
 */
const AuroraBackground = () => (
  <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#FDFDFF]">
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/15 rounded-full blur-[140px] animate-pulse"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
    <div className="absolute top-[30%] right-[5%] w-[25%] h-[25%] bg-purple-400/10 rounded-full blur-[100px] animate-bounce duration-[15s]"></div>
    <div className="absolute top-[10%] left-[20%] w-[15%] h-[15%] bg-emerald-300/5 rounded-full blur-[80px] animate-pulse delay-1000"></div>
  </div>
);

export default function DistAdminClient({ 
  distId, initialProfile, initialTeam, initialApps, initialCapacity, initialCommission, initialTools = []
}: { 
  distId: string, initialProfile: any, initialTeam: any[], initialApps: any[], initialCapacity: any, initialCommission: any, initialTools: any[] 
}) {
  const [activeToolPreview, setActiveToolPreview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'team' | 'approvals' | 'calendar' | 'financials' | 'tools' | 'profile' | 'logs' | 'temples' | 'b2b_payment'>('overview');
  const [isPending, startTransition] = useTransition();

  // --- Financial Sub-Tab State ---
  const [financialTab, setFinancialTab] = useState<'payments' | 'performance' | 'bonuses'>('payments');
  const [expandedTempleId, setExpandedTempleId] = useState<string | null>(null);

  // --- Calendar & Period State ---
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedDay, setSelectedDay] = useState(12);

  // --- Global Modals State ---
  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false);
  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [isEditBankModalOpen, setIsEditBankModalOpen] = useState(false);
  const [isDirectCreateModalOpen, setIsDirectCreateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isTempleListModalOpen, setIsTempleListModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);

  const [editBankForm, setEditBankForm] = useState({
    bankName: initialProfile?.bankInfo?.bankName || '國泰世華銀行 (013)',
    accountName: initialProfile?.bankInfo?.accountName || '北區雲端宮廟代理有限公司',
    accountNumber: initialProfile?.bankInfo?.accountNumber || '12345678901234'
  });

  // --- Selections ---
  const [selectedSales, setSelectedSales] = useState<any>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [contractTemple, setContractTemple] = useState("");

  // --- Managed Temples Mock ---
  const managedTemples = useMemo(() => [
    { id: 'T-001', name: "台北行天宮", sales: "陳小明", plan: "Elite Node", joinedAt: "2026-01-15", status: "Active" },
    { id: 'T-002', name: "龍山寺", sales: "林志玲", plan: "Standard Node", joinedAt: "2026-02-20", status: "Active" },
    { id: 'T-003', name: "大甲鎮瀾宮", sales: "王大錘", plan: "Elite Node", joinedAt: "2026-03-05", status: "Warning" },
    { id: 'T-004', name: "北港朝天宮", sales: "陳小明", plan: "Standard Node", joinedAt: "2026-04-10", status: "Active" },
    { id: 'T-005', name: "鹿港天后宮", sales: "李小龍", plan: "Elite Node", joinedAt: "2026-05-01", status: "Active" },
  ], []);

  // --- Mock Visit Data ---
  const mockVisits = useMemo(() => [
    { id: 1, day: 3, sales: "陳小明", temple: "台北行天宮", purpose: "系統續約洽談", status: "Completed" },
    { id: 2, day: 3, sales: "林志玲", temple: "龍山寺", purpose: "硬體維護檢查", status: "Completed" },
    { id: 3, day: 8, sales: "王大錘", temple: "大甲鎮瀾宮", purpose: "新功能展示", status: "Completed" },
    { id: 4, day: 12, sales: "陳小明", temple: "北港朝天宮", purpose: "年度預算簡報", status: "Pending" },
    { id: 5, day: 12, sales: "李小龍", temple: "鹿港天后宮", purpose: "金流介接測試", status: "Pending" },
    { id: 6, day: 15, sales: "林志玲", temple: "中和烘爐地", purpose: "拜訪管委會", status: "Pending" },
    { id: 7, day: 20, sales: "陳小明", temple: "南鯤鯓代天府", purpose: "擴充模組簽約", status: "Pending" },
    { id: 8, day: 12, sales: "張三豐", temple: "武當山辦事處", purpose: "雲端遷移評估", status: "Pending" },
  ], []);

  // --- Official Tools Mock Data ---
  const officialTools = initialTools;

  // --- Performance & Payment Mock Data with Regions & History ---
  const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
  const [bonusRequests, setBonusRequests] = useState<any[]>([]);
  const [teamPerformance, setTeamPerformance] = useState<any[]>(initialTeam);

  useEffect(() => {
    startTransition(async () => {
      const [financials, performance] = await Promise.all([
        fetchDistributorFinancials(distId),
        fetchDistributorSalesPerformance(distId)
      ]);
      setPaymentRecords(financials.paymentRecords);
      setBonusRequests(financials.bonusRequests);
      
      // Update team performance dynamically
      if (performance && performance.length > 0) {
        setTeamPerformance(performance);
      }
    });
  }, [distId]);

  // --- Forms ---
  const [rejectReason, setRejectReason] = useState("");
  const [newSalesForm, setNewSalesForm] = useState({ 
    name: "", phone: "", account: "", password: "", setupRate: 20, rentYear1Rate: 15, rentYear2Rate: 10, rentYear3PlusRate: 5 
  });
  const [editingRates, setEditingRates] = useState({
    setupRate: 20, rentYear1Rate: 15, rentYear2Rate: 10, rentYear3PlusRate: 5
  });

  const [logs, setLogs] = useState([{ id: 1, action: "系統初始化完成", target: "安全協議", operator: "System", time: "2026-05-04 00:00" }]);

  const addLog = (action: string, target: string) => {
    setLogs([{ id: Date.now(), action, target, operator: "管理員", time: new Date().toLocaleString() }, ...logs]);
  };

  // --- Handlers ---
  const handleApprove = (id: string) => {
    if (initialCapacity.used >= initialCapacity.total) return alert("❌ 配額已滿！");
    startTransition(async () => {
      addLog("核定開通宮廟", `案號: ${id}`);
      alert("✅ 帳戶已成功開通");
      window.location.reload();
    });
  };

  const handleReject = () => {
    if (!rejectReason) return alert("請輸入理由");
    startTransition(async () => {
      addLog("駁回申請", `原因: ${rejectReason}`);
      setIsRejectModalOpen(false);
      window.location.reload();
    });
  };

  const handleAddSales = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const { createDistributorSales } = await import('@/app/actions');
      const res = await createDistributorSales(distId, newSalesForm);
      if (res.success) {
        addLog("新增業務", `${newSalesForm.name} (${newSalesForm.phone})`);
        setIsAddSalesModalOpen(false);
        window.location.reload();
      } else {
        alert("新增失敗");
      }
    });
  };

  const handleSaveBankInfo = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const success = await updateDistributorBankInfo(distId, editBankForm);
      if (success) {
        addLog("更新銀行帳戶資訊", `解付銀行: ${editBankForm.bankName}`);
        setIsEditBankModalOpen(false);
        alert('銀行帳戶資訊已更新！');
        window.location.reload();
      } else {
        alert('更新失敗，請稍後再試。');
      }
    });
  };

  const handleReconcileBonus = (id: string) => {
    const request = bonusRequests.find(r => r.id === id);
    if (!request) return;
    setBonusRequests(prev => prev.map(r => r.id === id ? { ...r, status: "Verified" } : r));
    addLog("獎金撥款核銷", `單號: ${id} (${request.sales})`);
    alert(`✅ 已完成單號 ${id} 的撥款核銷`);
  };

  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

  // --- Grouping Logic ---
  const groupedPayments = useMemo(() => {
    const groups: Record<string, typeof paymentRecords> = {};
    paymentRecords.forEach(p => {
      if (!groups[p.region]) groups[p.region] = [];
      groups[p.region].push(p);
    });
    return groups;
  }, [paymentRecords]);

  // --- RENDERING COMPONENTS ---

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
       <section className="relative overflow-hidden bg-white/60 backdrop-blur-3xl border border-white/60 rounded-[45px] p-8 shadow-[0_25px_60px_rgba(59,130,246,0.1)] group hover:shadow-blue-200/50 transition-all duration-700">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/15 rounded-full blur-[90px] -mr-20 -mt-20 group-hover:bg-blue-500/25 transition-all"></div>
          <div className="relative z-10 space-y-6">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 bg-blue-50/80 px-4 py-1.5 rounded-full backdrop-blur-md">Network Status</span>
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-bold text-slate-400">HQ Live</span>
                </div>
             </div>
             <div className="flex flex-col items-center py-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] mb-4">系統配額使用進度</p>
                <div className="relative w-48 h-48 flex items-center justify-center">
                   <svg className="w-full h-full rotate-[-90deg]">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 88} 
                        strokeDashoffset={2 * Math.PI * 88 * (1 - initialCapacity.used / initialCapacity.total)}
                        className="text-blue-600 transition-all duration-1000 ease-out" 
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter italic group-hover:scale-110 transition-transform duration-500">{initialCapacity.used}</span>
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-1">/ {initialCapacity.total} Nodes</span>
                   </div>
                </div>
             </div>
          </div>
       </section>

       <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-xl p-7 rounded-[35px] border border-white shadow-xl flex flex-col justify-between h-44 group hover:border-blue-500 hover:bg-white/80 transition-all duration-500">
             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">👥</div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">轄下業務菁英</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{teamPerformance.length} <span className="text-[10px] opacity-20 italic">Elite</span></h3>
             </div>
          </div>
          <div onClick={() => setActiveTab('approvals')} className="bg-slate-950 p-7 rounded-[35px] shadow-2xl flex flex-col justify-between h-44 cursor-pointer active:scale-95 hover:shadow-blue-500/20 transition-all duration-500">
             <div className="w-10 h-10 bg-white/10 text-blue-400 rounded-xl flex items-center justify-center text-xl animate-pulse">⚡</div>
             <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">待處理審核</p>
                <h3 className="text-3xl font-black text-white mt-1">{initialApps.filter((a:any)=>a.status === 'Pending').length}</h3>
             </div>
          </div>
       </div>

       <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-sm space-y-6 hover:shadow-lg transition-all">
          <div className="flex justify-between items-center">
             <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">市場成長趨勢 Growth</h3>
             <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">+8.2% <span className="text-slate-300">W/W</span></span>
          </div>
          <div className="h-16 flex items-end gap-1.5 px-2">
             {[30, 45, 40, 65, 80, 55, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-50 rounded-lg relative overflow-hidden group/bar">
                   <div className="absolute bottom-0 inset-x-0 bg-blue-600/30 rounded-lg transition-all duration-1000 group-hover/bar:bg-blue-600" style={{ height: `${h}%` }}></div>
                </div>
             ))}
          </div>
       </section>

       <button onClick={() => setIsDirectCreateModalOpen(true)} className="w-full py-7 bg-blue-600 text-white rounded-[35px] font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl shadow-blue-200 hover:bg-slate-900 hover:shadow-slate-300 transition-all active:scale-95">
          🚀 快速部署新宮廟節點
       </button>
    </div>
  );

  const renderTools = () => (
    <div className="space-y-8 animate-in slide-in-from-right-10 duration-700 pb-20">
       <section className="px-2 space-y-1 border-l-4 border-blue-600 pl-5">
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">官方工具中心</h3>
          <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em]">Official Super Admin Assets</p>
       </section>

       {/* Video Gallery */}
       <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">影音介紹與培訓資源</h4>
             <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Live Sync</span>
             </div>
          </div>
          <div className="grid grid-cols-1 gap-8">
             {officialTools.filter(t => ['video', 'photo'].includes(t.type)).map(tool => (
                <div key={tool.id} onClick={() => setActiveToolPreview(tool)} className="group relative bg-white rounded-[45px] shadow-2xl border border-white overflow-hidden aspect-[16/10] hover:shadow-blue-200 transition-all duration-700 cursor-pointer">
                   <img src={tool.thumbnail || tool.url || 'https://images.unsplash.com/photo-1528642463367-12544dd1479d?q=80&w=800&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-10 flex flex-col justify-end">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-3 tracking-[0.3em] bg-blue-500/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">{tool.category}</p>
                      <h5 className="text-2xl font-black text-white leading-tight italic tracking-tighter">{tool.title}</h5>
                      <div className="mt-8 flex items-center gap-4">
                         <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shadow-2xl shadow-blue-500/40 group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-500">▶️</div>
                         <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">點擊檢閱資源</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </section>

       {/* Document & Assets Section */}
       <section className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">業務開發與法律文件 (官方規範)</h4>

          <div className="grid grid-cols-2 gap-4">
             {officialTools.filter(t => ['document', 'contract'].includes(t.type)).map(doc => (
                <div key={doc.id} onClick={() => setActiveToolPreview(doc)} className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-xl flex flex-col items-center text-center space-y-4 hover:border-blue-500 transition-all duration-500 group cursor-pointer">
                   <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">{doc.type === 'contract' ? '📑' : '📄'}</div>
                   <div>
                      <h6 className="text-xs font-black text-slate-900 tracking-tight">{doc.title}</h6>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{doc.category}</p>
                   </div>
                </div>
             ))}
          </div>
       </section>

       
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFDFF] font-sans text-slate-900 pb-40 relative">
       <AuroraBackground />
       
       <header className="max-w-md mx-auto px-7 pt-16 flex justify-between items-end mb-10 relative z-10">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.8)]"></div>
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-600">Central HQ V8.0</p>
             </div>
             <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic leading-none drop-shadow-sm">
                {activeTab === 'overview' && '控制台 Dash'}
                {activeTab === 'temples' && '宮廟管理 Temples'}
                {activeTab === 'team' && '業務團隊 Team'}
                {activeTab === 'approvals' && '申請核定 Appr'}
                {activeTab === 'calendar' && '拜訪監控 Log'}
                {activeTab === 'financials' && '業績監控 Perf'}
                {activeTab === 'tools' && '官方工具 Tools'}
                {activeTab === 'profile' && '資料中心 Profile'}
                {activeTab === 'logs' && '系統日誌 Sys'}
                 {activeTab === 'b2b_payment' && 'B2B收款 B2B'}
             </h1>
          </div>
          <div onClick={() => setActiveTab('logs')} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xl transition-all duration-500 hover:rotate-12 ${activeTab === 'logs' ? 'bg-blue-600 text-white scale-110' : 'bg-white/80 backdrop-blur-md border border-white text-slate-300'}`}>🛰️</div>
       </header>

       <main className="max-w-md mx-auto px-6 relative z-10">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tools' && renderTools()}

          {/* TAB: Temples */}
          {activeTab === 'temples' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
               {initialApps.length === 0 && (
                 <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[45px] shadow-xl border border-white text-center py-20">
                    <p className="text-slate-400 font-bold">目前旗下尚未綁定任何宮廟</p>
                 </div>
               )}
               {initialApps.map((temple: any) => (
                 <div key={temple.id} className="bg-white/60 backdrop-blur-xl p-8 rounded-[45px] shadow-xl border border-white space-y-6 group hover:bg-white transition-all duration-500">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-5 items-center">
                          <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center text-2xl font-black italic shadow-2xl group-hover:bg-blue-600 transition-all duration-500">{(temple.templeName || '宮').substring(0,1)}</div>
                          <div>
                            <h4 className="text-xl font-black text-slate-900 tracking-tighter">{temple.templeName || '未命名宮廟'}</h4>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: {temple.id}</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                         <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">{temple.status || 'Active'}</span>
                       </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                       <div className="text-[10px] text-slate-400 font-bold">系統版本: {temple.version || 'v10'}</div>
                       <button onClick={() => {
                           import('@/app/actions').then(async m => { 
                             const res = await m.impersonateTemple(temple.id as string, 'Distributor'); 
                             if(res.success && res.redirectPath) window.location.href = res.redirectPath; 
                           })
                       }} className="px-6 py-2 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">進入後台 🔑</button>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* TAB: Team */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
               <button onClick={() => setIsAddSalesModalOpen(true)} className="w-full py-6 bg-slate-900 text-blue-400 rounded-[30px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 hover:text-white transition-all">+ 新增正式業務人員</button>
               {teamPerformance.map((m: any) => (
                 <div key={m.id} className="bg-white/60 backdrop-blur-xl p-8 rounded-[45px] shadow-xl border border-white space-y-6 group hover:bg-white transition-all duration-500">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-5 items-center">
                          <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center text-2xl font-black italic shadow-2xl group-hover:bg-blue-600 transition-all duration-500">{m.name.substring(0,1)}</div>
                          <div><h4 className="text-xl font-black text-slate-900 tracking-tighter">{m.name}</h4><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">ID: {m.account}</p></div>
                       </div>
                       <button onClick={() => {
                          setSelectedSales(m); 
                          setEditingRates({
                            setupRate: m.commissionRules?.setupFeePercent || 20,
                            rentYear1Rate: m.commissionRules?.rentYear1Percent || 15,
                            rentYear2Rate: m.commissionRules?.rentYear2Percent || 10,
                            rentYear3PlusRate: m.commissionRules?.rentYear3PlusPercent || 5
                          });
                          setIsEditRateModalOpen(true);
                       }} className="text-[8px] font-black text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">調整分潤</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2">
                       <div className="p-3 bg-blue-50/80 rounded-2xl text-center border border-blue-100/30 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                          <p className="text-[6px] font-black opacity-50 uppercase mb-1 leading-none">開辦分潤</p>
                          <p className="text-xs font-black">{m.commissionRules?.setupFeePercent || 20}%</p>
                       </div>
                       <div className="p-3 bg-slate-50/80 rounded-2xl text-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                          <p className="text-[6px] font-black opacity-50 uppercase mb-1 leading-none">第一年月租</p>
                          <p className="text-xs font-black">{m.commissionRules?.rentYear1Percent || 15}%</p>
                       </div>
                       <div className="p-3 bg-slate-50/80 rounded-2xl text-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 opacity-80">
                          <p className="text-[6px] font-black opacity-50 uppercase mb-1 leading-none">第二年月租</p>
                          <p className="text-xs font-black">{m.commissionRules?.rentYear2Percent || 10}%</p>
                       </div>
                       <div className="p-3 bg-slate-50/80 rounded-2xl text-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 opacity-60">
                          <p className="text-[6px] font-black opacity-50 uppercase mb-1 leading-none">第三年後</p>
                          <p className="text-xs font-black">{m.commissionRules?.rentYear3PlusPercent || 5}%</p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}

          {/* TAB: Approvals */}
          {activeTab === 'approvals' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
               {initialApps.filter((a:any)=>a.status === 'Pending').map((app: any) => (
                 <div key={app.id} className="bg-white/70 backdrop-blur-xl p-10 rounded-[50px] shadow-2xl border border-white space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl"></div>
                    <div className="flex items-center gap-6 relative z-10">
                       <div className="w-16 h-16 rounded-[28px] bg-slate-900 text-white flex items-center justify-center text-3xl shadow-xl italic group hover:scale-110 transition-transform">🏛️</div>
                       <div><h4 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{app.templeName}</h4><p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-3">業務員：{app.submittedBy}</p></div>
                    </div>
                    <div className="p-8 bg-blue-50/50 rounded-[40px] space-y-5 border border-blue-100/30 shadow-inner">
                       <div className="flex justify-between text-[11px] font-black"><span className="text-slate-400 uppercase tracking-widest">合約開辦費</span><span className="text-slate-900 font-black">${app.setupFee?.toLocaleString() || '12,000'}</span></div>
                       <div className="flex justify-between text-[11px] font-black"><span className="text-slate-400 uppercase tracking-widest">方案月租</span><span className="text-blue-600 underline decoration-2 font-black">${app.monthlyRent?.toLocaleString() || '3,600'}</span></div>
                    </div>
                    <div className="flex gap-3 pt-2">
                       <button onClick={() => {setSelectedAppId(app.id); setIsRejectModalOpen(true);}} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[28px] font-black text-[10px] uppercase tracking-widest transition-all hover:bg-rose-50 hover:text-rose-600">駁回申請</button>
                       <button onClick={() => handleApprove(app.id)} className="flex-[1.5] py-5 bg-blue-600 text-white rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95">核定並開通節點 🚀</button>
                    </div>
                 </div>
               ))}
               {initialApps.filter((a:any)=>a.status === 'Pending').length === 0 && <div className="text-center py-24 text-slate-300 font-black uppercase tracking-[0.5em] italic">No pending requests</div>}
            </div>
          )}

          {/* TAB: Calendar */}
          {activeTab === 'calendar' && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-700 pb-20">
               <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[50px] shadow-2xl border border-white">
                  <div className="flex justify-between items-center mb-10 px-4">
                     <button onClick={() => setCurrentMonth(m => m === 1 ? 12 : m - 1)} className="text-slate-300 text-2xl font-black hover:text-blue-600 transition-colors">〈</button>
                     <h3 className="text-lg font-black text-slate-900 tracking-tighter italic underline decoration-blue-500 decoration-4 underline-offset-8">{currentYear}年 {currentMonth}月 監控</h3>
                     <button onClick={() => setCurrentMonth(m => m === 12 ? 1 : m + 1)} className="text-slate-300 text-2xl font-black hover:text-blue-600 transition-colors">〉</button>
                  </div>
                  <div className="grid grid-cols-7 gap-3">
                     {Array.from({length: daysInMonth(currentYear, currentMonth)}).map((_, i) => {
                        const day = i + 1;
                        const hasVisits = mockVisits.some(v => v.day === day);
                        const isSelected = selectedDay === day;
                        return (
                          <div key={i} onClick={() => setSelectedDay(day)} className={`h-14 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${isSelected ? 'bg-slate-950 text-white shadow-2xl scale-110 z-10 ring-4 ring-blue-500/20' : 'bg-white/50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 hover:scale-105'}`}>
                             <span className="text-[10px] font-black">{day}</span>
                             {hasVisits && !isSelected && <div className="mt-1 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>}
                             {hasVisits && isSelected && <div className="mt-1 w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>}
                          </div>
                        );
                     })}
                  </div>
               </section>
               <section className="space-y-4">
                  <div className="flex justify-between items-center px-4">
                     <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">本日拜訪計畫 Schedule ({selectedDay}日)</h3>
                  </div>
                  <div className="space-y-3">
                     {mockVisits.filter(v => v.day === selectedDay).map(visit => (
                        <div key={visit.id} className="bg-white/60 backdrop-blur-xl p-6 rounded-[35px] border border-white shadow-xl flex items-center justify-between group hover:border-blue-500 hover:bg-white transition-all duration-500">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-2xl group-hover:bg-blue-600 transition-all">{visit.sales.substring(0,1)}</div>
                              <div>
                                 <h4 className="text-sm font-black text-slate-900 tracking-tight">{visit.sales} 〈{visit.temple}〉</h4>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{visit.purpose}</p>
                              </div>
                           </div>
                           <div className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter shadow-sm ${visit.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'}`}>{visit.status === 'Completed' ? '已完成' : '進行中'}</div>
                        </div>
                     ))}
                  </div>
               </section>
            </div>
          )}

          {/* TAB: Financials */}
          {activeTab === 'financials' && (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-700 pb-20">
               <section className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white p-10 rounded-[55px] shadow-[0_20px_50px_rgba(37,99,235,0.3)] relative overflow-hidden group border border-white/20">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-125 transition-all duration-1000"></div>
                  <div className="relative z-10 space-y-8">
                     <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.5em]">2026 年度業績總覽</p>
                     <div className="grid grid-cols-2 gap-8 divide-x divide-white/20">
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest opacity-70">宮廟繳費總額</p>
                           <h2 className="text-4xl font-black tracking-tighter italic text-white drop-shadow-md">${paymentRecords.reduce((sum, p) => sum + p.history.filter((h: any)=>h.status==='Paid').reduce((s: number, h: any)=>s+h.amount, 0), 0).toLocaleString()}</h2>
                        </div>
                        <div className="pl-8 space-y-2">
                           <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest opacity-70">預計支出佣金</p>
                           <h2 className="text-4xl font-black tracking-tighter italic text-white drop-shadow-md">${bonusRequests.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</h2>
                        </div>
                     </div>
                  </div>
               </section>
               <div className="flex bg-white/60 backdrop-blur-md p-1.5 rounded-[30px] border border-white shadow-xl">
                  {[{ id: 'payments', label: '宮廟金流', icon: '🏛️' }, { id: 'performance', label: '業務績效', icon: '👥' }, { id: 'bonuses', label: '獎金核銷', icon: '💰' }].map(tab => (
                    <button key={tab.id} onClick={() => setFinancialTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[22px] transition-all duration-500 ${financialTab === tab.id ? 'bg-slate-950 text-white shadow-2xl scale-[1.02]' : 'text-slate-400 hover:bg-slate-100/50'}`}>
                       <span className="text-lg">{tab.icon}</span><span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                    </button>
                  ))}
               </div>
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {financialTab === 'payments' && (
                    <div className="space-y-10">
                       {Object.entries(groupedPayments).map(([region, records]) => (
                          <div key={region} className="space-y-4">
                             <div className="flex items-center gap-3 px-4"><div className="w-1.5 h-4 bg-blue-600 rounded-full"></div><h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">{region}地區宮廟 ({records.length})</h3></div>
                             <div className="space-y-4">
                                {records.map(p => (
                                   <div key={p.id} onClick={() => setExpandedTempleId(expandedTempleId === p.id ? null : p.id)} className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white shadow-xl overflow-hidden transition-all duration-500 cursor-pointer group">
                                      <div className={`flex items-center justify-between p-6 group-hover:bg-white transition-all`}><div className="flex items-center gap-5"><div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-xl italic transition-all group-hover:bg-blue-600 group-hover:scale-110">🏛️</div><div><h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.temple}</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">最後繳費：{p.date}</p></div></div><div className="text-right flex items-center gap-4"><div><p className="text-lg font-black text-slate-900">${p.amount.toLocaleString()}</p><span className={`text-[7px] font-black px-3 py-1 rounded-full uppercase ${p.status === 'Paid' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>{p.status === 'Paid' ? '已入帳' : '催收中'}</span></div><span className={`text-slate-300 transition-transform duration-500 ${expandedTempleId === p.id ? 'rotate-180 text-blue-600' : ''}`}>▼</span></div></div>
                                      {expandedTempleId === p.id && (
                                         <div className="bg-slate-50/80 p-8 border-t border-white/50 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">歷史付款紀錄 History Records</p>
                                            <div className="space-y-2">{p.history.map((h: any, i: number) => (
                                                  <div key={i} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
                                                     <div className="flex gap-4 items-center"><span className="text-[10px] font-black text-slate-900">{h.month}月度</span><span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">{h.type}</span></div>
                                                     <div className="flex items-center gap-3"><span className="text-xs font-black text-slate-900">${h.amount.toLocaleString()}</span><div className={`w-1.5 h-1.5 rounded-full ${h.status === 'Paid' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div></div>
                                                  </div>
                                               ))}</div>
                                         </div>
                                      )}
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                    </div>
                  )}
                  {financialTab === 'performance' && (
                    <div className="space-y-4">
                       {teamPerformance.map((s: any, idx: number) => (
                          <div key={s.id} className="bg-white/60 backdrop-blur-xl p-7 rounded-[40px] border border-white shadow-xl space-y-6 group hover:bg-white transition-all duration-500">
                             <div className="flex justify-between items-center"><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black italic shadow-xl group-hover:bg-blue-600 transition-all">0{idx+1}</div><div><h4 className="text-sm font-black text-slate-900">{s.name}</h4><p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">ID: {s.account}</p></div></div><div className="text-right"><p className="text-xl font-black text-slate-900 italic tracking-tighter">${s.totalSales.toLocaleString()}</p></div></div>
                             <div className="space-y-2"><div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-300"><span>績效達成率 Target Reach</span><span className="text-blue-600">82%</span></div><div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 rounded-full group-hover:animate-pulse" style={{ width: '82%' }}></div></div></div>
                          </div>
                       ))}
                    </div>
                  )}
                  {financialTab === 'bonuses' && (
                    <div className="space-y-4">
                       {bonusRequests.map(b => (
                          <div key={b.id} className="bg-white/60 backdrop-blur-xl p-8 rounded-[45px] border border-white shadow-2xl flex justify-between items-center group hover:bg-white transition-all duration-500 relative overflow-hidden">
                             <div className="space-y-2 relative z-10"><div className="flex items-center gap-2"><p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">{b.id}</p><span className="text-[8px] font-bold text-slate-300 uppercase italic">{b.date} 提報</span></div><h4 className="text-md font-black text-slate-900">{b.sales}</h4><p className="text-xl font-black text-slate-900 italic">${b.amount.toLocaleString()}</p></div>
                             <div className="relative z-10">{b.status === 'Verified' ? (<div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-full shadow-inner"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">已完成核銷紀錄</span></div>) : (<button onClick={() => handleReconcileBonus(b.id)} className="text-[9px] font-black text-white bg-slate-950 px-7 py-3.5 rounded-full uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 hover:-translate-y-1 transition-all active:translate-y-0">點選核銷 📝</button>)}</div>
                          </div>
                       ))}
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* TAB: Profile (Data Center) */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 pb-24">
               <section className="bg-white/60 backdrop-blur-xl p-12 rounded-[60px] shadow-2xl border border-white text-center relative overflow-hidden group">
                  <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-blue-50/50 to-transparent group-hover:from-blue-100/50 transition-all"></div>
                  
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="w-32 h-32 bg-slate-950 rounded-[45px] mx-auto flex items-center justify-center text-6xl shadow-2xl relative group-hover:rotate-3 group-hover:scale-105 transition-all duration-700 border-4 border-white/50">🏢</div>
                     
                     <div className="mt-8 space-y-2">
                        <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{initialProfile?.name}</h3>
                        <div className="flex items-center gap-2 justify-center">
                           <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100/50 backdrop-blur-md inline-block">Authorized Distributor</p>
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-12 text-left relative z-10">
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">經銷商編碼 ID</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.code || 'HQ-DIST-001'}</p>
                     </div>
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">加入時間</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.joinedAt || '2024-01-10'}</p>
                     </div>
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">官方通訊信箱</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.email || 'service@dist-north.tw'}</p>
                     </div>
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">營運總部地址</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.address || '台北市內湖區瑞光路 500 號 12 樓'}</p>
                     </div>
                  </div>
               </section>

               {/* 銀行帳戶資訊 - 改為淺色玻璃風格 */}
               <section className="bg-white/60 backdrop-blur-xl p-10 rounded-[60px] shadow-2xl space-y-8 relative overflow-hidden group border border-white">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
                  
                  <div className="flex justify-between items-center relative z-10 px-2">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">銀行撥款帳戶資訊</h4>
                     </div>
                     <button onClick={() => setIsEditBankModalOpen(true)} className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest px-3 py-1 bg-blue-50 hover:bg-blue-100 rounded-full transition-all">編輯</button>
                  </div>

                  <div className="space-y-5 relative z-10">
                     <div className="bg-white/40 p-6 rounded-[35px] border border-white/60 space-y-4">
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">解付銀行</p>
                           <p className="text-sm font-black text-slate-900">{initialProfile?.bankInfo?.bankName || '國泰世華銀行 (013)'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/40">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">帳戶名稱</p>
                           <p className="text-sm font-black text-slate-900">{initialProfile?.bankInfo?.accountName || '北區雲端宮廟代理有限公司'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/40">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">銀行帳號</p>
                           <p className="text-lg font-black text-blue-600 tracking-wider">
                              **** **** {initialProfile?.bankInfo?.accountNumber?.slice(-4) || '8901'}
                           </p>
                        </div>
                     </div>
                  </div>
               </section>

               {/* 方案內容專區 - 改為淺色玻璃風格 */}
               <section className="bg-white/60 backdrop-blur-xl p-10 rounded-[60px] shadow-2xl space-y-8 relative overflow-hidden group border border-white">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05),transparent)] pointer-events-none"></div>
                  
                  <div className="flex justify-between items-center relative z-10 px-2">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">當前經銷方案詳情</h4>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 tracking-widest italic">{initialCapacity.plan}</span>
                     </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                     <div className="bg-slate-50/50 p-7 rounded-[40px] border border-slate-100 flex justify-around items-center">
                        <div className="text-center space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">合約週期</p>
                           <p className="text-xl font-black text-slate-900 italic">2 YEARS</p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="text-center space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">管理帳戶上限</p>
                           <p className="text-xl font-black text-slate-900 italic">100 NODES</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-3">
                        {(initialCapacity.planDetails || []).map((detail: string, idx: number) => (
                           <div key={idx} className="flex items-center gap-4 bg-white/40 p-4 rounded-3xl border border-white/60 group/detail hover:bg-white transition-all">
                              <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-[10px] font-black group-hover/detail:bg-blue-600 group-hover/detail:text-white transition-all italic">0{idx+1}</div>
                              <p className="text-xs font-bold text-slate-600">{detail}</p>
                           </div>
                        ))}
                     </div>
                     <div className="pt-6 border-t border-slate-100 flex justify-between items-center px-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">下一次約期續約日</p>
                        <p className="text-xs font-black text-blue-600 italic tracking-tighter">{initialCapacity.nextRenewal || '2027-01-10'}</p>
                     </div>
                  </div>
               </section>

               <section className="grid grid-cols-2 gap-4">
                  <div onClick={()=>setIsTempleListModalOpen(true)} className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-xl space-y-4 hover:bg-blue-600 group transition-all cursor-pointer active:scale-95">
                     <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white/20 group-hover:scale-110 transition-all">🛰️</div>
                     <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60 leading-none mb-1">區域營運規模</p>
                        <p className="text-xl font-black text-slate-900 group-hover:text-white">{initialCapacity.used} Nodes</p>
                     </div>
                  </div>
                  <button className="bg-rose-50 p-8 rounded-[40px] border border-rose-100 shadow-xl space-y-4 hover:bg-rose-600 group transition-all active:scale-95">
                     <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white/20 group-hover:scale-110 transition-all">⏻</div>
                     <div className="text-left">
                        <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest group-hover:text-white/60 leading-none mb-1">系統安全性</p>
                        <p className="text-xl font-black text-rose-600 group-hover:text-white">登出系統</p>
                     </div>
                  </button>
               </section>
            </div>
          )}

          {/* TAB: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
               <div className="bg-slate-950/90 backdrop-blur-xl rounded-[48px] p-10 space-y-8 shadow-2xl relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]"></div>
                  {logs.map(log => (
                     <div key={log.id} className="relative pl-8 border-l-2 border-blue-500/20 py-2 group/log">
                        <div className="absolute -left-[9px] top-2.5 w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] group-hover/log:scale-125 transition-transform"></div>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5">{log.time}</p>
                        <h4 className="text-sm font-black text-white tracking-tight">{log.action}：<span className="text-slate-400 group-hover/log:text-blue-400 transition-colors">{log.target}</span></h4>
                     </div>
                  ))}
               </div>
            </div>
          )}
       </main>

       {/* --- BOTTOM NAV --- */}
       <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/70 backdrop-blur-3xl rounded-[45px] px-3 py-4 flex justify-between items-center shadow-[0_25px_60px_rgba(0,0,0,0.15)] z-[100] border border-white/50">
          {[
            {id: 'overview', icon: '💎', label: '首頁'},
            {id: 'temples', icon: '🏛️', label: '宮廟'},
            {id: 'team', icon: '👥', label: '團隊'},
            {id: 'approvals', icon: '⚡', label: '核定'},
            {id: 'calendar', icon: '📅', label: '監控'},
            {id: 'financials', icon: '💰', label: '業績監控'},
            {id: 'tools', icon: '🛠️', label: '工具'},
            {id: 'profile', icon: '⚙️', label: '資料'}
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex flex-col items-center gap-1.5 transition-all duration-500 w-[12%] ${activeTab === t.id ? 'text-blue-600 scale-110' : 'text-slate-300'}`}>
               <span className={`text-2xl transition-all duration-500 ${activeTab === t.id ? 'drop-shadow-[0_0_12px_rgba(37,99,235,0.4)]' : ''}`}>{t.icon}</span>
               <span className={`text-[7px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden text-center leading-none'}`}>{t.label}</span>
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
                      className="px-8 py-4 bg-blue-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-blue-700 transition-all mt-4" 
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



       {/* --- MODALS --- */}
       {isAddSalesModalOpen && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-end animate-in fade-in duration-300">
            <form onSubmit={handleAddSales} className="bg-white w-full rounded-t-[60px] p-12 pb-20 shadow-2xl space-y-8 animate-in slide-in-from-bottom-20 duration-500 max-w-xl mx-auto max-h-[90vh] overflow-y-auto no-scrollbar relative">
               <div className="sticky top-0 bg-white/80 backdrop-blur-md pt-2 pb-6 z-10 flex justify-between items-center border-b border-slate-50 mb-4">
                  <div className="space-y-1">
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">新增業務菁英</h3>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Authorized Sales Personnel</p>
                  </div>
                  <button type="button" onClick={() => setIsAddSalesModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">✕</button>
               </div>
               
               <div className="space-y-10">
                  {/* Basic Info Cards */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">基本資料辨識 Basic Identity</h4>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">正式姓名 Full Name</p>
                           <input type="text" placeholder="輸入業務姓名" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none border-2 border-transparent focus:border-blue-200 transition-all" value={newSalesForm.name} onChange={e=>setNewSalesForm({...newSalesForm, name:e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">聯繫電話 Phone</p>
                           <input type="tel" placeholder="輸入電話號碼" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none border-2 border-transparent focus:border-blue-200 transition-all" value={newSalesForm.phone} onChange={e=>setNewSalesForm({...newSalesForm, phone:e.target.value})} required />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">系統帳號 ID</p>
                           <input type="text" placeholder="自定義登入帳號" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none border-2 border-transparent focus:border-blue-200 transition-all" value={newSalesForm.account} onChange={e=>setNewSalesForm({...newSalesForm, account:e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">安全密碼 Password</p>
                           <input type="password" placeholder="輸入初始密碼" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none border-2 border-transparent focus:border-blue-200 transition-all" value={newSalesForm.password} onChange={e=>setNewSalesForm({...newSalesForm, password:e.target.value})} required />
                        </div>
                     </div>
                  </div>

                  {/* Commission Section */}
                  <div className="space-y-6">
                     <div className="flex items-center gap-3 px-2">
                        <div className="w-1.5 h-5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.6)]"></div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">分潤合約協議 Commission Rules</h4>
                     </div>
                     <div className="grid grid-cols-4 gap-3 px-2">
                        {[
                           { key: 'setupRate', label: '開辦費', sub: '分潤' },
                           { key: 'rentYear1Rate', label: '第一年', sub: '月租' },
                           { key: 'rentYear2Rate', label: '第二年', sub: '月租' },
                           { key: 'rentYear3PlusRate', label: '第三年後', sub: '月租' }
                        ].map(item => (
                           <div key={item.key} className="bg-slate-50 p-5 rounded-[30px] border border-slate-100 flex flex-col items-center justify-center space-y-4 hover:bg-slate-950 hover:text-white transition-all duration-500">
                              <p className="text-[9px] font-black opacity-50 uppercase text-center leading-tight">{item.label}<br/>{item.sub}</p>
                              <div className="relative">
                                 <input type="number" className="bg-transparent w-12 text-2xl font-black text-center outline-none" value={(newSalesForm as any)[item.key]} onChange={e=>setNewSalesForm({...newSalesForm, [item.key]:parseInt(e.target.value)})} />
                                 <span className="absolute -right-3 bottom-0.5 text-[10px] font-bold">%</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <button type="submit" className="w-full py-8 bg-slate-950 text-white rounded-[45px] font-black text-sm uppercase tracking-[0.4em] italic shadow-2xl hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95">
                     簽署並正式簽發權限 🚀
                  </button>
               </div>
            </form>
         </div>
       )}
       {isEditBankModalOpen && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-end animate-in fade-in duration-300">
            <form onSubmit={handleSaveBankInfo} className="bg-white w-full rounded-t-[60px] p-12 pb-20 shadow-2xl space-y-8 animate-in slide-in-from-bottom-20 duration-500 max-w-xl mx-auto relative">
               <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-4">
                  <div className="space-y-1">
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">編輯銀行帳戶資訊</h3>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Bank Account Information</p>
                  </div>
                  <button type="button" onClick={() => setIsEditBankModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">✕</button>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">解付銀行</label>
                     <input required type="text" value={editBankForm.bankName} onChange={e => setEditBankForm({...editBankForm, bankName: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="例：國泰世華銀行 (013)" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">帳戶名稱</label>
                     <input required type="text" value={editBankForm.accountName} onChange={e => setEditBankForm({...editBankForm, accountName: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">銀行帳號</label>
                     <input required type="text" value={editBankForm.accountNumber} onChange={e => setEditBankForm({...editBankForm, accountNumber: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
               </div>
               
               <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-sm shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all">儲存變更</button>
            </form>
         </div>
       )}
       {isEditRateModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-xl rounded-[60px] p-12 shadow-2xl text-center animate-in zoom-in-95 duration-500 space-y-10">
                <div className="space-y-2">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">調整分潤協議</h3>
                   <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{selectedSales?.name} • Elite Personnel</p>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                     { key: 'setupRate', label: '開辦費', sub: '分潤' },
                     { key: 'rentYear1Rate', label: '第一年', sub: '月租' },
                     { key: 'rentYear2Rate', label: '第二年', sub: '月租' },
                     { key: 'rentYear3PlusRate', label: '第三年後', sub: '月租' }
                  ].map(k => (
                    <div key={k.key} className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex flex-col items-center justify-center space-y-3 hover:bg-blue-600 hover:text-white transition-all">
                       <p className="text-[9px] font-black opacity-50 uppercase leading-tight">{k.label}<br/>{k.sub}</p>
                       <div className="relative">
                          <input type="number" className="bg-transparent w-full text-center font-black text-2xl outline-none" value={(editingRates as any)[k.key]} onChange={e=>setEditingRates({...editingRates, [k.key]:parseInt(e.target.value)})} />
                       </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setIsEditRateModalOpen(false)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-3xl font-black uppercase text-[10px] tracking-widest">取消變更</button>
                   <button onClick={() => {
                      addLog("分潤協議變更", selectedSales.name); 
                      setIsEditRateModalOpen(false); 
                      alert("✅ 協議已更新並即刻生效");
                   }} className="flex-[1.5] py-6 bg-slate-950 text-white rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] italic hover:bg-blue-600 shadow-2xl transition-all">確認簽署新協議</button>
                </div>
             </div>
          </div>
       )}
       {isRejectModalOpen && (
         <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
            <div className="bg-white w-full max-sm rounded-[55px] p-12 shadow-2xl space-y-8 text-center border border-white">
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">駁回開戶申請</h3>
               <textarea placeholder="敘明駁回理由..." className="w-full bg-slate-50 rounded-[35px] p-8 h-40 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-200 transition-all shadow-inner" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
               <div className="flex gap-3"><button onClick={()=>setIsRejectModalOpen(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-3xl font-black text-[10px] uppercase">返回</button><button onClick={handleReject} className="flex-1 py-5 bg-rose-500 text-white rounded-3xl font-black text-[10px] uppercase shadow-xl shadow-rose-100">確認駁回</button></div>
            </div>
         </div>
       )}
       {isDirectCreateModalOpen && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[400] flex items-end animate-in fade-in duration-300">
            <div className="bg-white w-full rounded-t-[75px] p-12 pb-24 shadow-2xl space-y-10 animate-in slide-in-from-bottom-40 duration-700 max-w-xl mx-auto max-h-[95vh] overflow-y-auto no-scrollbar relative">
               <div className="flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md pt-2 pb-6 z-10"><h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">部署新宮廟節點</h3><button onClick={() => setIsDirectCreateModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 text-xl font-bold hover:bg-rose-50 transition-all">✕</button></div>
               <TempleApplicationForm role="distributor" submittedBy={initialProfile.name} distributorId={initialProfile.id} onSuccess={() => window.location.reload()} onCancel={() => setIsDirectCreateModalOpen(false)} />
            </div>
         </div>
       )}
       {isTempleListModalOpen && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="bg-white w-full max-w-xl rounded-[60px] p-12 shadow-2xl animate-in zoom-in-95 duration-500 max-h-[85vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-8 px-4">
                   <div className="space-y-1"><h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">營運節點清單</h3><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Global Managed Nodes Registry</p></div>
                   <button onClick={() => setIsTempleListModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar px-2 space-y-4">
                   {managedTemples.map(temple => (
                      <div key={temple.id} className="bg-slate-50 p-6 rounded-[35px] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                         <div className="flex gap-4 items-center">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg transition-all ${temple.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>🏛️</div>
                            <div><h4 className="text-sm font-black text-slate-900">{temple.name}</h4><p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">負責業務：{temple.sales} • {temple.plan}</p></div>
                         </div>
                         <div className="text-right"><p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">開通日期</p><p className="text-[10px] font-black text-slate-900 tracking-tight">{temple.joinedAt}</p></div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
       )}
       {/* Official Contract Signing Modal (Ported from DistSales) */}
       {isContractModalOpen && (
         <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl z-[500] flex items-center justify-center p-6 animate-in zoom-in duration-500">
            <div className="bg-white w-full max-w-md rounded-[60px] p-12 space-y-12 shadow-2xl relative overflow-hidden border border-white">
               <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
               <div className="text-center space-y-4">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">官方數位合約</h2>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.3em]">HQ Admin Verified Protocol</p>
               </div>
               <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">受約對象宮廟名稱</p>
                  <input type="text" placeholder="輸入宮廟全銜" value={contractTemple} onChange={e => setContractTemple(e.target.value)} className="w-full py-6 rounded-[30px] bg-blue-50/50 border-2 border-blue-100 text-center text-xl font-black outline-none focus:border-blue-400 transition-all" />
               </div>
               <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex items-center justify-center text-slate-300 font-black italic shadow-inner">
                  在此區域進行法定電子簽署
               </div>
               <div className="grid grid-cols-2 gap-5">
                  <button onClick={() => setIsContractModalOpen(false)} className="py-6 rounded-[32px] font-black text-slate-400 bg-slate-50 uppercase text-[10px] tracking-widest">取消</button>
                  <button onClick={() => {
                     addLog("簽署官方合約", contractTemple);
                     setIsContractModalOpen(false);
                     alert("✅ 電子合約已完成簽署並加密存檔");
                  }} className="py-6 rounded-[32px] font-black text-white bg-slate-950 shadow-2xl uppercase text-[10px] tracking-[0.2em] italic hover:bg-blue-600">啟動契約</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
