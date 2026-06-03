const fs = require('fs');
const path = require('path');

const code = `"use client";

import React, { useState, useEffect } from 'react';
import { 
  fetchServiceDefinitions, 
  fetchForms, 
  fetchStaff,
  saveServiceDefinition, 
  saveForm,
  fetchAvailableSlots,
  createSlot,
  removeSingleSlot
} from '@/app/actions';

export default function ServicesManagement() {
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [forms, setForms] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Mobile Sidebar State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [editingService, setEditingService] = useState(null);
  const [editingForm, setEditingForm] = useState(null);
  const [newSlot, setNewSlot] = useState({ date: '', time: '', staff: '', serviceId: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [serviceData, formData, staffData, slotData] = await Promise.all([
        fetchServiceDefinitions(), 
        fetchForms(),
        fetchStaff(),
        fetchAvailableSlots()
      ]);
      setServices(Array.isArray(serviceData) ? serviceData : []);
      setForms(Array.isArray(formData) ? formData : []);
      setStaffList(Array.isArray(staffData) ? staffData : []);
      setAvailableSlots(Array.isArray(slotData) ? slotData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const getLinkedStaff = () => {
    if (!newSlot.serviceId) return staffList;
    const selectedService = services.find(s => s.id === newSlot.serviceId);
    if (!selectedService || !selectedService.assignedStaff) return staffList;
    return staffList.filter(s => selectedService.assignedStaff.includes(s.name));
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-slate-300 animate-pulse">管理系統載入中...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col md:flex-row">
      
      {/* 🚀 手機版頂部導覽 */}
      <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-[100]">
         <h1 className="text-xl font-black text-slate-900 tracking-tighter italic">管理中心 <span className="text-indigo-600">Admin</span></h1>
         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xl">
            {isMenuOpen ? '✕' : '☰'}
         </button>
      </header>

      {/* 🚀 響應式切換選單 (手機抽屜/桌面側欄) */}
      <nav className={`
        fixed md:sticky top-[61px] md:top-0 left-0 w-full md:w-64 h-[calc(100vh-61px)] md:h-screen 
        bg-white border-r border-slate-200 z-[90] transition-transform duration-300
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
         <div className="p-8 space-y-8">
            <div className="hidden md:block">
               <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic">宮廟管理系統</h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Admin Dashboard v2.0</p>
            </div>
            <div className="space-y-2">
               {[
                 { id: 'services', label: '服務項目', icon: '⛩️' },
                 { id: 'slots', label: '預約時段', icon: '⏰' },
                 { id: 'forms', label: '案卡設計', icon: '📑' }
               ].map(tab => (
                 <button 
                   key={tab.id} 
                   onClick={() => { setActiveTab(tab.id); setIsMenuOpen(false); }}
                   className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl translate-x-2' : 'text-slate-400 hover:bg-slate-50'}`}
                 >
                   <span>{tab.icon}</span>
                   {tab.label}
                 </button>
               ))}
            </div>
         </div>
      </nav>

      {/* 🚀 主內容區 (手機適配) */}
      <main className="flex-1 p-4 md:p-10 max-w-full overflow-x-hidden">
         
         {activeTab === 'services' && (
            <div className="space-y-6">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-200">
                  <div>
                     <h2 className="text-xl md:text-2xl font-black text-slate-800">服務清單管理</h2>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Service Infrastructure</p>
                  </div>
                  <button onClick={() => setEditingService({ id: 's-'+Date.now(), name: '新服務', assignedStaff: [], linkedFormId: '', status: 'Active' })} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg">＋ 新增服務</button>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10">
                  {services.map(s => (
                    <div key={s.id} className="bg-white p-6 md:p-10 rounded-[48px] border border-slate-200 shadow-sm flex flex-col min-h-[350px]">
                       <div className="flex justify-between items-start mb-6">
                          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-2xl">⛩️</div>
                          <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black">{s.status}</span>
                       </div>
                       <h3 className="text-xl md:text-2xl font-black text-slate-900">{s.name}</h3>
                       <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">指派師傅</p>
                          <div className="flex flex-wrap gap-2">
                             {s.assignedStaff?.map(st => <span key={st} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-600">{st}</span>)}
                          </div>
                       </div>
                       <button onClick={() => setEditingService(s)} className="w-full mt-8 py-5 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all">配置詳細邏輯</button>
                    </div>
                  ))}
               </div>
            </div>
         )}

         {activeTab === 'slots' && (
            <div className="space-y-6">
               {/* 🚀 核定面板 (手機全寬優化) */}
               <div className="bg-slate-900 text-white p-6 md:p-14 rounded-[32px] md:rounded-[60px] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 flex flex-col gap-10">
                     <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">人員產能核定</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Capacity Hub</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">日期</label><input type="date" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-white" /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">服務類別</label><select value={newSlot.serviceId} onChange={e => setNewSlot({...newSlot, serviceId: e.target.value, staff: ''})} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-white">{services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase ml-2">管理師傅</label><select value={newSlot.staff} onChange={e => setNewSlot({...newSlot, staff: e.target.value})} disabled={!newSlot.serviceId} className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-white disabled:opacity-30">{getLinkedStaff().map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                        <div className="flex items-end"><button onClick={async () => { await createSlot({...newSlot, time: '10:00'}); await loadData(); alert('核定成功'); }} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">核定發布 ✦</button></div>
                     </div>
                  </div>
               </div>

               {/* 🚀 時段列表 (手機表格轉卡片佈局) */}
               <div className="bg-white rounded-[32px] md:rounded-[70px] border border-slate-100 shadow-xl overflow-hidden">
                  <div className="md:hidden p-6 space-y-4">
                     <h3 className="text-lg font-black text-slate-900 border-b pb-4">已核定時段</h3>
                     {availableSlots.map(sl => (
                        <div key={sl.id} className="bg-slate-50 p-6 rounded-[28px] border border-slate-100 space-y-4">
                           <div className="flex justify-between items-center">
                              <p className="text-sm font-black text-slate-900">📅 {sl.date}</p>
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">{sl.time}</span>
                           </div>
                           <div className="flex justify-between items-end">
                              <div>
                                 <p className="text-[10px] font-black text-slate-400 uppercase">服務 / 師傅</p>
                                 <p className="text-xs font-bold text-slate-700 mt-1">{services.find(s => s.id === sl.serviceId)?.name} - {sl.staff}</p>
                              </div>
                              <button onClick={() => { removeSingleSlot(sl.id); loadData(); }} className="text-[10px] font-black text-rose-500 uppercase">撤銷</button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <table className="hidden md:table w-full text-left">
                     <thead><tr className="bg-slate-50 border-b"><th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase">發布時間</th><th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase">服務項目</th><th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase">執勤師傅</th><th className="px-12 py-10 text-[11px] font-black text-slate-400 uppercase text-right">管理</th></tr></thead>
                     <tbody className="divide-y">{availableSlots.map(sl => (
                        <tr key={sl.id} className="hover:bg-slate-50/50"><td className="px-12 py-8 text-sm font-black">{sl.date} {sl.time}</td><td className="px-12 py-8"><span className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">{services.find(s => s.id === sl.serviceId)?.name}</span></td><td className="px-12 py-8 text-sm font-bold text-slate-700">{sl.staff}</td><td className="px-12 py-8 text-right"><button onClick={async () => { await removeSingleSlot(sl.id); await loadData(); }} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">撤銷</button></td></tr>
                     ))}</tbody>
                  </table>
               </div>
            </div>
         )}
      </main>

      {/* 🚀 全螢幕配置彈窗 (手機全螢幕適配) */}
      {editingService && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 md:p-4">
           <div className="w-full h-full md:h-auto md:max-w-3xl bg-white md:rounded-[60px] shadow-2xl p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">服務配置</h3>
                 <button onClick={() => setEditingService(null)} className="md:hidden text-2xl">✕</button>
              </div>
              <div className="space-y-8 md:space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">標題</label>
                       <input value={editingService.name} onChange={e => setEditingService({...editingService, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] md:rounded-[32px] px-6 py-4 md:py-6 font-black text-slate-900" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">連結案卡</label>
                       <select value={editingService.linkedFormId} onChange={e => setEditingService({...editingService, linkedFormId: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[24px] md:rounded-[32px] px-6 py-4 md:py-6 font-black text-slate-900">
                          {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">指派執勤師傅</label>
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                       {staffList.map(st => (
                         <button key={st.id} onClick={() => {
                            const next = editingService.assignedStaff.includes(st.name) ? editingService.assignedStaff.filter(n => n !== st.name) : [...editingService.assignedStaff, st.name];
                            setEditingService({...editingService, assignedStaff: next});
                         }} className={`p-4 md:p-6 rounded-[24px] md:rounded-[32px] border-2 text-center transition-all ${editingService.assignedStaff?.includes(st.name) ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}>
                            <div className="text-sm font-black">{st.name}</div>
                            <div className="text-[10px] font-bold mt-1 opacity-60">{st.title}</div>
                         </button>
                       ))}
                    </div>
                 </div>
                 <div className="pt-10 flex flex-col md:flex-row gap-4 md:gap-6">
                    <button onClick={async () => { await saveServiceDefinition(editingService); await loadData(); setEditingService(null); }} className="flex-1 bg-indigo-600 text-white py-5 md:py-6 rounded-2xl md:rounded-[32px] font-black shadow-2xl uppercase tracking-widest">儲存配置 ✦</button>
                    <button onClick={() => setEditingService(null)} className="hidden md:block px-10 py-6 text-slate-400 font-bold">放棄</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
`;

const targetPath = path.join(process.cwd(), 'src/app/temple/services/page.tsx');
fs.writeFileSync(targetPath, code, { encoding: 'utf8' });
console.log('Successfully optimized Administrative Dashboard for Mobile Experience.');
