"use client";

import React, { useState, useTransition, useMemo } from 'react';
import TempleApplicationForm from '../components/TempleApplicationForm';
import { addSalesMember, approveTempleByDistributor, rejectTempleByDistributor, uploadReceiptAndApproveBonus } from '../actions';

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

export default function DistributorClient({ 
  initialProfile, initialTeam, initialApps, initialCapacity, initialCommission,
  initialTemples, initialVisits, initialTools, initialFinancials, initialLogs
}: { 
  initialProfile: any, initialTeam: any[], initialApps: any[], initialCapacity: any, initialCommission: any,
  initialTemples?: any[], initialVisits?: any[], initialTools?: any[], initialFinancials?: any, initialLogs?: any[]
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'temples' | 'team' | 'approvals' | 'calendar' | 'financials' | 'tools' | 'profile' | 'logs' | 'b2b_payment' | 'temple_payments'>('overview');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [templeSearch, setTempleSearch] = useState("");
  const [templeLocationFilter, setTempleLocationFilter] = useState("");
  const [viewTempleDetail, setViewTempleDetail] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  React.useEffect(() => {
    import('@/app/actions').then(m => m.fetchDistributorTempleBills && m.fetchDistributorTempleBills(initialProfile?.id)).then(res => {
         if (res) setTemplePayments(res);
      });
  }, [initialProfile?.id]);

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
  const [salesForm, setSalesForm] = useState({ name: "", account: "", password: "", commissionRate: "20" });

  const [uploadingBonusId, setUploadingBonusId] = useState<string | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string>('');

  const [isEditRateModalOpen, setIsEditRateModalOpen] = useState(false);
  const [isDirectCreateModalOpen, setIsDirectCreateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isTempleListModalOpen, setIsTempleListModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  // --- Selections ---
  const [selectedSales, setSelectedSales] = useState<any>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [contractTemple, setContractTemple] = useState("");

  // --- Profile Edit State ---
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ 
    name: initialProfile?.name || "", 
    account: initialProfile?.account || initialProfile?.code || "", 
    email: initialProfile?.email || "", 
    address: initialProfile?.address || "",
    bankCode: initialProfile?.bankInfo?.bankCode || "",
    bankName: initialProfile?.bankInfo?.bankName || "",
    accountName: initialProfile?.bankInfo?.accountName || "",
    accountNumber: initialProfile?.bankInfo?.accountNumber || ""
  });

  // --- Map Props to State ---
  const managedTemples = useMemo(() => initialTemples?.map(t => ({
    id: t.id,
    name: t.templeName,
    sales: initialTeam.find(s => s.id === t.salesId)?.name || '未知',
    plan: t.plan || 'Standard Node',
    joinedAt: t.timestamp?.split('T')[0] || '2026-01-01',
    status: t.status || 'Active'
  })) || [], [initialTemples, initialTeam]);

  const mockVisits = useMemo(() => initialVisits?.map((v, idx) => ({
    id: v.id || idx,
    day: v.date ? parseInt(v.date.split('-')[2]) : 1,
    sales: v.salesName || '未知',
    temple: v.templeName || '未知',
    purpose: v.notes || '例行拜訪',
    status: v.status || 'Pending'
  })) || [], [initialVisits]);

  const officialTools = useMemo(() => initialTools?.map((t: any, idx: number) => ({
    id: t.id || `TOOL-${idx}`,
    type: t.type === 'contract' ? 'doc' : (t.type === 'document' ? 'doc' : t.type || 'video'),
    originalType: t.type,
    title: t.title || '工具檔案',
    category: t.category || '官方資源',
    thumbnail: t.thumbnail || t.url || '',
    url: t.url || '',
    icon: t.type === 'contract' ? '📄' : '📂'
  })) || [], [initialTools]);

  const [activeToolPreview, setActiveToolPreview] = useState<any>(null);
  const [paymentRecords, setPaymentRecords] = useState(initialFinancials?.paymentRecords || []);
  const [bonusRequests, setBonusRequests] = useState(initialFinancials?.bonusRequests || []);

  const [rejectReason, setRejectReason] = useState("");
  const [newSalesForm, setNewSalesForm] = useState({ 
    name: "", phone: "", account: "", password: "", setupRate: 20, rentYear1Rate: 15, rentYear2Rate: 10, rentYear3PlusRate: 5 
  });
  
  const [editingRates, setEditingRates] = useState({
    setupRate: 20, rentYear1Rate: 15, rentYear2Rate: 10, rentYear3PlusRate: 5
  });

  const [b2bPayment, setB2bPayment] = useState<any>({
      linePay: { enabled: false, channelId: '', channelSecret: '' },
      thirdParty: { enabled: false, provider: 'ECPay', merchantId: '', hashKey: '', hashIV: '' },
      customTransfer: { enabled: false, bankCode: '', bankName: '', accountName: '', accountNo: '' },
      customQR: { enabled: false, qrImageUrl: '', description: '' },
      cash: { enabled: false, description: '' }
   });
   const [templePayments, setTemplePayments] = useState<any[]>([]);
   const [b2bReceiptViewerOpen, setB2bReceiptViewerOpen] = useState(false);
   const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
   const [currentReceiptImage, setCurrentReceiptImage] = useState<string | null>(null);
   const [currentOrderType, setCurrentOrderType] = useState<'saas' | 'temple_bill'>('saas');
  const [logs, setLogs] = useState(initialLogs || []);

  const addLog = async (action: string, target: string) => {
    try {
      const { logDistributorAction } = await import('@/app/actions');
      await logDistributorAction(initialProfile.id, action, target, '管理員');
      setLogs((prev: any) => [{ id: `DLOG-${Date.now()}`, action, target, operator: "管理員", time: new Date().toLocaleString('zh-TW') }, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  // --- Handlers ---
  const handleApprove = (id: string) => {
    if (initialCapacity.used >= initialCapacity.total) return alert("❌ 配額已滿！");
    startTransition(async () => {
      try {
        const res = await approveTempleByDistributor(id);
        if (res?.success) {
          addLog("核定開通宮廟", `案號: ${id}`);
          alert("✅ 帳戶已成功開通");
          window.location.reload();
        } else {
          alert("❌ 開通失敗");
        }
      } catch (e) {
        alert("❌ 發生錯誤");
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason || !selectedAppId) return alert("請輸入理由");
    startTransition(async () => {
      try {
        const res = await rejectTempleByDistributor(selectedAppId);
        if (res?.success) {
          addLog("駁回申請", `原因: ${rejectReason}`);
          setIsRejectModalOpen(false);
          window.location.reload();
        } else {
          alert("❌ 駁回失敗");
        }
      } catch (e) {
        alert("❌ 發生錯誤");
      }
    });
  };

  const handleApprovePayment = (id: string) => {
    if (!confirm("確認已收到款項並開通宮廟？")) return;
    startTransition(async () => {
      try {
        const { updateTempleBasicInfo } = await import('@/app/actions');
        await updateTempleBasicInfo({ status: 'Active' }, id);
        addLog("核款並開通宮廟", `案號: ${id}`);
        alert("✅ 帳戶已成功開通");
        window.location.reload();
      } catch (e) {
        alert("❌ 發生錯誤");
      }
    });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const { updateDistributorProfile } = await import('@/app/actions');
        await updateDistributorProfile(initialProfile.id, {
          name: editProfileForm.name,
          account: editProfileForm.account,
          email: editProfileForm.email,
          address: editProfileForm.address,
          bankInfo: {
            bankCode: editProfileForm.bankCode,
            bankName: editProfileForm.bankName,
            accountName: editProfileForm.accountName,
            accountNumber: editProfileForm.accountNumber
          }
        });
        addLog("修改經銷商資料", editProfileForm.name);
        setIsEditProfileModalOpen(false);
        alert("✅ 資料已成功更新！");
        window.location.reload();
      } catch (err) {
        alert("更新失敗");
      }
    });
  };

  const handleSaveB2bPayment = async () => {
    try {
      const { updateDistributorPaymentConfig } = await import('@/app/actions');
      await updateDistributorPaymentConfig(initialProfile.id, b2bPayment);
      alert("✅ 收款設定已儲存！");
      addLog("更新B2B收款設定", "B2B Payment Config");
    } catch (e) {
      alert("❌ 儲存失敗");
    }
  };

  const handleVerifySaasOrder = async (orderId: string, status: 'paid' | 'rejected') => {
    try {
      const { verifySaasOrder } = await import('@/app/actions');
      const res = await verifySaasOrder(orderId, status);
      if (res?.success) {
        window.location.reload();
        alert(`✅ 訂單已標記為${status === 'paid' ? '已收款' : '駁回'}`);
        addLog("審核訂單", `訂單編號: ${orderId} 狀態: ${status}`);
        setB2bReceiptViewerOpen(false);
      } else {
        alert("❌ 審核失敗");
      }
    } catch (e) {
      alert("❌ 發生錯誤");
    }
  };

  const handleVerifyTempleBill = async (billId: string, status: 'paid' | 'rejected') => {
    try {
      if (status === 'paid') {
        const { approveTempleBill } = await import('@/app/actions');
        const res = await approveTempleBill(billId);
        if (res?.success !== false) {
           alert("✅ 核款成功");
           addLog("審核宮廟匯款", `帳單編號: ${billId} 狀態: 已核款`);
           setB2bReceiptViewerOpen(false);
           window.location.reload();
        } else { alert("❌ 核款失敗"); }
      } else {
        const { rejectTempleBill } = await import('@/app/actions');
        const res = await rejectTempleBill(billId);
        if (res?.success !== false) {
           alert("✅ 已退回匯款審核");
           addLog("退回宮廟匯款", `帳單編號: ${billId} 狀態: 退回`);
           setB2bReceiptViewerOpen(false);
           window.location.reload();
        } else { alert("❌ 退回失敗"); }
      }
    } catch (e) {
      alert("❌ 發生錯誤");
    }
  };

  const handleVerifyOrderAction = (status: 'paid' | 'rejected') => {
     if (!currentOrderId) return;
     if (currentOrderType === 'saas') {
        handleVerifySaasOrder(currentOrderId, status);
     } else {
        handleVerifyTempleBill(currentOrderId, status);
     }
  };

  const handleAddSales = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await addSalesMember({
          distributorId: initialProfile?.id || 'dist-hq',
          name: newSalesForm.name,
          phone: newSalesForm.phone,
          account: newSalesForm.account,
          password: newSalesForm.password,
          setupFeePercent: newSalesForm.setupRate,
          rentYear1Percent: newSalesForm.rentYear1Rate,
          rentYear2Percent: newSalesForm.rentYear2Rate,
          rentYear3PlusPercent: newSalesForm.rentYear3PlusRate
        });
        addLog("新增業務", `${newSalesForm.name} (${newSalesForm.phone})`);
        setIsAddSalesModalOpen(false);
        window.location.reload();
      } catch (error) {
        alert("新增業務失敗，請稍後再試！");
      }
    });
  };

  const handleReconcileBonus = async (id: string) => {
    if (!receiptBase64) {
      alert("請先上傳匯款圖片憑證！");
      return;
    }
    const request = bonusRequests.find((r: any) => r.id === id);
    if (!request) return;

    try {
      await uploadReceiptAndApproveBonus(id, receiptBase64);
      setBonusRequests((prev: any[]) => prev.map((r: any) => r.id === id ? { ...r, status: "Verified", receiptUrl: receiptBase64 } : r));
      addLog("獎金撥款核銷", `單號: ${id} (${request.sales})`);
      alert(`✅ 已完成單號 ${id} 的撥款核銷`);
      setUploadingBonusId(null);
      setReceiptBase64('');
    } catch (e) {
      alert("核銷失敗，請重試");
    }
  };

  const onReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setReceiptBase64(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

  // --- Grouping Logic ---
  const groupedPayments = useMemo(() => {
    const groups: Record<string, typeof paymentRecords> = {};
    paymentRecords.forEach((p: any) => {
      if (!groups[p.region]) groups[p.region] = [];
      groups[p.region].push(p);
    });
    return groups;
  }, [paymentRecords]);

  const TAIWAN_CITIES = [
    '基隆市','臺北市','新北市','桃園市','新竹市','新竹縣','苗栗縣','臺中市','彰化縣','南投縣',
    '雲林縣','嘉義市','嘉義縣','臺南市','高雄市','屏東縣','宜蘭縣','花蓮縣','臺東縣','澎湖縣','金門縣','連江縣'
  ];

  const filteredTemples = (initialTemples || []).filter(t => {
    const matchSearch = t.templeName.includes(templeSearch) || (t.chairpersonName || "").includes(templeSearch);
    const matchLocation = templeLocationFilter === "" || t.city === templeLocationFilter;
    return matchSearch && matchLocation;
  });

  const getSalesName = (salesId?: string) => {
    if (!salesId) return null;
    const s = initialTeam.find(m => m.id === salesId);
    return s ? s.name : '未知業務';
  };

  const renderTemples = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20">
       <div className="bg-white/60 backdrop-blur-3xl p-6 rounded-[40px] shadow-sm border border-white space-y-4">
          <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
             <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
             轄下宮廟管理
          </h3>
          <div className="flex gap-3 px-2">
             <div className="flex-1 bg-white/80 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all border border-slate-100 shadow-inner">
                <span className="text-slate-400">🔍</span>
                <input 
                  type="text" 
                  placeholder="搜尋宮廟、負責人..." 
                  value={templeSearch}
                  onChange={e => setTempleSearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-bold placeholder:text-slate-300"
                />
             </div>
             <select 
               value={templeLocationFilter}
               onChange={e => setTempleLocationFilter(e.target.value)}
               className="bg-white/80 rounded-2xl px-4 py-3 text-sm font-bold outline-none border border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors shadow-inner"
             >
                <option value="">全台地域</option>
                {TAIWAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
       </div>
       
       <div className="space-y-4">
          {filteredTemples.map(app => (
            <div key={app.id} className="bg-white/60 backdrop-blur-xl rounded-[32px] shadow-lg border border-white p-5 space-y-4 hover:shadow-xl hover:border-blue-200 transition-all group">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg group-hover:bg-blue-600 transition-colors duration-500">🏛️</div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900">{app.templeName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase shadow-sm ${app.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : app.status === 'UnderReview' ? 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse' : app.status === 'PendingPayment' ? 'bg-purple-50 text-purple-600 border border-purple-100 animate-pulse' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                             {app.status === 'Active' ? '已開通營運' : app.status === 'UnderReview' ? '待核款' : app.status === 'PendingPayment' ? '待付開辦費' : '審核中'}
                          </span>
                       </div>
                       <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.city}{app.district} | {app.chairpersonName}</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   {app.creatorRole === 'DistSales' ? (
                     <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">🚀 業務：{getSalesName(app.salesId)}</span>
                   ) : (
                     <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">🏢 直屬帳戶</span>
                   )}
                 </p>
                 <button 
                   onClick={() => setViewTempleDetail(app)}
                   className="text-blue-600 bg-white shadow-sm border border-slate-100 px-4 py-1.5 rounded-full text-[10px] font-black hover:bg-blue-50 active:scale-95 transition-all"
                 >
                   檢視詳情
                 </button>
              </div>
            </div>
          ))}
          {filteredTemples.length === 0 && (
             <div className="py-20 text-center text-slate-400 font-bold bg-white/50 rounded-[40px] border border-white">找不到符合的宮廟</div>
          )}
       </div>
    </div>
  );

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
                        strokeDashoffset={2 * Math.PI * 88 * (1 - (initialCapacity.total > 0 ? initialCapacity.used / initialCapacity.total : 0))}
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
                <h3 className="text-3xl font-black text-slate-900 mt-1">{initialTeam.length} <span className="text-[10px] opacity-20 italic">Elite</span></h3>
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
             {officialTools.filter(t => t.type === 'video').length === 0 ? (
               <div className="text-center py-10 bg-white/40 rounded-[30px] border border-white/60">
                 <p className="text-sm font-bold text-slate-400">目前尚無影片資源</p>
               </div>
             ) : (
               officialTools.filter(t => t.type === 'video').map(tool => (
                  <div key={tool.id} onClick={() => setActiveToolPreview({...tool, type: tool.originalType})} className="group relative bg-slate-900 rounded-[45px] shadow-2xl border border-white overflow-hidden aspect-[16/10] hover:shadow-blue-200 transition-all duration-700 cursor-pointer">
                     {tool.thumbnail && <img src={tool.thumbnail} className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-[2s]" />}
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-10 flex flex-col justify-end">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-3 tracking-[0.3em] bg-blue-500/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">{tool.category}</p>
                        <h5 className="text-2xl font-black text-white leading-tight italic tracking-tighter">{tool.title}</h5>
                        <div className="mt-8 flex items-center gap-4">
                           <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shadow-2xl shadow-blue-500/40 group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-500">▶️</div>
                           <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">點擊觀看</span>
                        </div>
                     </div>
                  </div>
               ))
             )}
          </div>
       </section>

       {/* Document & Assets Section */}
       <section className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">業務開發與法律文件 (官方規範)</h4>
          <div className="grid grid-cols-2 gap-4">
             {officialTools.filter(t => t.type === 'doc').length === 0 ? (
                <div className="col-span-2 text-center py-10 bg-white/40 rounded-[30px] border border-white/60">
                   <p className="text-sm font-bold text-slate-400">目前尚無文件資源</p>
                </div>
             ) : (
                officialTools.filter(t => t.type === 'doc').map(doc => (
                   <div key={doc.id} onClick={() => setActiveToolPreview({...doc, type: doc.originalType})} className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-xl flex flex-col items-center text-center space-y-4 hover:border-blue-500 transition-all duration-500 group cursor-pointer">
                      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">{doc.icon}</div>
                      <div>
                         <h6 className="text-xs font-black text-slate-900 tracking-tight">{doc.title}</h6>
                         <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{doc.category}</p>
                      </div>
                   </div>
                ))
             )}
          </div>
       </section>

       {activeToolPreview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveToolPreview(null)}></div>
             <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                   <div>
                      <h3 className="font-black text-slate-900 text-lg">{activeToolPreview.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeToolPreview.category} • {activeToolPreview.originalType || activeToolPreview.type}</p>
                   </div>
                   <button onClick={() => setActiveToolPreview(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
                </div>
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center flex-col gap-6">
                   {activeToolPreview.originalType === 'photo' || activeToolPreview.type === 'photo' ? (
                      <img src={activeToolPreview.url || activeToolPreview.thumbnail} className="max-w-full max-h-full rounded-2xl shadow-sm" />
                   ) : activeToolPreview.originalType === 'video' || activeToolPreview.type === 'video' ? (
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
                {activeTab === 'b2b_payment' && '收款設定 B2B'}
                {activeTab === 'temple_payments' && '宮廟帳款審核'}
                {activeTab === 'logs' && '系統日誌 Sys'}
             </h1>
          </div>
          <div onClick={() => setActiveTab('logs')} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-2xl transition-all duration-500 hover:rotate-12 ${activeTab === 'logs' ? 'bg-blue-600 text-white scale-110' : 'bg-white/80 backdrop-blur-md border border-white text-slate-300'}`}>🛰️</div>
       </header>

       <main className="max-w-md mx-auto px-6 relative z-10 pb-32">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'temples' && renderTemples()}
          {activeTab === 'tools' && renderTools()}

          {/* TAB: Team */}
          {activeTab === 'team' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
               <button onClick={() => setIsAddSalesModalOpen(true)} className="w-full py-6 bg-slate-900 text-blue-400 rounded-[30px] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-blue-600 hover:text-white transition-all">+ 新增正式業務人員</button>
               {initialTeam.map((m: any) => (
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
                       <div className="flex justify-between text-[11px] font-black"><span className="text-slate-400 uppercase tracking-widest">{app.paymentCycle === 'Yearly' ? '方案年繳' : '方案月租'}</span><span className="text-blue-600 underline decoration-2 font-black">${app.paymentCycle === 'Yearly' ? ((app.monthlyRent || 3600) * 12 * 0.8).toLocaleString() : (app.monthlyRent?.toLocaleString() || '3,600')}</span></div>
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
                     <p className="text-[10px] font-black text-blue-100 uppercase tracking-[0.5em]">{new Date().getFullYear()} 年度業績總覽</p>
                     <div className="grid grid-cols-2 gap-8 divide-x divide-white/20">
                        <div className="space-y-2">
                           <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest opacity-70">宮廟繳費總額</p>
                           <h2 className="text-4xl font-black tracking-tighter italic text-white drop-shadow-md">${(paymentRecords.reduce((sum: number, p: any) => sum + p.history.filter((h: any) => h.status==='Paid').reduce((s: number, h: any) => s+(h.amount || 0), 0), 0) || 0).toLocaleString()}</h2>
                        </div>
                        <div className="pl-8 space-y-2">
                           <p className="text-[8px] font-black text-blue-100 uppercase tracking-widest opacity-70">預計支出佣金</p>
                           <h2 className="text-4xl font-black tracking-tighter italic text-white drop-shadow-md">${(bonusRequests.reduce((sum: number, b: any) => sum + (b.amount || 0), 0) || 0).toLocaleString()}</h2>
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
                       {Object.entries(groupedPayments).map(([region, records]: [string, any]) => (
                          <div key={region} className="space-y-4">
                             <div className="flex items-center gap-3 px-4"><div className="w-1.5 h-4 bg-blue-600 rounded-full"></div><h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">{region}地區宮廟 ({records.length})</h3></div>
                             <div className="space-y-4">
                                {records.map((p: any) => (
                                   <div key={p.id} onClick={() => setExpandedTempleId(expandedTempleId === p.id ? null : p.id)} className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white shadow-xl overflow-hidden transition-all duration-500 cursor-pointer group">
                                      <div className={`flex items-center justify-between p-6 group-hover:bg-white transition-all`}><div className="flex items-center gap-5"><div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-xl italic transition-all group-hover:bg-blue-600 group-hover:scale-110">🏛️</div><div><h4 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.temple} {p.trialMonths > 0 && p.templeStatus === 'Active' && <span className="ml-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full text-[9px]">免費體驗中</span>}</h4><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">最後繳費：{p.date}</p></div></div><div className="text-right flex items-center gap-4"><div><p className="text-lg font-black text-slate-900">${(p.amount || 0).toLocaleString()}</p><span className={`text-[7px] font-black px-3 py-1 rounded-full uppercase ${p.paymentStatusLabel && p.paymentStatusLabel.includes('已付') ? 'text-emerald-600 bg-emerald-50' : p.paymentStatusLabel && p.paymentStatusLabel.includes('免費試用') ? 'text-blue-600 bg-blue-50' : p.templeStatus === 'UnderReview' ? 'text-amber-600 bg-amber-50' : p.templeStatus === 'PendingPayment' ? 'text-purple-600 bg-purple-50' : 'text-rose-600 bg-rose-50'}`}>{p.status === 'Paid' ? '已入帳' : p.templeStatus === 'UnderReview' ? '待核款' : p.templeStatus === 'PendingPayment' ? '待付開辦費' : '催收中'}</span></div>{p.templeStatus === 'UnderReview' && (<button onClick={(e) => { e.stopPropagation(); handleApprovePayment(p.id); }} className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30">核款</button>)}<span className={`text-slate-300 transition-transform duration-500 ${expandedTempleId === p.id ? 'rotate-180 text-blue-600' : ''}`}>▼</span></div></div>
                                      {expandedTempleId === p.id && (
                                         <div className="bg-slate-50/80 p-8 border-t border-white/50 space-y-4 animate-in slide-in-from-top-4 duration-500">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">歷史付款紀錄 History Records</p>
                                            <div className="space-y-2">{p.history.map((h: any, i: number) => (
                                                  <div key={i} className="flex justify-between items-center bg-white/50 p-4 rounded-2xl border border-white shadow-sm">
                                                     <div className="flex gap-4 items-center"><span className="text-[10px] font-black text-slate-900">{h.month}月度</span><span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">{h.type}</span></div>
                                                     <div className="flex items-center gap-3">
    <span className="text-xs font-black text-slate-900">${(h.amount || 0).toLocaleString()}</span>
    {h.status === 'Pending' && h.receiptUrl && (
        <button onClick={(e) => { e.stopPropagation(); setCurrentOrderId(h.id); setCurrentReceiptImage(h.receiptUrl); setCurrentOrderType('temple_bill'); setB2bReceiptViewerOpen(true); }} className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-black hover:bg-amber-200">看明細核帳</button>
    )}
    <div className={`w-1.5 h-1.5 rounded-full ${h.status === 'Paid' ? 'bg-emerald-500' : h.status === 'Pending' ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
</div>
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
                       {initialTeam.map((s: any, idx: number) => (
                          <div key={s.id} className="bg-white/60 backdrop-blur-xl p-7 rounded-[40px] border border-white shadow-xl space-y-6 group hover:bg-white transition-all duration-500">
                              <div className="flex justify-between items-center">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center text-sm font-black italic shadow-xl group-hover:bg-blue-600 transition-all">0{idx+1}</div>
                                    <div>
                                       <h4 className="text-sm font-black text-slate-900">{s.name}</h4>
                                       <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">ID: {s.account}</p>
                                    </div>
                                 </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">總營業額</p>
                                      <p className="text-lg font-black text-slate-900">${(s.totalSales || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="bg-slate-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">總宮廟開設數</p>
                                      <p className="text-lg font-black text-slate-900">{s.totalTemplesCount || 0} <span className="text-[10px] text-slate-500">家</span></p>
                                  </div>
                                  <div className="bg-emerald-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center border border-emerald-100">
                                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">總獎金</p>
                                      <p className="text-lg font-black text-emerald-700">${(s.commission || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="bg-blue-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center border border-blue-100">
                                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">總已提領獎金</p>
                                      <p className="text-lg font-black text-blue-700">${(s.totalWithdrawn || 0).toLocaleString()}</p>
                                  </div>
                                  <div className="col-span-2 bg-amber-50 rounded-2xl p-4 flex flex-col justify-center items-center text-center border border-amber-100">
                                      <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">拜訪未成業務</p>
                                      <p className="text-lg font-black text-amber-700">{s.unconvertedVisitsCount || 0} <span className="text-[10px] text-amber-600/70">家</span></p>
                                  </div>
                              </div>
                          </div>
                       ))}
                    </div>
                  )}
                  {financialTab === 'bonuses' && (
                    <div className="space-y-4">
                       {bonusRequests.map((b: any) => (
                          <div key={b.id} className="bg-white/60 backdrop-blur-xl p-8 rounded-[45px] border border-white shadow-2xl flex flex-col gap-4 group hover:bg-white transition-all duration-500 relative overflow-hidden">
                             <div className="flex justify-between items-start relative z-10 w-full">
                                <div className="space-y-2">
                                   <div className="flex items-center gap-2">
                                      <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100">{b.id}</p>
                                      <span className="text-[8px] font-bold text-slate-300 uppercase italic">{b.date} 提報</span>
                                   </div>
                                   <h4 className="text-md font-black text-slate-900">{b.salesName || b.sales}</h4>
                                   <p className="text-xl font-black text-slate-900 italic">${(b.amount || 0).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                   {b.status === 'Verified' || b.status === 'Paid' ? (
                                      <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-full shadow-inner"><span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">已完成核銷紀錄</span></div>
                                   ) : (
                                      <button onClick={() => setUploadingBonusId(b.id)} className="text-[9px] font-black text-white bg-slate-950 px-7 py-3.5 rounded-full uppercase tracking-[0.2em] shadow-2xl hover:bg-blue-600 hover:-translate-y-1 transition-all active:translate-y-0">點選核銷 📝</button>
                                   )}
                                </div>
                             </div>
                             
                             {/* Bank Info Section */}
                             <div className="mt-2 pt-4 border-t border-slate-100/50 relative z-10">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">匯款帳戶資訊</p>
                                {b.bankAccount && b.bankAccount.accountNo ? (
                                   <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
                                      <div>
                                         <p className="text-xs font-bold text-slate-900">{b.bankAccount.bankCode} {b.bankAccount.bankName}</p>
                                         <p className="text-[10px] font-bold text-slate-500">戶名: {b.bankAccount.accountName}</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="text-xs font-black text-slate-900 tracking-wider">{b.bankAccount.accountNo}</p>
                                      </div>
                                   </div>
                                ) : (
                                   <div className="bg-orange-50 rounded-2xl p-4 text-center">
                                      <p className="text-[10px] font-black text-orange-600 uppercase">該業務尚未設定銀行帳戶</p>
                                   </div>
                                )}
                             </div>
                          </div>
                       ))}
                       {uploadingBonusId && (
                         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-2xl z-[500] flex items-center justify-center p-4">
                            <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl space-y-6">
                               <h3 className="text-xl font-black text-slate-900">上傳匯款圖片</h3>
                               <p className="text-xs text-slate-500">請上傳匯款憑證，完成核銷作業。</p>
                               <input type="file" accept="image/*" onChange={onReceiptFileChange} className="w-full text-xs" />
                               {receiptBase64 && <img src={receiptBase64} alt="Receipt Preview" className="w-full h-32 object-cover rounded-2xl" />}
                               <div className="flex gap-4">
                                  <button onClick={() => { setUploadingBonusId(null); setReceiptBase64(''); }} className="flex-1 py-4 bg-slate-100 rounded-full text-xs font-black text-slate-500">取消</button>
                                  <button onClick={() => handleReconcileBonus(uploadingBonusId)} className="flex-1 py-4 bg-blue-600 rounded-full text-xs font-black text-white">確認已匯款</button>
                               </div>
                            </div>
                         </div>
                       )}
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
                     <button onClick={() => setIsEditProfileModalOpen(true)} className="absolute top-6 right-6 w-10 h-10 bg-white/50 rounded-full flex items-center justify-center text-slate-500 hover:bg-blue-600 hover:text-white transition-all backdrop-blur-md shadow-sm">
                        ✏️
                     </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-12 text-left relative z-10">
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">經銷商編碼 ID</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.code || initialProfile?.account || '未設定'}</p>
                     </div>
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">加入時間</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.joinedAt || '未設定'}</p>
                     </div>
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">官方通訊信箱</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.email || '未設定'}</p>
                     </div>
                     <div className="p-6 bg-white/40 rounded-[35px] border border-white/60 space-y-1 group hover:bg-white transition-all col-span-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">營運總部地址</p>
                        <p className="text-md font-black text-slate-900 group-hover:text-blue-600 transition-colors">{initialProfile?.address || '未設定'}</p>
                     </div>
                  </div>
               </section>

               {/* 銀行帳戶資訊 - 改為淺色玻璃風格 */}
               <section className="bg-white/60 backdrop-blur-xl p-10 rounded-[60px] shadow-2xl space-y-8 relative overflow-hidden group border border-white">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-[60px] -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all"></div>
                  
                  <div className="flex items-center gap-3 relative z-10 px-2">
                     <div className="w-1.5 h-4 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">銀行撥款帳戶資訊</h4>
                  </div>

                  <div className="space-y-5 relative z-10">
                     <div className="bg-white/40 p-6 rounded-[35px] border border-white/60 space-y-4">
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">解付銀行</p>
                           <p className="text-sm font-black text-slate-900">{initialProfile?.bankInfo?.bankCode ? `(${initialProfile.bankInfo.bankCode}) ` : ''}{initialProfile?.bankInfo?.bankName || '未設定'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/40">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">戶名</p>
                           <p className="text-sm font-black text-slate-900">{initialProfile?.bankInfo?.accountName || '未設定'}</p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/40">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">銀行帳號</p>
                           <p className="text-lg font-black text-blue-600 tracking-wider">
                              {initialProfile?.bankInfo?.accountNumber ? `**** **** ${initialProfile.bankInfo.accountNumber.slice(-4)}` : '未設定'}
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
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">合約週期倒數</p>
                           <p className="text-xl font-black text-slate-900 italic">
                             {(() => {
                               if (!initialCapacity.nextRenewal) return '無效期';
                               const end = new Date(initialCapacity.nextRenewal);
                               const now = new Date();
                               const diffTime = end.getTime() - now.getTime();
                               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                               return diffDays > 0 ? `${diffDays} DAYS` : 'EXPIRED';
                             })()}
                           </p>
                        </div>
                        <div className="w-px h-10 bg-slate-200"></div>
                        <div className="text-center space-y-1">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">剩餘宮廟額度</p>
                           <p className="text-xl font-black text-blue-600 italic">{initialCapacity.total > 0 ? `${initialCapacity.total - initialCapacity.used} NODES` : '無限額度'}</p>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-slate-100 flex justify-between items-center px-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">下一次約期續約日</p>
                        <p className="text-xs font-black text-blue-600 italic tracking-tighter">{initialCapacity.nextRenewal || '無效期'}</p>
                     </div>
                  </div>
               </section>

               <section className="flex gap-4">
                  <button className="w-full bg-rose-50 p-6 rounded-[40px] border border-rose-100 shadow-xl flex items-center justify-center gap-4 hover:bg-rose-600 group transition-all active:scale-95">
                     <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-xl group-hover:bg-white/20 group-hover:scale-110 transition-all">⏻</div>
                     <p className="text-sm font-black text-rose-600 group-hover:text-white uppercase tracking-widest">登出系統</p>
                  </button>
               </section>
            </div>
          )}

          {/* TAB: B2B Payment */}
          {activeTab === 'b2b_payment' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 pb-24">
              <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white">
                 <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">B2B 收款設定</h3>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">B2B Payment Config</p>
                    </div>
                    <button onClick={handleSaveB2bPayment} className="px-6 py-3 bg-blue-600 text-white font-black text-xs rounded-2xl hover:bg-slate-900 transition-colors shadow-lg">儲存設定</button>
                 </div>

                 <div className="space-y-4">
                    {/* Bank Transfer */}
                    <div className={`p-6 rounded-[30px] border-2 transition-all ${b2bPayment.customTransfer?.enabled ? 'border-blue-200 bg-blue-50/50' : 'border-slate-100 bg-white/50'}`}>
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black text-slate-900">銀行匯款</h4>
                          <input type="checkbox" checked={b2bPayment.customTransfer?.enabled} onChange={e=>setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, enabled: e.target.checked}})} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                       </div>
                       {b2bPayment.customTransfer?.enabled && (
                          <div className="grid grid-cols-2 gap-4 mt-4">
                             <input type="text" placeholder="銀行代碼" className="bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm" value={b2bPayment.customTransfer.bankCode} onChange={e=>setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, bankCode: e.target.value}})} />
                             <input type="text" placeholder="銀行名稱" className="bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm" value={b2bPayment.customTransfer.bankName} onChange={e=>setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, bankName: e.target.value}})} />
                             <input type="text" placeholder="戶名" className="col-span-2 bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm" value={b2bPayment.customTransfer.accountName} onChange={e=>setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, accountName: e.target.value}})} />
                             <input type="text" placeholder="帳號" className="col-span-2 bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm" value={b2bPayment.customTransfer.accountNo} onChange={e=>setB2bPayment({...b2bPayment, customTransfer: {...b2bPayment.customTransfer, accountNo: e.target.value}})} />
                          </div>
                       )}
                    </div>
                    
                    {/* LINE Pay (Auto Verify) */}
                    <div className={`p-6 rounded-[30px] border-2 transition-all ${b2bPayment.linePay?.enabled ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white/50'}`}>
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black text-slate-900">LINE Pay (自動核銷)</h4>
                          <input type="checkbox" checked={b2bPayment.linePay?.enabled} onChange={e=>setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, enabled: e.target.checked}})} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                       </div>
                       {b2bPayment.linePay?.enabled && (
                          <div className="grid grid-cols-1 gap-4 mt-4">
                             <input type="text" placeholder="Channel ID" className="bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm" value={b2bPayment.linePay.channelId} onChange={e=>setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelId: e.target.value}})} />
                             <input type="text" placeholder="Channel Secret" className="bg-white p-4 rounded-xl border border-slate-100 font-bold text-sm" value={b2bPayment.linePay.channelSecret} onChange={e=>setB2bPayment({...b2bPayment, linePay: {...b2bPayment.linePay, channelSecret: e.target.value}})} />
                          </div>
                       )}
                    </div>
                 </div>
              </section>
            </div>
          )}

          {/* TAB: Temple Payments */}
          {activeTab === 'temple_payments' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 pb-24">
              <section className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white">
                 <div className="space-y-1 mb-8">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">宮廟帳款審核</h3>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Temple Payments</p>
                 </div>
                 <div className="space-y-4">
                   {templePayments.length === 0 ? (
                      <p className="text-center text-sm font-bold text-slate-400 py-10">目前尚無帳款紀錄</p>
                   ) : (
                     templePayments.map((payment: any) => (
                       <div key={payment.id} className="bg-white/80 p-6 rounded-[24px] shadow-sm border border-slate-100 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payment.billingDate}</p>
                             <p className="text-lg font-black text-slate-900">{payment.templeName}</p>
                             <p className="text-sm font-bold text-slate-500 mt-1">金額: NT$ {(payment.amount || 0).toLocaleString()} <span className="text-xs text-slate-400 ml-2">項目: {payment.type === 'MonthlyFee' ? '月租費' : payment.type}</span></p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-3">
                               {payment.receiptUrl && (
                                 <button onClick={() => {setCurrentOrderId(payment.id); setCurrentReceiptImage(payment.receiptUrl); setCurrentOrderType('temple_bill'); setB2bReceiptViewerOpen(true);}} className="text-lg hover:opacity-70 transition-opacity" title="查看匯款截圖">👁️</button>
                               )}
                               <span 
                                 onClick={async () => {
                                    const newStatus = payment.status === 'Paid' ? 'Unpaid' : 'Paid';
                                    if(confirm(newStatus === 'Paid' ? '確認已收到款項？核銷後將計算營業額與獎金。' : '確認退回未付款狀態？')) {
                                      const { toggleBillStatusSimple, approveTempleBill } = await import('@/app/actions');
                                      if (newStatus === 'Paid') {
                                         await approveTempleBill(payment.id);
                                      } else {
                                         await toggleBillStatusSimple(payment.id, 'Unpaid');
                                      }
                                      window.location.reload();
                                    }
                                 }}
                                 className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 ${payment.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : payment.receiptUrl ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'}`}>
                                 {payment.status === 'Paid' ? '已付款' : '未付款'}
                               </span>
                             </div>
                          </div>
                       </div>
                     ))
                   )}
                 </div>
              </section>
            </div>
          )}

          {/* TAB: Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-700">
               <div className="bg-slate-950/90 backdrop-blur-xl rounded-[48px] p-10 space-y-8 shadow-2xl relative overflow-hidden border border-white/10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[50px]"></div>
                  {logs.length === 0 ? (
                     <div className="py-20 text-center text-slate-400 font-black text-sm uppercase tracking-widest">尚無系統紀錄</div>
                  ) : logs.map((log: any) => (
                     <div key={log.id} className="relative pl-8 border-l-2 border-blue-500/20 py-2 group/log">
                        <div className="absolute -left-[9px] top-2.5 w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)] group-hover/log:scale-125 transition-transform"></div>
                        <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5">{log.time} <span className="ml-2 text-slate-500 opacity-50">操作者: {log.operator}</span></p>
                        <h4 className="text-sm font-black text-white tracking-tight">{log.action}：<span className="text-slate-400 group-hover/log:text-blue-400 transition-colors">{log.target}</span></h4>
                     </div>
                  ))}
               </div>
            </div>
          )}
       </main>

       {/* --- NEW MORE MENU OVERLAY --- */}
       {isMoreMenuOpen && (
         <div className="fixed inset-0 z-[90] flex items-end justify-center pointer-events-none pb-[100px]">
           <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={() => setIsMoreMenuOpen(false)}></div>
           <div className="relative z-10 w-[92%] max-w-md bg-white/90 backdrop-blur-2xl border border-white rounded-[45px] shadow-2xl p-6 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-300">
             <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
             <div className="grid grid-cols-3 gap-4">
               {[
                 {id: 'team', icon: '👥', label: '團隊'},
                 {id: 'calendar', icon: '📅', label: '監控'},
                 {id: 'tools', icon: '🛠️', label: '工具'},
                 {id: 'b2b_payment', icon: '💳', label: '收款設定'},
                 {id: 'temple_payments', icon: '🧾', label: '宮廟帳款'},
                 {id: 'profile', icon: '⚙️', label: '資料'},
                 {id: 'logs', icon: '🛰️', label: '系統日誌'}
               ].map(t => (
                 <button 
                   key={t.id} 
                   onClick={() => { setActiveTab(t.id as any); setIsMoreMenuOpen(false); }} 
                   className="flex flex-col items-center justify-center p-4 bg-slate-50/50 rounded-3xl hover:bg-blue-50 hover:text-blue-600 transition-colors active:scale-95"
                 >
                   <span className="text-3xl drop-shadow-sm mb-2">{t.icon}</span>
                   <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{t.label}</span>
                 </button>
               ))}
             </div>
           </div>
         </div>
       )}

       {/* --- BOTTOM NAV --- */}
       <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-slate-900/90 backdrop-blur-3xl rounded-[40px] px-2 py-3 flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] z-[100] border border-white/10">
          {[
            {id: 'overview', icon: '💎', label: '首頁'},
            {id: 'temples', icon: '🏛️', label: '宮廟'},
            {id: 'approvals', icon: '⚡', label: '核定'},
            {id: 'financials', icon: '💰', label: '業績'}
          ].map(t => (
            <button key={t.id} onClick={() => {setActiveTab(t.id as any); setIsMoreMenuOpen(false);}} className={`flex flex-col items-center gap-1.5 transition-all duration-500 w-[20%] ${activeTab === t.id && !isMoreMenuOpen ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
               <span className={`text-2xl transition-all duration-500 ${activeTab === t.id && !isMoreMenuOpen ? 'drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]' : ''}`}>{t.icon}</span>
               <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t.id && !isMoreMenuOpen ? 'opacity-100 h-auto' : 'opacity-50 h-auto'}`}>{t.label}</span>
            </button>
          ))}
          <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className={`flex flex-col items-center gap-1.5 transition-all duration-500 w-[20%] ${isMoreMenuOpen ? 'text-blue-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
             <span className={`text-2xl transition-all duration-500 ${isMoreMenuOpen ? 'drop-shadow-[0_0_12px_rgba(96,165,250,0.5)] rotate-45' : ''}`}>＋</span>
             <span className={`text-[8px] font-black uppercase tracking-widest transition-all ${isMoreMenuOpen ? 'opacity-100' : 'opacity-50'}`}>選單</span>
          </button>
       </nav>

       {/* --- MODALS --- */}
       {viewTempleDetail && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[400] flex items-center justify-center p-6 animate-in fade-in duration-300">
             <div className="bg-white w-full rounded-[40px] p-8 shadow-2xl space-y-6 relative max-w-sm">
                <button onClick={() => setViewTempleDetail(null)} className="absolute top-4 right-4 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors font-black">✕</button>
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                   <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🏛️</div>
                   <div>
                      <h3 className="text-xl font-black text-slate-900">{viewTempleDetail.templeName}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {viewTempleDetail.id}</p>
                   </div>
                </div>
                <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">開設來源</p>
                          {viewTempleDetail.creatorRole === 'DistSales' ? (
                             <p className="text-sm font-black text-amber-600 flex items-center gap-2">🚀 經銷業務開發 <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px]">業務: {getSalesName(viewTempleDetail.salesId)}</span></p>
                          ) : (
                             <p className="text-sm font-black text-blue-600">🏢 經銷商直屬帳戶</p>
                          )}
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">系統代號</p>
                          <p className="text-sm font-black text-slate-800">{viewTempleDetail.templeNo || '無'}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">聯絡人 / 負責人</p>
                          <p className="text-xs font-black text-slate-800">{viewTempleDetail.chairpersonName || viewTempleDetail.contactName || '未設定'}</p>
                       </div>
                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">聯絡電話</p>
                          <p className="text-xs font-black text-slate-800">{viewTempleDetail.phone || viewTempleDetail.contactPhone || '未提供'}</p>
                       </div>
                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">登入帳號</p>
                          <p className="text-xs font-black text-slate-800">{viewTempleDetail.account || '未設定'}</p>
                       </div>
                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">所在地區</p>
                          <p className="text-xs font-black text-slate-800">{viewTempleDetail.city}{viewTempleDetail.district}</p>
                       </div>

                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">開辦費</p>
                          <p className="text-xs font-black text-slate-800">${(viewTempleDetail.setupFee || 12000).toLocaleString()}</p>
                       </div>
                       <div className="bg-white border border-slate-200 p-3 rounded-2xl relative overflow-hidden">
                          {viewTempleDetail.paymentCycle === 'Yearly' ? (
                             <>
                                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">年租方案 (享{((viewTempleDetail.appliedDiscountRate || 20) % 10 === 0) ? (10 - (viewTempleDetail.appliedDiscountRate || 20) / 10) : (100 - (viewTempleDetail.appliedDiscountRate || 20))}折)</p>
                                <p className="text-xs font-black text-emerald-800">${((viewTempleDetail.monthlyRent || 3600) * 12 * (1 - (viewTempleDetail.appliedDiscountRate || 20) / 100)).toLocaleString()} / 年</p>
                             </>
                          ) : (
                             <>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">月租方案</p>
                                <p className="text-xs font-black text-slate-800">${(viewTempleDetail.monthlyRent || 3600).toLocaleString()} / 月</p>
                             </>
                          )}
                       </div>

                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">合約到期日</p>
                          <p className="text-xs font-black text-slate-800">{viewTempleDetail.contractEndDate || '永久有效'}</p>
                       </div>
                       <div className="bg-white border border-slate-200 p-3 rounded-2xl">
                          <p className="text-[9px] font-black text-slate-400 uppercase mb-1">繳款狀態</p>
                          <p className={`text-xs font-black ${viewTempleDetail.paymentStatusLabel?.includes('欠費') || viewTempleDetail.paymentStatusLabel?.includes('逾期') ? 'text-rose-600' : 'text-emerald-600'}`}>
                             {viewTempleDetail.paymentStatusLabel || '正常'}
                          </p>
                       </div>

                       <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl col-span-2">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-2">系統雲端與AI設定</p>
                          <div className="flex flex-wrap gap-2">
                             <span className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm">☁️ 雲端: {viewTempleDetail.cloudStorage || '500GB'}</span>
                             <span className="bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm">🤖 AI方案: {viewTempleDetail.aiAssistant || '基礎版'}</span>
                             {viewTempleDetail.trialMonths > 0 && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm">🎁 體驗 {viewTempleDetail.trialMonths} 個月</span>}
                          </div>
                       </div>
                    </div>
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
       {/* Edit Profile Modal */}
       {isEditProfileModalOpen && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[500] flex items-end animate-in fade-in duration-300">
            <form onSubmit={handleUpdateProfile} className="bg-white w-full rounded-t-[60px] p-12 pb-24 shadow-2xl space-y-8 animate-in slide-in-from-bottom-20 duration-500 max-w-xl mx-auto max-h-[90vh] overflow-y-auto no-scrollbar relative">
               <div className="sticky top-0 bg-white/80 backdrop-blur-md pt-2 pb-6 z-10 flex justify-between items-center border-b border-slate-50 mb-4">
                  <div className="space-y-1">
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">編輯經銷商資料</h3>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Edit Distributor Profile</p>
                  </div>
                  <button type="button" onClick={() => setIsEditProfileModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">✕</button>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">經銷商名稱</p>
                     <input type="text" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.name} onChange={e=>setEditProfileForm({...editProfileForm, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">官方通訊信箱</p>
                     <input type="email" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.email} onChange={e=>setEditProfileForm({...editProfileForm, email: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">總部地址</p>
                     <input type="text" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.address} onChange={e=>setEditProfileForm({...editProfileForm, address: e.target.value})} required />
                  </div>
                  
                  <div className="pt-6 border-t border-slate-100">
                     <h4 className="text-lg font-black text-slate-900 tracking-tight mb-4">銀行帳戶資訊</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">解付銀行名稱</p>
                           <input type="text" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.bankName} onChange={e=>setEditProfileForm({...editProfileForm, bankName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">銀行代碼 (Bank Code)</p>
                           <input type="text" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.bankCode || ''} onChange={e=>setEditProfileForm({...editProfileForm, bankCode: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">戶名</p>
                           <input type="text" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.accountName} onChange={e=>setEditProfileForm({...editProfileForm, accountName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">銀行帳號</p>
                           <input type="text" className="w-full bg-slate-50 rounded-[28px] p-6 text-sm font-black outline-none focus:border-blue-200 border-2 border-transparent transition-all" value={editProfileForm.accountNumber} onChange={e=>setEditProfileForm({...editProfileForm, accountNumber: e.target.value})} />
                        </div>
                     </div>
                  </div>
               </div>
               
               <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-[30px] font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl">
                  儲存變更
               </button>
            </form>
         </div>
       )}

       {/* B2B Receipt Viewer Modal */}
       {b2bReceiptViewerOpen && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[40px] p-8 space-y-6 shadow-2xl border border-white/20">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900 tracking-tighter">匯款截圖對帳</h3>
                <button onClick={() => setB2bReceiptViewerOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600">✕</button>
             </div>
             <div className="aspect-auto bg-slate-100 rounded-[20px] overflow-hidden flex items-center justify-center">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={currentReceiptImage || undefined} alt="Receipt" className="max-w-full h-auto object-contain" />
             </div>
             <div className="grid grid-cols-2 gap-4">
               <button onClick={() => handleVerifyOrderAction('rejected')} className="py-4 bg-rose-50 text-rose-600 rounded-[20px] font-black tracking-widest hover:bg-rose-600 hover:text-white transition-all text-sm">駁回款項</button>
               <button onClick={() => handleVerifyOrderAction('paid')} className="py-4 bg-emerald-500 text-white rounded-[20px] font-black tracking-widest hover:bg-emerald-600 transition-all text-sm">確認已收款</button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
