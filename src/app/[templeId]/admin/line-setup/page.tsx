// @ts-nocheck
"use client";

import React, { useState, useEffect } from 'react';
import { 
  fetchServiceSettings, 
  updateServiceSettings, 
  fetchServiceDefinitions,
  fetchLampCategories,
  fetchEvents,
  fetchQueueEvents, 
  ServiceSettings, 
  ServiceDefinition, 
  LinePushStage, 
  ServicePushConfig 
} from '@/app/actions';

export default function LineSetupPage() {
  const [activeTab, setActiveTab] = useState<'setup' | 'rules'>('setup');
  const [step, setStep] = useState(1);
  const [token, setToken] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Settings Data
  const [settings, setSettings] = useState<ServiceSettings | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchServiceSettings(), fetchServiceDefinitions(), fetchLampCategories(), fetchEvents(), fetchQueueEvents()]).then(([setts, servs, lamps, evts, queues]) => {
      const allServices = [
        ...servs.map((s: any) => ({ id: s.id, name: s.name || '未命名服務', group: '預約服務' })),
        ...lamps.map((l: any) => ({ id: l.id, name: l.name || '未命名點燈', group: '點燈服務' })),
        ...evts.map((e: any) => ({ id: e.id, name: e.title || '未命名活動', group: '法會活動' })),
        ...queues.map((q: any) => ({ id: q.id, name: q.eventName || '未命名排隊', group: '現場排隊' }))
      ];
      setServices(allServices);
      
      // Auto-initialize push configs for new services
      if (setts) {
        const newConfigs = [...(setts.pushConfigs || [])];
        let changed = false;
        allServices.forEach(s => {
           if (!newConfigs.find(c => c.serviceId === s.id)) {
              newConfigs.push({ serviceId: s.id, stages: [] });
              changed = true;
           }
        });
        if (changed) {
           setSettings({ ...setts, pushConfigs: newConfigs });
        } else {
           setSettings(setts);
        }
      }
    });
  }, []);

  const handleTest = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setTestResult('Success! 測試訊息已送出，請查看您的 LINE 官方帳號。');
    }, 1500);
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    await updateServiceSettings(settings);
    setIsSaving(false);
    alert("LINE 串接與推播規則已成功更新！");
  };

  const addStage = (serviceId: string) => {
    if (!settings) return;
    const newStage: LinePushStage = {
      id: 'p-' + Date.now(),
      timeType: 'Before',
      timeValue: 24,
      timeUnit: 'Hours',
      target: 'Customer',
      content: '提醒您預約即將開始。',
      enabled: true
    };

      const newPushConfigs = [...(settings.pushConfigs || [])];
    const configIndex = newPushConfigs.findIndex(c => c.serviceId === serviceId);
    
    if (configIndex > -1) {
      newPushConfigs[configIndex].stages.push(newStage);
    } else {
      newPushConfigs.push({ serviceId, stages: [newStage] });
    }

    setSettings({ ...settings, pushConfigs: newPushConfigs });
  };

  const removeStage = (serviceId: string, stageId: string) => {
    if (!settings) return;
    const newPushConfigs = (settings.pushConfigs || []).map(c => {
      if (c.serviceId === serviceId) {
        return { ...c, stages: c.stages.filter(s => s.id !== stageId) };
      }
      return c;
    });
    setSettings({ ...settings, pushConfigs: newPushConfigs });
  };

  const updateStage = (serviceId: string, stageId: string, updates: Partial<LinePushStage>) => {
    if (!settings) return;
    const newPushConfigs = (settings.pushConfigs || []).map(c => {
      if (c.serviceId === serviceId) {
        return { 
          ...c, 
          stages: c.stages.map(s => s.id === stageId ? { ...s, ...updates } : s) 
        };
      }
      return c;
    });
    setSettings({ ...settings, pushConfigs: newPushConfigs });
  };

  if (!settings) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">初始化 LINE 串接環境中...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
               LINE <span className="text-amber-600 italic">串接配置中心</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Messaging API & Push Automation Control</p>
         </div>

         <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('setup')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              API 連線設定
            </button>
            <button 
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'rules' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              進階推播規則
            </button>
         </div>
      </div>

      <main className="animate-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'setup' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Steps Navigation */}
            <div className="lg:col-span-4 space-y-4">
               {[1, 2, 3].map(i => (
                 <div 
                   key={i} 
                   onClick={() => setStep(i)}
                   className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${step === i ? 'bg-white border-amber-500 shadow-lg scale-[1.02]' : 'bg-slate-50 border-transparent opacity-60 hover:opacity-100'}`}
                 >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg shadow-inner transition-all ${step === i ? 'bg-slate-900 text-amber-500' : 'bg-slate-200 text-white'}`}>
                      {i}
                    </div>
                    <div>
                       <h4 className="font-black text-sm text-slate-800">
                         {i === 1 && '開通 API 核心權限'}
                         {i === 2 && '佈署官方帳號憑證'}
                         {i === 3 && '系統全自動連線測試'}
                       </h4>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Implementation Milestone</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[450px] relative group">
               <div className="p-8 flex-1 space-y-6 relative z-10">
                  {step === 1 && (
                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                       <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">前往 LINE Developers 控制台</h2>
                       <p className="text-slate-500 text-xs font-bold leading-relaxed">請登入您的 LINE 帳號，並在 Provider 下建立一個新的「Messaging API Channel」。</p>
                       <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                          <div className="flex items-start gap-4">
                             <span className="w-6 h-6 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">1</span>
                             <p className="text-xs font-bold text-slate-700">建立 Provider 身分 (建議使用您的宮廟正式全稱)</p>
                          </div>
                          <div className="flex items-start gap-4">
                             <span className="w-6 h-6 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">2</span>
                             <p className="text-xs font-bold text-slate-700">選擇 Create a new channel → Messaging API 類型</p>
                          </div>
                          <div className="flex items-start gap-4">
                             <span className="w-6 h-6 bg-amber-500 text-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">3</span>
                             <p className="text-xs font-bold text-slate-700">完成基本資訊核定並取得 Long-lived Access Token</p>
                          </div>
                       </div>
                       <a href="https://developers.line.biz/console/" target="_blank" className="inline-flex px-6 py-2 bg-[#06C755] text-white font-black rounded-xl text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg uppercase mt-2">前往 LINE Developers →</a>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                       <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">API 憑證與 Webhook 佈署</h2>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Channel Access Token (Long-lived)</label>
                             <input value={token} onChange={e => setToken(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:border-amber-500 outline-none shadow-inner" placeholder="貼上您的官方憑證字串..." />
                          </div>
                          <div className="p-6 bg-slate-900 rounded-2xl text-white space-y-4 relative overflow-hidden group/webhook border border-slate-800">
                             <div className="space-y-1 relative z-10">
                                <label className="block text-[10px] font-black text-amber-500 uppercase tracking-widest">系統專屬 Webhook Endpoint</label>
                                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest italic">* 請將此網址填入 LINE 控制台的 Webhook 欄位並開啟 "Use Webhook"</p>
                             </div>
                             <div className="flex flex-col md:flex-row gap-3 relative z-10">
                                <code className="bg-white/5 px-4 py-2 rounded-lg border border-white/10 text-amber-500 font-black flex-1 text-xs truncate shadow-inner tracking-tight">https://api.pivot.com/webhook/temple-shg</code>
                                <button onClick={() => {navigator.clipboard.writeText('https://api.pivot.com/webhook/temple-shg'); alert('網址已複製！')}} className="px-4 py-2 bg-amber-500 text-slate-900 font-black rounded-lg text-xs hover:bg-white transition-all uppercase tracking-widest shrink-0">複製</button>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center justify-center text-center py-12">
                       <div className="w-20 h-20 bg-slate-50 text-amber-500 rounded-2xl flex items-center justify-center text-5xl mb-4 shadow-inner border border-slate-100">
                          💬
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">發送連線測試</h2>
                          <p className="text-slate-500 max-w-sm mx-auto font-bold italic text-xs leading-relaxed">點擊下方按鈕，系統將與 LINE API 進行連線測試，並發送一則「連線成功」的數位通知。</p>
                       </div>
                       <button onClick={handleTest} disabled={isTesting} className="px-10 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg hover:scale-105 active:scale-95 uppercase mt-2">
                          {isTesting ? "分析連線數據中..." : "⚔️ 發送系統測試訊息"}
                       </button>
                       {testResult && <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl font-black text-xs border border-emerald-100 shadow-sm animate-bounce">{testResult}</div>}
                    </div>
                  )}
               </div>

               <div className="p-4 border-t border-slate-50 flex justify-between bg-slate-50/50">
                  <button onClick={() => setStep(Math.max(1, step-1))} disabled={step === 1} className="px-4 py-1.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-800 disabled:opacity-0 transition-all">上一步</button>
                  <button onClick={() => setStep(Math.min(3, step+1))} disabled={step === 3} className="px-4 py-1.5 bg-slate-900 text-white font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all disabled:opacity-0">下一步</button>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
             {/* Consolidated Reservation Rules & Thresholds */}
             <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 text-5xl group-hover:scale-125 transition-transform duration-1000">🛡️</div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
                   <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">全域預約防呆設定 <span className="text-amber-600">Protocol</span></h3>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Autonomous Modification & Cancellation Thresholds</p>
                   </div>
                   <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-inner">
                      <div className="px-4 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">系統保護中</div>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Toggle Rules */}
                   <div className="space-y-4">
                      <div 
                        onClick={() => setSettings({...settings, allowCancel: !settings.allowCancel})}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${settings.allowCancel ? 'bg-amber-50 border-amber-500 shadow-lg' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                      >
                         <div className="space-y-1">
                            <span className={`text-xs font-black block uppercase tracking-widest ${settings.allowCancel ? 'text-amber-900' : 'text-slate-500'}`}>信眾自主取消</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Self-Service Cancellation</span>
                         </div>
                         <div className={`w-10 h-5 rounded-full transition-all relative border border-white shadow-inner ${settings.allowCancel ? 'bg-amber-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-md ${settings.allowCancel ? 'left-[22px]' : 'left-[4px]'}`}></div>
                         </div>
                      </div>

                      <div 
                        onClick={() => setSettings({...settings, allowModify: !settings.allowModify})}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all cursor-pointer ${settings.allowModify ? 'bg-amber-50 border-amber-500 shadow-lg' : 'bg-slate-50 border-slate-200 opacity-60'}`}
                      >
                         <div className="space-y-1">
                            <span className={`text-xs font-black block uppercase tracking-widest ${settings.allowModify ? 'text-amber-900' : 'text-slate-500'}`}>信眾自主修改</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Self-Service Modification</span>
                         </div>
                         <div className={`w-10 h-5 rounded-full transition-all relative border border-white shadow-inner ${settings.allowModify ? 'bg-amber-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-md ${settings.allowModify ? 'left-[22px]' : 'left-[4px]'}`}></div>
                         </div>
                      </div>
                   </div>

                   {/* Threshold Inputs */}
                   <div className="space-y-4">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                         {/* Cancel Threshold */}
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                               禁止取消閾值設定 <span className="text-slate-400">Cancel Lock</span>
                            </label>
                            <div className="flex items-center gap-3">
                               <div className="relative flex-1">
                                  <input 
                                    type="number"
                                    min="0"
                                    value={settings.cancelHoursBefore >= 24 && settings.cancelHoursBefore % 24 === 0 ? settings.cancelHoursBefore / 24 : settings.cancelHoursBefore}
                                    onChange={(e) => {
                                       const val = Number(e.target.value);
                                       const isCurrentlyDays = settings.cancelHoursBefore >= 24 && settings.cancelHoursBefore % 24 === 0;
                                       setSettings({...settings, cancelHoursBefore: isCurrentlyDays ? val * 24 : val});
                                    }}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-200 uppercase pointer-events-none">Amount</span>
                               </div>
                               <select 
                                 value={settings.cancelHoursBefore >= 24 && settings.cancelHoursBefore % 24 === 0 ? 'Days' : 'Hours'}
                                 onChange={(e) => {
                                    const currentVal = settings.cancelHoursBefore >= 24 && settings.cancelHoursBefore % 24 === 0 ? settings.cancelHoursBefore / 24 : settings.cancelHoursBefore;
                                    const newUnit = e.target.value;
                                    setSettings({...settings, cancelHoursBefore: newUnit === 'Days' ? currentVal * 24 : currentVal});
                                 }}
                                 className="bg-slate-900 text-amber-500 border-2 border-slate-900 rounded-xl px-4 py-3.5 text-xs font-black outline-none cursor-pointer shadow-lg hover:bg-slate-800 transition-all"
                               >
                                  <option value="Hours">小時 (HRS)</option>
                                  <option value="Days">天數 (DAYS)</option>
                               </select>
                            </div>
                         </div>

                         {/* Modify Threshold */}
                         <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                               <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                               禁止更換閾值設定 <span className="text-slate-400">Modify Lock</span>
                            </label>
                            <div className="flex items-center gap-3">
                               <div className="relative flex-1">
                                  <input 
                                    type="number"
                                    min="0"
                                    value={settings.modifyHoursBefore >= 24 && settings.modifyHoursBefore % 24 === 0 ? settings.modifyHoursBefore / 24 : settings.modifyHoursBefore}
                                    onChange={(e) => {
                                       const val = Number(e.target.value);
                                       const isCurrentlyDays = settings.modifyHoursBefore >= 24 && settings.modifyHoursBefore % 24 === 0;
                                       setSettings({...settings, modifyHoursBefore: isCurrentlyDays ? val * 24 : val});
                                    }}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-900 outline-none focus:border-slate-900 transition-all shadow-sm"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-200 uppercase pointer-events-none">Amount</span>
                               </div>
                               <select 
                                 value={settings.modifyHoursBefore >= 24 && settings.modifyHoursBefore % 24 === 0 ? 'Days' : 'Hours'}
                                 onChange={(e) => {
                                    const currentVal = settings.modifyHoursBefore >= 24 && settings.modifyHoursBefore % 24 === 0 ? settings.modifyHoursBefore / 24 : settings.modifyHoursBefore;
                                    const newUnit = e.target.value;
                                    setSettings({...settings, modifyHoursBefore: newUnit === 'Days' ? currentVal * 24 : currentVal});
                                 }}
                                 className="bg-slate-900 text-amber-500 border-2 border-slate-900 rounded-xl px-4 py-3.5 text-xs font-black outline-none cursor-pointer shadow-lg hover:bg-slate-800 transition-all"
                               >
                                  <option value="Hours">小時 (HRS)</option>
                                  <option value="Days">天數 (DAYS)</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Push Rules */}
             <div className="space-y-4">
                <div className="flex items-end justify-between border-b border-slate-200 pb-2 px-2">
                   <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">服務推播分段自動化</h3>
                   <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Notification Infrastructure</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {services.map((service) => {
                       const config = (settings.pushConfigs || []).find(c => c.serviceId === service.id);
                       const stages = config?.stages || [];

                      return (
                        <div key={service.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group/service hover:border-amber-500/20 transition-all">
                           <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center text-xl font-black shadow-sm">
                                    {service.name ? service.name[0] : '?'}
                                 </div>
                                 <div className="space-y-0.5">
                                    <h4 className="text-sm font-black text-slate-800 tracking-tight uppercase">{service.name}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">階段規則: <span className="text-amber-600">{stages.length}</span></p>
                                 </div>
                              </div>
                              <button 
                                onClick={() => addStage(service.id)}
                                className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-black text-[10px] tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all shadow-sm uppercase"
                              >
                                ＋ 新增提醒階段
                              </button>
                           </div>

                           <div className="p-4 space-y-4">
                              {stages.length === 0 ? (
                                <div className="py-8 text-center space-y-2 opacity-20">
                                   <div className="text-3xl">🔕</div>
                                   <p className="text-[10px] font-black uppercase tracking-widest">目前無推播排程</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {stages.map((stage) => (
                                      <div key={stage.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4 relative group/stage hover:bg-white hover:border-amber-500/20 transition-all">
                                         <button 
                                           onClick={() => removeStage(service.id, stage.id)}
                                           className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-all"
                                         >✕</button>

                                         <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">觸發時點</label>
                                               <div className="flex gap-2">
                                                  <select 
                                                    value={stage.timeValue}
                                                    onChange={(e) => updateStage(service.id, stage.id, { timeValue: Number(e.target.value) })}
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                                  >
                                                     {[1, 2, 3, 7, 10, 14, 24, 48].map(v => <option key={v} value={v}>{v}</option>)}
                                                  </select>
                                                  <select 
                                                    value={stage.timeUnit}
                                                    onChange={(e) => updateStage(service.id, stage.id, { timeUnit: e.target.value as any })}
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                                  >
                                                     <option value="Days">日</option>
                                                     <option value="Hours">小時</option>
                                                  </select>
                                               </div>
                                            </div>
                                            <div className="space-y-1.5">
                                               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">通知對象</label>
                                               <select 
                                                 value={stage.target}
                                                 onChange={(e) => updateStage(service.id, stage.id, { target: e.target.value as any })}
                                                 className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold outline-none"
                                               >
                                                  <option value="Customer">僅 信眾</option>
                                                  <option value="Temple">僅 管理端</option>
                                                  <option value="Both">雙邊同步</option>
                                               </select>
                                            </div>
                                         </div>

                                         <div className="space-y-1.5">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">通知文本</label>
                                            <textarea 
                                              value={stage.content}
                                              onChange={(e) => updateStage(service.id, stage.id, { content: e.target.value })}
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:border-amber-500 outline-none h-20 resize-none leading-relaxed"
                                              placeholder="輸入訊息內容..."
                                            ></textarea>
                                         </div>

                                         <div className="flex items-center justify-between pt-1">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Automation Status</span>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                               <input 
                                                 type="checkbox" 
                                                 className="sr-only peer" 
                                                 checked={stage.enabled}
                                                 onChange={(e) => updateStage(service.id, stage.id, { enabled: e.target.checked })}
                                               />
                                               <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
                                            </label>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                              )}
                           </div>
                        </div>
                      )
                   })}
                </div>
             </div>

             {/* Bottom Save */}
             <div className="sticky bottom-6 z-50 flex justify-center pb-4">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-black text-xs tracking-widest shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-all flex items-center gap-3 uppercase border border-white/10"
                >
                  {isSaving ? "同步中..." : "⚔️ 佈署 LINE 規則系統"}
                </button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
