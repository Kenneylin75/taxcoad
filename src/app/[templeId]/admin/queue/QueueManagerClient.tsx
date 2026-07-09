"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { 
  QueueEvent, createQueueEvent, updateQueueEvent, completeQueueService, activateQueueEvent, deleteQueueEvent,
  checkInWithQr, callNextInQueue, updateQueueStatus, registerGuestForQueue, fetchQueueDashboard
} from '@/app/actions';
import { useRouter, usePathname } from 'next/navigation';

export default function QueueManagerClient({ initialEvents, initialDashboard, services, activeEventId }: { initialEvents: QueueEvent[], initialDashboard: any, services: any[], activeEventId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup'>('dashboard');
  const [activeWindow, setActiveWindow] = useState('01');
  const [isPending, startTransition] = useTransition();
  const [baseUrl, setBaseUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const activeEvents = initialEvents.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled' && e.date >= today);
  const historicalEvents = initialEvents.filter(e => e.status === 'Completed' || e.status === 'Cancelled' || e.date < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const filteredHistory = historicalEvents.filter(e => 
    e.title.includes(searchQuery) || 
    e.location.includes(searchQuery) || 
    e.serviceType.includes(searchQuery)
  );

  const activeEvent = initialEvents.find(e => e.id === activeEventId) || activeEvents.find(e => e.status === 'Active') || activeEvents[0];
  const allActiveEvents = activeEvents;

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('正殿廣場');
  const [maxCapacity, setMaxCapacity] = useState('100');
  const [serviceType, setServiceType] = useState('');
  const [price, setPrice] = useState('0');
  const [useCustomService, setUseCustomService] = useState(false);
  const [customService, setCustomService] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [editingEvent, setEditingEvent] = useState<QueueEvent | null>(null);
  
  // Walk-in Registration form state
  const [isRegistering, setIsRegistering] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  
  const loadHistoryTickets = async (eventId: string) => {
    if (expandedHistoryId === eventId) {
      setExpandedHistoryId(null);
      return;
    }
    const res = await fetchQueueDashboard(eventId);
    setHistoryTickets(res.tickets || []);
    setExpandedHistoryId(eventId);
  };
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return alert('請填寫完整資訊。');
    startTransition(async () => {
      const payload = {
        title, 
        date, 
        location, 
        maxCapacity: parseInt(maxCapacity), 
        serviceType: useCustomService ? customService : serviceType,
        price: parseInt(price),
        startTime,
        endTime
      };
      
      if (editingEvent) {
         const res = await updateQueueEvent(editingEvent.id, payload);
         if (!res.success) {
           alert('❌ 更新失敗：' + res.error);
           return;
         }
         alert('✅ 排隊活動已成功更新！');
         setEditingEvent(null);
      } else {
         const res = await createQueueEvent(payload);
         if (!res.success) {
           alert('❌ 部署失敗：' + res.error);
           return;
         }
         alert('✅ 排隊活動已成功部署！');
      }
      
      setTitle(''); setDate(''); setServiceType(''); setPrice('0');
    });
  };

  const handleEditEvent = (evt: QueueEvent) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDate(evt.date);
    setLocation(evt.location);
    setMaxCapacity(String(evt.maxCapacity));
    setServiceType(evt.serviceType || '');
    setPrice(String(evt.price || 0));
    setStartTime(evt.timeWindow?.split('-')[0] || '09:00');
    setEndTime(evt.timeWindow?.split('-')[1] || '17:00');
    setActiveTab('setup');
  };

  const handleActivate = (id: string, isCurrentlyActive: boolean) => {
    if (!confirm(isCurrentlyActive ? '確定要暫停此排隊活動嗎？' : '確定要將此活動設為今日活動嗎？系統將啟動報到功能。')) return;
    startTransition(async () => {
      await activateQueueEvent(id);
      setActiveTab('dashboard');
    });
  };

  const handleDeleteEvent = (id: string) => {
    if (!confirm('確定要取消/刪除此活動嗎？\n注意：若已有信眾報名，系統將變更狀態為「已取消」以保留紀錄；否則將會徹底刪除該活動。')) return;
    startTransition(async () => {
      const res = await deleteQueueEvent(id);
      if (res.success) {
        alert('✅ 操作成功！');
      } else {
        alert('操作失敗');
      }
    });
  };



  const handleComplete = (ticketId: string) => {
    startTransition(async () => {
      await completeQueueService(ticketId);
    });
  };

  const handleManualCheckIn = (ticketId: string) => {
    startTransition(async () => {
      await checkInWithQr(ticketId);
    });
  };

  const handleCallNext = () => {
    startTransition(async () => {
      if (activeEvent) {
        const result = await callNextInQueue(activeEvent.id);
        if (result.error === 'NO_ONE_IN_QUEUE') alert('現場已無報到成功的等候信眾。');
      }
    });
  };

  const handleNoShow = (ticketId: string) => {
    startTransition(async () => {
      await updateQueueStatus(ticketId, 'NoShow');
    });
  };

  const handleManualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !activeEvent) return;
    startTransition(async () => {
      const res = await registerGuestForQueue(activeEvent.id, { guestName: regName, phone: regPhone });
      if (res.success) {
        alert(`✅ 報名成功！號碼為：${res.ticket.assignedNumber}`);
        setRegName(''); setRegPhone(''); setIsRegistering(false);
      }
    });
  };

  const currentlyCalling = initialDashboard?.tickets?.find((t: any) => t.status === 'Calling');

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">
               現場排隊 <span className="text-amber-600 italic">即時主控</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Crowd Dynamics & Flow Orchestration</p>
         </div>

         <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-900 font-bold hover:bg-slate-100'}`}
            >
              即時監控
            </button>
            <button 
              onClick={() => { setActiveTab('setup'); setEditingEvent(null); }}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'setup' && !editingEvent ? 'bg-slate-900 text-white shadow-md' : 'text-slate-900 font-bold hover:bg-slate-100'}`}
            >
              活動部署
            </button>
         </div>
      </div>

      <main className="animate-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'setup' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
               <div className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                     <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">{editingEvent ? '編輯活動' : '部署新活動'}</h2>
                     {editingEvent && (
                        <button onClick={() => setEditingEvent(null)} className="text-xs text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest">
                           取消編輯
                        </button>
                     )}
                  </div>
                  <form onSubmit={handleCreateEvent} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-widest">活動主題 (ACTIVITY TITLE)</label>
                        <input type="text" value={title} onChange={e=>setTitle(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-slate-900" />
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">部署日期</label>
                           <input type="date" value={date} onChange={e=>setDate(e.target.value)} min={minDateStr} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">開始時間</label>
                           <input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">結束時間</label>
                           <input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold" />
                        </div>
                     </div>

                     <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">服務內容</label>
                           <button type="button" onClick={()=>setUseCustomService(!useCustomService)} className="text-[9px] font-black text-blue-600 uppercase border-b border-blue-600 pb-0.5">
                              {useCustomService ? '← 返回選單選取' : '+ 另外創建服務內容'}
                           </button>
                        </div>
                        {!useCustomService ? (
                           <select value={serviceType} onChange={e=>setServiceType(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-slate-900 cursor-pointer transition-all">
                              <option value="">-- 請選取服務 --</option>
                              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                           </select>
                        ) : (
                           <input type="text" placeholder="輸入自定義服務名稱..." value={customService} onChange={e=>setCustomService(e.target.value)} required className="w-full bg-white border-2 border-blue-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-600 animate-in fade-in zoom-in-95 duration-300" />
                        )}
                     </div>

                     <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">活動價格 (0 為隨喜)</label>
                           <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                              <input type="number" value={price} onChange={e=>setPrice(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold outline-none focus:border-slate-900" />
                           </div>
                           {price === '0' && <p className="text-[10px] font-black text-amber-600 mt-1 animate-pulse">✨ 自動設定為「隨喜功德」</p>}
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">容納上限</label>
                           <input type="number" value={maxCapacity} onChange={e=>setMaxCapacity(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-slate-900" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-900 uppercase tracking-widest">服務地點</label>
                           <input type="text" value={location} onChange={e=>setLocation(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-slate-900" />
                        </div>
                     </div>
                     <button type="submit" disabled={isPending} className="w-full bg-slate-900 text-amber-500 font-black py-4 rounded-xl text-sm tracking-widest shadow-xl hover:bg-amber-500 hover:text-slate-900 transition-all uppercase">
                        {isPending ? (editingEvent ? '正在更新活動...' : '正在發佈活動...') : (editingEvent ? '確認更新活動' : '活動發佈')}
                     </button>
                  </form>
               </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
               <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                  <div className="relative z-10 flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-black text-amber-500 italic tracking-tighter">當前報名活動清冊</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Registrations & Capacity Tracking</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="px-3 py-1 bg-amber-500 text-slate-900 rounded-lg text-[10px] font-black uppercase">報名中: {initialEvents.filter(e => e.status !== 'Completed').length}</span>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  {activeEvents.sort((a, b) => a.status === 'Active' ? -1 : 1).map((e) => {
                     const eventTickets = initialDashboard?.tickets?.filter((t: any) => t.eventId === e.id) || [];
                     const isFull = eventTickets.length >= e.maxCapacity;
                     return (
                        <div key={e.id} className="bg-white rounded-[35px] border-2 border-slate-100 hover:border-slate-300 shadow-sm hover:shadow-xl transition-all overflow-hidden relative group/card">
                           <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all z-10">
                             <button onClick={() => handleEditEvent(e)} className="w-8 h-8 flex items-center justify-center bg-amber-50 text-amber-500 rounded-full hover:bg-amber-500 hover:text-white shadow-sm" title="編輯活動">
                               ✏️
                             </button>
                             <button onClick={() => handleDeleteEvent(e.id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white shadow-sm" title="取消/刪除活動">
                               ✕
                             </button>
                           </div>
                           <div className="p-8">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                 <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg bg-slate-900 text-amber-500">
                                       🏮
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-3">
                                          <h4 className="text-xl font-black text-slate-900">{e.title}</h4>
                                          {isFull && <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[8px] font-black animate-pulse">額滿</span>}
                                       </div>
                                       <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">📍 {e.location} | 📅 {e.date} ({e.startTime || '09:00'} - {e.endTime || '17:00'})</p>
                                    </div>
                                 </div>
                                 <div className="text-right space-y-2 pr-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase">報名進度</p>
                                    <div className="flex items-center gap-3">
                                       <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                          <div className={`h-full transition-all duration-1000 ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(eventTickets.length / e.maxCapacity) * 100}%` }}></div>
                                       </div>
                                       <span className="text-sm font-black text-slate-900">{eventTickets.length}/{e.maxCapacity}</span>
                                    </div>
                                    {e.status === 'Draft' && (
                                       <button onClick={() => handleActivate(e.id, false)} className="bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase mt-2 w-full hover:bg-emerald-600 shadow-sm transition-all">啟動排隊</button>
                                    )}
                                    {e.status === 'Active' && (
                                       <button onClick={() => handleActivate(e.id, true)} className="text-[10px] font-black text-emerald-500 uppercase mt-2 block border border-emerald-500 rounded-xl px-2 py-1 text-center bg-emerald-50 w-full hover:bg-rose-50 hover:text-rose-500 hover:border-rose-500 transition-all">暫停排隊</button>
                                    )}
                                 </div>
                              </div>

                              {/* 可展開名單 */}
                              <details className="mt-8 group/list">
                                 <summary className="list-none cursor-pointer flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                    <span>展開報名清冊 ({eventTickets.length})</span>
                                    <span className="transition-transform group-open/list:rotate-180">↓</span>
                                 </summary>
                                 <div className="mt-6 border-t-2 border-slate-50 pt-6 space-y-2">
                                    {eventTickets.length === 0 ? (
                                       <p className="text-center py-4 text-xs font-bold text-slate-300 italic">目前尚無信眾報名</p>
                                    ) : eventTickets.map((t: any) => (
                                       <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                          <div className="flex items-center gap-4">
                                             <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-xs font-black text-slate-400 shadow-sm">{t.assignedNumber}</div>
                                             <div>
                                                <p className="text-sm font-black text-slate-800">{t.guestName}</p>
                                                <p className="text-[8px] font-bold text-slate-400">{t.phone}</p>
                                             </div>
                                          </div>
                                          <span className="text-[10px] font-bold text-slate-400 font-mono">{t.scannedAt || '尚未報到'}</span>
                                       </div>
                                    ))}
                                 </div>
                              </details>
                           </div>
                        </div>
                     );
                  })}
                  {activeEvents.length === 0 && (
                     <div className="bg-white p-10 rounded-[35px] border-2 border-slate-100 text-center opacity-60">
                        <div className="text-4xl mb-4 grayscale opacity-50">🏮</div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">目前無進行中的活動</p>
                     </div>
                  )}
               </div>

               {/* 歷史活動清單區塊 */}
               <div className="pt-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                     <div>
                        <h3 className="text-lg font-black text-slate-900">歷史活動歸檔</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Historical Activity Archive</p>
                     </div>
                     <div className="relative">
                        <input 
                           type="text" 
                           placeholder="搜尋歷史活動..." 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="pl-10 pr-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold focus:border-slate-900 outline-none w-full md:w-64 transition-all"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                     </div>
                  </div>

                  <div className="space-y-3">
                     {filteredHistory.map(e => {
                        const eventTickets = initialDashboard?.tickets?.filter((t: any) => t.eventId === e.id) || [];
                        const isCancelled = e.status === 'Cancelled';
                        return (
                           <div key={e.id} className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all">
                              <div className="flex items-center gap-4 opacity-70">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center text-lg">📁</div>
                                 <div>
                                    <div className="flex items-center gap-2">
                                       <h4 className="text-sm font-black text-slate-700">{e.title}</h4>
                                       {isCancelled && <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded text-[8px] font-black">已取消</span>}
                                       {!isCancelled && <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[8px] font-black">已結束</span>}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">📍 {e.location} | 📅 {e.date}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className="text-xs font-black text-slate-500">{eventTickets.length} 人報名</span>
                              </div>
                           </div>
                        );
                     })}
                     {filteredHistory.length === 0 && (
                        <p className="text-center py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">無歷史活動紀錄</p>
                     )}
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            {!activeEvent ? (
              <div className="bg-white p-20 rounded-[50px] border border-slate-100 shadow-sm text-center py-40 opacity-40">
                <div className="text-6xl mb-6">🚶</div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">今日尚未部署任何排隊活動</h3>
                <button onClick={() => setActiveTab('setup')} className="bg-slate-900 text-amber-500 px-10 py-3 rounded-2xl font-black text-[10px] tracking-widest uppercase mt-6 hover:scale-105 transition-all">前往部署中心 ↗</button>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                {/* Dashboard Active Event Header */}
                <div className="bg-white px-10 py-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-emerald-100">🏮</div>
                      <div>
                         <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                           {allActiveEvents.length > 0 ? (
                             <select 
                               className="bg-transparent border-none font-black text-xl text-slate-900 focus:outline-none cursor-pointer hover:bg-slate-50 rounded px-1"
                               value={activeEvent.id}
                               onChange={(e) => router.push(`?eventId=${e.target.value}`)}
                             >
                               {allActiveEvents.map(e => (
                                 <option key={e.id} value={e.id}>{e.title}</option>
                               ))}
                             </select>
                           ) : (
                             activeEvent.title
                           )}
                           <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-black ${activeEvent.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                             {activeEvent.status === 'Active' ? 'ACTIVE' : 'DRAFT'}
                           </span>
                         </h2>
                         <div className="flex items-center gap-3 mt-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              📍 {activeEvent.location} | 📅 {activeEvent.date} ({activeEvent.startTime || '09:00'} - {activeEvent.endTime || '17:00'})
                           </p>
                           {activeEvent.status !== 'Active' && (
                             <button onClick={() => handleActivate(activeEvent.id, false)} className="bg-emerald-500 text-white text-[9px] px-2 py-0.5 rounded shadow hover:bg-emerald-600 ml-2">立刻啟動 🚀</button>
                           )}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <button 
                         onClick={() => setIsRegistering(!isRegistering)}
                         className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isRegistering ? 'bg-amber-500 text-slate-900' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                         {isRegistering ? '✖ 取消報名' : '現場報名 +'}
                      </button>
                      <button 
                         onClick={() => {
                           const url = `${baseUrl}/live-queue`;
                           window.open(url, '_blank');
                         }}
                         className="px-6 py-2.5 bg-slate-900 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg"
                      >
                         打開大螢幕看板 🖥️
                      </button>
                      <button 
                         onClick={() => {
                            if (typeof window !== 'undefined' && navigator.clipboard) {
                               navigator.clipboard.writeText(`${baseUrl}/live-queue`);
                               alert("📋 大螢幕投放連結已複製！");
                            }
                         }}
                         className="px-6 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm"
                      >
                         複製看板連結 🔗
                      </button>
                   </div>
                </div>

                {/* Manual Registration Quick Form Overlay */}
                {isRegistering && (
                   <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white text-xl">📝</div>
                         <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">現場快速報名表單</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Walk-in Registration</p>
                         </div>
                      </div>
                      <form onSubmit={handleManualRegister} className="flex flex-col md:flex-row items-end gap-6">
                         <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">信眾姓名</label>
                            <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} placeholder="請輸入姓名" required className="w-full bg-white border-2 border-amber-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 shadow-inner" />
                         </div>
                         <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">聯絡電話 (可不填)</label>
                            <input type="text" value={regPhone} onChange={e=>setRegPhone(e.target.value)} placeholder="09xx-xxx-xxx" className="w-full bg-white border-2 border-amber-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500 shadow-inner" />
                         </div>
                         <button type="submit" disabled={isPending} className="px-10 py-3.5 bg-slate-900 text-amber-500 rounded-xl font-black text-sm tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all shadow-xl">
                            {isPending ? '正在報名...' : '確認報名 (產生號碼)'}
                         </button>
                      </form>
                   </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Panel: The Master Controller */}
                  <div className="lg:col-span-7 space-y-8">
                    <div className="bg-white p-12 lg:p-16 rounded-[70px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] text-center relative overflow-hidden group border-4 border-slate-900/5">
                       {/* Dynamic Background Elements - Lighter */}
                       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] -mr-20 -mt-20"></div>
                       <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] -ml-20 -mb-20"></div>
                       
                       <div className="relative z-10 flex flex-col items-center gap-12">
                          {/* Status Header */}
                          <div className="flex items-center gap-4">
                             <div className="h-px w-12 bg-slate-200"></div>
                             <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em] animate-pulse">Live Station {activeWindow} Active</span>
                             <div className="h-px w-12 bg-slate-200"></div>
                          </div>

                          <div className="flex flex-col items-center gap-6">
                             <div className="relative">
                                <div className="text-[240px] font-black bg-gradient-to-b from-slate-900 via-slate-800 to-slate-400 bg-clip-text text-transparent leading-none font-serif tracking-tighter drop-shadow-xl animate-in zoom-in duration-1000">
                                   {currentlyCalling ? currentlyCalling.assignedNumber.replace(/\D/g, '') : '--'}
                                </div>
                                <div className="absolute -top-4 -right-12 bg-slate-900 text-amber-500 px-4 py-1.5 rounded-xl text-xs font-black rotate-12 shadow-2xl border-4 border-white">
                                   NOW
                                </div>
                             </div>
                             
                             <div className="flex flex-col items-center gap-4">
                                <div className="px-12 py-4 bg-slate-50 rounded-[30px] border border-slate-100 shadow-inner">
                                   <p className="text-xl font-black text-slate-900 uppercase tracking-[0.4em] italic">
                                      {currentlyCalling ? `當前叫號：${currentlyCalling.assignedNumber}` : '準備中...'}
                                   </p>
                                </div>
                                <div className="flex items-center gap-3">
                                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{activeEvent.title}</p>
                                   <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">窗口 {activeWindow}</p>
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-8 w-full">
                             <button 
                                onClick={handleCallNext} 
                                disabled={isPending} 
                                className="group/btn relative bg-emerald-500 text-white py-10 rounded-[45px] font-black text-2xl shadow-[0_20px_60px_-10px_rgba(16,185,129,0.3)] active:scale-95 transition-all uppercase tracking-[0.4em] overflow-hidden hover:bg-slate-900"
                             >
                                <span className="relative z-10 flex items-center justify-center gap-3">下一位 🔊</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                             </button>
                             <button 
                                onClick={() => currentlyCalling && handleComplete(currentlyCalling.id)} 
                                disabled={!currentlyCalling || isPending} 
                                className="bg-slate-100 hover:bg-slate-200 text-slate-400 py-10 rounded-[45px] font-black text-2xl active:scale-95 transition-all uppercase tracking-[0.4em] border border-slate-200 disabled:opacity-30 shadow-sm"
                             >
                                完成服務
                             </button>
                          </div>

                          {/* Window Selector Quick Action */}
                          <div className="flex gap-4">
                             {['01', '02', '03'].map(win => (
                                <button key={win} onClick={() => setActiveWindow(win)} className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${activeWindow === win ? 'bg-slate-900 text-amber-500' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>
                                   {win}
                                </button>
                             ))}
                             <div className="ml-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Sync OK</span>
                             </div>
                          </div>
                       </div>
                    </div>
   
                    <div className="grid grid-cols-2 gap-8">
                      {[
                        { label: '現場等候中', val: initialDashboard?.tickets?.filter((t:any) => t.status === 'Queuing').length || 0, color: 'bg-white text-emerald-600 border-slate-100 shadow-xl' },
                        { label: '預計等待時間', val: `${(initialDashboard?.tickets?.filter((t:any) => t.status === 'Queuing').length || 0) * 8} 分`, color: 'bg-white text-indigo-600 border-slate-100 shadow-xl' },
                        { label: '已過號未到', val: initialDashboard?.tickets?.filter((t:any) => t.status === 'NoShow').length || 0, color: 'bg-white text-rose-500 border-slate-100 shadow-xl' },
                        { label: '今日累計完成', val: initialDashboard?.tickets?.filter((t:any) => t.status === 'Completed').length || 0, color: 'bg-white text-slate-500 border-slate-100 shadow-xl' }
                      ].map((stat, i) => (
                        <div key={i} className={`p-10 rounded-[50px] border ${stat.color} text-center transition-all hover:translate-y-[-8px]`}>
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-40">{stat.label}</div>
                          <div className="text-5xl font-black font-serif tracking-tighter italic">{stat.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
   
                  {/* Right Panel: Check-in & List */}
                  <div className="lg:col-span-5 space-y-8">
                    {/* QR Code Container */}
                    <div className="bg-white p-8 rounded-[50px] border border-slate-100 shadow-xl flex flex-col items-center gap-6">
                       <div className="p-4 bg-slate-50 rounded-[40px] shadow-inner">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${baseUrl}/${activeEvent.templeId || 'temple-1'}/checkin?eventId=${activeEvent.id}`)}`} alt="Check-in QR" className="w-48 h-48 mix-blend-multiply opacity-80" />
                       </div>
                       <div className="text-center">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">信眾報到 QR Code</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-2">請引導信眾掃描此碼完成報到手續</p>
                       </div>
                    </div>

                    <div className="bg-white rounded-[50px] border border-slate-100 shadow-xl overflow-hidden flex-1">
                       <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-xl text-amber-500">📋</div>
                             <div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">排隊名錄</h3>
                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Real-time Guest List</p>
                             </div>
                          </div>
                       </div>
                       
                       <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">順位</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">號碼牌</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾資訊</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {(initialDashboard?.tickets || [])
                                .filter((t:any) => t.status !== 'Pending')
                                .sort((a:any, b:any) => (a.actualOrder || 999) - (b.actualOrder || 999))
                                .map((ticket:any) => (
                                <tr key={ticket.id} className={`${ticket.status === 'Completed' ? 'opacity-20 grayscale' : 'hover:bg-slate-50/50 group'} ${ticket.status === 'Calling' ? 'bg-amber-50/50' : ''}`}>
                                  <td className="px-6 py-4 text-center">
                                     <span className={`text-2xl font-black italic font-serif ${ticket.status === 'Calling' ? 'text-amber-600 scale-125' : 'text-slate-900'}`}>#{ticket.actualOrder}</span>
                                   </td>
                                  <td className="px-6 py-4">
                                     <div className="flex flex-col">
                                        <span className={`text-sm font-black px-3 py-1 rounded-lg w-fit ${ticket.status === 'Calling' ? 'bg-slate-900 text-white' : 'bg-white text-slate-800 border'}`}>{ticket.assignedNumber} 號</span>
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                     <div className="text-sm font-black text-slate-800">{ticket.guestName}</div>
                                     <div className="text-[8px] text-slate-400 font-bold">@{ticket.phone}</div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {ticket.status === 'Queuing' && (
                                        <button onClick={handleCallNext} className="bg-slate-900 text-amber-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 hover:text-slate-950 transition-all">叫號服務</button>
                                      )}
                                      {ticket.status === 'Calling' && (
                                        <div className="flex gap-2">
                                          <button onClick={() => handleNoShow(ticket.id)} className="bg-rose-50 text-rose-600 px-3 py-2 rounded-xl text-[10px] font-black uppercase">過號</button>
                                          <button onClick={() => handleComplete(ticket.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">完成服務 ✓</button>
                                        </div>
                                      )}
                                      {ticket.status === 'Completed' && <span className="text-[8px] font-black text-emerald-400 uppercase">已完成</span>}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
