"use client";

import React, { useState, useTransition, useEffect } from 'react';
import TempleApplicationForm from '../components/TempleApplicationForm';
import DistributorApplicationForm from '../components/DistributorApplicationForm';
import dynamic from 'next/dynamic';

const TaiwanTempleMap = dynamic(() => import('../components/TaiwanTempleMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-slate-900 rounded-[40px] text-white">Loading Map...</div> 
});
import { 
  uploadTool, 
  deleteTool,
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
  fetchAllAccountsForAdmin,
  fetchAggregatedAnalytics,
  fetchStoragePlans, fetchAiPlans, saveAiPlan, deleteAiPlan, fetchAiApiModels, saveAiApiModels, fetchAllTempleAiUsage, grantTempleAiVip,
  updateStoragePlans,
  updateAccountPassword,
  fetchTempleStorages,
  fetchRoleWallets,
  fetchSuperAdminFinancials,
  fetchDataBridgeTree,
  approveWithdrawal,
  logoutAccount,
  upgradeTempleStorage,
  grantTempleStorageVip,
  purchaseAiPlanByAdmin
} from '../actions';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

export default function SuperAdminClient({ 
  initialStats, initialAccounts, initialPlans, initialMedia, initialTemples, initialWithdrawals
}: { 
  initialStats: any, initialAccounts: any[], initialPlans: any[], initialMedia: any[], initialTemples: any[], initialWithdrawals?: any[]
}) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'approvals' | 'tools' | 'finance' | 'bridge' | 'logs' | 'settings' | 'space' | 'ai' | 'b2b_payment'>('dashboard');
  const [analytics, setAnalytics] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [financeMonth, setFinanceMonth] = useState('2026-07');
  const [templePaymentMonth, setTemplePaymentMonth] = useState('2026-07');
  const [withdrawalProofs, setWithdrawalProofs] = useState<{[key:string]: string}>({});
  const [syncQueue, setSyncQueue] = useState<any[]>([]);
  const [pendingDistributors, setPendingDistributors] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>(initialWithdrawals || []);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);
  const pendingWithdrawals = withdrawals.filter((w: any) => w.status === 'Pending' || w.status === '審核中');
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
  const [templePaymentFilter, setTemplePaymentFilter] = useState('ALL');
  const [allTempleAiUsage, setAllTempleAiUsage] = useState<any[]>([]);
  const [templeStorages, setTempleStorages] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [bridgeTree, setBridgeTree] = useState<any[]>([]);
  const [searchTemple, setSearchTemple] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');
  const [bridgeSearch, setBridgeSearch] = useState('');
  const [bridgeDateFilter, setBridgeDateFilter] = useState('all');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [trendYear, setTrendYear] = useState(new Date().getFullYear().toString());
  
  const [isPending, startTransition] = useTransition();

  const [accountError, setAccountError] = useState('');
  
  const validateAccount = async (acc: string) => {
    if (!acc) { setAccountError(''); return; }
    try {
      const { checkAccountExists } = await import('../actions');
      const exists = await checkAccountExists(acc);
      if (exists) {
        setAccountError(`此帳號不可使用，建議使用：${acc}${Math.floor(Math.random()*900)+100}`);
      } else {
        setAccountError('');
      }
    } catch(e) {}
  };

  // --- UI States ---
   const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState<{id: string, type: 'Temple' | 'Distributor' | null}>({id: '', type: null});
  const [newSalesId, setNewSalesId] = useState('');
  const [newDistributorId, setNewDistributorId] = useState('');
   const [accountSubTab, setAccountSubTab] = useState<'Temple' | 'Distributor' | 'SuperSales'>('Temple');
  const [transferModalData, setTransferModalData] = useState<{id: string, role: string, name: string} | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>('HQ');
  const [transferTargetType, setTransferTargetType] = useState<'HQ' | 'Distributor' | 'SuperSales'>('HQ');
  const [selectedTransferTemples, setSelectedTransferTemples] = useState<string[]>([]);
   const [accountType, setAccountType] = useState<'SuperSales' | 'Distributor' | 'Temple' | 'Admin'>('SuperSales');
   const [isFree, setIsFree] = useState(false);
   const [freeType, setFreeType] = useState<'Normal' | 'Trial' | 'Permanent'>('Normal');
   const [uploadMode, setUploadMode] = useState<'video' | 'photo' | 'document' | 'contract'>('video');
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
   const [paymentCycle, setPaymentCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
   const [viewingAccountDetail, setViewingAccountDetail] = useState<any>(null);
   const [editDistributorForm, setEditDistributorForm] = useState<any>({});
   const [adminUpgradeStoragePlanId, setAdminUpgradeStoragePlanId] = useState('');
   const [adminUpgradeAiPlanId, setAdminUpgradeAiPlanId] = useState('');
   const [newPassword, setNewPassword] = useState('');
  
  // --- Data Fetching ---
  useEffect(() => {
    fetchAggregatedAnalytics(trendYear).then(setAnalytics);
    fetchSystemConfig().then(c => {
       setConfig(c);
       if (c.b2bPayment) setB2bPayment(c.b2bPayment);
    });
    fetchAdminLogs().then(setLogs);
    fetchSuperAdminFinancials().then(data => {
      setFinance({ records: data.records, summary: data.summary, templePayments: data.templePayments });
      setWallets(data.wallets);
    });
    fetchSyncQueue().then(setSyncQueue);
    fetchPendingDistributors().then(setPendingDistributors);
    fetchStoragePlans().then(setStoragePlans);
    fetchAiPlans().then(setAiPlans);
    fetchAiApiModels().then(setAiModels);
    fetchAllTempleAiUsage().then(setAllTempleAiUsage);
    fetchTempleStorages().then(setTempleStorages);
    fetchDataBridgeTree().then(setBridgeTree);
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
    if (accountError) {
      alert("目前帳號不可使用，請依照系統建議更換！");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    
    startTransition(async () => {
      let res: any;
      if (accountType === 'SuperSales') res = await createSuperSalesAccount(data);
      else if (accountType === 'Distributor') res = await createDistributorAccount(data);
      else if (accountType === 'Temple') res = await createTempleAccount(data);
      else if (accountType === 'Admin') res = await createAdminAccount(data);
      
      if (res && res.success === false) {
          alert(res.error || '此帳號已被註冊，不可使用，請更換！');
          return;
      }
      
      setIsAccountModalOpen(false);
      alert(`${accountType} 帳戶已部署開設並同步全球網域指令 🌐`);
      window.location.reload();
    });
  };

  const handleUploadTool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    let defaultThumb = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000';
    if (uploadMode === 'photo') defaultThumb = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000';
    if (uploadMode === 'document') defaultThumb = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000';
    if (uploadMode === 'contract') defaultThumb = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=1000';

    const formData = new FormData();
        formData.append('type', uploadMode);
        formData.append('title', fd.get('title') as string);
        formData.append('category', fd.get('category') as string);
        formData.append('thumbnail', defaultThumb);
        if (selectedFile) {
            formData.append('file', selectedFile);
        }

        startTransition(async () => {
            const res = await uploadTool(formData);
            if (res && res.success) {
                setMediaList([{
                    id: Date.now().toString(), 
                    type: uploadMode,
                    title: fd.get('title') as string,
                    category: fd.get('category') as string,
                    thumbnail: res.thumbnail,
                    url: res.toolUrl,
                    uploadedAt: new Date().toISOString().split('T')[0]
                }, ...mediaList]);
                setIsUploadModalOpen(false);
                setSelectedFile(null);
                alert("資材已即時同步至全球網域節點，所有業務端、經銷商、高級業務員介面均已更新 ⚡");
            } else {
                alert("上傳失敗！");
            }
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
             { id: 'approvals', label: '審核中心', icon: '⚖️', count: pendingDistributors.length + initialTemples.filter(t => t.status === 'Pending').length },
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
                      { label: '年度累計總營收', value: `$${(analytics?.overview?.monthlyRevenue || 0).toLocaleString()}`, change: 'Realtime', color: 'indigo' },
                      { label: '全球活動節點數', value: (analytics?.overview?.activeTemples || 0).toLocaleString(), change: 'Realtime', color: 'emerald' },
                      { label: '授權經銷商數', value: (analytics?.overview?.totalDistributors || 0).toLocaleString(), change: 'Realtime', color: 'slate' },
                      { label: '系統運行健康度', value: `${analytics?.overview?.systemHealth || 100}%`, change: 'Optimal', color: 'rose' }
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

                 <div className="grid grid-cols-1 gap-12">
                    <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-10">
                       <div className="flex items-center justify-between px-4">
                          <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-indigo-500 underline-offset-8">市場擴張趨勢 Expansion Analysis</h4>
                          <select 
                            value={trendYear}
                            onChange={(e) => {
                               setTrendYear(e.target.value);
                               fetchAggregatedAnalytics(e.target.value).then(setAnalytics);
                            }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500"
                          >
                             <option value="2026">2026 年</option>
                             <option value="2025">2025 年</option>
                             <option value="2024">2024 年</option>
                          </select>
                       </div>
                                              <div className="h-80 flex items-end gap-3 px-4 pb-8">
                          {analytics?.growthTrend.map((h: any, i: number, arr: any[]) => {
                             const maxCount = Math.max(...arr.map(t => t.count), 1);
                             const barHeight = Math.max((h.count / maxCount) * 100, 5);
                             return (
                               <div key={i} className="flex-1 relative h-full flex flex-col justify-end">
                                  <div className="bg-slate-50 rounded-2xl w-full h-full absolute inset-0"></div>
                                  <div 
                                    className="bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-2xl w-full relative z-10 transition-all duration-1000 shadow-lg shadow-indigo-100 group" 
                                    style={{ height: `${barHeight}%` }}
                                  >
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                                      {h.count} 間
                                    </div>
                                  </div>
                                  <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -bottom-8 left-0 w-full">{h.date.split('-')[1]}月</p>
                               </div>
                             );
                          })}
                       </div></div>

                    <div className="bg-white border border-slate-100 p-12 rounded-[60px] shadow-sm relative overflow-hidden">
                       <div className="relative z-10 space-y-10">
                          <div><p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2 italic">Regional Map</p><h4 className="text-3xl font-black text-slate-900 italic tracking-tighter">全球分佈地圖</h4></div>
                          <div className="w-full h-[600px] relative rounded-[40px] shadow-inner border border-slate-100 overflow-hidden">
                             {analytics?.regionalDistribution && <TaiwanTempleMap distribution={analytics.regionalDistribution} />}
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
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">直屬單位</th>
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
                               <td className="px-12 py-8">
                                  <button 
                                     onClick={async () => {
                                        if(confirm(`確定要${!acc.status || acc.status==='Active' ? '關閉' : '開啟'}此帳戶嗎？`)){
                                           const { updateAccountStatus } = await import('../actions');
                                           await updateAccountStatus(acc.id, 'SuperSales', (!acc.status || acc.status==='Active') ? 'Inactive' : 'Active');
                                           window.location.reload();
                                        }
                                     }}
                                     className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all ${(!acc.status || acc.status==='Active') ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                  >
                                     {(!acc.status || acc.status==='Active') ? '🟢 啟用中 (Active)' : '🔴 已停權 (Inactive)'}
                                  </button>
                               </td>
                               <td className="px-12 py-8 text-right flex justify-end gap-4">
                                  <button onClick={() => setTransferModalData({id: acc.id, role: 'SuperSales', name: acc.name})} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm">轉移資產</button>
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
                               <td className="px-12 py-8">
                                  <button 
                                     onClick={async () => {
                                        if(confirm(`確定要${!acc.status || acc.status==='Active' ? '關閉' : '開啟'}此帳戶嗎？`)){
                                           const { updateAccountStatus } = await import('../actions');
                                           await updateAccountStatus(acc.id, 'Distributor', (!acc.status || acc.status==='Active') ? 'Inactive' : 'Active');
                                           window.location.reload();
                                        }
                                     }}
                                     className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all ${(!acc.status || acc.status==='Active') ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                  >
                                     {(!acc.status || acc.status==='Active') ? '🟢 啟用中 (Active)' : '🔴 已停權 (Inactive)'}
                                  </button>
                               </td>
                               <td className="px-12 py-8 text-right flex justify-end gap-4">
                                  <button onClick={() => setTransferModalData({id: acc.id, role: 'Distributor', name: acc.name})} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm">轉移資產</button>
                                  <button onClick={() => {
                                     window.location.href = `/distributor/${acc.id}`;
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
                             <th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">直屬單位</th>
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
                               <td className="px-12 py-8 text-[12px] font-bold text-slate-600">{(() => {
                                  if (acc.distributorId && acc.distributorId !== 'system-hq') {
                                     return initialAccounts.find((a: any) => a.id === acc.distributorId)?.name || '系統總部 HQ';
                                  }
                                  if (acc.salesId) {
                                     return initialAccounts.find((a: any) => a.id === acc.salesId)?.name || '系統總部 HQ';
                                  }
                                  return '系統總部 HQ';
                               })()}</td>
                               <td className="px-12 py-8">
                                  <button 
                                     onClick={async () => {
                                        if(confirm(`確定要${!acc.status || acc.status==='Active' ? '關閉' : '開啟'}此帳戶嗎？`)){
                                           const { updateAccountStatus } = await import('../actions');
                                           await updateAccountStatus(acc.id, 'Temple', (!acc.status || acc.status==='Active') ? 'Inactive' : 'Active');
                                           window.location.reload();
                                        }
                                     }}
                                     className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all ${(!acc.status || acc.status==='Active') ? 'bg-emerald-50 text-emerald-600 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                  >
                                     {(!acc.status || acc.status==='Active') ? '🟢 啟用中 (Active)' : '🔴 已停權 (Inactive)'}
                                  </button>
                               </td>
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
                    {initialTemples.filter((t: any) => t.status === 'Pending' && !t.distributorId).map((app: any) => (
                       <div key={app.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-all">
                          <div className="flex items-center gap-10">
                             <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">🏮</div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                   <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{app.templeName}</h4>
                                   <span className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Pending Review</span>
                                 </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                                    申請身份：{app.creatorRole === 'SuperSales' ? `超級業務員 ${app.creatorId || ''}` : app.creatorRole === 'Distributor' ? `經銷商 ${app.creatorId || ''}` : app.creatorRole === 'System' ? '超級管理員' : (app.creatorRole || '超級業務員')} | 
                                    提交：超級管理員 | 
                                    日期：{app.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                 </p>
                                 <div className="flex gap-4 text-xs font-medium text-slate-500 mt-2">
                                    <span className="bg-slate-100 px-2 py-1 rounded">方案：{app.freeType === 'Trial' ? '免費試用' : app.freeType === 'Permanent' ? '永久免費' : '標準方案'}</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">繳費：{app.paymentCycle === 'Yearly' ? '年繳' : '月繳'}</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">{app.paymentCycle === 'Yearly' ? '年費' : '月費'}：NT$ {app.paymentCycle === 'Yearly' ? Number((app.monthlyRent || 3600) * 12 * 0.8).toLocaleString() : Number(app.monthlyRent || 0).toLocaleString()}</span>
                                 </div>
                                 <div className="flex gap-4 text-[11px] font-medium text-slate-400 mt-1">
                                    <span>負責人：{app.owner || app.contactName || app.name || '未提供'}</span>
                                    <span>電話：{app.templePhone || app.phone || app.contactPhone || '未提供'}</span>
                                 </div>
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
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">申請身份：授權經銷商 | 提交：{app.submittedBy}</p>
                                 <div className="flex gap-4 text-xs font-medium text-slate-500 mt-2">
                                    <span className="bg-slate-100 px-2 py-1 rounded">簽約金：${Number(app.customPrice || 0).toLocaleString()}</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">授權：{app.customDuration || app.years || 2} 年</span>
                                    <span className="bg-slate-100 px-2 py-1 rounded">配額：{app.nodes || app.customNodes || 100} 組</span>
                                 </div>
                                 <div className="flex gap-4 text-[11px] font-medium text-slate-400 mt-1">
                                    <span>負責人：{app.owner || app.contactName || '未提供'}</span>
                                    <span>統編：{app.taxId || '未提供'}</span>
                                    <span>電話：{app.phone || '未提供'}</span>
                                 </div>
                             </div>
                          </div>
                          <div className="flex gap-6">
                             <button onClick={()=>approveDistributorBySuperAdmin(app.id).then(()=>window.location.reload())} className="px-10 py-5 bg-emerald-600 text-white rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">核准授權</button>
                          </div>
                       </div>
                    ))}
                                         {pendingWithdrawals.map((req: any) => (
                        <div key={req.id} className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-amber-100 transition-all">
                           <div className="flex items-center gap-10">
                              <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 transition-transform">💰</div>
                              <div className="space-y-2">
                                 <div className="flex items-center gap-4">
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{req.salesName}</h4>
                                    <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Withdrawal Request</span>
                                 </div>
                                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">提領金額：${req.amount.toLocaleString()} | 日期：{req.date}</p>
                              </div>
                           </div>
                           <div className="flex flex-col gap-3">
                              <button onClick={() => { const url = prompt('請輸入匯款憑證圖片網址：'); if (url) approveWithdrawal(req.id, url).then(() => window.location.reload()); }} className="px-10 py-5 bg-amber-500 text-white rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-amber-600 transition-all">
                                 上傳憑證並核准
                              </button>
                           </div>
                        </div>
                     ))}
                     {withdrawals.filter((w: any) => w.status === 'Verified' || w.status === 'Approved').map((req: any) => (
                        <div key={req.id} className="bg-slate-50 p-12 rounded-[60px] border border-slate-100 flex items-center justify-between opacity-70">
                           <div className="flex items-center gap-10">
                              <div className="w-24 h-24 bg-white rounded-[40px] flex items-center justify-center text-4xl shadow-sm">✅</div>
                              <div className="space-y-2">
                                 <div className="flex items-center gap-4">
                                    <h4 className="text-2xl font-black text-slate-900 tracking-tighter italic">{req.salesName}</h4>
                                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Approved</span>
                                 </div>
                                 <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">提領金額：${req.amount.toLocaleString()} | 日期：{req.date}</p>
                              </div>
                           </div>
                           <div className="flex gap-4">
                              {req.receiptUrl && (
                                 <button onClick={() => setViewingReceiptUrl(req.receiptUrl)} className="px-8 py-4 bg-white text-slate-600 rounded-[20px] text-[10px] font-black tracking-widest hover:bg-slate-100 transition-all shadow-sm">
                                    🖼️ 查看匯款憑證
                                 </button>
                              )}
                           </div>
                        </div>
                     ))}
                     {initialTemples.filter(t => t.status === 'Pending').length === 0 && pendingDistributors.length === 0 && pendingWithdrawals.length === 0 && (
                        <div className="py-40 text-center space-y-6">
                           <p className="text-6xl">✨</p>
                           <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em] italic">目前沒有待處理事項 All Clear</p>
                        </div>
                     )}
                  </div>
                  {viewingReceiptUrl && (
                     <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setViewingReceiptUrl(null)}>
                        <div className="max-w-4xl w-full bg-white p-2 rounded-[40px] shadow-2xl relative" onClick={e => e.stopPropagation()}>
                           <button onClick={() => setViewingReceiptUrl(null)} className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-lg hover:scale-110 transition-all font-black text-xl z-10">✕</button>
                           <img src={viewingReceiptUrl} alt="Receipt" className="w-full h-auto rounded-[30px]" />
                        </div>
                     </div>
                  )}
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
                                <div className="flex items-center gap-3">
                                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">{plan.id}</span>
                                   <button 
                                      onClick={() => {
                                         setStoragePlans(storagePlans.filter(p => p.id !== plan.id));
                                      }}
                                      className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all text-xs"
                                      title="刪除此方案"
                                   >
                                      ✕
                                   </button>
                                </div>
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
                    <div className="flex justify-end pt-4 gap-4">
                       <button 
                          onClick={() => {
                             setStoragePlans([...storagePlans, { id: `SP-${Date.now()}`, name: '新方案', sizeGb: 100, priceMonthly: 0 }]);
                          }}
                          className="px-10 py-4 bg-slate-100 text-slate-600 rounded-[25px] text-xs font-black uppercase tracking-[0.2em] shadow-sm hover:bg-slate-200 transition-all"
                       >
                          + 新增方案 (ADD PLAN)
                       </button>
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
                                      <tr key={s.templeId || s.id || s.templeName} className="hover:bg-slate-50/30 transition-all">
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

                 <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6 mb-10">
                     <h4 className="text-lg font-black text-slate-900">上傳新資源</h4>
                     <form onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const formData = new FormData(form);
                        const { uploadTool, fetchSalesTools } = await import('@/app/actions');
                        const res = await uploadTool(formData);
                        if (res.success) {
                           alert('上傳成功！已同步至全球網路。');
                           const newTools = await fetchSalesTools();
                           setMediaList(newTools);
                           form.reset();
                        } else {
                           alert('上傳失敗');
                        }
                     }} className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <select name="type" className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none">
                              <option value="video">影片 (Video)</option>
                              <option value="photo">照片 (Photo)</option>
                              <option value="document">檔案 (Document)</option>
                              <option value="contract">電子合約 (E-Contract)</option>
                           </select>
                           <input name="title" placeholder="資源標題" required className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none" />
                           <input name="category" placeholder="分類 (例如: 業務培訓)" required className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none" />
                           <input name="thumbnail" placeholder="縮圖 URL (選填)" className="bg-slate-50 border-none rounded-2xl p-4 text-sm font-bold text-slate-700 outline-none" />
                        </div>
                        <div className="flex items-center gap-4">
                           <input type="file" name="file" className="flex-1 bg-slate-50 rounded-2xl p-3 text-sm font-bold text-slate-700 outline-none" required />
                           <button type="submit" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all">上傳同步 📤</button>
                        </div>
                     </form>
                  </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {mediaList.map((tool, i) => (
                       <div key={i} className="bg-white rounded-[60px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-2xl transition-all">
                          <div className="aspect-video relative bg-slate-100 overflow-hidden">
                             <img src={tool.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 opacity-80" />
                             <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                <span className="text-4xl">
                                   {tool.type === 'video' ? '▶️' : tool.type === 'photo' ? '🖼️' : tool.type === 'document' ? '📄' : '📝'}
                                </span>
                             </div>
                             <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                {tool.type === 'video' ? '影片' : tool.type === 'photo' ? '照片' : tool.type === 'document' ? '文件' : '電子合約'}
                             </div>
                          </div>
                          <div className="p-10 space-y-4">
                             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">{tool.category} • {tool.uploadedAt || '2026/05/19'}</p>
                             <h5 className="text-xl font-black text-slate-900 tracking-tight italic">{tool.title}</h5>
                             <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                                <span className="text-[10px] font-black text-emerald-500 uppercase italic">Synced All Nodes</span>
                                <div className="flex gap-4">
                                   <button onClick={() => window.open(tool.url, '_blank')} className="text-xs font-black text-indigo-500 hover:text-indigo-700 transition-all">查看</button>
                                   <a href={tool.url} download className="text-xs font-black text-slate-500 hover:text-slate-700 transition-all">下載</a>
                                   <button onClick={async () => {
                                      if(confirm('確定要移除此資源嗎？移除後全球網域皆會同步刪除。')) {
                                         const res = await deleteTool(tool.id);
                                         if (res.success) {
                                            setMediaList(mediaList.filter(t => t.id !== tool.id));
                                         }
                                      }
                                   }} className="text-xs font-black text-rose-300 hover:text-rose-500 transition-all">移除</button>
                                </div>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* --- 5. FINANCE HUB --- */}
                                 {activeTab === 'ai' && (
             <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
                {/* Header */}
                <div className="flex justify-between items-end px-4">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">AI Core & Model Orchestration</p>
                      <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">AI 引擎與方案管理</h3>
                   </div>
                </div>

                {/* --- 1. Unified AI Engine & API Keys (Redesigned - Light Theme) --- */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none"></div>
                   
                   <div className="relative z-10">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">API 端點與備用模型池</h4>
                          <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Global AI Endpoints & Model Pool</p>
                        </div>
                        <button onClick={async () => {
                           await import('@/app/actions').then(m => m.updateSystemConfig({ aiEndpoints: config.aiEndpoints }));
                           await saveAiApiModels(aiModels);
                           alert('✨ AI 參數設定已成功儲存！');
                        }} className="px-8 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                           💾 儲存所有 AI 設定
                        </button>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                         {/* Core Engines (Combined into a cleaner layout) */}
                         <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-slate-100">🧠</div>
                               <div>
                                  <h5 className="text-slate-800 font-black italic text-lg">對話大腦引擎 (主對話)</h5>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Intelligent QA Chat</p>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API URL</label>
                                  <input value={config?.aiEndpoints?.chatApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiUrl: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="https://api.openai.com/v1/chat/completions" />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API Key</label>
                                  <input type="password" value={config?.aiEndpoints?.chatApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, chatApiKey: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="sk-..." />
                               </div>
                            </div>
                         </div>
                         
                         <div className="bg-slate-50/80 backdrop-blur-sm border border-slate-200/60 p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl shadow-sm border border-slate-100">👁️</div>
                               <div>
                                  <h5 className="text-slate-800 font-black italic text-lg">視覺識別引擎 (OCR)</h5>
                                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Vision & Scanning</p>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API URL</label>
                                  <input value={config?.aiEndpoints?.ocrApiUrl || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiUrl: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="https://api.openai.com/v1/chat/completions" />
                               </div>
                               <div>
                                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">API Key</label>
                                  <input type="password" value={config?.aiEndpoints?.ocrApiKey || ''} onChange={e => setConfig({...config, aiEndpoints: {...config?.aiEndpoints, ocrApiKey: e.target.value}})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="sk-..." />
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Fallback Models List */}
                      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-sm">
                         <div className="flex justify-between items-center bg-slate-50/80 border-b border-slate-200 px-6 py-4">
                            <h5 className="text-slate-700 font-black italic text-sm">🔄 備用模型池 (Fallback Models Pool)</h5>
                            <button onClick={() => setAiModels([...aiModels, { id: 'NEW-'+Date.now(), name: '', apiKey: '', isEnabled: false }])} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">+ 新增備用模型</button>
                         </div>
                         <div className="p-4 space-y-3">
                            {aiModels.map((model, i) => (
                               <div key={i} className="flex flex-col md:flex-row gap-4 items-center bg-white p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                 <div className="w-full md:w-1/3">
                                   <input type="text" value={model.name || ''} onChange={e => {
                                     const copy = [...aiModels]; copy[i].name = e.target.value; setAiModels(copy);
                                   }} placeholder="模型名稱 (e.g. Claude 3 Opus)" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                                 </div>
                                 <div className="w-full md:w-1/2">
                                   <input type="password" value={model.apiKey || ''} onChange={e => {
                                     const copy = [...aiModels]; copy[i].apiKey = e.target.value; setAiModels(copy);
                                   }} placeholder="API Key" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all" />
                                 </div>
                                 <div className="w-full md:w-auto flex justify-end">
                                   <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={!!model.isEnabled} onChange={e => {
                                       const copy = [...aiModels]; copy[i].isEnabled = e.target.checked; setAiModels(copy);
                                     }} />
                                     <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                   </label>
                                 </div>
                                 <button onClick={() => {
                                    if(confirm('確定要刪除此備用模型嗎？')) setAiModels(aiModels.filter((_, idx) => idx !== i));
                                 }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                 </button>
                               </div>
                            ))}
                            {aiModels.length === 0 && (
                               <p className="text-xs text-slate-400 font-bold italic text-center py-6">目前尚無備用模型</p>
                            )}
                         </div>
                      </div>
                   </div>
                </div>

                {/* --- 2. AI Plans Pricing Redesign (Light Theme) --- */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-fuchsia-500/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-fuchsia-50 to-pink-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                   
                   <div className="relative z-10">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">AI 方案定價與配置</h4>
                          <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">SaaS Plan Pricing & Limits</p>
                        </div>
                        <button onClick={() => setAiPlans([...aiPlans, { id: 'NEW-'+Date.now(), name: '新方案', monthlyFee: 0, chatLimit: 0 }])} className="px-6 py-2.5 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 rounded-xl text-[11px] font-black tracking-widest uppercase hover:bg-fuchsia-600 hover:text-white transition-colors shadow-sm">
                           + 新增方案
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {aiPlans.map((plan, i) => (
                           <div key={i} className="group flex flex-col bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:shadow-fuchsia-500/10 hover:border-fuchsia-200 transition-all duration-300 relative overflow-hidden">
                              <div className="relative z-10 flex-1 space-y-5">
                                 <div>
                                    <label className="block text-[9px] font-black text-fuchsia-500 uppercase tracking-widest mb-1.5">Plan Name</label>
                                    <input type="text" value={plan.name} onChange={e => {
                                      const copy = [...aiPlans]; copy[i].name = e.target.value; setAiPlans(copy);
                                    }} className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xl font-black text-slate-800 italic tracking-tighter outline-none focus:border-fuchsia-300 focus:ring-2 focus:ring-fuchsia-500/10 transition-colors" />
                                 </div>
                                 
                                 <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monthly Fee (NT$)</label>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 focus-within:border-fuchsia-300 focus-within:ring-2 focus-within:ring-fuchsia-500/10 transition-colors">
                                       <span className="text-slate-400 font-bold text-sm">$</span>
                                       <input type="number" value={plan.monthlyFee} onChange={e => {
                                         const copy = [...aiPlans]; copy[i].monthlyFee = Number(e.target.value); setAiPlans(copy);
                                       }} className="w-full bg-transparent py-2 text-2xl font-black text-slate-800 outline-none" />
                                    </div>
                                 </div>

                                 <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Monthly Chat Limit</label>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 focus-within:border-fuchsia-300 focus-within:ring-2 focus-within:ring-fuchsia-500/10 transition-colors">
                                       <span className="text-slate-400 font-bold text-xs">Tokens</span>
                                       <input type="number" value={plan.chatLimit} onChange={e => {
                                         const copy = [...aiPlans]; copy[i].chatLimit = Number(e.target.value); setAiPlans(copy);
                                       }} className="w-full bg-transparent py-2 text-lg font-black text-slate-600 outline-none" />
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="relative z-10 mt-6 pt-5 border-t border-slate-100 flex justify-between items-center">
                                 <button onClick={() => {
                                    if(confirm('確定要刪除這個方案嗎？')) setAiPlans(aiPlans.filter((_, idx) => idx !== i));
                                 }} className="text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest px-2 py-1 rounded hover:bg-rose-50">
                                    Delete
                                 </button>
                                 <button onClick={async () => {
                                    await saveAiPlan(plan);
                                    alert(`✨ 方案 [${plan.name}] 已更新儲存！`);
                                 }} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-[10px] font-black tracking-widest uppercase hover:bg-fuchsia-600 shadow-md hover:shadow-fuchsia-500/30 transition-all">
                                   Save
                                 </button>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                </div>

                {/* --- 3. Temple AI Usage Analytics Table (Light Theme) --- */}
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-emerald-500/5">
                   <div className="flex justify-between items-end mb-6">
                     <div>
                       <h4 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">宮廟 AI 使用狀況監控</h4>
                       <p className="text-[11px] font-bold text-slate-500 mt-1 tracking-widest uppercase">Real-time Usage Analytics</p>
                     </div>
                   </div>
                   
                   <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                           <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">宮廟名稱</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">目前方案</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-1/4">當月使用額度</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">狀態</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">系統設定權</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {allTempleAiUsage.map((u, i) => {
                              const isExpired = new Date(u.expiryDate).getTime() < Date.now();
                              const isExhausted = u.usedCount >= u.chatLimit;
                              const usagePercent = u.isVip ? 0 : Math.min(100, Math.round((u.usedCount / Math.max(1, u.chatLimit)) * 100));
                              
                              let statusBadge = <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded text-[9px] font-black tracking-widest uppercase">啟用中 (Active)</span>;
                              if (u.isVip) statusBadge = <span className="px-2.5 py-1 bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 rounded text-[9px] font-black tracking-widest uppercase">無限免費 (VIP)</span>;
                              else if (!u.enabled) statusBadge = <span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] font-black tracking-widest uppercase">已停用 (Disabled)</span>;
                              else if (isExpired) statusBadge = <span className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded text-[9px] font-black tracking-widest uppercase">已過期 (Expired)</span>;
                              else if (isExhausted) statusBadge = <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 rounded text-[9px] font-black tracking-widest uppercase">額度耗盡 (Exhausted)</span>;

                              return (
                                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-5 text-sm font-black text-slate-700">{u.templeName}</td>
                                    <td className="px-6 py-5 text-xs font-bold text-slate-500">{u.planName}</td>
                                    <td className="px-6 py-5">
                                       <div className="flex justify-between items-end mb-1.5">
                                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{u.isVip ? '無限制' : 'Usage'}</span>
                                          <span className={`text-[10px] font-black tracking-widest ${usagePercent > 90 ? 'text-rose-500' : 'text-indigo-500'}`}>
                                             {u.isVip ? '∞' : `${u.usedCount} / ${u.chatLimit}`}
                                          </span>
                                       </div>
                                       {!u.isVip && (
                                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                             <div className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-400' : 'bg-indigo-400'}`} style={{ width: `${usagePercent}%` }}></div>
                                          </div>
                                       )}
                                    </td>
                                    <td className="px-6 py-5">{statusBadge}</td>
                                    <td className="px-6 py-5 text-right">
                                       <button onClick={async () => {
                                          await grantTempleAiVip(u.templeId, !u.isVip);
                                          fetchAllTempleAiUsage().then(setAllTempleAiUsage);
                                       }} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${u.isVip ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700' : 'bg-slate-800 border-slate-800 text-white shadow hover:bg-indigo-600 hover:border-indigo-600'}`}>
                                          {u.isVip ? '取消特權 (Revoke)' : '✨ 設為無限免費'}
                                       </button>
                                    </td>
                                 </tr>
                              )
                           })}
                           {allTempleAiUsage.length === 0 && (
                              <tr><td colSpan={5} className="px-6 py-12 text-center text-[11px] font-black uppercase tracking-widest text-slate-400 italic">目前沒有任何宮廟使用 AI 助理</td></tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'finance' && (() => {
              const filteredRecords = finance?.records?.filter((r: any) => r.date?.startsWith(financeMonth)) || [];
              const dynTotalRevenue = filteredRecords.filter((r: any) => r.type === 'INCOME').reduce((s: number, r: any) => s + r.amount, 0);
              const dynTotalCommission = filteredRecords.filter((r: any) => r.type === 'EXPENSE').reduce((s: number, r: any) => s + r.amount, 0);
              const dynNetProfit = dynTotalRevenue - dynTotalCommission;
              const templeIncome = filteredRecords.filter((r: any) => r.type === 'INCOME' && r.category !== 'AUTH_FEE').reduce((s: number, r: any) => s + r.amount, 0);
              const distIncome = filteredRecords.filter((r: any) => r.type === 'INCOME' && r.category === 'AUTH_FEE').reduce((s: number, r: any) => s + r.amount, 0);

              return (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-10 duration-700">
                 {/* Month Filter Header */}
                 <div className="flex justify-between items-end px-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] italic">Dynamic Ledger</p>
                       <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">中央財務結算</h3>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-full border border-slate-200 shadow-sm">
                       <span className="text-[11px] font-black text-slate-400 pl-4 uppercase tracking-widest">結算月份</span>
                       <select 
                         value={financeMonth}
                         onChange={(e) => setFinanceMonth(e.target.value)}
                         className="bg-slate-50 text-slate-900 border-none font-black rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-emerald-500 cursor-pointer outline-none transition-all"
                       >
                         <option value="2026-07">2026 年 7 月</option>
                         <option value="2026-06">2026 年 6 月</option>
                         <option value="2026-05">2026 年 5 月</option>
                         <option value="2026-04">2026 年 4 月</option>
                         <option value="2026-03">2026 年 3 月</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-10">
                       <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-emerald-500 underline-offset-8">交易明細 ({financeMonth})</h4>
                       
                       <div className="space-y-4 h-[400px]">
                          {(() => {
                             const daysInMonth = new Date(parseInt(financeMonth.split('-')[0]), parseInt(financeMonth.split('-')[1]), 0).getDate();
                             const chartData = Array.from({length: daysInMonth}, (_, i) => {
                                const dayStr = String(i + 1).padStart(2, '0');
                                const dateStr = `${financeMonth}-${dayStr}`;
                                const dayRecords = filteredRecords.filter((r: any) => r.date === dateStr);
                                const income = dayRecords.filter((r: any) => r.type === 'INCOME').reduce((s: number, r: any) => s + r.amount, 0);
                                return { name: dayStr, 收益: income };
                             });

                             if (filteredRecords.length === 0) {
                                return (
                                   <div className="py-16 text-center opacity-50 flex flex-col items-center justify-center h-full">
                                      <div className="text-4xl mb-4">📭</div>
                                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{financeMonth} 沒有任何交易紀錄</p>
                                   </div>
                                );
                             }

                             return (
                                <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                      <Bar dataKey="收益" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={40}>
                                         {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.收益 > 0 ? '#10b981' : '#cbd5e1'} />
                                         ))}
                                      </Bar>
                                   </BarChart>
                                </ResponsiveContainer>
                             );
                          })()}
                       </div>
                    </div>
                    
                    <div className="space-y-8">
                       {/* Dynamic Summary Panel */}
                       <div className="bg-slate-900 p-12 rounded-[60px] shadow-2xl text-white space-y-10 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-emerald-500/30 transition-all duration-1000"></div>
                          <div className="relative z-10">
                             <div><p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2 italic">Monthly Summary ({financeMonth})</p><h4 className="text-3xl font-black italic tracking-tighter leading-tight">當月統計中心</h4></div>
                             
                             <div className="space-y-6 mt-10">
                                {/* 分類收入 */}
                                <div className="space-y-4 bg-white/5 p-6 rounded-[30px] border border-white/5">
                                   <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-indigo-300 uppercase">宮廟端收入</span><span className="text-lg font-black italic text-indigo-100">${templeIncome.toLocaleString()}</span></div>
                                   <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-amber-300 uppercase">經銷端授權收入</span><span className="text-lg font-black italic text-amber-100">${distIncome.toLocaleString()}</span></div>
                                </div>

                                <div className="space-y-6 bg-white/10 p-8 rounded-[40px] border border-white/10 shadow-inner backdrop-blur-xl">
                                   <div className="flex justify-between border-b border-white/10 pb-4"><span className="text-[11px] font-bold text-slate-300 uppercase">當月總營收</span><span className="text-xl font-black italic">${dynTotalRevenue.toLocaleString()}</span></div>
                                   <div className="flex justify-between border-b border-white/10 pb-4"><span className="text-[11px] font-bold text-slate-300 uppercase">當月支出/分潤</span><span className="text-xl font-black italic text-rose-300">-${dynTotalCommission.toLocaleString()}</span></div>
                                   <div className="flex justify-between pt-2"><span className="text-[11px] font-black text-emerald-400 uppercase">當月淨利</span><span className="text-3xl font-black italic text-white">${dynNetProfit.toLocaleString()}</span></div>
                                </div>
                             </div>
                             <button className="w-full mt-8 py-6 bg-emerald-600 text-white rounded-[30px] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-500 active:scale-95 transition-all">核發本月分潤 💳</button>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* 超級業務員提領審核 */}
                 <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-8 mt-12">
                    <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-indigo-500 underline-offset-8">超級業務員提領審核 (Super Sales Withdrawals)</h4>
                    <div className="space-y-4">
                       {(() => {
                          const wList = finance?.superSalesWithdrawals || [];
                          if (wList.length === 0) {
                            return <p className="text-center text-sm font-bold text-slate-400 py-10">目前沒有提領申請</p>;
                          }

                          return wList.map((w: any) => (
                            <div key={w.id} className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                               <div className="flex-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{w.date}</p>
                                  <p className="text-lg font-black text-slate-900">{w.salesName}</p>
                                  <p className="text-sm font-bold text-slate-500 mt-1">申請提領金額: <span className="text-rose-500 text-xl font-black italic">NT$ {(w.amount || 0).toLocaleString()}</span></p>
                               </div>
                               
                               {w.status === 'Approved' ? (
                                  <div className="flex flex-col items-end gap-2">
                                     <span className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-full text-xs font-black uppercase tracking-widest">已匯款</span>
                                     {w.receiptUrl && (
                                        <button 
                                           onClick={() => window.open(w.receiptUrl, '_blank')}
                                           className="text-[10px] text-blue-500 underline font-bold"
                                        >
                                           查看匯款截圖
                                        </button>
                                     )}
                                  </div>
                               ) : (
                                  <div className="flex flex-col items-end gap-4 w-full md:w-auto">
                                     <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={(e) => {
                                           const file = e.target.files?.[0];
                                           if(file) {
                                              const reader = new FileReader();
                                              reader.onload = (ev) => {
                                                 setWithdrawalProofs(prev => ({ ...prev, [w.id]: ev.target?.result as string }));
                                              };
                                              reader.readAsDataURL(file);
                                           }
                                        }}
                                        className="text-xs w-full max-w-[200px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                     />
                                     <button 
                                        onClick={async (e) => {
                                           const proof = withdrawalProofs[w.id];
                                           if (!proof) {
                                              alert('請先上傳匯款圖片');
                                              return;
                                           }
                                           try {
                                              const target = e.currentTarget;
                                              const originalText = target.innerText;
                                              target.innerText = "處理中...";
                                              target.disabled = true;

                                              const { approveSuperSalesWithdrawal, fetchSuperAdminFinancials } = await import('@/app/actions');
                                              const res = await approveSuperSalesWithdrawal(w.id, proof);

                                              if (res && res.success === false) {
                                                 alert('操作失敗: ' + res.error);
                                                 target.innerText = originalText;
                                                 target.disabled = false;
                                                 return;
                                              }

                                              alert('匯款確認成功！');
                                              const updated = await fetchSuperAdminFinancials();
                                              setFinance({ records: updated.records, summary: updated.summary, templePayments: updated.templePayments, superSalesWithdrawals: updated.superSalesWithdrawals });
                                           } catch (err) {
                                              console.error(err);
                                              alert('系統發生錯誤！');
                                           }
                                        }}
                                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-full cursor-pointer transition-colors shadow-md disabled:opacity-50"
                                     >
                                        已匯款
                                     </button>
                                  </div>
                               )}
                            </div>
                          ));
                       })()}
                    </div>
                 </div>

                 {/* 宮廟付款狀態 */}
                 <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-8 mt-12">
                    <div className="flex justify-between items-center">
                       <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-amber-500 underline-offset-8">宮廟付款審核 (Temple Payments)</h4>
                       <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-full border border-slate-200 shadow-sm">
                          <span className="text-[11px] font-black text-slate-400 pl-4 uppercase tracking-widest">篩選月份</span>
                          <select 
                            value={templePaymentMonth}
                            onChange={(e) => setTemplePaymentMonth(e.target.value)}
                            className="bg-white text-slate-900 border-none font-black rounded-full px-6 py-2 text-sm focus:ring-2 focus:ring-amber-500 cursor-pointer outline-none transition-all shadow-sm"
                          >
                            <option value="2026-07">2026 年 7 月</option>
                            <option value="2026-06">2026 年 6 月</option>
                            <option value="2026-05">2026 年 5 月</option>
                            <option value="2026-04">2026 年 4 月</option>
                            <option value="2026-03">2026 年 3 月</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-4">
                       {(() => {
                          const currentPayments = (finance?.templePayments || []).flatMap((t: any) => 
                            (t.bills || []).filter((b: any) => b.billingDate === templePaymentMonth || b.dueDate?.startsWith(templePaymentMonth)).map((b: any) => ({
                              ...b, templeName: t.name, creatorRole: t.creatorRole
                            }))
                          );

                          if (currentPayments.length === 0) {
                            return <p className="text-center text-sm font-bold text-slate-400 py-10">這個月份目前沒有帳單紀錄</p>;
                          }

                          return currentPayments.map((payment: any) => (
                            <div key={payment.id} className="bg-slate-50 p-6 rounded-[30px] border border-slate-100 flex items-center justify-between">
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payment.billingDate || payment.dueDate}</p>
                                  <p className="text-lg font-black text-slate-900">{payment.templeName}</p>
                                  <p className="text-sm font-bold text-slate-500 mt-1">金額: NT$ {(payment.amount || 0).toLocaleString()} <span className="text-xs text-slate-400 ml-2">項目: {payment.type === 'MonthlyFee' ? '月租費' : payment.type}</span></p>
                               </div>
                               <div className="flex flex-col items-end gap-2">
                                  <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => {
                                           const actualReceiptUrl = payment.receiptUrl || payment.receipt_url;
                                           if (actualReceiptUrl) {
                                              if (actualReceiptUrl.startsWith('data:')) {
                                                 const a = document.createElement('a');
                                                 a.href = actualReceiptUrl;
                                                 a.download = `receipt_${payment.templeName}_${payment.type}.png`;
                                                 a.click();
                                              } else {
                                                 window.open(actualReceiptUrl, '_blank');
                                              }
                                           } else {
                                              alert('該宮廟尚未上傳付款截圖');
                                           }
                                        }} 
                                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-sm ${(payment.receiptUrl || payment.receipt_url) ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`} 
                                        title={(payment.receiptUrl || payment.receipt_url) ? "下載/查看匯款截圖" : "尚無截圖"}
                                     >
                                        👁️
                                     </button>
                                     <button 
                                        onClick={async (e) => {
                                           try {
                                              const target = e.currentTarget;
                                              const originalText = target.innerText;
                                              target.innerText = "處理中...";
                                              target.disabled = true;

                                              const { toggleBillStatusSimple, approveTempleBill, fetchSuperAdminFinancials } = await import('@/app/actions');
                                              let res;
                                              if (payment.status === 'Paid') {
                                                 res = await toggleBillStatusSimple(payment.id, 'Unpaid');
                                              } else {
                                                 res = await approveTempleBill(payment.id);
                                              }

                                              if (res && res.success === false) {
                                                 alert('操作失敗，請稍後再試！');
                                                 target.innerText = originalText;
                                                 target.disabled = false;
                                                 return;
                                              }

                                              const updated = await fetchSuperAdminFinancials();
                                              setFinance({ records: updated.records, summary: updated.summary, templePayments: updated.templePayments, superSalesWithdrawals: updated.superSalesWithdrawals });
                                           } catch (err) {
                                              console.error(err);
                                              alert('系統發生錯誤！');
                                           }
                                        }}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 ${payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : payment.status === 'PendingVerification' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}
                                     >
                                       {payment.status === 'Paid' ? '已付款' : '未付款'}
                                     </button>
                                  </div>
                               </div>
                            </div>
                          ));
                       })()}
                    </div>
                 </div>
              </div>
              );
           })()}
           {/* --- 6. DATA BRIDGE --- */}
           {activeTab === 'bridge' && (() => {
              const todayStr = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
                
              const filterBridgeNode = (node: any): boolean => {
                 let dateMatch = true;
                 if (bridgeDateFilter === 'today') {
                    if (!node.timestamp) dateMatch = false;
                    else {
                       const nodeDateStr = new Date(node.timestamp).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
                       if (nodeDateStr !== todayStr) dateMatch = false;
                    }
                 } else if (bridgeDateFilter !== 'all') {
                    if (!node.timestamp) dateMatch = false;
                    else {
                       const nodeDateStr = new Date(node.timestamp).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }).replace(/\//g, '-');
                       if (nodeDateStr !== bridgeDateFilter.replace(/\//g, '-')) dateMatch = false;
                    }
                 }

                 let searchMatch = true;
                 if (bridgeSearch) {
                    searchMatch = !!node.name?.toLowerCase().includes(bridgeSearch.toLowerCase());
                 }
                 
                 // If node itself matches both, return true
                 if (dateMatch && searchMatch) return true;

                 // If it doesn't match, check if any child matches
                 if (node.children) {
                    return node.children.some((child: any) => filterBridgeNode(child));
                 }
                 return false;
              };

              const toggleNode = (id: string) => {
                 const next = new Set(expandedNodes);
                 if (next.has(id)) next.delete(id);
                 else next.add(id);
                 setExpandedNodes(next);
              };

              const renderNode = (node: any, level: number) => {
                 const hasChildren = node.children && node.children.length > 0;
                 const isMatch = filterBridgeNode(node);
                 if (!isMatch && (!node.children || !node.children.some(filterBridgeNode))) return null;

                 const isSearching = bridgeSearch.length > 0;
                 const isExpanded = isSearching ? true : expandedNodes.has(node.id);
                 const isQuotaEditable = node.type === 'distributor' || node.type === 'dist-sales';

                 const handleEditQuota = async (e: React.MouseEvent, targetNode: any) => {
                    e.stopPropagation();
                    const q = window.prompt(`修改 ${targetNode.name} 的帳戶配額 (目前為 ${targetNode.nodes || 100})`, String(targetNode.nodes || 100));
                    if (!q || isNaN(Number(q))) return;
                    const newQuota = Number(q);
                    try {
                       const { updateDistributorQuota } = await import('@/app/actions');
                       await updateDistributorQuota(targetNode.id, newQuota);
                       alert('配額修改成功，系統將重整。');
                       window.location.reload();
                    } catch (err) {
                       console.error(err);
                       alert('配額修改失敗');
                    }
                 };

                 const icons: any = {
                    'super-admin': '🌐',
                    'super-sales': '👑',
                    'distributor': '🏢',
                    'dist-sales': '👔',
                    'temple': '⛩️'
                 };
                 const badges: any = {
                    'super-admin': '超級管理員',
                    'super-sales': '超級業務',
                    'distributor': '經銷代理商',
                    'dist-sales': '經銷業務',
                    'temple': '宮廟'
                 };
                 const colors: any = {
                    'super-admin': 'bg-slate-900 text-white border-slate-700',
                    'super-sales': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    'distributor': 'bg-amber-50 text-amber-700 border-amber-200',
                    'dist-sales': 'bg-blue-50 text-blue-700 border-blue-200',
                    'temple': 'bg-emerald-50 text-emerald-700 border-emerald-200'
                 };

                  return (
                     <div key={node.id} className="relative group">
                        <div 
                           onClick={() => toggleNode(node.id)}
                           className={`flex items-center gap-4 py-3 px-4 rounded-2xl cursor-pointer transition-all duration-300 relative z-10
                              ${level === 0 ? 'hover:bg-slate-50' : 'hover:bg-slate-50/50'}
                           `}
                           style={{ paddingLeft: `${level * 28 + 16}px` }}
                        >
                           {/* 連接線 */}
                           {level > 0 && (
                              <div className="absolute left-[calc(-14px)] top-1/2 w-4 border-t-2 border-slate-200" />
                           )}

                           <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              {hasChildren && (
                                 <span className="text-slate-400 hover:text-indigo-600 transition-colors">
                                    {isExpanded ? '▼' : '▶'}
                                 </span>
                              )}
                           </div>
                           
                           <span className="text-2xl shrink-0">{icons[node.type]}</span>
                           
                           <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-3">
                                 <span className={`text-sm font-black ${isMatch ? 'text-slate-900' : 'text-slate-700'}`}>{node.name}</span>
                                 <span className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${colors[node.type]}`}>{badges[node.type]}</span>
                                 {node.status && (
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${node.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                       {node.status === 'Active' ? '生效中' : node.status}
                                    </span>
                                 )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500 font-medium">
                                 {node.type !== 'super-admin' && node.joinedAt && (
                                    <span>開設: {new Date(node.joinedAt).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })} {node.parentName ? `(由 ${node.parentName} 建立)` : ''}</span>
                                 )}
                                 {node.expirationDate && (
                                    <span>合約至: {new Date(node.expirationDate).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' })}</span>
                                 )}
                                 {node.planName && (
                                    <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                       {node.planName} {node.price > 0 ? (node.planName.includes('經銷') && node.price >= 160000 ? `(NT$${node.price.toLocaleString()} / ${node.durationYears || 2}年 / ${node.nodes || 100}組宮廟帳戶)` : `(NT$${node.price.toLocaleString()})`) : '(免費)'}
                                    </span>
                                 )}
                                 {node.type === 'temple' && node.freeType !== 'Permanent' && (() => {
                                    const now = new Date();
                                    const start = node.billingStartDate ? new Date(node.billingStartDate) : new Date(node.joinedAt);
                                    const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                    if (diffDays > 0) {
                                       return <span className="text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shadow-sm">剩餘 {diffDays} 天試用</span>;
                                    } else {
                                       const month = now.getMonth() + 1;
                                       const year = now.getFullYear();
                                       const periodStr = node.paymentCycle === 'Yearly' ? `${year}年` : `${month}月`;
                                       const paidStr = node.paymentStatus === 'Paid' ? '已付款' : '未付款';
                                       const colorClass = node.paymentStatus === 'Paid' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200';
                                       return <span className={`${colorClass} px-1.5 py-0.5 rounded border shadow-sm`}>{periodStr} {paidStr}</span>;
                                    }
                                 })()}
                              </div>
                           </div>
                        </div>
                        {isExpanded && hasChildren && (
                           <div className="w-full border-l-2 border-slate-100 ml-[28px]">
                              {node.children.map((child: any) => <React.Fragment key={child.id}>{renderNode(child, level + 1)}</React.Fragment>)}
                           </div>
                        )}
                     </div>
                  );
               };

              const handleExportBridge = () => {
                 let csv = "\\uFEFF節點類型,節點名稱,節點ID,建立日期\\n";
                 const extract = (node: any) => {
                    if (filterBridgeNode(node)) {
                       const nodeDate = node.timestamp ? new Date(node.timestamp).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }) : '未知';
                       const typeStr = node.type === 'super-sales' ? '超級業務' : node.type === 'distributor' ? '經銷代理商' : node.type === 'dist-sales' ? '經銷業務' : '宮廟';
                       csv += `${typeStr},${node.name},${node.id},${nodeDate}\\n`;
                    }
                    if (node.children) {
                       node.children.forEach(extract);
                    }
                 };
                 bridgeTree.forEach(extract);
                 const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                 const url = window.URL.createObjectURL(blob);
                 const a = document.createElement('a');
                 a.href = url;
                 a.download = `data_bridge_export_${new Date().toISOString().split('T')[0]}.csv`;
                 a.click();
              };

              return (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex justify-between items-end px-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">Database Connection</p>
                       <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">中央數據連動 (Data Bridge)</h3>
                    </div>
                    <div className="flex items-center gap-4">
                       <select
                         value={bridgeDateFilter}
                         onChange={(e) => setBridgeDateFilter(e.target.value)}
                         className="px-6 py-3 rounded-full border border-slate-200 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                       >
                         <option value="all">全部日期紀錄</option>
                         <option value="today">今日新增節點</option>
                       </select>
                       <div className="flex items-center gap-4 bg-white p-2 rounded-full border border-slate-200 shadow-sm w-80">
                          <span className="pl-4 text-slate-400">🔍</span>
                          <input 
                            type="text" 
                            placeholder="搜尋節點名稱 (自動展開)..." 
                            value={bridgeSearch}
                            onChange={(e) => setBridgeSearch(e.target.value)}
                            className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-900 outline-none"
                          />
                       </div>
                       <button onClick={handleExportBridge} className="px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-2">
                          💾 匯出拓樸
                       </button>
                    </div>
                 </div>

                 <div className="bg-white border border-slate-200 rounded-[40px] shadow-sm overflow-hidden min-h-[500px]">
                    <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                       <span className="text-sm font-black uppercase tracking-widest italic text-indigo-300">全網節點拓樸視圖</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Node Topology</span>
                    </div>
                    <div className="py-4">
                       {bridgeTree.map(ss => <React.Fragment key={ss.id}>{renderNode(ss, 0)}</React.Fragment>)}
                       {bridgeTree.length === 0 && (
                          <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                             尚無資料節點
                          </div>
                       )}
                    </div>
                 </div>
              </div>
              );
           })()}

           {/* --- 7. LOGS --- */}
           {activeTab === 'logs' && (() => {
              const filteredLogs = logs.filter(l => {
                 const uName = (l.user || l.adminId || 'SuperAdmin').toLowerCase();
                 const act = (l.action || '').toLowerCase();
                 if (logUserFilter && !uName.includes(logUserFilter.toLowerCase())) return false;
                 if (logActionFilter && !act.includes(logActionFilter.toLowerCase())) return false;
                 return true;
              });

              return (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <div className="flex justify-between items-end px-4">
                    <div className="space-y-2"><p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] italic">System Audit Trail</p><h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">決策日誌與審計紀錄</h3></div>
                    <div className="flex gap-4">
                       <input 
                         type="text" 
                         placeholder="篩選執行者..." 
                         value={logUserFilter}
                         onChange={(e) => setLogUserFilter(e.target.value)}
                         className="px-6 py-4 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                       <input 
                         type="text" 
                         placeholder="篩選事件分類..." 
                         value={logActionFilter}
                         onChange={(e) => setLogActionFilter(e.target.value)}
                         className="px-6 py-4 bg-white border border-slate-200 rounded-full text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                       <button onClick={handleDownloadLogs} className="px-8 py-4 bg-slate-900 text-white rounded-[30px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                          💾 匯出過濾結果 (CSV)
                       </button>
                    </div>
                 </div>
                 <section className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50/50">
                          <tr>
                             <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100">時間戳記 Timestamp</th>
                             <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100">執行者 User</th>
                             <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100">事件分類 Action</th>
                             <th className="px-12 py-8 text-[11px] font-black text-slate-400 uppercase tracking-widest italic border-b border-slate-100">詳細紀錄 Details</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {filteredLogs.map((log: any, i) => (
                            <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                               <td className="px-12 py-6 text-[12px] font-bold text-slate-400 whitespace-nowrap">{log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : ''}</td>
                               <td className="px-12 py-6"><span className="px-4 py-1.5 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700 rounded-full text-[10px] font-black uppercase italic text-slate-600 transition-colors">{log.user || log.adminId || 'SuperAdmin'}</span></td>
                               <td className="px-12 py-6 text-[11px] font-black text-slate-500 tracking-widest uppercase"><span className="px-3 py-1 bg-slate-800 text-white rounded-md">{log.action || 'SYSTEM_ACTION'}</span></td>
                               <td className="px-12 py-6 text-sm font-bold text-slate-700 italic">{log.target ? `${log.target} | ` : ''}{log.details || log.action}</td>
                            </tr>
                          ))}
                          {filteredLogs.length === 0 && (
                             <tr><td colSpan={4} className="px-12 py-16 text-center text-slate-400 font-bold uppercase tracking-widest">沒有符合條件的日誌紀錄</td></tr>
                          )}
                       </tbody>
                    </table>
                 </section>
              </div>
              );
           })()}

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
                                        const rentInput = document.getElementById('fixedMonthlyRent') as HTMLInputElement;
                                        const discInput = document.getElementById('yearlyDiscountRate') as HTMLInputElement;
                                        const rent = parseInt(rentInput.value);
                                        const disc = parseInt(discInput.value);
                                        
                                        if (isNaN(rent) || rent < 0) {
                                            alert('錯誤：月租費必須為大於或等於 0 的數字');
                                            rentInput.focus();
                                            return;
                                        }
                                        if (isNaN(disc) || disc < 0 || disc > 100) {
                                            alert('錯誤：年繳優惠折扣率必須介於 0 到 100 之間');
                                            discInput.focus();
                                            return;
                                        }
                                        
                                        startTransition(async () => {
                                           await updateSystemConfig({ fixedMonthlyRent: rent, yearlyDiscountRate: disc });
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

                 {/* 宮廟繳費狀態模組 */}
                 <div className="bg-white p-12 rounded-[60px] border border-slate-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                       <h4 className="text-xl font-black text-slate-900 italic uppercase tracking-tighter underline decoration-4 decoration-indigo-500 underline-offset-8">宮廟營運繳費狀態 (Temple Payments)</h4>
                       <select 
                           value={templePaymentFilter} 
                           onChange={e => setTemplePaymentFilter(e.target.value)}
                           className="bg-slate-50 text-slate-900 border-none font-black rounded-full px-6 py-2 text-[11px] focus:ring-2 focus:ring-indigo-500 outline-none"
                       >
                           <option value="ALL">全部狀態</option>
                           <option value="Paid">已付款 (Paid)</option>
                           <option value="Unpaid">未付款 (Unpaid)</option>
                           <option value="VIP">免費/VIP</option>
                       </select>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                           <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">宮廟名稱</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">週期</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">租金/費用</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">計費起始日</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">繳費狀態</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {finance?.templePayments?.filter((tp: any) => templePaymentFilter === 'ALL' || tp.status === templePaymentFilter).map((tp: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                 <td className="px-6 py-4 text-sm font-black text-slate-800 italic">{tp.name}</td>
                                 <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{tp.paymentCycle}</td>
                                 <td className="px-6 py-4 text-sm font-black text-slate-900">${(tp.rentAmount !== undefined ? tp.rentAmount : (tp.paymentCycle === 'Yearly' ? tp.monthlyRent * 12 : tp.monthlyRent)).toLocaleString()}</td>
                                 <td className="px-6 py-4 text-xs font-bold text-slate-400">{tp.billingStartDate ? tp.billingStartDate.split('T')[0] : 'N/A'}</td>
                                 <td className="px-6 py-4">
                                    {tp.freeType !== 'Permanent' && (() => {
                                        const now = new Date();
                                        const start = tp.billingStartDate ? new Date(tp.billingStartDate) : new Date(tp.joinedAt || Date.now());
                                        const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 3600 * 24));
                                        if (diffDays > 0) {
                                           return <span className="px-3 py-1 bg-amber-50 text-amber-500 rounded text-[10px] font-black uppercase tracking-widest border border-amber-200">剩餘 {diffDays} 天試用</span>;
                                        } else {
                                           return (
                                              <>
                                                {tp.status === 'Paid' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-100">已付款</span>}
                                                {tp.status === 'Unpaid' && <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded text-[10px] font-black uppercase tracking-widest border border-rose-100">未付款 (${tp.unpaidAmount.toLocaleString()})</span>}
                                                {tp.status === 'PendingVerification' && <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-black uppercase tracking-widest border border-amber-100">審核中</span>}
                                              </>
                                           );
                                        }
                                    })()}
                                    {tp.status === 'VIP' && <span className="px-3 py-1 bg-fuchsia-50 text-fuchsia-600 rounded text-[10px] font-black uppercase tracking-widest border border-fuchsia-100">VIP/終身免繳</span>}
                                 </td>
                              </tr>
                           ))}
                           {(!finance?.templePayments || finance.templePayments.filter((tp: any) => templePaymentFilter === 'ALL' || tp.status === templePaymentFilter).length === 0) && (
                              <tr><td colSpan={5} className="px-6 py-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest italic">目前沒有符合的宮廟資料</td></tr>
                           )}
                        </tbody>
                    </table>
                 </div>
              </div>
           )}

        </div>
      
           {activeTab === 'b2b_payment' && b2bPayment && b2bPayment.serviceMapping && (
              <div className="p-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto space-y-12">
                 <div className="text-center space-y-4 mb-16">
                    <h3 className="text-4xl font-black text-slate-900 italic tracking-tighter">超級管理員 B2B 收款與分流設定</h3>
                    <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Payment Gateway & Service Routing</p>
                 </div>
                 
                 <div className="space-y-12">
                                        {/* 支付通道憑證設定 */}
                    <div className="bg-white p-12 rounded-[50px] border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none"></div>
                       
                       <div className="relative z-10">
                          <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                             <span className="text-3xl">🔐</span> 通道憑證配置 (Gateway Credentials)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* ECPay */}
                             <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 space-y-4 hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                  <h5 className="font-black text-lg italic tracking-widest text-indigo-500">ECPay 綠界科技</h5>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={!!b2bPayment.thirdParty?.enabled} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, enabled: e.target.checked}})} />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                                  </label>
                                </div>
                                <input type="text" placeholder="Merchant ID" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.thirdParty?.merchantId || ''} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, merchantId: e.target.value}})} />
                                <input type="text" placeholder="Hash Key" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.thirdParty?.hashKey || ''} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, hashKey: e.target.value}})} />
                                <input type="text" placeholder="Hash IV" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.thirdParty?.hashIV || ''} onChange={e => setB2bPayment({...b2bPayment, thirdParty: {...b2bPayment.thirdParty, hashIV: e.target.value}})} />
                             </div>
                             
                             {/* LINE Pay */}
                             <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 space-y-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                  <h5 className="font-black text-lg italic tracking-widest text-emerald-500">LINE Pay</h5>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={!!b2bPayment.linePay?.enabled} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, enabled: e.target.checked}})} />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                  </label>
                                </div>
                                <input type="text" placeholder="Channel ID" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.linePay?.channelId || ''} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelId: e.target.value}})} />
                                <input type="text" placeholder="Channel Secret" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.linePay?.channelSecret || ''} onChange={e => setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelSecret: e.target.value}})} />
                             </div>

                             {/* Bank Transfer */}
                             <div className="bg-slate-50/80 backdrop-blur-sm p-8 rounded-3xl border border-slate-200/60 space-y-4 md:col-span-2 hover:shadow-lg hover:border-amber-200 transition-all duration-300">
                                <div className="flex justify-between items-center mb-6">
                                  <h5 className="font-black text-lg italic tracking-widest text-amber-500">銀行匯款帳戶</h5>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={!!b2bPayment.customTransfer?.enabled} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, enabled: e.target.checked}})} />
                                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                  </label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                   <input type="text" placeholder="銀行代碼" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400" value={b2bPayment.customTransfer?.bankCode || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, bankCode: e.target.value}})} />
                                   <input type="text" placeholder="銀行名稱" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 md:col-span-1" value={b2bPayment.customTransfer?.bankName || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, bankName: e.target.value}})} />
                                   <input type="text" placeholder="帳戶名稱" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 md:col-span-2" value={b2bPayment.customTransfer?.accountName || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, accountName: e.target.value}})} />
                                   <input type="text" placeholder="銀行帳號" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 outline-none transition-all placeholder:text-slate-400 md:col-span-4" value={b2bPayment.customTransfer?.accountNo || ''} onChange={e => setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, accountNo: e.target.value}})} />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* 服務分流設定 */}
                    <div className="bg-white p-12 rounded-[50px] border-2 border-slate-100 shadow-xl relative">
                       <h4 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                          <span className="text-3xl">🔀</span> 服務分流設定 (Service Routing)
                       </h4>
                       <div className="space-y-6">
                          {[
                             { id: 'storage', name: '擴充空間方案', icon: '💾' },
                             { id: 'ai', name: 'AI 引擎方案', icon: '🤖' },
                             { id: 'rent', name: '宮廟系統租費', icon: '⛩️' }
                          ].map(service => (
                             <div key={service.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-slate-50 rounded-3xl border border-slate-100 gap-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-slate-100">{service.icon}</div>
                                   <div>
                                      <h5 className="font-black text-slate-800 text-lg">{service.name}</h5>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.id}_ROUTING</p>
                                   </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                   {['thirdParty', 'linePay', 'customTransfer'].map(provider => {
                                      const label = provider === 'thirdParty' ? 'ECPay' : provider === 'linePay' ? 'LINE Pay' : '銀行匯款';
                                      const isChecked = !!b2bPayment.serviceMapping[service.id]?.includes(provider);
                                      return (
                                         <label key={provider} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${isChecked ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50'}`}>
                                            <input 
                                              type="checkbox" 
                                              className="hidden" 
                                              checked={isChecked}
                                              onChange={(e) => {
                                                 const current = b2bPayment.serviceMapping[service.id] || [];
                                                 const next = e.target.checked ? [...current, provider] : current.filter((p: string) => p !== provider);
                                                 setB2bPayment({
                                                    ...b2bPayment,
                                                    serviceMapping: { ...b2bPayment.serviceMapping, [service.id]: next }
                                                 });
                                              }}
                                            />
                                            <div className={`w-3 h-3 rounded-full ${isChecked ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                            <span className="font-black text-xs uppercase tracking-widest">{label}</span>
                                         </label>
                                      )
                                   })}
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <button 
                       onClick={() => {
                          startTransition(async () => {
                             await updateSystemConfig({ b2bPayment });
                             alert('🚀 B2B 收款與分流設定已成功套用至全系統！');
                          });
                       }}
                       disabled={isPending}
                       className="w-full py-8 bg-slate-950 text-white rounded-[30px] font-black text-lg uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-indigo-600 hover:-translate-y-1 active:translate-y-0 transition-all"
                    >
                       {isPending ? '儲存中...' : '儲存分流與收款設定 💾'}
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
                          <div className="space-y-4"><label className={`text-[11px] font-black uppercase tracking-widest ml-4 italic ${accountError ? 'text-rose-500' : 'text-slate-500'}`}>登入 ID (Account)</label><input name="account" type="text" onChange={e => validateAccount(e.target.value)} className={`w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black outline-none border focus:bg-white transition-all shadow-inner ${accountError ? 'border-rose-400 bg-rose-50 text-rose-900 focus:border-rose-600' : 'border-slate-100 text-slate-800 focus:border-slate-900'}`} placeholder="elite_manager_01" required />{accountError && <p className="text-rose-500 text-xs font-bold px-4">{accountError}</p>}</div>
                          <div className="space-y-4"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">安全密碼 (Password)</label><input name="password" type="password" className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black text-slate-800 outline-none border border-slate-100 focus:border-slate-900 focus:bg-white transition-all shadow-inner" placeholder="••••••••" required /></div>
                          {accountType === 'SuperSales' && (
                             <div className="space-y-4 col-span-2"><label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4 italic">電子郵件 (Email)</label><input name="email" type="email" className="w-full bg-slate-50 rounded-[30px] p-8 text-lg font-black text-slate-800 outline-none border border-slate-100 focus:border-slate-900 focus:bg-white transition-all shadow-inner" placeholder="elite@system.tw" /></div>
                          )}
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
                          <div className="flex items-center gap-4 pt-4"><div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div><h4 className="text-xs font-black text-slate-400 uppercase tracking-widest italic">03. 收款帳戶設定 (Bank Account Information)</h4></div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">銀行名稱</label>
                                <input name="bankName" type="text" className="w-full bg-white rounded-2xl p-4 font-black outline-none border border-slate-100 focus:border-emerald-500 transition-all" placeholder="例如：中國信託" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">戶名</label>
                                <input name="accountName" type="text" className="w-full bg-white rounded-2xl p-4 font-black outline-none border border-slate-100 focus:border-emerald-500 transition-all" placeholder="例如：林精英" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 italic">帳號</label>
                                <input name="accountNumber" type="text" className="w-full bg-white rounded-2xl p-4 font-black outline-none border border-slate-100 focus:border-emerald-500 transition-all" placeholder="例如：1234567890" />
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
                        <button type="button" onClick={()=>setUploadMode('video')} className={`flex-1 py-5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${uploadMode === 'video' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>影片</button>
                        <button type="button" onClick={()=>setUploadMode('photo')} className={`flex-1 py-5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${uploadMode === 'photo' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>照片</button>
                        <button type="button" onClick={()=>setUploadMode('document')} className={`flex-1 py-5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${uploadMode === 'document' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>文件</button>
                        <button type="button" onClick={()=>setUploadMode('contract')} className={`flex-1 py-5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all ${uploadMode === 'contract' ? 'bg-slate-900 text-white shadow-xl' : 'bg-slate-50 text-slate-400'}`}>電子合約</button>
                    </div>
                    <div className="space-y-6">
                        <input name="title" type="text" placeholder="資源標題 (例如：2026合約演示)" className="w-full bg-slate-50 rounded-[30px] p-7 text-sm font-black outline-none border border-slate-100" required />
                        <input name="category" type="text" placeholder="類別 (例如：系統說明)" className="w-full bg-slate-50 rounded-[30px] p-7 text-sm font-black outline-none border border-slate-100" required />
                        <label 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    setSelectedFile(e.dataTransfer.files[0]);
                                    e.dataTransfer.clearData();
                                }
                            }}
                            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] h-40 flex flex-col items-center justify-center space-y-2 group cursor-pointer hover:bg-white hover:border-indigo-400 transition-all">
                            {selectedFile ? (
                               <>
                                 <span className="text-3xl text-emerald-500">✅</span>
                                 <p className="text-xs font-black text-slate-800 tracking-widest">{selectedFile.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400">點擊或拖曳可重新選擇檔案</p>
                               </>
                            ) : (
                               <>
                                 <span className="text-3xl group-hover:scale-110 transition-transform">📁</span>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">點擊或拖曳檔案至此 (MAX 500MB)</p>
                               </>
                            )}
                            <input type="file" name="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                        </label>
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
                            <span className="text-xs font-bold text-slate-400">所屬代理商 (Distributor)</span>
                            <span className="text-sm font-black text-slate-900">
                               {viewingAccountDetail.creatorInfo?.type === 'super_admin' ? '超級管理員 (總部)' : (viewingAccountDetail.creatorInfo?.distName || '無')}
                            </span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">負責業務 (Sales)</span>
                            <span className="text-sm font-black text-slate-900">
                               {viewingAccountDetail.creatorInfo?.type === 'super_admin' ? '超級管理員 (總部)' : (viewingAccountDetail.creatorInfo?.salesName || '無')}
                            </span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">
                               {(viewingAccountDetail.paymentCycle === 'Yearly' || viewingAccountDetail.rentType === 'Yearly') ? '年租費 (Yearly Rent)' : '月租費 (Monthly Rent)'}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                               {viewingAccountDetail.freeType === 'Permanent' || viewingAccountDetail.monthlyRent === 0 ? '免費' : 
                                 ((viewingAccountDetail.paymentCycle === 'Yearly' || viewingAccountDetail.rentType === 'Yearly') ? 
                                   `NT$ ${((viewingAccountDetail.monthlyRent || 0) * 12 * (1 - (config?.yearlyDiscountRate || 20) / 100)).toLocaleString()}` : 
                                   `NT$ ${viewingAccountDetail.monthlyRent || 0}`
                                 )
                               }
                            </span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">建置費 (Setup Fee)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.freeType === 'Permanent' || viewingAccountDetail.setupFee === 0 ? '免費' : `NT$ ${viewingAccountDetail.setupFee || 0}`}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">建立時間 (Created At)</span>
                            <span className="text-[10px] font-black text-slate-900">{viewingAccountDetail.timestamp ? new Date(viewingAccountDetail.timestamp).toLocaleString() : '未知'}</span>
                         </div>

                         {/* 宮廟獨立雲端儲存數據 */}
                         <div className="mt-6 pt-4 border-t border-slate-200">
                            <h4 className="text-xs font-black text-slate-800 uppercase mb-3">宮廟獨立雲端儲存數據</h4>
                            {(() => {
                               const storage = templeStorages.find(s => s.templeId === viewingAccountDetail.id);
                               return storage ? (
                                  <div className="bg-slate-50 rounded-xl p-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500">目前方案: <strong className="text-slate-800">{storage.planName}</strong></span>
                                        <span className="text-xs font-bold text-slate-700">用量: {storage.isVip ? '無限使用' : `${((storage.usedBytes || 0) / 1e9).toFixed(2)} GB / ${storage.capacityGb || 0} GB`}</span>
                                     </div>
                                     {!storage.isVip && (
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                                           <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, ((storage.usedBytes || 0) / ((storage.capacityGb || 1) * 1e9)) * 100)}%` }}></div>
                                        </div>
                                     )}
                                  </div>
                               ) : <p className="text-xs text-slate-400">尚未啟用獨立儲存空間</p>;
                            })()}
                            
                            {/* SuperAdmin 專屬升級介面 */}
                            <div className="mt-3 flex gap-2 items-center">
                                  <select 
                                    className="text-xs border border-slate-200 rounded px-2 py-1 flex-1"
                                    value={adminUpgradeStoragePlanId}
                                    onChange={e => setAdminUpgradeStoragePlanId(e.target.value)}
                                  >
                                    <option value="">-- 選擇空間方案 --</option>
                                    {storagePlans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sizeGb}GB)</option>)}
                                  </select>
                                  <button 
                                    onClick={async () => {
                                      if (!adminUpgradeStoragePlanId) return alert('請選擇方案');
                                      await upgradeTempleStorage(viewingAccountDetail.id, adminUpgradeStoragePlanId, 'Monthly', false);
                                      const newData = await fetchTempleStorages();
                                      setTempleStorages(newData);
                                      setAdminUpgradeStoragePlanId('');
                                      alert('空間方案已升級');
                                    }}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100"
                                  >套用</button>
                                  <button 
                                    onClick={async () => {
                                      await grantTempleStorageVip(viewingAccountDetail.id);
                                      const newData = await fetchTempleStorages();
                                      setTempleStorages(newData);
                                      alert('已開通免費無限空間 (VIP)');
                                    }}
                                    className="px-3 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold hover:bg-rose-100"
                                  >設為無限免費</button>
                               </div>
                         </div>

                         {/* 宮廟 AI 助理數據 */}
                         <div className="mt-6 pt-4 border-t border-slate-200">
                            <h4 className="text-xs font-black text-slate-800 uppercase mb-3">宮廟 AI 助理數據</h4>
                            {(() => {
                               const ai = allTempleAiUsage.find(a => a.templeId === viewingAccountDetail.id);
                               return ai ? (
                                  <div className="bg-slate-50 rounded-xl p-4">
                                     <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-slate-500">目前方案: <strong className="text-slate-800">{ai.planName}</strong></span>
                                        <span className="text-xs font-bold text-slate-700">用量: {ai.isVip ? '無限使用' : `${ai.usedTokens || 0} / ${ai.monthlyTokenLimit || 0} Tokens`}</span>
                                     </div>
                                  </div>
                               ) : <p className="text-xs text-slate-400">尚未啟用 AI 助理</p>;
                            })()}
                            
                            {/* SuperAdmin 專屬 AI 升級介面 */}
                            <div className="mt-3 flex gap-2 items-center">
                                  <select 
                                    className="text-xs border border-slate-200 rounded px-2 py-1 flex-1"
                                    value={adminUpgradeAiPlanId}
                                    onChange={e => setAdminUpgradeAiPlanId(e.target.value)}
                                  >
                                    <option value="">-- 選擇 AI 方案 --</option>
                                    {aiPlans.map(p => <option key={p.id} value={p.id}>{p.name} ({p.tokenLimit} Tokens)</option>)}
                                  </select>
                                  <button 
                                    onClick={async () => {
                                      if (!adminUpgradeAiPlanId) return alert('請選擇方案');
                                      await purchaseAiPlanByAdmin(viewingAccountDetail.id, adminUpgradeAiPlanId);
                                      const newData = await fetchAllTempleAiUsage();
                                      setAllTempleAiUsage(newData);
                                      setAdminUpgradeAiPlanId('');
                                      alert('AI 方案已升級');
                                    }}
                                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold hover:bg-indigo-100"
                                  >套用</button>
                                  <button 
                                    onClick={async () => {
                                      await grantTempleAiVip(viewingAccountDetail.id);
                                      const newData = await fetchAllTempleAiUsage();
                                      setAllTempleAiUsage(newData);
                                      alert('已開通免費無限 AI (VIP)');
                                    }}
                                    className="px-3 py-1 bg-rose-50 text-rose-600 rounded text-xs font-bold hover:bg-rose-100"
                                  >設為無限免費</button>
                               </div>
                         </div>

                       </>
                    )}
                    
                    {viewingAccountDetail.role === 'Distributor' && (
                       <>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">聯絡電話 (Phone)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.phone || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">電子信箱 (Email)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.email || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">通訊地址 (Address)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.address || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">抽成歸屬 (Commission To)</span>
                            <span className="text-sm font-black text-slate-900">
                               {(() => {
                                  if (!viewingAccountDetail.creatorSalesId || viewingAccountDetail.creatorSalesId === 'SuperAdmin' || viewingAccountDetail.creatorSalesId === 'System Admin') return '超級管理員 (總部)';
                                  const sales = initialAccounts.find((s: any) => s.id === viewingAccountDetail.creatorSalesId);
                                  return sales ? sales.name : viewingAccountDetail.creatorSalesId;
                               })()}
                            </span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">合約狀態 (Contract)</span>
                            <span className="text-sm font-black text-slate-900">
                               {viewingAccountDetail.status === 'Active' ? `生效中 (至 ${viewingAccountDetail.expirationDate || '未知'})` : viewingAccountDetail.status || '未設定'}
                            </span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">加入時間 (Joined At)</span>
                            <span className="text-[10px] font-black text-slate-900">{viewingAccountDetail.joinedAt || '未知'}</span>
                         </div>
                         {viewingAccountDetail.bankInfo && (
                           <div className="pb-4 border-b border-slate-50 space-y-2">
                              <span className="text-xs font-bold text-slate-400 block">匯款帳戶 (Bank Info)</span>
                              <div className="text-[10px] font-black text-slate-900 bg-slate-100 p-3 rounded-xl leading-relaxed">
                                 銀行：{viewingAccountDetail.bankInfo.bankName}<br/>
                                 戶名：{viewingAccountDetail.bankInfo.accountName}<br/>
                                 帳號：{viewingAccountDetail.bankInfo.accountNumber}
                              </div>
                           </div>
                         )}
                       </>
                    )}

                    {viewingAccountDetail.role === 'SuperSales' && (
                       <>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">聯絡電話 (Phone)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.phone || '未設定'}</span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                            <span className="text-xs font-bold text-slate-400">所屬代理商 (Distributor ID)</span>
                            <span className="text-sm font-black text-slate-900">{viewingAccountDetail.distributorId || '總部直屬'}</span>
                         </div>
                         {viewingAccountDetail.bankInfo && (
                            <div className="flex justify-between items-start pb-4 border-b border-slate-50 bg-slate-50/50 p-4 rounded-xl">
                               <span className="text-xs font-bold text-slate-400">收款帳戶 (Bank Account)</span>
                               <span className="text-xs font-black text-slate-900 text-right leading-relaxed">
                                  銀行：{viewingAccountDetail.bankInfo.bankName}<br/>
                                  戶名：{viewingAccountDetail.bankInfo.accountName}<br/>
                                  帳號：{viewingAccountDetail.bankInfo.accountNumber}
                               </span>
                            </div>
                         )}
                         {viewingAccountDetail.commissionRules && (
                           <form onSubmit={async (e) => {
                              e.preventDefault();
                              if(confirm('確定要更新此業務的抽成設定嗎？')) {
                                 const formData = new FormData(e.currentTarget);
                                 const newRates = {
                                    ...viewingAccountDetail.commissionRules,
                                    templeSetupRate: Number(formData.get('setup')),
                                    templeRentRates: [
                                       Number(formData.get('y1')),
                                       Number(formData.get('y2')),
                                       Number(formData.get('y3'))
                                    ]
                                 };
                                 const { updateSuperSalesCommission } = await import('../actions');
                                 await updateSuperSalesCommission(viewingAccountDetail.name, newRates);
                                 alert('抽成設定已更新！');
                                 window.location.reload();
                              }
                           }} className="pb-4 border-b border-slate-50 space-y-2">
                              <div className="flex justify-between items-center">
                                 <span className="text-xs font-bold text-slate-400 block">抽成規則 (Commission Rules)</span>
                                 <button type="submit" className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm">更新設定</button>
                              </div>
                              <div className="text-[10px] font-black text-slate-900 bg-slate-100 p-4 rounded-xl leading-relaxed mt-2 border border-slate-200 shadow-sm">
                                 <div className="grid grid-cols-2 gap-4">
                                    <div className="flex justify-between items-center">
                                       <span className="text-slate-500">建置費抽成 (%):</span>
                                       <input name="setup" type="number" defaultValue={viewingAccountDetail.commissionRules.templeSetupRate || viewingAccountDetail.commissionRules.setupFeePercent || 0} className="w-16 bg-white border border-slate-200 rounded-lg text-center py-1.5 outline-none focus:border-indigo-500 text-indigo-600 font-black" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-slate-500">首年租金 (%):</span>
                                       <input name="y1" type="number" defaultValue={viewingAccountDetail.commissionRules.templeRentRates?.[0] || viewingAccountDetail.commissionRules.rentYear1Percent || 0} className="w-16 bg-white border border-slate-200 rounded-lg text-center py-1.5 outline-none focus:border-emerald-500 text-emerald-600 font-black" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-slate-500">次年租金 (%):</span>
                                       <input name="y2" type="number" defaultValue={viewingAccountDetail.commissionRules.templeRentRates?.[1] || viewingAccountDetail.commissionRules.rentYear2Percent || 0} className="w-16 bg-white border border-slate-200 rounded-lg text-center py-1.5 outline-none focus:border-emerald-500 text-emerald-600 font-black" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                       <span className="text-slate-500">後續租金 (%):</span>
                                       <input name="y3" type="number" defaultValue={viewingAccountDetail.commissionRules.templeRentRates?.[2] || viewingAccountDetail.commissionRules.rentYear3PlusPercent || 0} className="w-16 bg-white border border-slate-200 rounded-lg text-center py-1.5 outline-none focus:border-emerald-500 text-emerald-600 font-black" />
                                    </div>
                                 </div>
                              </div>
                           </form>
                         )}
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
    
      {/* 轉移資產 Modal */}
      {transferModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
           <div className="w-full max-w-3xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">資產轉移配置 (Asset Transfer)</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">來源：<span className="text-indigo-600">{transferModalData.name} ({transferModalData.role})</span></p>
                 </div>
              </div>
              <div className="p-10 overflow-y-auto bg-white flex-1">
                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">名下資產 (宮廟列表)</h4>
                 <div className="border border-slate-100 rounded-2xl overflow-hidden mb-8">
                    <table className="w-full text-left text-sm">
                       <thead className="bg-slate-50 border-b border-slate-100 text-[10px] uppercase font-black text-slate-400">
                          <tr>
                             <th className="p-4 w-12"><input type="checkbox" onChange={(e) => {
                                const relatedTemples = initialAccounts.filter(a => a.role === 'Temple' && (transferModalData.role === 'Distributor' ? a.distributorId === transferModalData.id : a.salesId === transferModalData.id));
                                setSelectedTransferTemples(e.target.checked ? relatedTemples.map(t => t.id) : []);
                             }} /></th>
                             <th className="p-4">宮廟名稱</th>
                             <th className="p-4">現有租金設定</th>
                          </tr>
                       </thead>
                       <tbody>
                          {initialAccounts.filter(a => a.role === 'Temple' && (transferModalData.role === 'Distributor' ? a.distributorId === transferModalData.id : a.salesId === transferModalData.id)).map(t => (
                             <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                                <td className="p-4"><input type="checkbox" checked={selectedTransferTemples.includes(t.id)} onChange={(e) => {
                                   if(e.target.checked) setSelectedTransferTemples([...selectedTransferTemples, t.id]);
                                   else setSelectedTransferTemples(selectedTransferTemples.filter(id => id !== t.id));
                                }} /></td>
                                <td className="p-4 font-bold text-slate-800">{t.name || t.templeName}</td>
                                <td className="p-4 text-slate-500">{t.monthlyRent || 0} / 月</td>
                             </tr>
                          ))}
                          {initialAccounts.filter(a => a.role === 'Temple' && (transferModalData.role === 'Distributor' ? a.distributorId === transferModalData.id : a.salesId === transferModalData.id)).length === 0 && (
                             <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-bold">該帳戶名下無宮廟資產</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">轉移目標 (Target Allocation)</h4>
                 
                 <div className="space-y-4">
                    <select 
                       className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-indigo-500" 
                       value={transferTargetType} 
                       onChange={e => {
                          const val = e.target.value as 'HQ' | 'Distributor' | 'SuperSales';
                          setTransferTargetType(val);
                          setTransferTargetId(val === 'HQ' ? 'HQ' : '');
                       }}
                    >
                       <option value="HQ">👑 系統總部 (收回直營)</option>
                       <option value="Distributor">🏢 經銷代理商</option>
                       <option value="SuperSales">🚀 超級業務</option>
                    </select>

                    {transferTargetType === 'Distributor' && (
                       <select 
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-sm" 
                          value={transferTargetId} 
                          onChange={e => setTransferTargetId(e.target.value)}
                       >
                          <option value="" disabled>請選擇要轉移的經銷商...</option>
                          {initialAccounts.filter(a => a.role === 'Distributor' && a.id !== transferModalData.id && (!a.status || a.status === 'Active')).map(d => (
                             <option key={d.id} value={`Distributor|${d.id}`}>{d.name} ({d.id})</option>
                          ))}
                       </select>
                    )}

                    {transferTargetType === 'SuperSales' && (
                       <select 
                          className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-bold focus:outline-none focus:border-indigo-500 shadow-sm" 
                          value={transferTargetId} 
                          onChange={e => setTransferTargetId(e.target.value)}
                       >
                          <option value="" disabled>請選擇要轉移的超級業務...</option>
                          {initialAccounts.filter(a => a.role === 'SuperSales' && a.id !== transferModalData.id && (!a.status || a.status === 'Active')).map(s => (
                             <option key={s.id} value={`SuperSales|${s.id}`}>{s.name} ({s.id})</option>
                          ))}
                       </select>
                    )}
                 </div>

                 <p className="mt-4 text-[11px] text-rose-500 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100">⚠️ 轉移後，選定宮廟的後續月租費分潤將自動歸屬於新的目標帳戶，此動作無法撤銷，請審慎操作。</p>
              </div>
              <div className="p-6 bg-slate-50 flex gap-4">
                 <button onClick={async () => {
                    if (selectedTransferTemples.length === 0) { alert('請先選擇要轉移的宮廟！'); return; }
                    if (confirm(`確定要將 ${selectedTransferTemples.length} 間宮廟轉移給該目標嗎？`)) {
                       const { transferTemples } = await import('../actions');
                       let tRole: 'HQ' | 'Distributor' | 'SuperSales' = 'HQ';
                       let tId: string | null = null;
                       if (transferTargetId !== 'HQ') {
                          const parts = transferTargetId.split('|');
                          tRole = parts[0] as any;
                          tId = parts[1];
                       }
                       await transferTemples(selectedTransferTemples, tId, tRole);
                       alert('資產轉移成功！');
                       setTransferModalData(null);
                       setSelectedTransferTemples([]);
                       window.location.reload();
                    }
                 }} className="flex-1 bg-purple-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-700 shadow-xl">確認轉移 (Confirm Transfer)</button>
                 <button onClick={() => { setTransferModalData(null); setSelectedTransferTemples([]); }} className="px-8 py-4 font-black text-xs text-slate-400">取消 (Cancel)</button>
              </div>
           </div>
        </div>
      )}
</div>
  );
}
