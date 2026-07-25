// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { 
  fetchDistributorStats, 
  Organization, 
  getCurrentRole, 
  AppRole, 
  fetchPricePlans,
  createPricePlan,
  PricePlan,
  TempleApplication,
  fetchTempleApplications,
  submitTempleApplication,
  approveTempleApplication
} from '@/app/actions';

export default function MyNetworkPage() {
  const [role, setRole] = useState<AppRole | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pricePlans, setPricePlans] = useState<PricePlan[]>([]);
  const [templeApps, setTempleApps] = useState<TempleApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Distributor Plan Manager States
  const [newPlan, setNewPlan] = useState({ name: '', setupFee: 0, monthlyFee: 0, isFree: false, freeMonths: 0 });

  // Sales Form States
  const [templeData, setTempleData] = useState({
    templeName: '',
    contactPerson: '',
    contactPhone: '',
    planId: ''
  });

  const loadData = async () => {
    setLoading(true);
    const r = await getCurrentRole();
    setRole(r);
    
    if (r === 'Distributor' || r === 'SuperAdmin') {
      const [data, plans, tApps] = await Promise.all([fetchDistributorStats(), fetchPricePlans(), fetchTempleApplications()]);
      setStats(data);
      setPricePlans(plans);
      setTempleApps(tApps);
    } else if (r === 'DistSales' || r === 'SuperSales') {
      const [plans, tApps] = await Promise.all([fetchPricePlans(), fetchTempleApplications()]);
      setPricePlans(plans);
      setTempleApps(tApps);
      if (plans.length > 0) setTempleData(prev => ({ ...prev, planId: plans[0].id }));
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreatePlan = async () => {
    if (!newPlan.name) return alert('請輸入方案名稱。');
    await createPricePlan(newPlan);
    alert('✅ 定價方案已成功新增！');
    setNewPlan({ name: '', setupFee: 0, monthlyFee: 0, isFree: false, freeMonths: 0 });
    loadData();
  };

  const handleTempleSubmit = async () => {
    if (!templeData.templeName) return alert('請填寫宮廟名稱。');
    if (!templeData.planId) return alert('請選定一個定價方案。');
    const res = await submitTempleApplication(templeData);
    if (res.success) {
      alert('✅ 宮廟開案申請已送出審核！');
      setTempleData({ templeName: '', contactPerson: '', contactPhone: '', planId: pricePlans[0]?.id || '' });
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handleApproveTemple = async (appId: string, planId: string) => {
    const appPlan = pricePlans.find(p => p.id === planId);
    const isFreePlan = appPlan?.isFree;
    
    const confirmMessage = isFreePlan 
      ? `此為「免費宮廟管理帳號」申請 (${appPlan.freeMonths} 個月免費)，確定要核准開通嗎？`
      : '確定核准此宮廟開案並啟動數位帳號開通嗎？';

    if (confirm(confirmMessage)) {
      const res = await approveTempleApplication(appId);
      if (res.success) loadData(); else alert(res.error);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
         <p className="text-xs font-semibold text-slate-500 tracking-wider">初始化網路系統中...</p>
      </div>
    );
  }

  // --- Distributor Sales View ---
  if (role === 'DistSales' || role === 'SuperSales') {
    const selectedPlanDetails = pricePlans.find(p => p.id === templeData.planId);
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
             提報宮廟開案申請
          </h1>
          <p className="text-slate-500 text-sm mt-1">PIVOT Application Hub</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">🆕</div>
                 <h2 className="text-sm font-bold text-slate-800">新客戶開案申請</h2>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">宮廟組織名稱</label>
                    <input value={templeData.templeName} onChange={e => setTempleData({...templeData, templeName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="例：萬華龍山寺" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-600">聯絡人</label>
                       <input value={templeData.contactPerson} onChange={e => setTempleData({...templeData, contactPerson: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-600">聯絡電話</label>
                       <input value={templeData.contactPhone} onChange={e => setTempleData({...templeData, contactPhone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" />
                    </div>
                 </div>
                 
                 <div className="h-px bg-slate-100 my-4"></div>
                 
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">選定定價方案</label>
                    <select value={templeData.planId} onChange={e => setTempleData({...templeData, planId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-500 transition-colors text-slate-800">
                       {pricePlans.map(p => <option key={p.id} value={p.id}>{p.name} {p.isFree ? '(包含免費試用)' : ''}</option>)}
                    </select>
                 </div>
                 
                 {selectedPlanDetails && (
                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-500">開辦費</span><span className="text-sm font-bold text-slate-800">NT$ {selectedPlanDetails.setupFee.toLocaleString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-xs font-semibold text-slate-500">月租費</span><span className="text-sm font-bold text-slate-800">NT$ {selectedPlanDetails.monthlyFee.toLocaleString()}</span></div>
                      {selectedPlanDetails.isFree && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mt-2 flex items-start gap-2">
                           <span className="text-emerald-500 mt-0.5">🎁</span>
                           <div>
                              <p className="text-xs font-bold text-emerald-800">免費宮廟管理帳戶方案</p>
                              <p className="text-xs text-emerald-600">包含 {selectedPlanDetails.freeMonths} 個月免費試用，將提報至管理端進行審核。</p>
                           </div>
                        </div>
                      )}
                   </div>
                 )}
                 <button onClick={handleTempleSubmit} className="w-full py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition-all shadow-sm flex justify-center items-center gap-2 mt-4">
                    提交開案審核 🚀
                 </button>
              </div>
           </div>

           <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                 <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-lg">📄</div>
                    <div>
                       <h2 className="text-sm font-bold text-slate-800">開案提報進度</h2>
                       <p className="text-xs text-slate-500 mt-0.5">Application Progress</p>
                    </div>
                 </div>
                 <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                       <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">宮廟名稱 / 方案</th>
                             <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">費用詳情</th>
                             <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">審核狀態</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {templeApps.map((a) => {
                             const plan = pricePlans.find(p => p.id === a.planId);
                             return (
                               <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center text-lg shadow-sm">⛩️</div>
                                        <div className="flex flex-col">
                                           <span className="text-sm font-bold text-slate-800">{a.templeName}</span>
                                           <span className="text-xs text-slate-500 mt-0.5">{plan?.name}</span>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-800">NT$ {a.setupFee.toLocaleString()} <span className="text-slate-400 text-xs font-normal">開辦</span></span>
                                        <span className="text-sm font-semibold text-slate-800">NT$ {a.monthlyFee.toLocaleString()} <span className="text-slate-400 text-xs font-normal">月租</span></span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <span className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 border ${a.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${a.status === 'Pending' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                        {a.status === 'Pending' ? '審核中' : '已開通'}
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
        </div>
      </div>
    );
  }

  // --- Distributor / SuperAdmin View ---
  if ((role === 'Distributor' || role === 'SuperAdmin') && stats) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
             經銷定價與開案管理
          </h1>
          <p className="text-slate-500 text-sm mt-1">PIVOT Pricing & Approval Hub</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* 1. Price Plan Manager */}
           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                 <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">🛠️</div>
                 <h2 className="text-sm font-bold text-slate-800">新增定價方案</h2>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600">方案名稱</label>
                    <input value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="例：經銷推廣專案" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-600">開辦費 (NT$)</label>
                       <input type="number" value={newPlan.setupFee} onChange={e => setNewPlan({...newPlan, setupFee: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-center" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-semibold text-slate-600">月租費 (NT$)</label>
                       <input type="number" value={newPlan.monthlyFee} onChange={e => setNewPlan({...newPlan, monthlyFee: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-center" />
                    </div>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setNewPlan({...newPlan, isFree: !newPlan.isFree})}>
                    <div className={`w-10 h-6 rounded-full transition-all relative shrink-0 ${newPlan.isFree ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${newPlan.isFree ? 'left-5' : 'left-1'}`}></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">提供免費試用期 (免費宮廟管理帳戶)</span>
                 </div>
                 {newPlan.isFree && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2">
                       <label className="text-xs font-semibold text-slate-600">免費月數</label>
                       <input type="number" value={newPlan.freeMonths} onChange={e => setNewPlan({...newPlan, freeMonths: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors text-center" />
                    </div>
                 )}
                 <button onClick={handleCreatePlan} className="w-full py-2.5 bg-indigo-600 text-white font-semibold text-sm rounded-lg hover:bg-indigo-700 transition-all shadow-sm mt-4">
                    新增定價方案
                 </button>
              </div>
              
              <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                 <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">現有方案清單</h3>
                 <div className="grid grid-cols-1 gap-3">
                    {pricePlans.map(p => (
                      <div key={p.id} className="p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white hover:border-indigo-100 transition-colors gap-2">
                         <div>
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-bold text-slate-800">{p.name}</span>
                               {p.isFree && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded border border-emerald-100">免費帳戶</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">開辦: ${p.setupFee.toLocaleString()} | 月租: ${p.monthlyFee.toLocaleString()} {p.isFree && <span className="text-emerald-600 font-medium ml-1">({p.freeMonths}個月免費)</span>}</div>
                         </div>
                         <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">🏷️</div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* 2. Approval Center */}
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">🛡️</div>
                    <h2 className="text-sm font-bold text-slate-800">業務開案審核中心</h2>
                 </div>
                 {templeApps.filter(a => a.status === 'Pending').length > 0 && (
                   <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md text-xs font-semibold animate-pulse">待審核: {templeApps.filter(a => a.status === 'Pending').length}</span>
                 )}
              </div>
              <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] flex-1 bg-white">
                 {templeApps.length === 0 ? (
                   <div className="p-8 text-center text-slate-500 text-sm">目前沒有開案申請。</div>
                 ) : (
                   templeApps.map((a) => {
                     const plan = pricePlans.find(p => p.id === a.planId);
                     const isFreePlan = plan?.isFree;

                     return (
                       <div key={a.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-50 transition-colors gap-4">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-800">{a.templeName}</span>
                                {isFreePlan && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 shadow-sm">免費宮廟管理帳戶請求</span>}
                             </div>
                             <div className="text-xs text-slate-500">
                               提報業務: <span className="font-medium text-slate-700">@{a.salesId}</span> | 方案: {plan?.name}
                             </div>
                          </div>
                          {a.status === 'Pending' ? (
                            <button onClick={() => handleApproveTemple(a.id, a.planId)} className={`px-4 py-2 text-white text-xs font-semibold rounded-lg transition-all w-full sm:w-auto shadow-sm ${isFreePlan ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                               確認核准開通
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-xs font-semibold rounded-md border border-slate-200 whitespace-nowrap">已開通</span>
                          )}
                       </div>
                     );
                   })
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  return null;
}
