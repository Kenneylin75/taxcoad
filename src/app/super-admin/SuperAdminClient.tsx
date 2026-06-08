"use client";

import React, { useState, useTransition, useEffect } from 'react';
import TempleApplicationForm from '../components/TempleApplicationForm';
import DistributorApplicationForm from '../components/DistributorApplicationForm';
import { 
  uploadTool, 
  approveTempleBySuperAdmin, 
  rejectTempleBySuperAdmin, 
  fetchSystemConfig, 
  updateSystemConfig,
  fetchPendingDistributors,
  approveDistributorBySuperAdmin,
  rejectDistributorBySuperAdmin,
  fetchAdminLogs,
  downloadAdminLogsCsv,
  fetchFinanceData,
  fetchSyncQueue,
  createSuperSalesAccount,
  createDistributorAccount,
transferTempleOwnership,
transferDistributorOwnership,
  createTempleAccount,
  createAdminAccount,
  fetchAggregatedAnalytics,
  fetchStoragePlans, fetchAiPlans, saveAiPlan, deleteAiPlan, fetchAiApiModels, saveAiApiModels, fetchAllTempleAiUsage, grantTempleAiVip,
  updateStoragePlans,
  updateAccountPassword,
  fetchTempleStorages,
  fetchRoleWallets,
  logoutAccount
} from '../actions';

export default function SuperAdminClient({ 
  initialStats, initialAccounts, initialPlans, initialMedia, initialTemples
}: { 
  initialStats: any, initialAccounts: any[], initialPlans: any[], initialMedia: any[], initialTemples: any[]
}) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'approvals' | 'tools' | 'finance' | 'bridge' | 'logs' | 'settings' | 'space' | 'ai' | 'b2b_payment'>('dashboard');
  const [analytics, setAnalytics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [pendingDistributors, setPendingDistributors] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<any[]>(initialMedia);
  const [storagePlans, setStoragePlans] = useState<any[]>([]);
  const [aiPlans, setAiPlans] = useState<any[]>([]);
  const [aiModels, setAiModels] = useState<any[]>([]);
  const [b2bPayment, setB2bPayment] = useState<any>({
    enabledMethods: [],
    ecpay: { merchantId: '', hashKey: '', hashIV: '' },
    linePay: { channelId: '', channelSecret: '' },
    transfer: { bankCode: '', accountNumber: '', accountName: '' }
  });
  const [allTempleAiUsage, setAllTempleAiUsage] = useState<any[]>([]);
  const [templeStorages, setTempleStorages] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [searchTemple, setSearchTemple] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  
  const [isPending, startTransition] = useTransition();

  // --- UI States ---
   const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{id: string, type: 'Temple' | 'Distributor' | null}>({id: '', type: null});
  const [newSalesId, setNewSalesId] = useState('');
  const [newDistributorId, setNewDistributorId] = useState('');
   const [accountSubTab, setAccountSubTab] = useState<'Temple' | 'Distributor' | 'SuperSales'>('Temple');
   const [accountType, setAccountType] = useState<'SuperSales' | 'Distributor' | 'Temple' | 'Admin'>('SuperSales');
   const [isFree, setIsFree] = useState(false);
   const [freeType, setFreeType] = useState<'Normal' | 'Trial' | 'Permanent'>('Normal');
   const [uploadMode, setUploadMode] = useState<'video' | 'contract'>('video');
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [paymentCycle, setPaymentCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
   const [viewingAccountDetail, setViewingAccountDetail] = useState<any>(null);
   const [newPassword, setNewPassword] = useState('');
  
  // --- Data Fetching ---
  useEffect(() => {
    fetchAggregatedAnalytics().then(setAnalytics);
    fetchSystemConfig().then(setConfig);
    fetchAdminLogs().then(setLogs);
    fetchFinanceData().then(setFinance);
    fetchSyncQueue().then(setSyncQueue);
    fetchPendingDistributors().then(setPendingDistributors);
    fetchStoragePlans().then(setStoragePlans);
    fetchAiPlans().then(setAiPlans);
    fetchAiApiModels().then(setAiModels);
    fetchAllTempleAiUsage().then(setAllTempleAiUsage);
    fetchTempleStorages().then(setTempleStorages);
    fetchRoleWallets().then(setWallets);
  }, []);

  // --- Handlers ---
  
  const handleExecuteTransfer = async () => {
     if (!transferTarget.id || !transferTarget.type) return;
     startTransition(async () => {
        if (transferTarget.type === 'Temple') {
           await transferTempleOwnership(transferTarget.id, newDistributorId || null, newSalesId || null);
        } else if (transferTarget.type === 'Distributor') {
           await transferDistributorOwnership(transferTarget.id, newSalesId || null);
        }
        setIsTransferModalOpen(false);
        setTransferTarget({ id: '', type: null });
        setNewSalesId('');
        setNewDistributorId('');
        alert('轉移操作已完成，全球節點權限更新完畢！');
        window.location.reload();
     });
  };

  const handleCreateAccount = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    
    startTransition(async () => {
      if (accountType === 'SuperSales') await createSuperSalesAccount(data);
      else if (accountType === 'Distributor') await createDistributorAccount(data);
      else if (accountType === 'Temple') await createTempleAccount(data);
      else if (accountType === 'Admin') await createAdminAccount(data);
      
      setIsAccountModalOpen(false);
      alert(`${accountType} 帳戶已部署開設並同步全球網域指令 🌐`);
      window.location.reload();
    });
  };

  const handleUploadTool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
        type: uploadMode,
        title: fd.get('title') as string,
        category: fd.get('category') as string,
        thumbnail: uploadMode === 'video' ? 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000' : 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1000'
    };

    startTransition(async () => {
        await uploadTool(data);
        setMediaList([ {id: Date.now().toString(), ...data}, ...mediaList ]);
        setIsUploadModalOpen(false);
        alert("資材已即時同步至全球網域節點，所有業務端、經銷商、高級業務員介面均已更新 ⚡");
    });
  };

  const handleDownloadLogs = async () => {
    const csv = await downloadAdminLogsCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!config || !analytics) return <div className="h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="flex h-screen bg-[#F8F9FD] text-slate-600 font-sans overflow-hidden">
      
      {/* 1. SIDEBAR */}
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col h-full z-50">
        <div className="p-12 mb-4">
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-2xl">SC</div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">SystemCore</h1>
           </div>
           <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] ml-1">Elite Administration</p>
        </div>

        <nav className="flex-1 px-8 space-y-2 overflow-y-auto">
           {[
             { id: 'dashboard', label: '決策儀表板', icon: '📊' },
             { id: 'accounts', label: '帳戶管理', icon: '👤' },
             { id: 'approvals', label: '審核中心', icon: '⚖️', count: pendingDistributors.length },
             { id: 'space', label: '雲端空間管理', icon: '☁️' },
             { id: 'ai', label: 'AI 引擎與方案管理', icon: '🤖' },
             { id: 'tools', label: '資源同步', icon: '🔄' },
             { id: 'finance', label: '財務中心', icon: '💰' },
             { id: 'bridge', label: '數據橋接', icon: '🌐' },
             { id: 'logs', label: '系統日誌', icon: '📝' },
             { id: 'settings', label: '系統參數', icon: '⚙️' },
             { id: 'b2b_payment', label: 'B2B收款設定', icon: '💳' }

           ].map(item => (
             <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id as any)} 
                className={`w-full flex items-center gap-5 px-8 py-5 rounded-[25px] text-[14px] font-black transition-all relative ${activeTab === item.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
             >
               <span className="text-xl">{item.icon}</span>
               <span className="tracking-wide uppercase italic">{item.label}</span>
               {item.count && item.count > 0 && <span className="absolute right-6 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{item.count}</span>}
             </button>
           ))}
        </nav>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-y-auto bg-white relative">
        
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl px-16 py-10 flex justify-between items-center border-b border-slate-50">
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">
                 {activeTab === 'dashboard' && 'Strategic Hub'}
                 {activeTab === 'accounts' && 'Identity Matrix'}
                 {activeTab === 'approvals' && 'Approval Center'}
                 {activeTab === 'space' && 'SaaS Cloud Storage'}
                 {activeTab === 'tools' && 'Resource Synchronization'}
                 {activeTab === 'finance' && 'Financial Intelligence'}
                 {activeTab === 'bridge' && 'Data Core Bridge'}
                 {activeTab === 'logs' && 'System Audit Trail'}
                 {activeTab === 'settings' && 'Global Configurations'}
                  {activeTab === 'b2b_payment' && 'B2B Payment Gateway'}

              </h2>
           </div>
           
           <div className="flex items-center gap-6">
              
              {activeTab === 'tools' && (
                 <button onClick={()=>{setUploadMode('video'); setIsUploadModalOpen(true)}} className="px-10 py-4 bg-slate-900 text-white rounded-[25px] text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">
                    + 上傳同步資材 ⚡
                 </button>
              )}

              <button 
                onClick={async () => { await logoutAccount(); window.location.href = '/login'; }} 
                className="px-6 py-2.5 bg-rose-50 text-rose-600 border border-rose-200/50 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors shadow-sm"
              >
                 登出系統
              </button>
           </div>
        </header>

        <div className="p-16 space-y-20 max-w-[1600px] mx-auto pb-40">
           
           {/* --- 1. DASHBOARD --- */}
           {activeTab === 'dashboard' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {[
                      { label: '年度累計總營收', value: `$${(analytics?.overview?.monthlyRevenue * 12).toLocaleString()}`, change: '+12.5%', color: 'indigo' },
                      { label: '全球活動節點數', value: (analytics?.overview?.activeTemples || 0).toLocaleString(), change: '+42', color: 'emerald' },
                      { label: '授權經銷商數', value: (analytics?.overview?.totalDistributors || 0).toLocaleString(), change: '穩定', color: 'slate' },
                      { label: '系統運行健康度', value: `${analytics?.overview?.systemHealth}%`, change: 'Optimal', color: 'rose' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-10 rounded-[50px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                         <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-${stat.color}-500/10`}></div>
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 italic">{stat.label}</p>
                         <div className="flex items-end gap-4">
                            <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{stat.value}</h3>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>{stat.change}</span>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-10">
                       <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter px-4 underline decoration-4 decoration-indigo-500 underline-offset-8">市場擴張趨勢 Expansion Analysis</h4>
                       <div className="h-80 flex items-end gap-3 px-4">
                          {analytics?.growthTrend.map((h: any, i: number) => (
                            <div key={i} className="flex-1 group relative">
                               <div className="bg-slate-50 rounded-2xl w-full h-full absolute inset-0"></div>
                               <div className="bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl w-full relative z-10 transition-all duration-1000 shadow-lg shadow-indigo-100" style={{ height: `${(h.count/100)*100}%` }}></div>
                               <p className="text-center mt-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">{h.date.split('-')[1]}月</p>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="bg-slate-900 p-12 rounded-[60px] shadow-2xl text-white relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                       <div className="relative z-10 space-y-10">
                          <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2 italic">Regional Mix</p><h4 className="text-3xl font-black italic tracking-tighter">全球分佈比例</h4></div>
                          <div className="space-y-8">
                             {analytics?.regionalDistribution.map((item: any, i: number) => (
                               <div key={i} className="space-y-3">
                                  <div className="flex justify-between items-end px-2">
                                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{item.region}</span>
                                     <span className="text-lg font-black italic">{item.count}</span>
                                  </div>
                                  <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                                     <div className={`h-full bg-indigo-500 rounded-full`} style={{ width: `${(item.count/initialStats.temples)*100}%` }}></div>
                                  </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* --- 2. ACCOUNTS --- */}
           {activeTab === 'accounts' && (
              
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 
                 {/* 內部分頁導覽 */}
                 <div className="flex items-center gap-4 mb-8 bg-slate-50 p-2 rounded-[25px] border border-slate-100 shadow-sm w-fit">
                    <button 
                       onClick={() => setAccountSubTab('Temple')}
                       className={`px-8 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all ${accountSubTab === 'Temple' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                       🏰 宮廟營運
                    </button>
                    <button 
                       onClick={() => setAccountSubTab('Distributor')}
                       className={`px-8 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all ${accountSubTab === 'Distributor' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                       🏢 經銷代理
                    </button>
                    <button 
                       onClick={() => setAccountSubTab('SuperSales')}
                       className={`px-8 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all ${accountSubTab === 'SuperSales' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                       🚀 超級業務
                    </button>
                 </div>

                 
                 {accountSubTab === 'SuperSales' && (
<>
                 <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4"><div className="w-2 h-8 bg-indigo-500 rounded-full"></div><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">超級業務體系</h3></div>
  <button onClick={() => {setAccountType('SuperSales'); setIsAccountModalOpen(true)}} className="px-6 py-2 bg-indigo-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm mx-4">+ 開通超級業務</button>
                       <div className="relative"><input type="text" placeholder="快速搜尋業務..." className="w-64 bg-slate-50 border border-slate-100 rounded-full px-6 py-3 text-[11px] font-bold focus:outline-none focus:border-indigo-500 transition-all"/><span className="absolute right-4 top-3.5 text-slate-400">🔍</span></div>
                    </div>
                    <table className="w-full bg-white rounded-[40px] shadow-sm overflow-hidden text-left border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">職級 (Role)</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">業務名稱</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">登入帳號</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {initialAccounts.filter(a => a.role === 'SuperSales').map((acc: any) => (
                            <tr key={acc.id} className="hover:bg-slate-50/30 transition-all group">
                               <td className="px-12 py-8"><span className="px-5 py-2 rounded-full text-[10px] font-black uppercase italic bg-indigo-50 text-indigo-600">{acc.role}</span></td>
                               <td className="px-12 py-8 text-lg font-black text-slate-800 tracking-tight italic">{acc.name || acc.templeName || '宮廟管理員'}</td>
                               <td className="px-12 py-8 text-[13px] font-bold text-slate-400 uppercase">{acc.account || `USR-${acc.id}`}</td>
                               <td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[11px] font-black text-emerald-500 uppercase italic">Active</span></div></td>
                               <td className="px-12 py-8 text-right flex justify-end gap-4">
                                  <button onClick={() => {
                                     window.location.href = `/super-sales/${acc.id}`;
                                  }} className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm">進入後台 (Manage)</button>
                                  <button onClick={() => setViewingAccountDetail(acc)} className="text-[11px] font-black text-slate-300 uppercase hover:text-slate-900 transition-all border-b-2 border-transparent hover:border-slate-900 italic mt-2">VIEW DETAIL 🔑</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </section>
</>
)}

{accountSubTab === 'Distributor' && (
<>
                 <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4"><div className="w-2 h-8 bg-emerald-500 rounded-full"></div><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">經銷商代理體系</h3></div>
  <button onClick={() => {setAccountType('Distributor'); setIsAccountModalOpen(true)}} className="px-6 py-2 bg-emerald-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm mx-4">+ 開通經銷商</button>
                       <div className="relative"><input type="text" placeholder="快速搜尋經銷商..." className="w-64 bg-slate-50 border border-slate-100 rounded-full px-6 py-3 text-[11px] font-bold focus:outline-none focus:border-emerald-500 transition-all"/><span className="absolute right-4 top-3.5 text-slate-400">🔍</span></div>
                    </div>
                    <table className="w-full bg-white rounded-[40px] shadow-sm overflow-hidden text-left border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">職級 (Role)</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">經銷商名稱</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">登入帳號</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {initialAccounts.filter(a => a.role === 'Distributor').map((acc: any) => (
                            <tr key={acc.id} className="hover:bg-slate-50/30 transition-all group">
                               <td className="px-12 py-8"><span className="px-5 py-2 rounded-full text-[10px] font-black uppercase italic bg-emerald-50 text-emerald-600">{acc.role}</span></td>
                               <td className="px-12 py-8 text-lg font-black text-slate-800 tracking-tight italic">{acc.name || acc.templeName || '宮廟管理員'}</td>
                               <td className="px-12 py-8 text-[13px] font-bold text-slate-400 uppercase">{acc.account || `USR-${acc.id}`}</td>
                               <td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[11px] font-black text-emerald-500 uppercase italic">Active</span></div></td>
                               <td className="px-12 py-8 text-right flex justify-end gap-4">
                                  <button onClick={() => {
                                     window.location.href = `/${acc.id}`;
                                  }} className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm">進入後台 (Manage)</button>
                                  <button onClick={() => setViewingAccountDetail(acc)} className="text-[11px] font-black text-slate-300 uppercase hover:text-slate-900 transition-all border-b-2 border-transparent hover:border-slate-900 italic mt-2">VIEW DETAIL 🔑</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </section>
</>
)}

{accountSubTab === 'Temple' && (
<>
                 <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4"><div className="w-2 h-8 bg-amber-500 rounded-full"></div><h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">宮廟營運列表</h3></div>
  <button onClick={() => {setAccountType('Temple'); setIsAccountModalOpen(true)}} className="px-6 py-2 bg-amber-500 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-sm mx-4">+ 開通宮廟</button>
                       <div className="relative"><input type="text" placeholder="快速搜尋宮廟..." className="w-64 bg-slate-50 border border-slate-100 rounded-full px-6 py-3 text-[11px] font-bold focus:outline-none focus:border-amber-500 transition-all"/><span className="absolute right-4 top-3.5 text-slate-400">🔍</span></div>
                    </div>
                    <table className="w-full bg-white rounded-[40px] shadow-sm overflow-hidden text-left border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">編號</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">宮廟名稱</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">登入帳號</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">操作</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {initialAccounts.filter(a => a.role === 'Temple').map((acc: any, idx: number) => (
                            <tr key={acc.id} className="hover:bg-slate-50/30 transition-all group">
                               <td className="px-12 py-8 text-lg font-black text-slate-400 tracking-tight italic">No.{String(idx+1).padStart(4, '0')}</td>
                               <td className="px-12 py-8 text-lg font-black text-slate-800 tracking-tight italic">{acc.name || acc.templeName || '宮廟管理員'}</td>
                               <td className="px-12 py-8 text-[13px] font-bold text-slate-400 uppercase">{acc.account || `USR-${acc.id}`}</td>
                               <td className="px-12 py-8"><div className="flex items-center gap-3"><div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[11px] font-black text-emerald-500 uppercase italic">Active</span></div></td>
                               <td className="px-12 py-8 text-right flex justify-end gap-4">
                                  <button onClick={() => {
                                     import('@/app/actions').then(async m => { const res = await m.impersonateTemple((acc.templeId || acc.id) as string, 'SuperAdmin'); if(res.success && res.redirectPath) window.location.href = res.redirectPath; })
                                  }} className="px-6 py-2 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-sm">進入後台 (Manage)</button>
                                  <button onClick={() => setViewingAccountDetail(acc)} className="text-[11px] font-black text-slate-300 uppercase hover:text-slate-900 transition-all border-b-2 border-transparent hover:border-slate-900 italic mt-2">VIEW DETAIL 🔑</button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </section>
</>
)}
              </div>
           )}

           {/* --- 3. APPROVALS --- */}
           {activeTab === 'approvals' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-700">
                 <div className="grid grid-cols-1 gap-8">
                    {initialTemples.filter(t => t.status === 'Pending').map((app: any) => (
                       <div key={app.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                          <div className="flex items-center gap-10">
                             <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">🏮</div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                   <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{app.templeName}</h4>
                                   <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Pending Review</span>
                                 </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">申請身份：宮廟帳戶 | 提交：{app.submittedBy || '超級業務'} | 日期：{app.timestamp?.split('T')[0]}</p>
                             </div>
                          </div>
                          <div className="flex gap-6">
                             <button onClick={()=>approveTempleBySuperAdmin(app.id).then(()=>window.location.reload())} className="px-10 py-5 bg-slate-900 text-white rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">核准並部署</button>
                             <button onClick={()=>rejectTempleBySuperAdmin(app.id).then(()=>window.location.reload())} className="px-10 py-5 bg-slate-50 text-slate-400 rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] border border-slate-100 hover:text-rose-500 transition-all">退回申請</button>
                          </div>
                       </div>
                    ))}
                    {pendingDistributors.map((app: any) => (
                       <div key={app.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                          <div className="flex items-center gap-10">
                             <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">🤝</div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                   <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{app.name}</h4>
                                   <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Distributor Auth</span>
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">申請身份：授權經銷商 | 方案：{app.plan} | 提交：{app.submittedBy}</p>
                             </div>
                          </div>
                          <div className="flex gap-6">
                             <button onClick={()=>approveDistributorBySuperAdmin(app.id).then(()=>window.location.reload())} className="px-10 py-5 bg-emerald-600 text-white rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">核准授權</button>
                          </div>
                       </div>
                    ))}
                    {initialTemples.filter(t => t.status === 'Pending').length === 0 && pendingDistributors.length === 0 && (
                       <div className="py-40 text-center space-y-6">
                          <p className="text-6xl">✨</p>
                          <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] italic">目前沒有待處理事項 All Clear</p>
                       </div>
                    )}
                 </div>
              </div>
           )}

           {/* --- 9. CLOUD STORAGE MANAGEMENT --- */}
           {activeTab === 'space' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                 {/* Top pricing settings */}
                 <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-8">
                    <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-indigo-500 underline-offset-8">雲端儲存方案定價設定 (Storage Pricing Model)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {storagePlans.map((plan) => (
                          <div key={plan.id} className="p-8 bg-slate-50/50 rounded-[40px] border border-white shadow-inner space-y-6 hover:bg-white hover:shadow-xl transition-all duration-300">
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">{plan.id}</span>
                                <input 
                                   type="text" 
                                   defaultValue={plan.name} 
                                   onChange={(e) => {
                                      const updated = storagePlans.map(p => p.id === plan.id ? { ...p, name: e.target.value } : p);
                                      setStoragePlans(updated);
                                   }}
                                   className="bg-transparent text-sm font-black text-slate-800 text-right outline-none border-b border-transparent focus:border-slate-300"
                                />
                             </div>
                             <div className="flex items-center gap-4 justify-between">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">方案容量 (GB)</label>
                                   <input 
                                      type="number" 
                                      defaultValue={plan.sizeGb} 
                                      onChange={(e) => {
                                         const updated = storagePlans.map(p => p.id === plan.id ? { ...p, sizeGb: Number(e.target.value) || 0 } : p);
                                         setStoragePlans(updated);
                                      }}
                                      className="w-20 bg-transparent text-xl font-black text-slate-900 outline-none border-b border-transparent focus:border-slate-300"
                                   />
                                </div>
                                <div className="space-y-1 text-right">
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">月繳費用 (NT$)</label>
                                   <div className="flex items-center gap-1 justify-end">
                                      <span className="text-xs font-black text-slate-400">$</span>
                                      <input 
                                         type="number" 
                                         defaultValue={plan.priceMonthly} 
                                         onChange={(e) => {
                                            const updated = storagePlans.map(p => p.id === plan.id ? { ...p, priceMonthly: Number(e.target.value) || 0 } : p);
                                            setStoragePlans(updated);
                                         }}
                                         className="w-20 bg-transparent text-xl font-black text-slate-900 text-right outline-none border-b border-transparent focus:border-slate-300"
                                      />
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                    <div className="flex justify-end pt-4">
                       <button 
                          onClick={() => {
                             startTransition(async () => {
                                await updateStoragePlans(storagePlans);
                                alert('☁️ 雲端空間定價方案已成功同步至全網節點！');
                             });
                          }}
                          disabled={isPending}
                          className="px-10 py-4 bg-slate-900 text-white rounded-[25px] text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all"
                       >
                          {isPending ? '儲存中...' : '儲存空間方案定價 💾'}
                       </button>
                    </div>
                 </div>

                 {/* Storage Ranking / Monitoring with filters */}
                 <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-6">
                       <div>
                          <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-indigo-500 underline-offset-8">全網宮廟空間容量監控 Matrix</h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">SaaS Storage Node Telemetry</p>
                       </div>
                       
                       {/* Filtering controls */}
                       <div className="flex bg-slate-50 p-2 rounded-[25px] border border-slate-100 shadow-inner gap-4 items-center">
                          {/* Region Filter */}
                          <select 
                             value={selectedRegion}
                             onChange={(e) => setSelectedRegion(e.target.value)}
                             className="bg-transparent border-0 text-[11px] font-black text-slate-500 uppercase tracking-widest px-4 py-2 outline-none"
                          >
                             <option value="">所有地域</option>
                             <option value="台北市">台北市</option>
                             <option value="台中市">台中市</option>
                             <option value="高雄市">高雄市</option>
                          </select>
                          
                          <div className="h-6 w-px bg-slate-200"></div>

                          {/* Search Filter */}
                          <input 
                             type="text" 
                             placeholder="搜尋宮廟名稱..."
                             value={searchTemple}
                             onChange={(e) => setSearchTemple(e.target.value)}
                             className="bg-transparent border-0 text-[11px] font-black text-slate-700 px-4 py-2 outline-none placeholder:text-slate-300"
                          />
                       </div>
                    </div>

                    <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">宮廟名稱</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">地區</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">目前容量方案</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">使用進度</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">空間狀態</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {templeStorages
                                .filter(s => !selectedRegion || s.city === selectedRegion)
                                .filter(s => !searchTemple || s.templeName.toLowerCase().includes(searchTemple.toLowerCase()))
                                .map((s) => {
                                   const percentage = Math.min(((s.usedBytes / (s.quotaGb * 1024 * 1024 * 1024)) * 100), 100);
                                   const usedGb = (s.usedBytes / (1024 * 1024 * 1024)).toFixed(2);
                                   return (
                                      <tr key={s.id} className="hover:bg-slate-50/30 transition-all">
                                         <td className="px-8 py-6 text-base font-black text-slate-800 tracking-tight italic">{s.templeName}</td>
                                         <td className="px-8 py-6"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.city}</span></td>
                                         <td className="px-8 py-6 font-bold text-slate-600">{s.planName}</td>
                                         <td className="px-8 py-6">
                                            <div className="w-full space-y-2">
                                               <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                  <span>{usedGb} GB 已使用</span>
                                                  <span>上限 {s.quotaGb} GB</span>
                                               </div>
                                               <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                  <div 
                                                     className={`h-full rounded-full transition-all ${percentage >= 85 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                                     style={{ width: `${percentage}%` }}
                                                  ></div>
                                               </div>
                                            </div>
                                         </td>
                                         <td className="px-8 py-6 text-right">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                               percentage >= 85 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                                            }`}>
                                               <div className={`w-1.5 h-1.5 rounded-full ${percentage >= 85 ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                               {percentage >= 85 ? '容量即將爆滿' : '正常'}
                                            </span>
                                         </td>
                                      </tr>
                                   );
                                })}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {/* --- 4. RESOURCES SYNC (TOOLS) --- */}
           {activeTab === 'tools' && (
              <div className="space-y-16 animate-in fade-in zoom-in-95 duration-700">
                 <div className="bg-slate-900 p-16 rounded-[80px] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
                    <div className="relative z-10 flex justify-between items-center">
                       <div className="space-y-6">
                          <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] italic">Cloud Synchronization Engine</p>
                          <h3 className="text-5xl font-black italic tracking-tighter leading-tight">中央資源同步中心<br/>影音與合約分發系統</h3>
                          <p className="text-sm text-slate-400 font-bold max-w-xl">此處上傳的資源將即時同步至全網節點，包括超級業務員、授權經銷商、其下業務端的工作手冊、展示影片與最新合約範本。</p>
                       </div>
                       <div className="flex flex-col items-center gap-4">
                          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center text-slate-900 text-4xl shadow-2xl animate-spin-slow">🌀</div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Live Syncing</span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {mediaList.map((tool, i) => (
                       <div key={i} className="bg-white rounded-[60px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all">
                          <div className="aspect-video relative bg-slate-100 overflow-hidden">
                             <img src={tool.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 opacity-80" />
                             <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <span className="text-4xl">{tool.type === 'video' ? '▶️' : '📄'}</span>
                             </div>
                             <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                {tool.type === 'video' ? '業務演示影片' : '合約 規範文檔'}
                             </div>
                          </div>
                          <div className="p-10 space-y-4">
                             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">{tool.category}</p>
                             <h5 className="text-xl font-black text-slate-900 tracking-tight italic">{tool.title}</h5>
                             <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                                <span className="text-[10px] font-black text-emerald-500 uppercase italic">Synced All Nodes</span>
                                <button className="text-xs font-black text-slate-300 hover:text-rose-500 transition-all">移除</button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* --- 5. FINANCE HUB --- */}
                      {activeTab === 'ai' && (
             <div className="space-y-6">
          <div className="p-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div className="mb-12">
              <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">AI 核心介接設定</h3>
              <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest uppercase">Global AI Engine Endpoints</p>
            </div>
            
            <div className="space-y-12">
               {/* OCR */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                 <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><span className="text-2xl">👁️</span> 視知識別引擎 (OCR / 表單掃描)</h4>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API URL</label>
                       <input value={config?.aiEndpoints?.ocrApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiUrl: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="https://api.openai.com/v1/chat/completions" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API Key</label>
                       <input type="password" value={config?.aiEndpoints?.ocrApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiKey: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="sk-..." />
                    </div>
                 </div>
               </div>

               {/* Chat */}
               <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
                 <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3"><span className="text-2xl">🧠</span> 對話大腦引擎 (信眾智能問答)</h4>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API URL</label>
                       <input value={config?.aiEndpoints?.chatApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiUrl: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="https://api.openai.com/v1/chat/completions" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">API Key</label>
                       <input type="password" value={config?.aiEndpoints?.chatApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiKey: e.target.value}})} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600" placeholder="sk-..." />
                    </div>
                 </div>
               </div>

               <div className="flex justify-end">
                  <button 
                    onClick={async () => {
                       await import('@/app/actions').then(m => m.updateSystemConfig({ aiEndpoints: config.aiEndpoints }));
                       alert('AI 引擎設定已安全儲存生效！');
                    }}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-xl hover:-translate-y-1"
                  >
                     💾 儲存 AI 安全配置
                  </button>
               </div>
            </div>
          </div>
                <div className="bg-white p-12 rounded-[2rem] border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">🤖</div>
                   <div className="relative z-10 max-w-4xl">
                      <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-8 underline decoration-4 decoration-fuchsia-500 underline-offset-8">AI 助理定價方案配置</h4>
                      <div className="space-y-6">
                        {aiPlans.map((plan, i) => (
                           <div key={plan.id} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">方案名稱</label>
                               <input type="text" value={plan.name} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].name = e.target.value;
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">月租費 (NT$)</label>
                               <input type="number" value={plan.monthlyFee} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].monthlyFee = Number(e.target.value);
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">對話次數上限</label>
                               <input type="number" value={plan.chatLimit} onChange={e => {
                                 const copy = [...aiPlans];
                                 copy[i].chatLimit = Number(e.target.value);
                                 setAiPlans(copy);
                               }} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1 flex gap-2">
                               <button onClick={async () => {
                                  await saveAiPlan(plan);
                                  alert('🤖 AI 方案已更新！');
                               }} className="w-full px-4 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-fuchsia-600 transition-colors shadow-lg shadow-fuchsia-500/20">
                                 儲存 💾
                               </button>
                             </div>
                           </div>
                        ))}
                        <button onClick={() => setAiPlans([...aiPlans, { id: 'NEW', name: '新方案', monthlyFee: 0, chatLimit: 0 }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors uppercase tracking-widest">
                           + 新增 AI 方案 ADD PLAN
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-12 rounded-[2rem] border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">🧠</div>
                   <div className="relative z-10 max-w-4xl">
                      <div className="flex justify-between items-end mb-8">
                        <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-emerald-500 underline-offset-8">API 語言模型配置</h4>
                        <button onClick={async () => {
                           await saveAiApiModels(aiModels);
                           alert('✅ API 語言模型設定已儲存！');
                        }} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                          儲存所有模型 💾
                        </button>
                      </div>
                      <div className="space-y-6">
                        {aiModels.map((model, i) => (
                           <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end bg-slate-50 p-6 rounded-2xl border border-slate-100">
                             <div className="col-span-1">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">模型名稱</label>
                               <input type="text" value={model.name} onChange={e => {
                                 const copy = [...aiModels];
                                 copy[i].name = e.target.value;
                                 setAiModels(copy);
                               }} placeholder="例如: OpenAI GPT-4" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-2">
                               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API Key</label>
                               <input type="password" value={model.apiKey} onChange={e => {
                                 const copy = [...aiModels];
                                 copy[i].apiKey = e.target.value;
                                 setAiModels(copy);
                               }} placeholder="sk-..." className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800" />
                             </div>
                             <div className="col-span-1 flex items-center justify-between h-[46px] px-4 bg-white border border-slate-200 rounded-xl">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">啟用狀態</span>
                               <label className="relative inline-flex items-center cursor-pointer">
                                 <input type="checkbox" className="sr-only peer" checked={model.isEnabled} onChange={e => {
                                   const copy = [...aiModels];
                                   copy[i].isEnabled = e.target.checked;
                                   setAiModels(copy);
                                 }} />
                                 <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                               </label>
                             </div>
                           </div>
                        ))}
                        <button onClick={() => setAiModels([...aiModels, { id: 'NEW-'+Date.now(), name: '', apiKey: '', isEnabled: false }])} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-xs font-black text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-colors uppercase tracking-widest">
                           + 新增 API 語言模型
                        </button>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-12 rounded-[2rem] border-2 border-slate-200 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl group-hover:scale-110 transition-transform duration-700">📊</div>
                   <div className="relative z-10">
                      <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter mb-8 underline decoration-4 decoration-blue-500 underline-offset-8">宮廟 AI 使用狀況清單</h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b-2 border-slate-100">
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">宮廟名稱</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">目前方案</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">本期用量</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">到期日</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">狀態</th>
                                 <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">管理員特權</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {allTempleAiUsage.map((u, i) => {
                                 const isExpired = new Date(u.expiryDate).getTime() < Date.now();
                                 const isExhausted = u.usedCount >= u.chatLimit;
                                 let statusBadge = <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black tracking-widest">正常</span>;
                                 if (u.isVip) statusBadge = <span className="px-3 py-1 bg-fuchsia-100 text-fuchsia-600 rounded-full text-[10px] font-black tracking-widest">永久免費</span>;
                                 else if (!u.enabled) statusBadge = <span className="px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black tracking-widest">已關閉</span>;
                                 else if (isExpired) statusBadge = <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black tracking-widest">已過期</span>;
                                 else if (isExhausted) statusBadge = <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-[10px] font-black tracking-widest">已用盡</span>;

                                 return (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-6 py-4 text-sm font-bold text-slate-800">{u.templeName}</td>
                                       <td className="px-6 py-4 text-xs font-bold text-indigo-600">{u.planName}</td>
                                       <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.isVip ? '無限' : `${u.usedCount} / ${u.chatLimit}`}</td>
                                       <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.isVip ? '無期限' : new Date(u.expiryDate).toLocaleDateString()}</td>
                                       <td className="px-6 py-4">{statusBadge}</td>
                                       <td className="px-6 py-4">
                                          <button onClick={async () => {
                                             await grantTempleAiVip(u.templeId, !u.isVip);
                                             alert(u.isVip ? '已取消特權' : '已開通免費無限使用特權！');
                                             fetchAllTempleAiUsage().then(setAllTempleAiUsage);
                                          }} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-colors ${u.isVip ? 'bg-slate-200 text-slate-500 hover:bg-slate-300' : 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20 hover:bg-fuchsia-600'}`}>
                                             {u.isVip ? '取消 VIP' : '👑 設為 VIP'}
                                          </button>
                                       </td>
                                    </tr>
                                 )
                              })}
                              {allTempleAiUsage.length === 0 && (
                                 <tr><td colSpan={6} className="px-6 py-12 text-center text-sm font-bold text-slate-400">目前沒有任何宮廟使用 AI 方案</td></tr>
                              )}
                           </tbody>
                        </table>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'finance' && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-700">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 bg-white p-16 rounded-[70px] border border-slate-100 shadow-sm space-y-12">
                       <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-emerald-500 underline-offset-8">系統財務結算清單 Financial Ledger</h4>
                       <div className="space-y-6">
                          {finance?.records.map((r: any, i: number) => (
                             <div key={i} className="flex justify-between items-center border-b border-slate-50 pb-8 last:border-0">
                                <div className="flex items-center gap-6">
                                   <div className={`w-14 h-14 rounded-2xl ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} flex items-center justify-center text-xl font-black shadow-inner italic`}>{r.type === 'INCOME' ? '+' : '-'}</div>
                                   <div>
                                      <p className="text-base font-black text-slate-900">{r.source}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.category} | {r.date}</p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={`text-2xl font-black italic ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-500'}`}>${r.amount.toLocaleString()}</p>
                                   <p className="text-[9px] font-black text-slate-300 uppercase">Transaction ID: TX-{Math.floor(Math.random()*9000)}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                    <div className="bg-slate-900 p-16 rounded-[70px] shadow-2xl text-white space-y-10">
                       <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2 italic">Global Summary</p><h4 className="text-4xl font-black italic tracking-tighter leading-tight">財務統計中心</h4></div>
                       <div className="space-y-8 bg-white/5 p-10 rounded-[50px] border border-white/5">
                          <div className="flex justify-between border-b border-white/10 pb-6"><span className="text-[11px] font-bold text-slate-400 uppercase">總營收 (Total Rev)</span><span className="text-xl font-black italic">${finance?.summary.totalRevenue.toLocaleString()}</span></div>
                          <div className="flex justify-between border-b border-white/10 pb-6"><span className="text-[11px] font-bold text-slate-400 uppercase">總分潤 (Commission)</span><span className="text-xl font-black italic">${finance?.summary.totalCommission.toLocaleString()}</span></div>
                          <div className="flex justify-between pt-2"><span className="text-[11px] font-black text-emerald-400 uppercase">累計淨利 (Profit)</span><span className="text-3xl font-black italic text-white">${finance?.summary.netProfit.toLocaleString()}</span></div>
                       </div>
                       <button className="w-full py-8 bg-emerald-600 text-white rounded-[35px] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-emerald-500 transition-all">全網財務清算對帳 💳</button>
                    </div>
                 </div>

                 {/* 錢包對帳模組 */}
                 <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-8">
                    <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-indigo-500 underline-offset-8">分佈式錢包結算帳戶 (Wallets Ledger)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                       {wallets.map((w, idx) => (
                          <div key={idx} className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 flex flex-col justify-center hover:shadow-md transition-all">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{w.role === 'SuperAdmin' ? '系統總部' : w.role === 'Distributor' ? '經銷代理' : w.role === 'SuperSales' ? '超級業務' : '經銷業務'} ({w.name})</p>
                             <p className="text-2xl font-black text-slate-900 italic">${w.balance.toLocaleString()}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}

           {/* --- 6. DATA BRIDGE --- */}
           {activeTab === 'bridge' && (
              <div className="space-y-16 animate-in fade-in zoom-in-95 duration-700">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-[600px]">
                    <div className="bg-slate-900 rounded-[100px] shadow-2xl p-16 text-white flex flex-col justify-between relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                       <div className="space-y-6 relative z-10">
                          <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] italic">Database Connection: Stable</p>
                          <h3 className="text-5xl font-black italic tracking-tighter leading-tight">中央資料庫匯流核心<br/>Live Bridge Status</h3>
                       </div>
                       <div className="flex items-center gap-12 relative z-10">
                          <div className="text-center space-y-2"><p className="text-5xl font-black italic">24ms</p><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Network Latency</p></div>
                          <div className="text-center space-y-2"><p className="text-5xl font-black italic">100%</p><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uptime Performance</p></div>
                       </div>
                    </div>
                    <div className="bg-white border-2 border-slate-100 rounded-[100px] p-12 shadow-sm flex flex-col items-center justify-center space-y-10 relative">
                       <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center text-7xl shadow-inner animate-pulse">🛰️</div>
                       <div className="space-y-2 text-center">
                          <h4 className="text-xl font-black text-slate-900 tracking-widest uppercase italic">全球分點同步中</h4>
                          <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Node-A1, Node-B2, Node-C3 Online</p>
                       </div>
                       <div className="grid grid-cols-3 gap-4 w-full">
                          {[1,2,3,4,5,6].map(i => <div key={i} className="h-2 bg-emerald-500/20 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-full"></div></div>)}
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {/* --- 7. LOGS --- */}
           {activeTab === 'logs' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex justify-between items-end px-4">
                    <div className="space-y-2"><p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">System Audit Trail</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">決策日誌與審計紀錄</h3></div>
                    <button onClick={handleDownloadLogs} className="px-10 py-5 bg-slate-900 text-white rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-4">
                       💾 匯出歷史日誌紀錄 (CSV)
                    </button>
                 </div>
                 <section className="bg-white rounded-[60px] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50/50">
                          <tr>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">時間戳記 Timestamp</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">執行者 User</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">事件描述 Action</th>
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-right">標記</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {logs.map((log: any, i) => (
                            <tr key={i} className="hover:bg-slate-50/30 transition-all group">
                               <td className="px-12 py-8 text-[12px] font-bold text-slate-400">{log.timestamp}</td>
                               <td className="px-12 py-8"><span className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase italic text-slate-600">{log.user}</span></td>
                               <td className="px-12 py-8 text-sm font-black text-slate-700 tracking-tight italic">{log.action}：{log.target}</td>
                               <td className="px-12 py-8 text-right"><div className="flex items-center justify-end gap-2 text-[10px] font-black text-emerald-500 italic uppercase"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>Audit Passed</div></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </section>
              </div>
           )}

           {/* --- 8. SETTINGS --- */}
           {activeTab === 'settings' && (
              <div className="space-y-16 animate-in fade-in zoom-in-95 duration-700 max-w-4xl mx-auto pb-40">
                 <div className="bg-white p-20 rounded-[100px] shadow-[0_50px_120px_-20px_rgba(0,0,0,0.12)] border border-slate-100 relative overflow-hidden group">
                     {/* Decorative background elements */}
                     <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-indigo-500/10 transition-all duration-1000"></div>
                     <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -ml-40 -mb-40"></div>
                     
                     <div className="relative z-10 space-y-16">
                        <div className="flex flex-col items-center text-center space-y-4">
                           <div className="w-24 h-24 bg-slate-950 text-white rounded-[35px] flex items-center justify-center text-4xl shadow-2xl rotate-3 mb-4 group-hover:rotate-0 transition-all duration-700">⚙️</div>
                           <h4 className="text-5xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">系統全域參數設定</h4>
                           <p className="text-[12px] font-black text-indigo-500 uppercase tracking-[0.6em]">Global Core Architecture Configuration</p>
                        </div>

                        <div className="grid grid-cols-1 gap-12">
                            <div className="space-y-10">
                               <div className="grid grid-cols-1 gap-8">
                                  {/* Field 01: Monthly Rent */}
                                  <div className="p-16 bg-slate-50/50 rounded-[60px] border border-white shadow-inner space-y-10 group/item hover:bg-white hover:shadow-2xl transition-all duration-500">
                                     <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                           <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                           <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] italic">01. 全網宮廟租賃標準 (Monthly Rent)</p>
                                        </div>
                                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full">SYSTEM DEFAULT</span>
                                     </div>
                                     <div className="flex items-center justify-center gap-8">
                                        <div className="relative flex-1 max-w-md">
                                           <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-200 opacity-50">$</span>
                                           <input id="fixedMonthlyRent" type="number" defaultValue={config?.fixedMonthlyRent} className="w-full bg-transparent border-b-8 border-slate-100 focus:border-slate-950 p-4 pl-12 text-8xl font-black text-slate-950 outline-none transition-all italic tracking-tighter text-center" />
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-4xl font-black text-slate-950 italic">TWD</span>
                                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">per month</span>
                                        </div>
                                     </div>
                                  </div>

                                  {/* Field 02: Yearly Discount */}
                                  <div className="p-16 bg-indigo-600 rounded-[60px] shadow-2xl shadow-indigo-200 space-y-10 relative overflow-hidden group/card hover:scale-[1.01] transition-all duration-500">
                                     <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent"></div>
                                     <div className="flex justify-between items-center relative z-10">
                                        <div className="flex items-center gap-4">
                                           <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                           <p className="text-[12px] font-black text-indigo-100 uppercase tracking-[0.4em] italic">02. 年繳優惠折扣率 (Yearly Discount)</p>
                                        </div>
                                        <div className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest">PROMOTION_ACTIVE</div>
                                     </div>
                                     <div className="flex items-center justify-center gap-8 relative z-10">
                                        <div className="relative flex-1 max-w-sm">
                                           <input id="yearlyDiscountRate" type="number" defaultValue={config?.yearlyDiscountRate || 20} className="w-full bg-transparent border-b-8 border-indigo-400 focus:border-white p-4 text-8xl font-black text-white outline-none transition-all italic tracking-tighter text-center" />
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-5xl font-black text-white italic group-hover/card:scale-110 transition-transform">%</span>
                                           <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">off yearly</span>
                                        </div>
                                     </div>
                                  </div>
                               </div>

                               <div className="pt-8">
                                  <button 
                                     onClick={() => {
                                        const rent = (document.getElementById('fixedMonthlyRent') as HTMLInputElement).value;
                                        const disc = (document.getElementById('yearlyDiscountRate') as HTMLInputElement).value;
                                        startTransition(async () => {
                                           await updateSystemConfig({ fixedMonthlyRent: parseInt(rent), yearlyDiscountRate: parseInt(disc) });
                                           alert('🚀 全域核心參數已成功同步至分佈式網路！');
                                        });
                                     }}
                                     disabled={isPending}
                                     className="w-full py-12 bg-slate-950 text-white rounded-[50px] font-black text-lg uppercase tracking-[0.6em] shadow-[0_30px_70px_rgba(0,0,0,0.3)] hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-6 group overflow-hidden relative"
                                  >
                                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                                     <span className="relative z-10">{isPending ? 'SYNCHRONIZING...' : '儲存並廣播全域指令 🌐'}</span>
                                  </button>
                                  <p className="text-center mt-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Warning: Changes will affect all new temple applications across the network.</p>
                               </div>
                            </div>
                        </div>
                     </div>
                 </div>
              </div>
           )}

        </div>
      
           {activeTab === 'b2b_payment' && (
              <div className="p-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
                 <div className="mb-12">
                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">超級管理員 B2B 收款設定</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2 tracking-widest uppercase">System B2B Payment Gateway</p>
                 </div>
                 
                 <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[30px] border-2 border-slate-100 shadow-2xl relative overflow-hidden">
                       <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">💳</span>
                          啟用之收款方式
                       </h4>
                       <div className="flex gap-4">
                          {['creditCard', 'linePay', 'transfer'].map(method => (
                             <label key={method} className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" 
                                   checked={b2bPayment.enabledMethods.includes(method)}
                                   onChange={e => {
                                      const newMethods = e.target.checked 
                                         ? [...b2bPayment.enabledMethods, method]
                                         : b2bPayment.enabledMethods.filter((m: string) => m !== method);
                                      setB2bPayment({...b2bPayment, enabledMethods: newMethods});
                                   }}
                                />
                                <span className="font-bold text-slate-700">
                                   {method === 'creditCard' ? '信用卡 (ECPay)' : method === 'linePay' ? 'LINE Pay' : '銀行轉帳'}
                                </span>
                             </label>
                          ))}
                       </div>
                    </div>

                    {b2bPayment.enabledMethods.includes('creditCard') && (
                       <div className="bg-white p-10 rounded-[30px] border-2 border-indigo-100 shadow-xl relative overflow-hidden">
                          <h4 className="text-xl font-black text-indigo-900 mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl text-indigo-500">🔒</span>
                             ECPay 信用卡設定
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Merchant ID</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                   value={b2bPayment.ecpay.merchantId} onChange={e => setB2bPayment({...b2bPayment, ecpay: {...b2bPayment.ecpay, merchantId: e.target.value}})} />
                             </div>
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hash Key</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                   value={b2bPayment.ecpay.hashKey} onChange={e => setB2bPayment({...b2bPayment, ecpay: {...b2bPayment.ecpay, hashKey: e.target.value}})} />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Hash IV</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-indigo-500/20 transition-all"
                                   value={b2bPayment.ecpay.hashIV} onChange={e => setB2bPayment({...b2bPayment, ecpay: {...b2bPayment.ecpay, hashIV: e.target.value}})} />
                             </div>
                          </div>
                       </div>
                    )}

                    {b2bPayment.enabledMethods.includes('linePay') && (
                       <div className="bg-white p-10 rounded-[30px] border-2 border-green-100 shadow-xl relative overflow-hidden">
                          <h4 className="text-xl font-black text-green-900 mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">📱</span>
                             LINE Pay 設定
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Channel ID</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-green-500/20 transition-all"
                                   value={b2bPayment.linePay.channelId} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelId: e.target.value}})} />
                             </div>
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Channel Secret</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-green-500/20 transition-all"
                                   value={b2bPayment.linePay.channelSecret} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelSecret: e.target.value}})} />
                             </div>
                          </div>
                       </div>
                    )}

                    {b2bPayment.enabledMethods.includes('transfer') && (
                       <div className="bg-white p-10 rounded-[30px] border-2 border-emerald-100 shadow-xl relative overflow-hidden">
                          <h4 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-3">
                             <span className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">🏦</span>
                             銀行轉帳設定
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                             <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">銀行代碼</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                   value={b2bPayment.transfer.bankCode} onChange={e => setB2bPayment({...b2bPayment, transfer: {...b2bPayment.transfer, bankCode: e.target.value}})} />
                             </div>
                             <div className="md:col-span-2">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">收款帳號</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                   value={b2bPayment.transfer.accountNumber} onChange={e => setB2bPayment({...b2bPayment, transfer: {...b2bPayment.transfer, accountNumber: e.target.value}})} />
                             </div>
                             <div className="md:col-span-3">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">戶名</label>
                                <input type="text" className="w-full bg-slate-50 border-0 rounded-2xl px-6 py-5 text-slate-900 font-bold focus:ring-4 focus:ring-emerald-500/20 transition-all"
                                   value={b2bPayment.transfer.accountName} onChange={e => setB2bPayment({...b2bPayment, transfer: {...b2bPayment.transfer, accountName: e.target.value}})} />
                             </div>
                          </div>
                       </div>
                    )}

                    <button 
                       onClick={() => {
                          startTransition(async () => {
                             await updateSystemConfig({ b2bPayment });
                             alert('B2B 收款設定已儲存！');
                          });
                       }}
                       disabled={isPending}
                       className="w-full py-8 bg-slate-950 text-white rounded-[30px] font-black text-lg uppercase tracking-[0.4em] shadow-xl hover:bg-slate-800 transition-all"
                    >
                       {isPending ? '儲存中...' : '儲存收款設定'}
                    </button>
                 </div>
              </div>
           )}

      </main>

      {/* --- MODAL: CREATE ACCOUNT --- */}
      
      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-12 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 border-4 border-rose-50">
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase text-rose-600">🔄 跨階層轉移</h3>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">目前選擇: {transferTarget.type === 'Temple' ? '宮廟營運節點' : '經銷代理節點'} ({transferTarget.id})</p>
              </div>

              <div className="space-y-6 bg-rose-50/50 p-8 rounded-3xl border border-rose-100">
                 {transferTarget.type === 'Temple' && (
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">指派新經銷商 (留空則為總部直屬)</label>
                      <select value={newDistributorId} onChange={(e)=>setNewDistributorId(e.target.value)} className="w-full bg-white rounded-2xl p-4 text-sm font-black outline-none border border-slate-200">
                         <option value="">-- 直屬總部 (SuperAdmin) --</option>
                         {initialAccounts.filter((a:any) => a.role === 'Distributor').map((d:any) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                         ))}
                      </select>
                   </div>
                 )}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">指派超級業務 (留空則無抽成業務)</label>
                    <select value={newSalesId} onChange={(e)=>setNewSalesId(e.target.value)} className="w-full bg-white rounded-2xl p-4 text-sm font-black outline-none border border-slate-200">
                       <option value="">-- 無超級業務 --</option>
                       {initialAccounts.filter((a:any) => a.role === 'SuperSales').map((s:any) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                       ))}
                    </select>
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button onClick={handleExecuteTransfer} disabled={isPending} className="flex-1 py-5 rounded-[20px] bg-rose-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-rose-700 transition-all active:scale-95">確認強制轉移</button>
                 <button onClick={() => setIsTransferModalOpen(false)} className="px-8 py-5 rounded-[20px] bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">取消</button>
              </div>
           </div>
        </div>
      )}

      {isAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[300] flex items-center justify-center p-12 overflow-y-auto animate-in fade-in duration-500">
           <button onClick={()=>setIsAccountModalOpen(false)} className="fixed top-12 right-12 w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-900 text-3xl font-bold shadow-2xl hover:scale-110 hover:bg-rose-500 hover:text-white transition-all z-[310] group">
              <span className="group-hover:rotate-90 transition-transform">✕</span>
           </button>
           <div className="bg-white w-full max-w-5xl rounded-[80px] shadow-2xl overflow-hidden animate-in zoom-in-95 my-10 relative">
              {accountType === 'Distributor' ? (
              <div className="p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div className="space-y-4">
                       <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">System Provisioning Protocol</p>
                       <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">開設經銷商</h3>
                    </div>
                 </div>
                 <div className="max-h-[70vh] overflow-y-auto px-4">
                    <DistributorApplicationForm 
                       role="super-admin"
                       submittedBy="超級總裁"
                       onSuccess={() => {
                          setIsAccountModalOpen(false);
                          alert('經銷商帳戶已成功建立並開通！');
                          window.location.reload();
                       }}
                       onCancel={() => setIsAccountModalOpen(false)}
                    />
                 </div>
              </div>
            ) : accountType === 'Temple' ? (
              <div className="p-8">
                 <div className="flex justify-between items-center mb-8">
                    <div className="space-y-4">
                       <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] italic">System Provisioning Protocol</p>
                       <h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">開設宮廟帳號</h3>
                    </div>
                 </div>
                 <div className="max-h-[70vh] overflow-y-auto px-4">
                    <TempleApplicationForm 
                       role="super-admin"
                       submittedBy="超級總裁"
                       onSuccess={() => {
                          setIsAccountModalOpen(false);
                          alert('宮廟帳戶已成功建立並開通！');
                          window.location.reload();
                       }}
                       onCancel={() => setIsAccountModalOpen(false)}
                    />
                 </div>
              </div>
            ) : (
              <form onSubmit={handleCreateAccount} className="flex flex-col h-full">
                 <div className="bg-slate-50 p-16 border-b border-slate-100 flex justify-between items-end">
                    <div className="space-y-4"><p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">System Provisioning Protocol</p><h3 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">開設{accountType === 'Admin' ? '管理員' : accountType === 'SuperSales' ? '超級業務' : accountType === 'Distributor' ? '經銷商' : '宮廟帳號'}</h3></div>
                 </div>
                 <div className="p-16 space-y-16 overflow-y-auto max-h-[60vh]">
                    <section className="space-y-10">
                       <div className="flex items-center gap-4"><div className="w-1.5 h-6 bg-slate-900 rounded-full"></div><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">01. 基礎身份資訊設定 (Basic Identity)</h4></div>
                       <div className="grid grid-cols-2 gap-12">
                          <div className="space-y-4"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">完整姓名 / 名稱</label><input name="name" type="text" className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black text-slate-800 outline-none border border-slate-100 focus:border-slate-900 focus:bg-white transition-all shadow-inner" placeholder="例如：林精英 / 誠信經銷" required /></div>
                          <div className="space-y-4"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">聯繫電話</label><input name="phone" type="text" className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black text-slate-800 outline-none border border-slate-100 focus:border-slate-900 focus:bg-white transition-all shadow-inner" placeholder="0900-000-000" /></div>
                          <div className="space-y-4"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">登入 ID (Account)</label><input name="account" type="text" className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black text-slate-800 outline-none border border-slate-100 focus:border-slate-900 focus:bg-white transition-all shadow-inner" placeholder="elite_manager_01" required /></div>
                          <div className="space-y-4"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">安全密碼 (Password)</label><input name="password" type="password" className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black text-slate-800 outline-none border border-slate-100 focus:border-slate-900 focus:bg-white transition-all shadow-inner" placeholder="••••••••" required /></div>
                       </div>
                    </section>

                    {/* --- 2. 業務帳戶屬性設定 --- */}
                    {accountType === 'SuperSales' && (
                       <section className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="flex items-center gap-4"><div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">02. 超級業務分潤設定 (Commission Policy)</h4></div>
                          <div className="grid grid-cols-2 gap-10">
                             <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">經銷商授權費提成 (%)</label>
                                <input name="distributorAuthRate" type="number" defaultValue={config?.defaultSuperSalesRates?.distributorAuthRate ?? 15} className="w-full bg-slate-50 rounded-[25px] p-6 text-xl font-black text-slate-800 outline-none border border-slate-100" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">宮廟開辦費提成 (%)</label>
                                <input name="templeSetupRate" type="number" defaultValue={config?.defaultSuperSalesRates?.templeSetupRate ?? 10} className="w-full bg-slate-50 rounded-[25px] p-6 text-xl font-black text-slate-800 outline-none border border-slate-100" />
                             </div>
                             <div className="col-span-2 space-y-4">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">宮廟月租維護提成 (階梯年分 %)</label>
                                <div className="grid grid-cols-3 gap-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                                   <div className="space-y-2 text-center"><p className="text-[9px] font-black text-slate-400">第一年</p><input name="rentY1" type="number" defaultValue={config?.defaultSuperSalesRates?.templeRentRates?.[0] ?? 15} className="w-full bg-white rounded-2xl p-4 text-center font-black" /></div>
                                   <div className="space-y-2 text-center"><p className="text-[9px] font-black text-slate-400">第二年</p><input name="rentY2" type="number" defaultValue={config?.defaultSuperSalesRates?.templeRentRates?.[1] ?? 12} className="w-full bg-white rounded-2xl p-4 text-center font-black" /></div>
                                   <div className="space-y-2 text-center"><p className="text-[9px] font-black text-slate-400">後續 (三年起)</p><input name="rentY3" type="number" defaultValue={config?.defaultSuperSalesRates?.templeRentRates?.[2] ?? 10} className="w-full bg-white rounded-2xl p-4 text-center font-black" /></div>
                                </div>
                             </div>
                          </div>
                       </section>
                    )}

                    

                    
                 </div>
                 <div className="p-16 border-t border-slate-50 bg-slate-50/30 flex gap-6">
                    <button type="submit" disabled={isPending} className="flex-1 py-10 bg-slate-900 text-white rounded-[40px] font-black text-sm uppercase tracking-[0.6em] shadow-2xl hover:scale-[1.02] transition-all disabled:bg-slate-300">{isPending ? 'Processing...' : '確認開設帳戶 Confirm Provisioning 🚀'}</button>
                 </div>
              </form>
            )}
            </div>
         </div>
      )}

      {/* --- MODAL: UPLOAD TOOL --- */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-3xl z-[300] flex items-center justify-center p-12 overflow-y-auto animate-in fade-in duration-500">
            <button onClick={()=>setIsUploadModalOpen(false)} className="fixed top-12 right-12 w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-900 text-3xl font-bold shadow-2xl hover:scale-110 z-[310]">✕</button>
            <div className="bg-white w-full max-w-2xl rounded-[70px] shadow-2xl overflow-hidden p-16 space-y-12">
                <div className="space-y-4"><p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">System Resource Sync</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">上傳並同步資源至全網</h3></div>
                <form onSubmit={handleUploadTool} className="space-y-8">
                    <div className="flex gap-4">
                        <button type="button" onClick={()=>setUploadMode('video')} className={`flex-1 py-5 rounded-[25px] font-black text-[10px] uppercase tracking-widest transition-all ${uploadMode === 'video' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>業務演示影片</button>
                        <button type="button" onClick={()=>setUploadMode('contract')} className={`flex-1 py-5 rounded-[25px] font-black text-[10px] uppercase tracking-widest transition-all ${uploadMode === 'contract' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>合約 規範文件</button>
                    </div>
                    <div className="space-y-6">
                        <input name="title" type="text" placeholder="資源標題 (例如：2026合約演示)" className="w-full bg-slate-50 rounded-[30px] p-7 text-sm font-black outline-none border border-slate-100" required />
                        <input name="category" type="text" placeholder="類別 (例如：系統說明)" className="w-full bg-slate-50 rounded-[30px] p-7 text-sm font-black outline-none border border-slate-100" required />
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] h-40 flex flex-col items-center justify-center space-y-2 group cursor-pointer hover:bg-white hover:border-indigo-400 transition-all">
                            <span className="text-3xl group-hover:scale-110 transition-transform">📁</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">點擊或拖曳檔案至此 (MAX 500MB)</p>
                        </div>
                    </div>
                    <button type="submit" disabled={isPending} className="w-full py-8 bg-indigo-600 text-white rounded-[35px] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-indigo-500 transition-all">確認上傳並廣播雲端指令 ☁️</button>
                </form>
            </div>
        </div>
      )}


      {/* View Detail Modal */}
      {viewingAccountDetail && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }} className="backdrop-blur-sm">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-50 p-8 flex justify-between items-center border-b border-slate-100">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">{viewingAccountDetail.role === 'Temple' ? '宮廟基本信息' : '帳戶基本信息'}</h3>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{viewingAccountDetail.role} ACCOUNT DETAIL</p>
                 </div>
                 <button onClick={() => { setViewingAccountDetail(null); setNewPassword(''); }} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all">✕</button>
              </div>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">ID / 編號</span>
                       <span className="text-sm font-black text-slate-900">{viewingAccountDetail.id}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">名稱 (Name)</span>
                       <span className="text-sm font-black text-slate-900">{viewingAccountDetail.name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">登入帳號 (Account)</span>
                       <span className="text-sm font-black text-slate-900">{viewingAccountDetail.account}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                       <span className="text-xs font-bold text-slate-400">狀態 (Status)</span>
                       <span className="text-sm font-black text-emerald-500 uppercase italic">{viewingAccountDetail.status}</span>
                    </div>
                    
                    {viewingAccountDetail.role === 'Temple' && (
                       <>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">所在縣市 (City)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.city || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">地址 (Address)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.address || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">聯絡電話 (Phone)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.templePhone || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">所屬代理商 (Distributor ID)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.distributorId || '無'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">負責業務 (Sales ID)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.salesId || '無'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">月租費 (Monthly Rent)</span>
                            <span className="text-sm font-black text-slate-900">NT$ {viewingAccountDetail.monthlyRent || 0}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">建置費 (Setup Fee)</span>
                            <span className="text-sm font-black text-slate-900">NT$ {viewingAccountDetail.setupFee || 0}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">建立時間 (Created At)</span>
                            <span className="text-[10px] font-black text-slate-900">{viewingAccountDetail.timestamp ? new Date(viewingAccountDetail.timestamp).toLocaleString() : '未知'}</span>
                         </div>
                       </>
                    )}
                 </div>

                 <div className="pt-4 space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">修改密碼 (Reset Password)</label>
                    <input 
                       type="text" 
                       placeholder="請輸入新密碼 (不修改請留空)" 
                       value={newPassword}
                       onChange={e => setNewPassword(e.target.value)}
                       className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-sm outline-none focus:bg-white focus:border-indigo-500 transition-all"
                    />
                 </div>
              </div>
              <div className="bg-slate-50 p-6 flex gap-4">
                 <button 
                    onClick={() => {
                       if (!newPassword) { alert('請輸入新密碼！'); return; }
                       startTransition(async () => {
                          await updateAccountPassword(viewingAccountDetail.id, newPassword, viewingAccountDetail.role);
                          alert('密碼修改成功！');
                          setViewingAccountDetail(null);
                          setNewPassword('');
                       });
                    }}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest"
                 >儲存密碼更新</button>
                 <button onClick={() => { setViewingAccountDetail(null); setNewPassword(''); }} className="px-8 py-4 text-slate-400 font-bold text-xs">關閉</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}