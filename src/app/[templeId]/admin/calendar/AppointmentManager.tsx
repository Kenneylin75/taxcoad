// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchServiceDefinitions, fetchAvailableSlots, bookAppointment, 
  fetchQueueEvents, fetchEvents, fetchGuestByPhone, createOrUpdateGuest,
  searchGuestsByNameOrPhone
} from '@/app/actions';

interface Appointment {
  id: number;
  guestName: string;
  serviceName: string;
  time: string;
  status: string;
}

// Helper to check if a Date is in the past in real-world time (ignoring time for pure date compare)
const isPastDate = (date: Date) => {
  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dateZero = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return dateZero.getTime() < todayZero.getTime();
};

export default function AppointmentManager({ initialAppointments }: { initialAppointments: Appointment[] }) {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [services, setServices] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [queueEvents, setQueueEvents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  // 🔍 雙向聯絡人動態檢索狀態與處理
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [foundGuest, setFoundGuest] = useState<any | null>(null);
  const [isAddingNewGuest, setIsAddingNewGuest] = useState(false);
  const [newGuestData, setNewGuestData] = useState({
    name: "",
    phone: "",
    account: "",
    password: "",
    lineId: "",
    birthday: "",
    address: ""
  });

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const handleNameSearchChange = async (nameVal: string) => {
    setSearchName(nameVal);
    setFoundGuest(null);
    setIsAddingNewGuest(false);
    if (nameVal.trim().length > 0) {
      const res = await searchGuestsByNameOrPhone(nameVal);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const handlePhoneSearchChange = async (phoneVal: string) => {
    setSearchPhone(phoneVal);
    setFoundGuest(null);
    setIsAddingNewGuest(false);
    if (phoneVal.trim().length > 0) {
      const res = await searchGuestsByNameOrPhone(phoneVal);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const selectGuest = (guest: any) => {
    setFoundGuest(guest);
    setSearchName(guest.name);
    setSearchPhone(guest.phone);
    setSearchResults([]);
  };

  const handleAddNewGuestSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newGuestData.name || !newGuestData.phone) {
      alert("⚠️ 請填寫姓名與電話號碼！");
      return;
    }
    const finalAccount = newGuestData.account || newGuestData.phone;
    const finalPassword = newGuestData.password || "123456";
    
    const payload = {
      ...newGuestData,
      account: finalAccount,
      password: finalPassword
    };

    const res = await createOrUpdateGuest(payload);
    if (res.success) {
      alert("✨ 信眾檔案已成功建立！已自動為您帶入。");
      setFoundGuest(payload);
      setSearchName(payload.name);
      setSearchPhone(payload.phone);
      setIsAddingNewGuest(false);
    } else {
      alert("❌ " + (res.error || "建立失敗，請重試。"));
    }
  };

  useEffect(() => {
    setMounted(true);
    setSelectedDate(new Date());
    Promise.all([
      fetchServiceDefinitions(),
      fetchAvailableSlots(),
      fetchQueueEvents(),
      fetchEvents()
    ]).then(([svcs, slots, qEvts, evts]) => {
      setServices(svcs);
      setAvailableSlots(slots);
      setQueueEvents(qEvts);
      setEvents(evts);
    });
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, date: new Date(year, month, i) });
    return days;
  }, [currentMonth]);

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  if (!mounted) return <div className="min-h-screen bg-white animate-pulse" />;

  const dayAppointments = initialAppointments.filter(app => {
    try { return isSameDay(new Date(app.time), selectedDate); } catch(e) { return false; }
  });

  return (
    <div className="h-[calc(100vh-80px)] w-full max-w-[1800px] mx-auto p-4 flex flex-col bg-white overflow-hidden text-slate-900 font-sans tracking-tight">
      
      {/* 🏛️ 緊湊且美觀的 Header */}
      <header className="flex items-center justify-between mb-4 px-2 h-16 flex-shrink-0">
        <div className="flex items-center gap-8">
          <h2 className="text-4xl font-black tracking-tighter text-slate-950 flex items-center gap-3">
            {currentMonth.getFullYear()}<span className="text-indigo-600">.</span>{(currentMonth.getMonth() + 1).toString().padStart(2, '0')}
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] ml-2">Sacred Calendar</span>
          </h2>
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
             <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600">←</button>
             <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600">→</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="hidden md:flex flex-col items-end mr-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Date Details</p>
              <p className="text-sm font-bold text-indigo-600">{selectedDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
           </div>
            <button 
              onClick={() => !isPastDate(selectedDate) && setShowAddModal(true)}
              disabled={isPastDate(selectedDate)}
              className={`px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${
                isPastDate(selectedDate) 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                  : 'bg-slate-900 text-white hover:bg-indigo-600'
              }`}
            >
              協助預約 ✦ {isPastDate(selectedDate) && '(已超過時間)'}
            </button>
        </div>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* 📅 一屏式全寬日曆 */}
        <div className="flex-1 bg-white rounded-[32px] border border-slate-100 overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.02)]">
          <div className="grid grid-cols-7 border-b border-slate-100 flex-shrink-0">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 tracking-[0.4em] bg-slate-50/50 border-r border-slate-100 last:border-0">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 border-collapse min-h-0">
            {calendarDays.map((item, idx) => {
              if (item.day === null) return <div key={idx} className="bg-slate-50/10 border-r border-slate-100 border-b last:border-r-0" />;
              
              const isSelected = isSameDay(item.date!, selectedDate);
              const isToday = isSameDay(item.date!, new Date());
              const isPast = isPastDate(item.date!);
              const apps = initialAppointments.filter(a => isSameDay(new Date(a.time), item.date!));

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(item.date!)}
                  className={`relative p-3 border-r border-b border-slate-100 transition-all flex flex-col items-start group overflow-hidden ${
                    isPast 
                      ? 'bg-slate-100/70 opacity-60 hover:bg-slate-200' 
                      : isSelected 
                        ? 'bg-indigo-50/40' 
                        : 'bg-white hover:bg-slate-50/30'
                  } last:border-r-0`}
                >
                  <div className="flex justify-between items-start w-full mb-1">
                    <span className={`text-xl font-black leading-none transition-all ${
                      isPast
                        ? 'text-slate-400 group-hover:text-slate-600'
                        : isSelected 
                          ? 'text-indigo-600' 
                          : isToday 
                            ? 'text-white bg-indigo-600 w-7 h-7 flex items-center justify-center rounded-lg shadow-md text-sm' 
                            : 'text-slate-300 group-hover:text-slate-800'
                    }`}>
                      {item.day}
                    </span>
                    {apps.length > 0 && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isPast ? 'text-slate-400 bg-slate-200' : 'text-indigo-400 bg-indigo-50'
                      }`}>
                        {apps.length} 預約
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-1 w-full space-y-1 overflow-hidden">
                    {apps.slice(0, 3).map((app, i) => (
                      <div key={i} className={`text-[9px] font-bold flex items-center gap-1.5 truncate ${
                        isPast ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                         <span className={`w-1 h-1 rounded-full flex-shrink-0 ${isPast ? 'bg-slate-300' : 'bg-indigo-400'}`}></span>
                         {app.guestName}
                      </div>
                    ))}
                    {apps.length > 3 && <p className="text-[8px] font-black text-slate-300 ml-2.5">+{apps.length - 3} MORE</p>}
                  </div>

                  {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 📑 精緻側邊面板 (固定高度，內部可捲動) */}
        <div className="w-[380px] flex flex-col gap-4 overflow-hidden">
           <div className="bg-slate-900 rounded-[32px] p-8 flex flex-col h-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="mb-8 border-b border-slate-800 pb-6">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Schedule For Today</p>
                 <h3 className="text-2xl font-black text-white italic tracking-tighter">
                    {selectedDate.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
                 </h3>
                 <p className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-widest">{selectedDate.toLocaleDateString('zh-TW', { weekday: 'long' })}</p>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
                 {dayAppointments.length > 0 ? dayAppointments.map(app => (
                   <div 
                     key={app.id} 
                     onClick={() => {
                       // 尋找該信眾的電話號碼並跳轉至信眾管理頁面
                       // 假設信眾管理頁面支援搜尋或 URL 參數
                       window.location.href = `/temple/guests?search=${app.guestName}`;
                     }}
                     className="group p-5 bg-slate-800/50 border border-slate-700/50 rounded-2xl hover:bg-indigo-600 hover:border-indigo-500 transition-all cursor-pointer relative overflow-hidden"
                   >
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[8px] font-black text-white bg-white/20 px-2 py-1 rounded-lg uppercase tracking-widest">查看檔案中心 →</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[9px] font-black text-slate-500 group-hover:text-white/60 uppercase">
                            {new Date(app.time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12:false})}
                         </span>
                         <span className="text-sm">🏮</span>
                      </div>
                      <h4 className="text-lg font-black text-white mb-1">{app.guestName}</h4>
                      <p className="text-[9px] font-bold text-slate-500 group-hover:text-white/80 uppercase tracking-widest">{app.serviceName}</p>
                   </div>
                 )) : (
                   <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                      <p className="text-5xl mb-4">🕊️</p>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest text-center leading-relaxed">此日尚無登記日程</p>
                   </div>
                 )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-white/50 text-[10px] font-bold uppercase tracking-widest">
                 <p>Total Records: {dayAppointments.length}</p>
                 <button className="hover:text-white transition-colors">Export PDF →</button>
              </div>
           </div>
        </div>
      </div>

      {/* 💡 協助預約彈窗 */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/80 backdrop-blur-3xl p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-2xl bg-white rounded-[60px] p-16 shadow-2xl relative border border-slate-900 border-4 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-3xl font-black italic tracking-tighter uppercase">代客預約系統 <span className="text-indigo-600">Proxy</span></h3>
                 <button onClick={() => {setShowAddModal(false); setFoundGuest(null); setSearchName(""); setSearchPhone(""); setSearchResults([]); setIsAddingNewGuest(false);}} className="text-slate-300 hover:text-black transition-all">✕</button>
              </div>

              <div className="space-y-12">
                 <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Step 1. 信眾資料核定 (雙向模糊檢索)</label>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative">
                        {/* 姓名檢索 */}
                        <div className="space-y-2 relative">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">信眾姓名 (Name)</label>
                           <input 
                              type="text" 
                              value={searchName}
                              onChange={(e) => handleNameSearchChange(e.target.value)}
                              placeholder="輸入姓名搜尋..." 
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 text-lg font-black text-slate-900 outline-none focus:border-indigo-600 transition-all"
                              autoComplete="off"
                           />
                           {searchResults.length > 0 && searchName && !foundGuest && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl z-[1000] max-h-48 overflow-y-auto p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                 <p className="text-[9px] font-black text-slate-400 px-3 py-1 uppercase tracking-widest">🔍 匹配信眾檔案 (點擊套用)</p>
                                 {searchResults.map((guest) => (
                                    <button
                                       key={guest.phone}
                                       type="button"
                                       onClick={() => selectGuest(guest)}
                                       className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-between"
                                    >
                                       <span className="font-black text-slate-900 text-sm">{guest.name}</span>
                                       <span className="text-xs font-bold text-slate-400">{guest.phone}</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>

                        {/* 電話檢索 */}
                        <div className="space-y-2 relative">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">聯絡電話 (Phone)</label>
                           <input 
                              type="tel" 
                              value={searchPhone}
                              onChange={(e) => handlePhoneSearchChange(e.target.value)}
                              placeholder="輸入電話搜尋..." 
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-[20px] px-6 py-4 text-lg font-black text-slate-900 outline-none focus:border-indigo-600 transition-all"
                              autoComplete="off"
                           />
                           {searchResults.length > 0 && searchPhone && !foundGuest && (
                              <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl z-[1000] max-h-48 overflow-y-auto p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                 <p className="text-[9px] font-black text-slate-400 px-3 py-1 uppercase tracking-widest">🔍 匹配信眾檔案 (點擊套用)</p>
                                 {searchResults.map((guest) => (
                                    <button
                                       key={guest.phone}
                                       type="button"
                                       onClick={() => selectGuest(guest)}
                                       className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-between"
                                    >
                                       <span className="font-black text-slate-900 text-sm">{guest.name}</span>
                                       <span className="text-xs font-bold text-slate-400">{guest.phone}</span>
                                    </button>
                                 ))}
                              </div>
                           )}
                        </div>
                     </div>

                     {/* 核定狀態 */}
                     {foundGuest ? (
                        <div className="p-6 bg-emerald-50 rounded-[30px] border-2 border-emerald-100 flex justify-between items-center shadow-sm animate-in fade-in duration-300">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xl shadow-md">✓</div>
                              <div>
                                 <h4 className="text-lg font-black text-slate-950 tracking-tighter">已套用：{foundGuest.name}</h4>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{foundGuest.phone}</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => { setFoundGuest(null); setSearchName(''); setSearchPhone(''); }} 
                              className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest"
                           >
                              重新檢索
                           </button>
                        </div>
                     ) : (searchName || searchPhone) && !isAddingNewGuest && (
                        <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[35px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-300">
                           <div className="flex items-start gap-3">
                              <span className="text-xl mt-0.5">🔍</span>
                              <div>
                                 <p className="text-xs font-black text-amber-800">未找到匹配的信眾檔案？</p>
                                 <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">點選按鈕以快速為此信眾建檔與設定帳密</p>
                              </div>
                           </div>
                           <button 
                              type="button"
                              onClick={() => {
                                 setIsAddingNewGuest(true);
                                 setNewGuestData({
                                    name: searchName,
                                    phone: searchPhone,
                                    account: searchPhone,
                                    password: "",
                                    lineId: "",
                                    birthday: "",
                                    address: ""
                                 });
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm self-start sm:self-auto transition-colors"
                           >
                              ➕ 建立新信眾檔案
                           </button>
                        </div>
                     )}

                     {/* Step 2: 服務與時段選擇 */}
                     {foundGuest && (
                        <div className="space-y-6 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                           <div className="flex items-center gap-4 border-b-2 border-slate-50 pb-4">
                              <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">02</span>
                              <div>
                                 <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">服務項目與時段設定</h4>
                                 <p className="text-[10px] font-bold text-slate-400">Service & Scheduling Allocation</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">選擇服務項目</label>
                              <div className="grid grid-cols-2 gap-3">
                                 {services.map(svc => (
                                    <button 
                                       key={svc.id}
                                       onClick={() => { setSelectedServiceId(svc.id); setSelectedSlotId(null); }}
                                       className={`p-4 rounded-2xl text-left border-2 transition-all ${selectedServiceId === svc.id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
                                    >
                                       <h5 className="font-bold text-slate-900 text-sm">{svc.name}</h5>
                                       <p className="text-[10px] text-slate-500 mt-1">{svc.price ? `結緣金 $${svc.price}` : '隨喜功德'}</p>
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {selectedServiceId && (
                              <div className="space-y-4 pt-2">
                                 <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                       選擇 {selectedDate.toISOString().split('T')[0]} 之可用時段
                                    </label>
                                 </div>
                                 <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                    {availableSlots
                                       .filter(slot => slot.date === selectedDate.toISOString().split('T')[0] && slot.status === 'Available' && (String(slot.bound_service_id) === String(selectedServiceId) || String(slot.serviceId) === String(selectedServiceId)))
                                       .map(slot => (
                                          <button 
                                             key={slot.id}
                                             onClick={() => setSelectedSlotId(slot.id)}
                                             className={`py-3 px-2 rounded-2xl border-2 text-center transition-all ${selectedSlotId === slot.id ? 'border-amber-500 bg-amber-50 shadow-md text-amber-700' : 'border-slate-100 hover:border-amber-200 bg-white text-slate-700'}`}
                                          >
                                             <div className="font-black text-sm">{slot.time}</div>
                                             <div className="text-[9px] text-slate-400 mt-0.5 truncate">{slot.staff}</div>
                                          </button>
                                    ))}
                                    {availableSlots.filter(slot => slot.date === selectedDate.toISOString().split('T')[0] && slot.status === 'Available' && (String(slot.bound_service_id) === String(selectedServiceId) || String(slot.serviceId) === String(selectedServiceId))).length === 0 && (
                                       <div className="col-span-full py-6 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                          <p className="text-xs font-bold text-slate-400">此日期暫無此服務的可用時段，請嘗試選擇其他日期</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           )}
                        </div>
                     )}

                     {/* 新增信眾子表單 */}
                     {isAddingNewGuest && (
                        <div className="bg-slate-900 text-white border-4 border-slate-950 p-8 rounded-[35px] space-y-6 animate-in zoom-in-95 duration-200">
                           <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                              <div>
                                 <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest">👤 新增信眾基本檔案</h4>
                                 <p className="text-[9px] font-bold text-slate-400">Manual Onboarding Credentials Portal</p>
                              </div>
                              <button type="button" onClick={() => setIsAddingNewGuest(false)} className="text-slate-400 hover:text-white text-xs">✕ 關閉</button>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">信眾姓名 *</label>
                                 <input 
                                    required 
                                    type="text" 
                                    placeholder="姓名" 
                                    value={newGuestData.name} 
                                    onChange={(e) => setNewGuestData({ ...newGuestData, name: e.target.value })} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">聯絡電話 *</label>
                                 <input 
                                    required 
                                    type="tel" 
                                    placeholder="電話" 
                                    value={newGuestData.phone} 
                                    onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">登入帳號 (預設手機)</label>
                                 <input 
                                    type="text" 
                                    placeholder="預設為手機" 
                                    value={newGuestData.account} 
                                    onChange={(e) => setNewGuestData({ ...newGuestData, account: e.target.value })} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">登入密碼 (預設123456)</label>
                                 <input 
                                    type="password" 
                                    placeholder="預設為 123456" 
                                    value={newGuestData.password} 
                                    onChange={(e) => setNewGuestData({ ...newGuestData, password: e.target.value })} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">LINE ID</label>
                                 <input 
                                    type="text" 
                                    placeholder="@line" 
                                    value={newGuestData.lineId} 
                                    onChange={(e) => setNewGuestData({ ...newGuestData, lineId: e.target.value })} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                                 />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">國曆生日</label>
                                 <input 
                                    type="date" 
                                    value={newGuestData.birthday} 
                                    onChange={(e) => setNewGuestData({ ...newGuestData, birthday: e.target.value })} 
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                                 />
                              </div>
                           </div>

                           <div className="space-y-1">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">通訊地址</label>
                              <input 
                                 type="text" 
                                 placeholder="通訊地址" 
                                 value={newGuestData.address} 
                                 onChange={(e) => setNewGuestData({ ...newGuestData, address: e.target.value })} 
                                 className="w-full bg-slate-800 border border-slate-700 rounded-xl text-slate-950 px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none" 
                              />
                           </div>

                           <button 
                              type="button"
                              onClick={handleAddNewGuestSubmit}
                              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all"
                           >
                              儲存檔案並套用 🚀
                           </button>
                        </div>
                     )}
                  </div>

                  <div className="pt-6">
                     <button 
                        disabled={!foundGuest || !selectedServiceId || !selectedSlotId || isSubmittingBooking}
                        onClick={async () => {
                           setIsSubmittingBooking(true);
                           const res = await bookAppointment(selectedSlotId!, foundGuest.name, foundGuest.phone, 'Cash');
                           setIsSubmittingBooking(false);
                           if (res.success) {
                              alert(`🏮 預約成功！已為 ${foundGuest.name} 排定時程，由於採取現金對帳，此筆狀態預設為「待付款」。`);
                              setShowAddModal(false);
                              setFoundGuest(null);
                              setSearchName("");
                              setSearchPhone("");
                              setSearchResults([]);
                              setSelectedServiceId("");
                              setSelectedSlotId(null);
                              window.location.reload();
                           } else {
                              alert(`❌ 預約失敗: ${res.message}`);
                           }
                        }}
                        className="w-full py-8 bg-slate-950 text-amber-500 rounded-[40px] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                     >
                        {isSubmittingBooking ? '處理中...' : '確認核准預約 🚀'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
}
