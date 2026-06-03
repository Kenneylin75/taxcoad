// @ts-nocheck
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { 
  updateServiceSettings, 
  fetchStoragePlans, 
  fetchTempleStorages, 
  upgradeTempleStorage 
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

  useEffect(() => {
    // Load storage info and plans
    fetchStoragePlans().then(setStoragePlans);
    fetchTempleStorages().then(list => {
      const myStorage = list.find(s => s.templeId === 'temple-1') || {
        templeId: 'temple-1',
        templeName: '預設示範宮廟',
        city: '台北市',
        usedBytes: 2576980377, // 2.4 GB
        quotaGb: 5,
        planName: '免費 5GB 空間'
      };
      setStorageInfo(myStorage);
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
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateServiceSettings();
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
    </div>
  );
}
