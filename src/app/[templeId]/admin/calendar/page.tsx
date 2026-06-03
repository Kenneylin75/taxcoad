"use client";
import React, { useState, useEffect, useTransition } from 'react';
import { 
  fetchAppointments, fetchAvailableSlots, bookAppointment, 
  fetchServiceDefinitions, searchGuestsByNameOrPhone, createOrUpdateGuest,
  markAppointmentAsArrived,
  confirmPayment
} from '@/app/actions';

// Helper to check if a specific time slot on a date has already passed in real-world time
const isSlotTimePassed = (dateStr: string, timeStr: string) => {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  if (dateStr < todayString) return true;
  if (dateStr > todayString) return false;
  
  const [slotHour, slotMin] = timeStr.split(':').map(Number);
  const currentHour = today.getHours();
  const currentMin = today.getMinutes();
  
  if (currentHour > slotHour) return true;
  if (currentHour === slotHour && currentMin >= slotMin) return true;
  
  return false;
};

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // 🔍 信眾姓名與電話雙向檢索狀態
  const [searchName, setSearchName] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any | null>(null);
  
  // ➕ 快速新增信眾狀態
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

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayString);

  const loadData = async () => {
    setIsLoading(true);
    const [appData, slotData, serviceData] = await Promise.all([
      fetchAppointments(),
      fetchAvailableSlots(),
      fetchServiceDefinitions()
    ]);
    setAppointments(appData);
    setAvailableSlots(slotData);
    setServices(serviceData);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const dayAppointments = appointments.filter(app => app.date === selectedDate);
  const dayAvailableSlots = availableSlots.filter(slot => slot.date === selectedDate && slot.status !== 'Booked');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getAppointmentCount = (dateString: string) => {
    return appointments.filter(app => app.date === dateString).length;
  };

  // 🔍 雙向聯絡人動態檢索處理
  const handleVerifyPayment = async (appId: string, method: string) => {
    const confirmMsg = method === 'Transfer' ? '是否確認已收到匯款？' : '是否確認已收到現金？';
    if (!window.confirm(confirmMsg)) return;
    
    startTransition(async () => {
      const res = await confirmPayment(appId, 'Appointment');
      if (res.success) {
        alert('✅ 對帳成功！');
        loadData();
      } else {
        alert('對帳失敗！');
      }
    });
  };

    const handleNameSearchChange = async (nameVal: string) => {
    setSearchName(nameVal);
    setSelectedGuest(null);
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
    setSelectedGuest(null);
    setIsAddingNewGuest(false);
    if (phoneVal.trim().length > 0) {
      const res = await searchGuestsByNameOrPhone(phoneVal);
      setSearchResults(res);
    } else {
      setSearchResults([]);
    }
  };

  const selectGuest = (guest: any) => {
    setSelectedGuest(guest);
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
      setSelectedGuest(payload);
      setSearchName(payload.name);
      setSearchPhone(payload.phone);
      setIsAddingNewGuest(false);
    } else {
      alert("❌ " + (res.error || "建立失敗，請重試。"));
    }
  };

  const handleAdminBook = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const slotId = Number(fd.get('slotId'));
    const guestName = searchName;
    const phone = searchPhone;

    startTransition(async () => {
      const res = await bookAppointment(slotId, guestName, phone);
      if (res.success) {
        alert('✅ 代客預約成功！');
        setIsBookingModalOpen(false);
        // 清空狀態
        setSearchName("");
        setSearchPhone("");
        setSelectedGuest(null);
        setIsAddingNewGuest(false);
        await loadData();
      } else {
        alert(`❌ 預約失敗: ${res.message}`);
      }
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

    const headers = weekDays.map(day => (
      <div key={`header-${day}`} className="text-center font-black text-[10px] text-slate-400 uppercase py-2">
        {day}
      </div>
    ));

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 border border-transparent"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isSelected = dateString === selectedDate;
      const isToday = dateString === todayString;
      const dateApps = appointments.filter(app => app.date === dateString);
      const dateSlots = availableSlots.filter(slot => slot.date === dateString && slot.status !== 'Booked');
      
      const count = dateApps.length;
      
      // 🌈 Dynamic Fallback Color Generator (Optimized for brightness and variety)
      const getFallbackColor = (str: string) => {
        if (!str) return '#cbd5e1';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Convert hash to HSL for better control over brightness and saturation
        const h = Math.abs(hash) % 360;
        const s = 70 + (Math.abs(hash) % 30); // 70-100% saturation
        const l = 50 + (Math.abs(hash) % 20); // 50-70% lightness (avoiding black/dark)
        
        return `hsl(${h}, ${s}%, ${l}%)`;
      };

      // 🌈 Map activities and slots to colors
      // We use 'Service Name + Time + Staff' as the unique key
      // This ensures:
      // 1. Same service at different times = Different colors
      // 2. Same service at same time but DIFFERENT staff = Different colors
      // 3. An appointment and its original slot = SAME color (because they share service, time, and staff)
      const allColors = [
        ...dateApps.map(app => {
          return getFallbackColor(`${app.service}-${app.time}-${app.staff}`); 
        }),
        ...dateSlots.map(slot => {
          return getFallbackColor(`${slot.description || 'slot'}-${slot.time}-${slot.staff}`);
        })
      ].filter(Boolean) as string[];

      // Each entry in allColors represents one segment in the ring.
      // We keep the list as-is to show all segments.
      let uniqueColors = allColors; 
      
      // FAILSAFE: If there is activity but no specific color found, show a default Indigo ring
      if ((dateApps.length > 0 || dateSlots.length > 0) && uniqueColors.length === 0) {
        uniqueColors = ['#6366f1']; 
      }

      const isPast = dateString < todayString;

      days.push(
        <div key={`day-cell-${i}`} className="relative h-16 sm:h-24 p-2">
          {/* 🌈 The Ring Layer (Placed BEHIND but visible at edges) */}
          {!isSelected && uniqueColors.length > 0 && (
            <div className={`absolute inset-0 rounded-[26px] overflow-hidden z-0 shadow-sm transition-all ${isPast ? 'filter grayscale opacity-30' : ''}`}>
              <div 
                className="absolute inset-0" 
                style={{
                  background: uniqueColors.length === 1 
                    ? uniqueColors[0] 
                    : `conic-gradient(${uniqueColors.map((c, idx) => `${c} ${(idx/uniqueColors.length)*100}%, ${c} ${((idx+1)/uniqueColors.length)*100}%`).join(', ')})`,
                }}
              />
            </div>
          )}

          <button
            onClick={() => setSelectedDate(dateString)}
            className={`relative w-full h-full border-2 rounded-[22px] flex flex-col items-center justify-center transition-all z-10 ${
              isPast 
                ? isSelected
                  ? 'bg-slate-700 border-slate-700 shadow-2xl text-slate-400 transform scale-105'
                  : 'bg-slate-100/80 border-transparent text-slate-400 opacity-60 hover:bg-slate-200'
                : isSelected 
                  ? 'bg-slate-900 border-slate-900 shadow-2xl text-amber-500 transform scale-105' 
                  : 'bg-white border-transparent text-slate-700 hover:border-amber-200 shadow-sm'
            }`}
          >
            <span className={`text-sm sm:text-xl font-black ${
              isPast 
                ? 'text-slate-400' 
                : isSelected 
                  ? 'text-amber-500' 
                  : isToday 
                    ? 'text-indigo-600' 
                    : ''
            }`}>
              {i}
            </span>
            {count > 0 && (
              <span className={`absolute bottom-2 text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                isPast
                  ? 'bg-slate-300 text-slate-600'
                  : isSelected 
                    ? 'bg-amber-500 text-slate-900' 
                    : 'bg-slate-900 text-white shadow-sm'
              }`}>
                {count} 筆
              </span>
            )}
          </button>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-6 px-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">⬅️</button>
          <h3 className="text-xl font-black text-slate-900 tracking-wider">
            {currentYear} 年 {currentMonth + 1} 月
          </h3>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">➡️</button>
        </div>
        <div className="grid grid-cols-7 gap-4 mb-2">
          {headers}
        </div>
        <div className="grid grid-cols-7 gap-x-4 gap-y-6">
          {days}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">同步日曆數據中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">預約日曆</h1>
            <p className="text-slate-400 text-xs font-black tracking-[0.4em] uppercase mt-2">Dharma Service Appointment Orchestration</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Calendar View */}
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-white p-6 sm:p-8 rounded-[40px] border-4 border-slate-900 shadow-2xl">
              {renderCalendar()}
              
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-slate-400 text-[10px] font-black tracking-widest uppercase">選定日期：{selectedDate}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="w-3 h-3 bg-indigo-600 rounded-full"></span>
                  <span className="text-[10px] font-bold text-slate-400 mr-2">今日</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">各類服務預約</span>
                </div>
              </div>
           </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center justify-between px-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">明細列表 ({selectedDate})</h3>
              <button 
                onClick={() => !(selectedDate < todayString) && setIsBookingModalOpen(true)}
                disabled={selectedDate < todayString}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest shadow-lg transition-all uppercase flex items-center gap-2 ${
                  (selectedDate < todayString)
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/20'
                }`}
              >
                <span>➕</span> 代客預約 {selectedDate < todayString && '(已超過時間)'}
              </button>
           </div>
           <div className="h-0.5 w-full bg-slate-100"></div>

           <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
              {dayAppointments.length === 0 ? (
                <div className="py-24 text-center bg-white border-4 border-dashed border-slate-50 rounded-[40px] opacity-40">
                   <p className="text-4xl mb-4 grayscale">🍵</p>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">本日無信眾預約</p>
                </div>
              ) : (
                dayAppointments.map((app) => (
                  <div key={app.id} className="bg-white p-6 rounded-[30px] border-2 border-slate-50 shadow-sm hover:shadow-xl hover:border-amber-200 transition-all group">
                     <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-[16px] flex items-center justify-center text-xl font-black shadow-lg">
                                {app.guestName[0]}
                             </div>
                             <div>
                                <h4 className="text-lg font-black text-slate-900 italic tracking-tighter">{app.guestName}</h4>
                                <p className="text-[10px] font-bold text-slate-400">{app.phone || '未提供電話'}</p>
                             </div>
                          </div>
                          <span className="px-4 py-1.5 rounded-full bg-slate-900 text-amber-500 text-[10px] font-black uppercase tracking-widest shadow-md">
                             {app.service}
                          </span>
                        </div>
                        
                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                           <div className="flex items-center gap-2">
                              <span className="text-xl">🕓</span>
                              <span className="text-sm font-black text-slate-700">{app.time}</span>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase">主理老師</span>
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{app.staff}</span>
                           </div>
                        </div>
                        {/* 付款與對帳狀態區塊 */}
                        <div className="bg-slate-50 p-3 rounded-2xl flex items-center justify-between border border-slate-100 mt-2">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase">結緣金狀態</span>
                              <div className="flex items-center gap-2">
                                <span className={'text-xs font-black px-2 py-1 rounded-md ' + (app.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                  {app.paymentStatus === 'Paid' ? '✅ 已付款' : '⏳ 待付款 / 待確認'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-600">
                                  {(!app.amount && app.paymentMethod !== 'Cash') ? '隨喜功德' : 
                                   (app.amount ? (app.amount === 0 ? '隨喜功德' : 'NT$ ' + app.amount) : '現場付現')}
                                </span>
                              </div>
                           </div>
                           
                           {app.paymentStatus === 'Pending' && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[9px] font-bold text-slate-400">
                                  {app.paymentMethod === 'Transfer' ? ('匯款後五碼: ' + (app.paymentRef || '未提供')) : 
                                   app.paymentMethod === 'Cash' ? '信眾預計現場付現' : 
                                   app.paymentMethod === 'QR' ? '信眾掃描自訂 QR 碼' : '數位支付處理中...'}
                                </span>
                                {(app.paymentMethod === 'Transfer' || app.paymentMethod === 'Cash' || app.paymentMethod === 'QR') && (
                                  <button
                                    onClick={() => handleVerifyPayment(app.id, app.paymentMethod)}
                                    className="px-3 py-1 bg-slate-900 text-amber-500 rounded-lg text-[10px] font-black hover:bg-amber-500 hover:text-slate-900 transition-all shadow-sm"
                                  >
                                    {app.paymentMethod === 'Cash' ? '💰 現金結清' : '💵 核對收款'}
                                  </button>
                                )}
                              </div>
                           )}
                        </div>

                        {/* 報到操作區塊 */}
                        <div className="flex justify-end pt-2 border-t border-slate-50 mt-2">
                          {app.status === 'Arrived' ? (
                            <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> 已到場
                            </span>
                          ) : (
                            <button 
                              onClick={async () => {
                                if (confirm(`確定標記 ${app.guestName} 已抵達現場？`)) {
                                  await markAppointmentAsArrived(app.id);
                                  await loadData();
                                }
                              }}
                              className="px-6 py-2 bg-slate-900 text-white hover:bg-emerald-600 rounded-xl text-xs font-black tracking-widest transition-all shadow-md active:scale-95"
                            >
                              ✅ 標記為已到場
                            </button>
                          )}
                        </div>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isPending && setIsBookingModalOpen(false)}></div>
          <div className="relative bg-white rounded-[40px] p-8 w-full max-w-2xl shadow-2xl border-4 border-slate-900 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <button onClick={() => !isPending && setIsBookingModalOpen(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors font-black">✕</button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 italic tracking-tighter">代客預約登記</h3>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Manual Appointment Orchestration</p>
              <div className="mt-2 text-sm font-bold text-slate-500">
                預約日期：<span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{selectedDate}</span>
              </div>
            </div>

            {dayAvailableSlots.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-2xl mb-2">🚧</p>
                <p className="text-sm font-bold text-slate-500">此日期目前沒有任何可用的空班次。</p>
                <p className="text-[10px] text-slate-400 mt-1">請先至「預約時段」功能中排班。</p>
              </div>
            ) : (
              <form onSubmit={handleAdminBook} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">選擇空班次 (Available Slots)</label>
                  <select required name="slotId" className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-amber-500 outline-none transition-colors">
                    <option value="">請選擇班次時段...</option>
                    {dayAvailableSlots.map(slot => {
                      const srv = services.find(s => s.id === slot.bound_service_id);
                      const isPassed = isSlotTimePassed(selectedDate, slot.time);
                      return (
                        <option key={slot.id} value={slot.id} disabled={isPassed}>
                          {slot.time} - {srv?.name || slot.description || '未知服務'} ({slot.staff}){isPassed ? ' (已過預約時間 ✕)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  {/* 信眾姓名 */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾姓名 (Guest Name)</label>
                    <input 
                      required 
                      name="guestName" 
                      type="text" 
                      value={searchName}
                      onChange={(e) => handleNameSearchChange(e.target.value)}
                      placeholder="例: 王小明" 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-amber-500 outline-none transition-colors" 
                      autoComplete="off"
                    />
                    
                    {/* 姓名檢索下拉選單 */}
                    {searchResults.length > 0 && searchName && !selectedGuest && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl z-[1000] max-h-48 overflow-y-auto p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[9px] font-black text-slate-400 px-3 py-1 uppercase tracking-widest">🔍 匹配信眾檔案 (點擊套用)</p>
                        {searchResults.map((guest) => (
                          <button
                            key={guest.phone}
                            type="button"
                            onClick={() => selectGuest(guest)}
                            className="w-full text-left p-3 hover:bg-amber-50 rounded-xl transition-all flex items-center justify-between"
                          >
                            <span className="font-black text-slate-900 text-sm">{guest.name}</span>
                            <span className="text-xs font-bold text-slate-400">{guest.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 聯絡電話 */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">聯絡電話 (Phone)</label>
                    <input 
                      required 
                      name="phone" 
                      type="tel" 
                      value={searchPhone}
                      onChange={(e) => handlePhoneSearchChange(e.target.value)}
                      placeholder="09XX-XXX-XXX" 
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-amber-500 outline-none transition-colors" 
                      autoComplete="off"
                    />
                    
                    {/* 電話檢索下拉選單 */}
                    {searchResults.length > 0 && searchPhone && !selectedGuest && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-slate-900 rounded-2xl shadow-2xl z-[1000] max-h-48 overflow-y-auto p-2 space-y-1 animate-in slide-in-from-top-2 duration-200">
                        <p className="text-[9px] font-black text-slate-400 px-3 py-1 uppercase tracking-widest">🔍 匹配信眾檔案 (點擊套用)</p>
                        {searchResults.map((guest) => (
                          <button
                            key={guest.phone}
                            type="button"
                            onClick={() => selectGuest(guest)}
                            className="w-full text-left p-3 hover:bg-amber-50 rounded-xl transition-all flex items-center justify-between"
                          >
                            <span className="font-black text-slate-900 text-sm">{guest.name}</span>
                            <span className="text-xs font-bold text-slate-400">{guest.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 信眾檔案比對結果徽章 */}
                {selectedGuest ? (
                  <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
                    <span className="text-xl">🛡️</span>
                    <div>
                      <p className="text-xs font-black text-emerald-800">已成功套用信眾檔案：<span className="underline font-black">{selectedGuest.name}</span></p>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">LINE ID: {selectedGuest.lineId || '尚未綁定'}</p>
                    </div>
                  </div>
                ) : (searchName || searchPhone) && !isAddingNewGuest && (
                  <div className="bg-amber-50 border-2 border-amber-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">🔍</span>
                      <div>
                        <p className="text-xs font-black text-amber-800">未找到匹配的信眾檔案？</p>
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">系統中無此姓名或電話紀錄</p>
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

                {/* ➕ 快速新增信眾表單 */}
                {isAddingNewGuest && (
                  <div className="bg-slate-900 text-white border-4 border-slate-950 p-8 rounded-3xl space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-amber-500 uppercase tracking-widest">👤 新增信眾基本檔案</h4>
                        <p className="text-[9px] font-bold text-slate-400">Believer Registration Orchestration</p>
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
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
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
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
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
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">登入密碼 (預設123456)</label>
                        <input 
                          type="password" 
                          placeholder="預設為 123456" 
                          value={newGuestData.password} 
                          onChange={(e) => setNewGuestData({ ...newGuestData, password: e.target.value })} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
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
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">國曆生日</label>
                        <input 
                          type="date" 
                          value={newGuestData.birthday} 
                          onChange={(e) => setNewGuestData({ ...newGuestData, birthday: e.target.value })} 
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
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
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:border-amber-500 outline-none text-white" 
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

                <div className="pt-4 mt-8 border-t border-slate-100 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-500 px-8 py-3 rounded-xl text-xs font-black tracking-widest shadow-xl shadow-slate-900/20 transition-all uppercase flex items-center gap-2 disabled:opacity-50"
                  >
                    {isPending ? '處理中...' : '確認預約送出 🚀'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}