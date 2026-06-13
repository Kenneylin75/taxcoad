// @ts-nocheck
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { 
  updateServiceSettings, fetchServiceSettings,
  fetchStoragePlans, 
  fetchTempleStorages, 
  upgradeTempleStorage, fetchTempleAiUsage, toggleTempleAiStatus, purchaseAiPlan, fetchAiPlans, fetchB2BPaymentConfig,
  getTempleBasicInfo, updateTempleBasicInfo, getTempleCreatorInfo
} from '@/app/actions';

export default function AdvancedSettingsPage() {
  const [settings, setSettings] = useState<any>({
    modules: {
      calendar: true,
      lamps: true,
      queue: true,
      events: true,
      analytics: true,
      agi: true,
    },
    guestRequiredFields: {
      birthday: true,
      address: false,
      trouble: true,
    },
    rules: {
      allowCancel: true,
      allowModify: true,
      cancelThresholdHours: 24,
      modifyThresholdHours: 48,
    },
    preferences: {
      darkMode: true,
      autoAudit: true,
      lineNotify: true,
    }
  });

  const [isPending, startTransition] = useTransition();

  // Storage UI States
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [storagePlans, setStoragePlans] = useState<any[]>([]);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [isPaying, setIsPaying] = useState(false);
  const [aiInfo, setAiInfo] = useState<any>(null);
  const [aiPlans, setAiPlans] = useState<any[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedAiPlanId, setSelectedAiPlanId] = useState('');
  
  const [creatorInfo, setCreatorInfo] = useState<any>(null);

  const [b2bConfig, setB2bConfig] = useState<any>(null);
  const [b2bModalOpen, setB2bModalOpen] = useState(false);
  const [b2bTarget, setB2bTarget] = useState<any>(null); // { type: 'storage' | 'ai' }
  const [selectedB2bMethod, setSelectedB2bMethod] = useState('creditCard');
  const [transferLast5, setTransferLast5] = useState('');

  const [basicInfo, setBasicInfo] = useState<any>(null);

  useEffect(() => {
    // Load storage info and plans
    fetchStoragePlans().then(setStoragePlans);
    fetchAiPlans().then(setAiPlans);
    fetchTempleAiUsage().then(setAiInfo);
    
    // We assume templeId is accessible via window.location or we can just pass dynamic ID
    const currentTempleId = decodeURIComponent(window.location.pathname.split('/')[1]);
    
    getTempleBasicInfo(currentTempleId).then(setBasicInfo);
    getTempleCreatorInfo(currentTempleId).then(setCreatorInfo);
    
    fetchB2BPaymentConfig(currentTempleId).then(setB2bConfig);
    fetchTempleStorages().then(list => {
      const myStorage = list.find(s => s.templeId === currentTempleId) || {
        templeId: currentTempleId,
        templeName: basicInfo?.templeName || '未知宮廟',
        city: basicInfo?.city || '台北市',
        usedBytes: 0,
        quotaGb: 5,
        planName: '免費 5GB 空間'
      };
      setStorageInfo(myStorage);
    });

    fetchServiceSettings().then(fetchedSettings => {
      if (fetchedSettings) {
        setSettings((prev: any) => ({
          ...prev,
          ...fetchedSettings,
          modules: { ...prev.modules, ...(fetchedSettings.modules || {}) },
          guestRequiredFields: { ...prev.guestRequiredFields, ...(fetchedSettings.guestRequiredFields || {}) },
          rules: { ...prev.rules, ...(fetchedSettings.rules || {}) },
          preferences: { ...prev.preferences, ...(fetchedSettings.preferences || {}) }
        }));
      }
    });
  }, []);

  const handleToggle = (category: string, field: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as any),
        [field]: !(prev[category] as any)[field]
      }
    }));
    if (field === 'agi') {
      startTransition(async () => {
        await toggleTempleAiStatus(!settings.modules.agi);
      });
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateServiceSettings(settings);
      alert('✅ 系統配置已成功儲存並同步！');
    });
  };

  const handleUpgrade = () => {
    if (!selectedPlanId) {
      alert('請先選擇一個空間容量方案！');
      return;
    }
    const plan = storagePlans.find(p => p.id === selectedPlanId);
    if (!plan) return;

    const priceMonthly = plan.priceMonthly;
    const priceYearly = Math.round(plan.priceMonthly * 12 * 0.8);
    const finalPrice = selectedCycle === 'Monthly' ? priceMonthly : priceYearly;

    setIsPaying(true);
    // 建立訂單編號: TS-[Timestamp]-temple-1-[PlanSizeGb]-[selectedCycle]
    const orderId = `TS-${Date.now()}-temple-1-${plan.sizeGb}-${selectedCycle}`;
    
    // 跳轉至我們的模擬支付網關
    window.location.href = `/api/payment-mock-gateway?orderId=${orderId}&amount=${finalPrice}&gateway=ecpay`;
  };

  const sections = [
    {
      id: 'modules',
      title: '系統功能模組控制',
      subtitle: 'Feature Deployment Infrastructure',
      icon: '🛡️',
      items: [
        { id: 'calendar', name: '預約行程日曆', desc: '控制全域預約行程的可見性與數位操作邊界' },
        { id: 'lamps', name: '點燈祈福管理', desc: '管理信眾點燈、安太歲紀錄與過期巡檢' },
        { id: 'queue', name: '現場排隊叫號', desc: '啟動數位排隊、實時叫號與流量分流控管' },
        { id: 'events', name: '法會活動管理', desc: '部署大型法會報名系統與多維度活動案板' },
        { id: 'analytics', name: '數據分析面板', desc: '展示實時營運指標、財務熱圖與決策圖表' },
        { id: 'agi', name: 'AI 智能香客管家', desc: '啟用 AI 自動客服、語意理解與自動應答' },
      ]
    },
    {
      id: 'guestRequiredFields',
      title: '信眾報名欄位控制',
      subtitle: 'Dynamic Form Configuration',
      icon: '📜',
      items: [
        { id: 'birthday', name: '強制填寫生辰', desc: '信眾報名時是否必須提供精確農曆生辰數據' },
        { id: 'address', name: '強制填寫住址', desc: '信眾報名時是否必須提供精確通訊地址' },
        { id: 'trouble', name: '開放困擾描述', desc: '是否允許信眾在報名時進行深度困擾語意描述' },
      ]
    },
    {
      id: 'preferences',
      title: '系統偏好與自動化',
      subtitle: 'System Preference Engine',
      icon: '⚙️',
      items: [
        { id: 'lineNotify', name: 'LINE 實時通知', desc: '預約成功時自動執行 LINE 推播提醒' },
        { id: 'autoAudit', name: '管理行為稽核', desc: '自動紀錄全域管理員的所有數位變動與足跡' },
        { id: 'darkMode', name: '後台深色主題', desc: '調整後台管理系統之視覺主題能級' },
      ]
    }
  ];

  // Calculate percentage used
  const usedGb = storageInfo ? (storageInfo.usedBytes / (1024 * 1024 * 1024)) : 0;
  const quotaGb = storageInfo ? storageInfo.quotaGb : 5;
  const percentage = Math.min((usedGb / quotaGb) * 100, 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">系統進階配置</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Infrastructure Control Matrix</p>
         </div>

         <button 
           onClick={handleSave}
           disabled={isPending}
           className="bg-slate-900 text-amber-500 px-6 py-2 rounded-xl font-black text-[10px] tracking-widest shadow-md hover:bg-slate-800 transition-all flex items-center gap-2 border border-slate-800 uppercase"
         >
           <span>{isPending ? '⏳' : '⚔️'}</span> 
           {isPending ? '同步中...' : '儲存系統設定'}
         </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 relative">
         <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-sm shadow-inner">🏛️</div>
               <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">宮廟基本資料</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Temple Basic Information</p>
               </div>
            </div>
            <button 
              onClick={() => {
                startTransition(async () => {
                  const res = await updateTempleBasicInfo(basicInfo, window.location.pathname.split('/')[1]);
                  if (res.success) alert('宮廟基本資料已更新！');
                });
              }}
              className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
            >
              更新資料
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">宮廟名稱</label>
              <input type="text" value={basicInfo?.templeName || ''} onChange={e => setBasicInfo({...basicInfo, templeName: e.target.value})} className="w-full bg-slate-50 border-0 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">所在縣市</label>
              <input type="text" value={basicInfo?.city || ''} onChange={e => setBasicInfo({...basicInfo, city: e.target.value})} className="w-full bg-slate-50 border-0 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">詳細地址</label>
              <input type="text" value={basicInfo?.address || ''} onChange={e => setBasicInfo({...basicInfo, address: e.target.value})} className="w-full bg-slate-50 border-0 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">聯絡電話</label>
              <input type="text" value={basicInfo?.templePhone || ''} onChange={e => setBasicInfo({...basicInfo, templePhone: e.target.value})} className="w-full bg-slate-50 border-0 rounded-lg px-4 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500" />
            </div>
         </div>
      </div>

      {/* Creator Info */}
      {creatorInfo && (
         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-blue-200/50">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg text-white flex items-center justify-center text-sm shadow-md">🤝</div>
                  <div>
                     <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">系統開通與服務窗口</h3>
                     <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">Account Provider & Service Contact</p>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {(creatorInfo.type === 'dist_sales' || creatorInfo.type === 'super_sales') && (
                  <div className="space-y-2 bg-white/60 p-4 rounded-xl border border-white">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">服務業務專員</p>
                     <h4 className="text-base font-black text-slate-800">{creatorInfo.salesName}</h4>
                     <p className="text-xs font-bold text-slate-500">聯絡方式: {creatorInfo.salesPhone}</p>
                  </div>
               )}
               
               {(creatorInfo.type === 'dist_sales' || creatorInfo.type === 'distributor') && (
                  <div className="space-y-2 bg-white/60 p-4 rounded-xl border border-white">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">所屬授權經銷商</p>
                     <h4 className="text-base font-black text-slate-800">{creatorInfo.distName}</h4>
                     <p className="text-xs font-bold text-slate-500">聯絡方式: {creatorInfo.distPhone}</p>
                  </div>
               )}

               {creatorInfo.type === 'super_admin' && (
                  <div className="space-y-2 bg-white/60 p-4 rounded-xl border border-white md:col-span-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統總管理處</p>
                     <h4 className="text-base font-black text-slate-800">{creatorInfo.adminName}</h4>
                     <p className="text-xs font-bold text-slate-500">聯絡方式: {creatorInfo.adminContact}</p>
                  </div>
               )}
            </div>
         </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Configuration Columns */}
         <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {sections.map((section) => (
                 <div key={section.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center text-sm shadow-sm">
                             {section.icon}
                          </div>
                          <div>
                             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{section.title}</h3>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{section.subtitle}</p>
                          </div>
                       </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1">
                       {section.items.map((item) => {
                         const isActive = (settings[section.id] as any)[item.id];
                         return (
                           <div 
                             key={item.id} 
                             onClick={() => handleToggle(section.id, item.id)}
                             className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                               isActive 
                               ? 'bg-amber-50 border-amber-200 shadow-sm' 
                               : 'bg-white border-transparent hover:bg-slate-50'
                             }`}
                           >
                              <div className="space-y-0.5 flex-1 pr-4">
                                 <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-amber-700' : 'text-slate-600'}`}>{item.name}</p>
                                 <p className="text-[8px] font-bold text-slate-400 italic leading-tight">{item.desc}</p>
                              </div>
                              <div className={`w-8 h-4 rounded-full transition-all relative shrink-0 border border-white shadow-inner ${isActive ? 'bg-amber-500' : 'bg-slate-200'}`}>
                                 <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all shadow-sm ${isActive ? 'left-[18px]' : 'left-[2px]'}`}></div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               ))}
            </div>
         </div>



         {/* Sidebar: AI Assistant Manager */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm shadow-inner">🤖</div>
               <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">AI 智能香客管家</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SaaS AI Assistant Status</p>
               </div>
            </div>

            {!settings.modules.agi ? (
               <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-slate-400">模組尚未啟用，請從左側開啟</p>
               </div>
            ) : aiInfo && (
               <div className="space-y-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <span>當前方案</span>
                     <span className="text-slate-800">{aiInfo.planName}</span>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-[11px] font-black italic">
                        <span className="text-slate-800">{aiInfo.isVip ? '免費無限' : `${aiInfo.usedCount} 次已使用`}</span>
                        <span className="text-slate-400">{aiInfo.isVip ? '無限制' : `配額 ${aiInfo.chatLimit} 次`}</span>
                     </div>
                     {!aiInfo.isVip && (
                       <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                          <div 
                             className={`h-full rounded-full transition-all ${
                                (aiInfo.usedCount / aiInfo.chatLimit) * 100 >= 85 ? 'bg-rose-500 animate-pulse' : 'bg-fuchsia-500'
                             }`}
                             style={{ width: `${Math.min((aiInfo.usedCount / aiInfo.chatLimit) * 100, 100)}%` }}
                          ></div>
                       </div>
                     )}
                     <p className="text-[8px] font-bold text-slate-400 italic">
                        到期日: {aiInfo.isVip ? '永久有效' : new Date(aiInfo.expiryDate).toLocaleDateString()} 
                        {(!aiInfo.isVip && new Date(aiInfo.expiryDate).getTime() < Date.now()) && <span className="text-rose-500 ml-1">(已過期)</span>}
                     </p>
                  </div>

                  <button 
                     onClick={() => setIsAiModalOpen(true)}
                     className="w-full py-3 bg-slate-900 text-fuchsia-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                  >
                     升級與續約方案
                  </button>
               </div>
            )}
         </div>
         {/* Sidebar: Cloud Storage & Quota Manager */}
         <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm shadow-inner">☁️</div>
                  <div>
                     <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">宮廟獨立雲端儲存</h3>
                     <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SaaS Cloud Storage Status</p>
                  </div>
               </div>

               {storageInfo && (
                  <div className="space-y-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>當前方案</span>
                        <span className="text-slate-800">{storageInfo.planName}</span>
                     </div>

                     <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-black italic">
                           <span className="text-slate-800">{usedGb.toFixed(2)} GB 已使用</span>
                           <span className="text-slate-400">配額上限 {quotaGb} GB</span>
                        </div>
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                           <div 
                              className={`h-full rounded-full transition-all ${
                                 percentage >= 85 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                           ></div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 italic">適用於信眾預約上傳、相片歸檔、法會影像雲端備份等儲存功能。</p>
                     </div>

                     <button 
                        onClick={() => setIsUpgradeModalOpen(true)}
                        className="w-full py-3 bg-slate-900 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-md hover:bg-slate-800 hover:-translate-y-0.5 transition-all"
                     >
                        ⚡ 點擊升級容量空間
                     </button>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* --- MODAL: UPGRADE CLOUD STORAGE --- */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6 animate-in zoom-in-95">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                 <div>
                    <h3 className="text-base font-black text-slate-900">升級宮廟專屬雲端儲存空間</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Upgrade Cloud Storage Quota</p>
                 </div>
                 <button onClick={() => setIsUpgradeModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center font-bold transition-all">✕</button>
              </div>

              <div className="space-y-4">
                 {/* Cycle Selector */}
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                       type="button" 
                       onClick={() => setSelectedCycle('Monthly')}
                       className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedCycle === 'Monthly' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
                    >
                       月繳費
                    </button>
                    <button 
                       type="button" 
                       onClick={() => setSelectedCycle('Yearly')}
                       className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${selectedCycle === 'Yearly' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400'}`}
                    >
                       年繳費 (省20%)
                    </button>
                 </div>

                 {/* Storage Plans list */}
                 <div className="space-y-3">
                    {storagePlans.map(plan => {
                       const priceMonthly = plan.priceMonthly;
                       const priceYearly = Math.round(plan.priceMonthly * 12 * 0.8); // 20% discount
                       const finalPrice = selectedCycle === 'Monthly' ? priceMonthly : priceYearly;
                       const isSelected = selectedPlanId === plan.id;
                       
                       return (
                          <div 
                             key={plan.id}
                             onClick={() => setSelectedPlanId(plan.id)}
                             className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                isSelected ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100 hover:border-slate-200'
                             }`}
                          >
                             <div>
                                <p className="text-sm font-black text-slate-800 italic">{plan.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">空間上限: {plan.sizeGb} GB</p>
                             </div>
                             <div className="text-right">
                                <p className="text-lg font-black text-slate-900 italic">${finalPrice.toLocaleString()}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{selectedCycle === 'Monthly' ? '/ 月' : '/ 年'}</p>
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 {/* Simulated Payment Area */}
                 {selectedPlanId && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">選擇模擬支付方式 (Simulated Gateway)</p>
                       <div className="grid grid-cols-3 gap-2">
                          <button type="button" className="py-2.5 rounded-lg bg-white border border-slate-200 text-[9px] font-black hover:border-amber-500 text-slate-600 uppercase tracking-widest">💳 信用卡</button>
                          <button type="button" className="py-2.5 rounded-lg bg-white border border-slate-200 text-[9px] font-black hover:border-amber-500 text-slate-600 uppercase tracking-widest">🟢 LINE PAY</button>
                          <button type="button" className="py-2.5 rounded-lg bg-white border border-slate-200 text-[9px] font-black hover:border-amber-500 text-slate-600 uppercase tracking-widest">🏦 銀行轉帳</button>
                       </div>
                       <p className="text-[8px] font-bold text-indigo-500 italic text-center mt-1">※ 本費用為 SaaS 特許擴展服務，100% 費用將直接匯入系統中央管理總部 (超級管理員)。</p>
                    </div>
                 )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                 <button 
                    onClick={handleUpgrade}
                    disabled={isPaying || !selectedPlanId}
                    className="flex-1 py-4 bg-slate-900 text-amber-500 rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 transition-all flex items-center justify-center gap-2"
                 >
                    {isPaying ? (
                       <>
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          正在安全傳輸金流指令...
                       </>
                    ) : '確認支付並即時升級 🚀'}
                 </button>
              </div>
           </div>
        </div>
      )}

      
      {/* B2B Payment Modal */}
      {b2bModalOpen && b2bConfig && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border-4 border-white max-h-[90vh]">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute right-0 top-0 opacity-5 text-8xl -translate-y-8 translate-x-8">💰</div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">B2B 安全金流閘道</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Secure Payment Gateway</p>
                 </div>
                 <button onClick={() => setB2bModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center font-bold transition-all relative z-10">✕</button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto">
                 <h4 className="text-sm font-black text-slate-800">選擇付款方式</h4>
                 <div className="grid grid-cols-1 gap-3">
                    {b2bConfig.enabledMethods.includes('creditCard') && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedB2bMethod === 'creditCard' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}>
                          <input type="radio" name="b2bMethod" className="sr-only" checked={selectedB2bMethod === 'creditCard'} onChange={() => setSelectedB2bMethod('creditCard')} />
                          <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">💳</span>
                          <div>
                             <p className="text-sm font-black text-slate-800">信用卡安全支付 (ECPay)</p>
                             <p className="text-[10px] font-bold text-slate-400">支援 VISA, MasterCard, JCB</p>
                          </div>
                          {selectedB2bMethod === 'creditCard' && <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">✓</div>}
                       </label>
                    )}
                    {b2bConfig.enabledMethods.includes('linePay') && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedB2bMethod === 'linePay' ? 'border-green-500 bg-green-50' : 'border-slate-100 hover:border-slate-300'}`}>
                          <input type="radio" name="b2bMethod" className="sr-only" checked={selectedB2bMethod === 'linePay'} onChange={() => setSelectedB2bMethod('linePay')} />
                          <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">📱</span>
                          <div>
                             <p className="text-sm font-black text-slate-800">LINE Pay</p>
                             <p className="text-[10px] font-bold text-slate-400">使用 LINE Points 折抵</p>
                          </div>
                          {selectedB2bMethod === 'linePay' && <div className="ml-auto w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>}
                       </label>
                    )}
                    {b2bConfig.enabledMethods.includes('transfer') && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedB2bMethod === 'transfer' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-300'}`}>
                          <input type="radio" name="b2bMethod" className="sr-only" checked={selectedB2bMethod === 'transfer'} onChange={() => setSelectedB2bMethod('transfer')} />
                          <span className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-xl">🏦</span>
                          <div>
                             <p className="text-sm font-black text-slate-800">銀行匯款 / ATM 轉帳</p>
                             <p className="text-[10px] font-bold text-slate-400">專屬虛擬帳號或實體轉帳</p>
                          </div>
                          {selectedB2bMethod === 'transfer' && <div className="ml-auto w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>}
                       </label>
                    )}
                 </div>

                 {/* Transfer Details */}
                 {selectedB2bMethod === 'transfer' && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-4 animate-in fade-in zoom-in-95">
                       <h5 className="text-xs font-black text-slate-800 mb-4 uppercase tracking-widest">請匯款至以下帳戶</h5>
                       <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-bold text-slate-500">銀行代碼</span>
                             <span className="text-sm font-black text-slate-800">{b2bConfig.transfer.bankCode}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-bold text-slate-500">收款帳號</span>
                             <span className="text-sm font-black text-slate-800 font-mono tracking-wider text-emerald-600">{b2bConfig.transfer.accountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                             <span className="text-[10px] font-bold text-slate-500">戶名</span>
                             <span className="text-sm font-black text-slate-800">{b2bConfig.transfer.accountName}</span>
                          </div>
                       </div>
                       <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">您的匯款帳號末五碼</label>
                          <input type="text" maxLength={5} placeholder="例如: 12345" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/50"
                             value={transferLast5} onChange={e => setTransferLast5(e.target.value)} />
                       </div>
                    </div>
                 )}
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                 <button 
                    onClick={() => {
                       if (selectedB2bMethod === 'transfer' && transferLast5.length < 5) {
                          return alert('請輸入完整的帳號末五碼！');
                       }
                       setIsPaying(true);
                       startTransition(async () => {
                          const currentTempleId = window.location.pathname.split('/')[1];
                          const methodStr = selectedB2bMethod === 'creditCard' ? '信用卡' : selectedB2bMethod === 'linePay' ? 'LINE Pay' : `轉帳(${transferLast5})`;
                          
                          if (b2bTarget.type === 'storage') {
                             const res = await upgradeTempleStorage(currentTempleId, selectedPlanId, selectedCycle);
                             if (res.success) {
                                alert(`✅ [${methodStr}] 付款/通報成功！雲端空間已即時擴充！`);
                                fetchTempleStorages().then(list => {
                                  const myStorage = list.find(s => s.templeId === currentTempleId);
                                  if (myStorage) setStorageInfo(myStorage);
                                });
                             }
                          } else if (b2bTarget.type === 'ai') {
                             const res = await purchaseAiPlan(selectedAiPlanId, methodStr);
                             if (res.success) {
                                alert(`✅ [${methodStr}] 付款/通報成功！AI 方案已升級！`);
                                fetchTempleAiUsage().then(setAiInfo);
                             }
                          }
                          setIsPaying(false);
                          setB2bModalOpen(false);
                       });
                    }}
                    disabled={isPaying || !selectedB2bMethod}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                 >
                    {isPaying ? '處理中...' : selectedB2bMethod === 'transfer' ? '確認已匯款並開通' : '前往支付閘道並開通'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* AI Upgrade Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col border-4 border-white max-h-[90vh]">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center relative overflow-hidden shrink-0">
                 <div className="absolute right-0 top-0 opacity-5 text-9xl -translate-y-10 translate-x-10">🤖</div>
                 <div className="relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter uppercase">AI 方案續約與升級</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">AI Assistant Plan Upgrade</p>
                 </div>
                 <button onClick={() => setIsAiModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 flex items-center justify-center font-bold transition-all relative z-10">✕</button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiPlans.map(plan => (
                       <label key={plan.id} className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${selectedAiPlanId === plan.id ? 'border-fuchsia-500 bg-fuchsia-50 shadow-md translate-y-0' : 'border-slate-100 hover:border-slate-300 bg-white hover:-translate-y-1'}`}>
                          <input type="radio" name="aiPlan" className="sr-only" checked={selectedAiPlanId === plan.id} onChange={() => setSelectedAiPlanId(plan.id)} />
                          {selectedAiPlanId === plan.id && <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-fuchsia-500 shadow-sm flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full"></div></div>}
                          <h4 className="text-sm font-black text-slate-900 mb-1">{plan.name}</h4>
                          <p className="text-2xl font-black text-fuchsia-600 mb-4">NT$ {plan.monthlyFee}</p>
                          <div className="space-y-2">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="text-emerald-500">✓</span> 每月對話上限 {plan.chatLimit} 次</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="text-emerald-500">✓</span> 智慧上下文記憶</div>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><span className="text-emerald-500">✓</span> 30天訂閱保障</div>
                          </div>
                       </label>
                    ))}
                 </div>
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                 <button 
                    onClick={() => {
                       if (!selectedAiPlanId) return alert('請選擇方案');
                       if (!b2bConfig || !b2bConfig.enabledMethods || b2bConfig.enabledMethods.length === 0) {
                         alert('上層機構尚未設定收款方式，請聯繫代理商或系統客服。');
                         return;
                       }
                       setB2bTarget({ type: 'ai' });
                       setSelectedB2bMethod(b2bConfig.enabledMethods[0]);
                       setIsAiModalOpen(false); // Close AI plan modal
                       setB2bModalOpen(true);
                    }}
                    disabled={isPaying || !selectedAiPlanId}
                    className="w-full py-5 bg-slate-900 text-fuchsia-400 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {isPaying ? '處理金流中...' : '確認信用卡結帳並啟用'}
                 </button>
                 <p className="text-center text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest italic">付款後將立即重置 30 天訂閱期與對話次數</p>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
