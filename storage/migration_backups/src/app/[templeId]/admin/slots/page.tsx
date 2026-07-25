"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { fetchAvailableSlots, createSlot, updateSlot, removeSingleSlot, removeBatchSlots, analyzeAffectedAppointments, executeEmergencyReschedule, fetchPersonnel, getCurrentRole, AppRole, fetchServiceDefinitions } from '@/app/actions';

export default function AdminSlotsPage() {
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 批次排班狀態
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [startMonth, setStartMonth] = useState(1);
  const [endMonth, setEndMonth] = useState(12);
  const [weekdays, setWeekdays] = useState<number[]>([]); // 0=Sun, 1=Mon...
  
  // 畫面控制狀態
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 單筆編輯狀態
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // 突發請假智能調度狀態
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyStaff, setEmergencyStaff] = useState("");
  const [emergencyStart, setEmergencyStart] = useState("");
  const [emergencyEnd, setEmergencyEnd] = useState("");
  const [affectedList, setAffectedList] = useState<any[] | null>(null);
  const [targetNewTime, setTargetNewTime] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  // 動態讀取服務人員與服務項目
  const [serviceStaffs, setServiceStaffs] = useState<any[]>([]);
  const [currentRole, setCurrentRole] = useState<any>('Admin');
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  // 智能調度控制
  const [enableSmartScheduling, setEnableSmartScheduling] = useState(true);
  const [aiInsight, setAiInsight] = useState("目前預約負載平衡中，建議下週增加時段以應對高峰期需求。");

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAvailableSlots();
      // 🛡️ 確保數據被正確接收
      console.log("Loaded slots count:", data?.length);
      setSlots(Array.isArray(data) ? data : []);
      
      const personnel = await fetchPersonnel();
      const filteredPersonnel = personnel.filter((p:any) => p.role?.includes('Service') || p.role?.includes('師傅'));
      setServiceStaffs(filteredPersonnel);
      if (filteredPersonnel.length > 0 && !emergencyStaff) {
        setEmergencyStaff(filteredPersonnel[0].name);
      }

      const services = await fetchServiceDefinitions();
      setAvailableServices(Array.isArray(services) ? services : []);
      
      const role = await getCurrentRole();
      setCurrentRole(role);
    } catch (err) {
      console.error("Failed to load slots data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  const generatedDates = useMemo(() => {
    if (weekdays.length === 0 || startMonth > endMonth) return [];
    const dates = [];
    const y = parseInt(year);
    for (let m = startMonth; m <= endMonth; m++) {
      const daysInMonth = new Date(y, m, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(y, m - 1, d);
        if (weekdays.includes(dateObj.getDay())) {
          dates.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }
    }
    return dates;
  }, [year, startMonth, endMonth, weekdays]);

  const toggleWeekday = (day: number) => {
    setWeekdays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  const handleBatchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (generatedDates.length === 0) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    formData.append("dates", generatedDates.join(','));
    
    try {
      const res = await createSlot(formData);
      if (res.success) {
        setWeekdays([]);
        // 🚀 關鍵：確保狀態同步
        await loadSlots();
        alert(`✅ 成功發布 ${generatedDates.length} 個班次！`);
      }
    } catch (err) {
      alert("❌ 發布失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🛡️ 深度優化分組邏輯：確保所有日期都被完整歸類且不遺漏，並支援排序與分頁
  const groupedSlotsArray = useMemo(() => {
    const groups: Record<string, any> = {};
    
    // 遍歷所有從 Server 抓回來的時段
    slots.forEach(slot => {
      const staffName = slot.staff || '未指定';
      const slotTime = slot.time || '--:--';
      const slotDesc = slot.description || '無描述';
      
      // 使用更精確的組合 Key，避免不同描述但同老師同時間的項目被混淆
      const key = `${staffName}|${slotTime}|${slotDesc}`;
      
      if (!groups[key]) {
        groups[key] = {
          key,
          staff: staffName,
          time: slotTime,
          description: slotDesc,
          notice: slot.notice,
          penalty_rule: slot.penalty_rule,
          dates: [], // 準備存放該群組下的所有日期
          maxId: 0, // 紀錄該群組中最新的 ID，用於排序
        };
      }
      
      // 檢查日期或 ID 是否重複存入 (防止資料重複抓取產生的 Key 衝突)
      const isExist = groups[key].dates.some((d: any) => d.date === slot.date || d.id === slot.id);
      if (!isExist) {
        groups[key].dates.push({ id: slot.id, date: slot.date });
        // 解析 slot.id，若是數字則取大者，若是字串(如 SL-12345)則嘗試解析數字或單純使用字串比對
        // 在 Postgres 中 SERIAL PRIMARY KEY 通常會回傳數字或字串型的數字
        const numericId = parseInt(slot.id, 10) || 0;
        if (numericId > groups[key].maxId) {
          groups[key].maxId = numericId;
        }
      }
    });
    
    // 依照日期先後順序排序各組內的班次
    const groupsArray = Object.values(groups);
    groupsArray.forEach(group => {
      group.dates.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });
    
    // 降冪排序，最新開設（id最大）的排在最前面
    groupsArray.sort((a, b) => b.maxId - a.maxId);
    
    return groupsArray;
  }, [slots]);

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(groupedSlotsArray.length / ITEMS_PER_PAGE) || 1;
  const currentGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return groupedSlotsArray.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [groupedSlotsArray, currentPage]);

  const handleRemoveSlot = async (id: number) => {
    if(confirm("確定要取消此日時段嗎？")) {
      await removeSingleSlot(id);
      loadSlots();
    }
  };

  const handleRemoveGroup = async (e: React.MouseEvent, groupKey: string, dates: any[]) => {
    e.stopPropagation();
    if(confirm(`確定要刪除這 ${dates.length} 個班次嗎？這將會永久移除這些尚未被預約的時段！`)) {
      setIsSubmitting(true);
      try {
        const ids = dates.map(d => d.id);
        await removeBatchSlots(ids);
        await loadSlots();
        alert('✅ 已成功刪除整個預約時段活動！');
      } catch (err) {
        alert('❌ 刪除失敗，請稍後再試。');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditSlotClick = (slotId: number) => {
    const slot = slots.find(s => s.id === slotId);
    if (slot) {
      setEditFormData({
        date: slot.date,
        time: slot.time,
        staff: slot.staff,
        location: slot.location,
        description: slot.description,
        price: slot.price,
        serviceId: slot.bound_service_id || slot.serviceId
      });
      setEditingSlotId(slotId);
    }
  };

  const handleEditSlotSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSlotId) return;
    setIsSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await updateSlot(editingSlotId, fd);
      if (res.success) {
        setEditingSlotId(null);
        await loadSlots();
        alert('✅ 時段已成功更新！');
      }
    } catch(err) {
      alert("❌ 更新失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanEmergency = async () => {
    if (!emergencyStart || !emergencyEnd || !emergencyStaff) return;
    setIsScanning(true);
    const affected = await analyzeAffectedAppointments(emergencyStaff, emergencyStart, emergencyEnd);
    setAffectedList(affected);
    setIsScanning(false);
  };

  const handleExecuteEmergency = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirm("確定要執行緊急疏散與自動改期嗎？系統將透過 LINE 通知受影響信眾。")) {
       setIsSubmitting(true);
       const formData = new FormData(e.currentTarget);
       await executeEmergencyReschedule(formData);
       setShowEmergencyModal(false);
       setAffectedList(null);
       loadSlots();
       setIsSubmitting(false);
    }
  };

  const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

  if (isLoading && slots.length === 0) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
         <p className="text-xs font-black text-slate-400 uppercase tracking-widest">正在同步全域班次數據...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight italic">預約時段配置</h1>
          <p className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase mt-1">Smart Scheduling Hub</p>
        </div>

        <div className="flex items-center gap-3">
           <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${enableSmartScheduling ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              <span className="text-[10px] font-black uppercase tracking-widest">{enableSmartScheduling ? '智能調度啟動' : '智能調度關閉'}</span>
              <button 
                onClick={() => setEnableSmartScheduling(!enableSmartScheduling)}
                className={`w-10 h-5 rounded-full relative transition-all ${enableSmartScheduling ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                 <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${enableSmartScheduling ? 'right-0.5' : 'left-0.5'}`}></div>
              </button>
           </div>
           
           <button 
             onClick={() => setShowEmergencyModal(true)}
             className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-black text-xs tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 flex items-center gap-2 uppercase"
           >
             ⚠️ 緊急調度
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Batch Generator */}
         <div className="lg:col-span-5 bg-white rounded-[40px] border-2 border-slate-50 shadow-sm overflow-hidden flex flex-col h-fit">
            <div className="p-10 border-b border-slate-50 bg-slate-50/20">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-4 italic">
                 <div className="w-12 h-12 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center text-2xl shadow-xl">⚡</div>
                 批次排班生成器
               </h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 ml-16">High-Performance Batch Engine</p>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-10 space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">年份</label>
                     <input 
                        type="number" 
                        value={year} 
                        onChange={(e)=>setYear(e.target.value)} 
                        className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-indigo-600 outline-none transition-all shadow-sm"
                        min="2024"
                        max="2100"
                        required
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">月份區間</label>
                     <div className="flex items-center gap-3">
                        <select value={startMonth} onChange={(e)=>setStartMonth(Number(e.target.value))} className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm font-black focus:border-indigo-600 outline-none shadow-sm">
                           {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                        </select>
                        <span className="text-slate-300 font-black">→</span>
                        <select value={endMonth} onChange={(e)=>setEndMonth(Number(e.target.value))} className="flex-1 bg-white border-2 border-slate-100 rounded-2xl px-4 py-4 text-sm font-black focus:border-indigo-600 outline-none shadow-sm">
                           {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                        </select>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">週期規律 (多選週幾發布)</label>
                  <div className="grid grid-cols-7 gap-2">
                     {DAY_NAMES.map((name, idx) => {
                        const isSelected = weekdays.includes(idx);
                        return (
                          <button
                             type="button"
                             key={idx}
                             onClick={() => toggleWeekday(idx)}
                             className={`aspect-square rounded-2xl font-black text-xs transition-all border-2 ${isSelected ? 'bg-slate-900 text-amber-500 border-slate-900 shadow-xl scale-110 z-10' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-300 shadow-sm'}`}
                          >
                             {name}
                          </button>
                        )
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">開始時段</label>
                     <input type="time" name="time" defaultValue="14:00" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-indigo-600 outline-none shadow-sm" required />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">服務老師</label>
                     <select name="staff" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-indigo-600 outline-none shadow-sm">
                        {serviceStaffs.map(staff => (
                          <option key={staff.id} value={staff.name}>{staff.name} 老師</option>
                        ))}
                        {serviceStaffs.length === 0 && <option value="未指定">未指定</option>}
                     </select>
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">服務項目</label>
                  <select 
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-indigo-600 outline-none shadow-sm transition-all"
                    required
                  >
                     <option value="">請選擇欲排班的服務項目</option>
                     {availableServices.map(s => (
                       <option key={s.id} value={s.id}>{s.name}</option>
                     ))}
                  </select>
                  <input type="hidden" name="bound_service_id" value={selectedServiceId} />
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">服務細節與注意事項</label>
                  <textarea name="description" rows={2} className="w-full bg-white border-2 border-slate-100 rounded-3xl px-6 py-5 text-sm font-black focus:border-indigo-600 outline-none resize-none transition-all shadow-sm" placeholder="請輸入本時段特定的注意事項（例如：請提早10分鐘報到）..." required></textarea>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">服務地點</label>
                  <input type="text" name="location" className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-black focus:border-indigo-600 outline-none transition-all shadow-sm" placeholder="請輸入服務地點（例如：大殿左側、濟世辦事處）" required />
               </div>

               <button 
                 type="submit" 
                 disabled={generatedDates.length === 0 || isSubmitting}
                 className="w-full bg-slate-900 text-amber-500 py-6 rounded-[30px] font-black text-xs tracking-[0.4em] shadow-2xl transition-all hover:bg-indigo-600 hover:text-white active:scale-95 disabled:opacity-20 uppercase border-4 border-slate-900"
               >
                 {isSubmitting ? "正在核定排班並同步..." : `立即發布 ${generatedDates.length} 個班次 ➔`}
               </button>
            </form>
         </div>

         {/* Deployed Clusters */}
         <div className="lg:col-span-7 space-y-8">
            <div className="flex items-center justify-between px-6">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">在線排班清單 ({groupedSlotsArray.length} GROUPS)</h3>
            </div>

            <div className="space-y-6">
              {groupedSlotsArray.length === 0 && !isLoading && (
                <div className="py-24 text-center bg-white border-4 border-dashed border-slate-100 rounded-[50px] flex flex-col items-center gap-4">
                   <div className="text-6xl grayscale opacity-20">📭</div>
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">目前系統中暫無已發布的排班資料</p>
                </div>
              )}
              
              {currentGroups.map((group: any) => {
                 const key = group.key;
                 const isExpanded = expandedGroup === key;
                 return (
                    <div key={key} className={`bg-white rounded-[50px] border-2 transition-all duration-500 overflow-hidden ${isExpanded ? 'border-indigo-600 shadow-2xl' : 'border-slate-50 shadow-sm hover:shadow-xl hover:border-slate-200'}`}>
                       <div 
                         onClick={() => setExpandedGroup(isExpanded ? null : key)}
                         className="flex items-center justify-between p-10 cursor-pointer group/header"
                       >
                          <div className="flex items-center gap-8">
                             <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center text-3xl font-black transition-all duration-500 ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 group-hover/header:bg-slate-900 group-hover/header:text-amber-500'}`}>
                                {group.staff ? group.staff[0] : '?'}
                             </div>
                             <div className="space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                  <div className="flex items-center gap-4">
                                    <h4 className="text-xl font-black text-slate-900 italic tracking-tighter">{group.staff} 老師</h4>
                                    <span className="text-[10px] font-black text-white bg-slate-900 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                                      {group.dates.length} 班次已發布
                                    </span>
                                  </div>
                                  <button 
                                    onClick={(e) => handleRemoveGroup(e, key, group.dates)}
                                    className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest transition-all shadow-sm flex items-center gap-2 uppercase"
                                    title="一鍵刪除整個預約時段"
                                  >
                                    ✕ 刪除整個時段活動
                                  </button>
                                </div>
                                <p className={`text-xs font-black uppercase tracking-[0.2em] transition-colors ${isExpanded ? 'text-indigo-600' : 'text-slate-400'}`}>
                                   🕓 定期時段: {group.time}
                                </p>
                             </div>
                          </div>
                          <div className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl transition-all duration-500 ${isExpanded ? 'rotate-180 bg-indigo-600 text-white border-indigo-600 shadow-xl' : 'border-slate-100 text-slate-300 hover:border-indigo-300'}`}>
                             {isExpanded ? '↑' : '↓'}
                          </div>
                       </div>
                       
                       {isExpanded && (
                         <div className="bg-slate-50/30 p-12 border-t-2 border-slate-50 space-y-12 animate-in slide-in-from-top-10 duration-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                               <div className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-sm space-y-5">
                                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block border-b-2 border-indigo-50 pb-3">服務細節說明 (SERVICE INFO)</span>
                                  <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{group.description}</p>
                               </div>
                               <div className="bg-rose-50/50 p-8 rounded-[40px] border-2 border-rose-100 space-y-5 shadow-sm">
                                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block border-b-2 border-rose-100 pb-3">預約取消規則 (POLICY)</span>
                                  <p className="text-sm font-bold text-rose-700 leading-relaxed italic">{group.penalty_rule || "遵循全域服務預約取消政策。"}</p>
                               </div>
                            </div>
                            
                            <div className="space-y-8">
                               <div className="flex items-center gap-8">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">日期節點明細 ({group.dates.length} 個班次)</h5>
                                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                               </div>
                               {/* 🚀 優化日期列表，使用 Grid 佈局確保完整顯示 */}
                               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
                                  {group.dates.map((dObj: any) => (
                                     <div key={dObj.id} className="bg-white border-2 border-slate-100 px-6 py-5 rounded-2xl text-xs font-black text-slate-800 flex items-center justify-between shadow-sm hover:border-indigo-600 hover:shadow-2xl transition-all group/date">
                                        <div className="flex items-center gap-4">
                                           <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full group-hover/date:animate-ping"></span>
                                           <span className="tracking-widest font-mono">{dObj.date}</span>
                                        </div>
                                        <div className="flex gap-2">
                                           <button onClick={() => handleEditSlotClick(dObj.id)} className="w-10 h-10 rounded-2xl text-slate-400 hover:bg-amber-500 hover:text-white transition-all shadow-inner flex items-center justify-center font-bold text-lg" title="編輯時段">✏️</button>
                                           <button onClick={() => handleRemoveSlot(dObj.id)} className="w-10 h-10 rounded-2xl text-slate-200 hover:bg-rose-500 hover:text-white transition-all shadow-inner flex items-center justify-center font-bold text-lg" title="刪除時段">✕</button>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                 )
              })}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 rounded-full bg-white border-2 border-slate-100 font-bold text-xs text-slate-600 disabled:opacity-50 hover:border-indigo-600 transition-all shadow-sm"
                  >
                    上一頁
                  </button>
                  <span className="text-xs font-black text-slate-400 tracking-widest">
                    PAGE {currentPage} OF {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 rounded-full bg-white border-2 border-slate-100 font-bold text-xs text-slate-600 disabled:opacity-50 hover:border-indigo-600 transition-all shadow-sm"
                  >
                    下一頁
                  </button>
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Edit Slot Modal */}
      {editingSlotId !== null && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-lg">編輯單一時段</h3>
                 <button onClick={() => setEditingSlotId(null)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">×</button>
              </div>
              <form onSubmit={handleEditSlotSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">日期</label>
                       <input type="date" name="date" defaultValue={editFormData.date} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">時間</label>
                       <input type="time" name="time" defaultValue={editFormData.time} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">服務老師</label>
                       <select name="staff" defaultValue={editFormData.staff} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none">
                          {serviceStaffs.map(staff => <option key={staff.id} value={staff.name}>{staff.name} 老師</option>)}
                          <option value="未指定">未指定</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-black text-slate-500 uppercase tracking-widest">功德金</label>
                       <input type="number" name="price" defaultValue={editFormData.price} min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">地點</label>
                    <input type="text" name="location" defaultValue={editFormData.location} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">服務項目</label>
                    <select name="serviceId" defaultValue={editFormData.serviceId} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none">
                       {availableServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">說明 / 注意事項</label>
                    <textarea name="description" defaultValue={editFormData.description} rows={3} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-indigo-600 outline-none resize-none"></textarea>
                 </div>
                 <div className="pt-4 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={() => setEditingSlotId(null)} className="flex-1 py-3 bg-white text-slate-600 font-black rounded-xl border border-slate-200 hover:bg-slate-50">取消</button>
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 disabled:opacity-50 tracking-widest uppercase">
                       {isSubmitting ? "更新中..." : "儲存更新"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl p-4 animate-in fade-in duration-500">
           <div className="w-full max-w-4xl bg-white rounded-[60px] shadow-3xl overflow-hidden border-4 border-slate-900 flex flex-col max-h-[90vh]">
              <div className="p-12 border-b-4 border-slate-900 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-rose-600 text-white rounded-[30px] flex items-center justify-center text-4xl shadow-2xl">⚠️</div>
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">突發緊急調度中心</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Crisis Management & Orchestration</p>
                    </div>
                 </div>
                 <button onClick={() => setShowEmergencyModal(false)} className="w-16 h-16 flex items-center justify-center rounded-[20px] hover:bg-rose-600 hover:text-white text-rose-500 transition-all border-2 border-rose-100 text-2xl font-black shadow-sm">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 space-y-12">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Step 1 */}
                    <div className="space-y-10">
                       <div className="flex items-center gap-5 border-b-2 border-slate-50 pb-5">
                          <span className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center text-xl font-black shadow-lg italic">01</span>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">定義受衝擊區間</h4>
                       </div>
                       <div className="bg-slate-50/50 p-10 rounded-[50px] border-2 border-slate-100 space-y-10 shadow-inner">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">受衝擊服務老師</label>
                             <select value={emergencyStaff} onChange={e=>setEmergencyStaff(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm font-black focus:border-rose-600 outline-none shadow-sm">
                                {serviceStaffs.map(staff => <option key={staff.id} value={staff.name}>{staff.name} 老師</option>)}
                             </select>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">起始日</label>
                                <input type="date" value={emergencyStart} onChange={e=>setEmergencyStart(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-5 text-sm font-black focus:border-rose-600 outline-none shadow-sm" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">結束日</label>
                                <input type="date" value={emergencyEnd} onChange={e=>setEmergencyEnd(e.target.value)} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-5 text-sm font-black focus:border-rose-600 outline-none shadow-sm" />
                             </div>
                          </div>
                          <button onClick={handleScanEmergency} disabled={isScanning} className="w-full bg-slate-900 text-amber-500 font-black py-6 rounded-3xl shadow-2xl hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-5 text-xs tracking-[0.2em] uppercase disabled:opacity-30 border-2 border-slate-900">
                             {isScanning ? "正在分析數據衝擊..." : "🔍 啟動系統衝擊分析"}
                          </button>
                       </div>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-10">
                       <div className="flex items-center gap-5 border-b-2 border-slate-50 pb-5">
                          <span className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-500 flex items-center justify-center text-xl font-black shadow-lg italic">02</span>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">自動化推播與通知</h4>
                       </div>
                       
                       {affectedList !== null ? (
                         <form onSubmit={handleExecuteEmergency} className="bg-rose-50/30 p-10 rounded-[50px] border-2 border-rose-200 space-y-10 animate-in slide-in-from-right-12 duration-700">
                            <div className="space-y-8">
                               <div className="flex items-center justify-between border-b-2 border-rose-100 pb-4">
                                  <span className="text-rose-600 text-[10px] font-black uppercase tracking-widest">受影響預約席次清冊</span>
                                  <span className="bg-rose-600 text-white px-5 py-2 rounded-full text-[10px] font-black shadow-xl">{affectedList.length} 席次</span>
                               </div>
                               <div className="bg-white/80 backdrop-blur-md p-8 rounded-[40px] border-2 border-rose-100 h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                  <div className="space-y-4">
                                     {affectedList.map((app:any, i) => (
                                       <div key={i} className="flex items-center justify-between text-xs border-b border-rose-50 pb-4 last:border-0 hover:bg-rose-100/30 p-3 rounded-2xl transition-all">
                                          <span className="font-black text-slate-900 italic underline decoration-rose-300 decoration-2 underline-offset-4">{app.guest_name}</span>
                                          <span className="text-[10px] font-black text-rose-500 font-mono tracking-tighter bg-rose-50 px-3 py-1 rounded-full border border-rose-100">📅 {app.date} {app.time}</span>
                                       </div>
                                     ))}
                                     {affectedList.length === 0 && <p className="text-center py-12 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">目前無受衝擊之席次數據</p>}
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1">自動通知範本 (LINE Push)</label>
                               <input type="text" name="targetNewTime" placeholder="例如：老師因故請假，建議改期至..." required className="w-full bg-white border-2 border-rose-200 rounded-3xl px-8 py-5 text-sm font-black text-rose-700 outline-none focus:border-rose-500 transition-all shadow-sm" />
                            </div>
                            <button type="submit" disabled={isSubmitting || affectedList.length === 0} className="w-full bg-rose-600 text-white font-black py-6 rounded-[30px] shadow-2xl hover:bg-slate-900 transition-all tracking-[0.3em] uppercase text-xs border-4 border-rose-600 active:scale-95">
                               {isSubmitting ? "正在處理全球通知數據..." : "⚔️ 執行全自動改期通知推播"}
                            </button>
                         </form>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-center p-20 bg-slate-50/50 rounded-[60px] border-4 border-dashed border-slate-100 opacity-40">
                            <div className="text-8xl mb-8 grayscale">🕵️</div>
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 leading-relaxed">請先執行左側衝擊數據掃描<br/>以利評估受影響權益清冊</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <footer className="pt-24 pb-12 text-center space-y-8 opacity-25">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[1.5em]">PIVOT Intelligent Scheduling Engine v3.0_LATEST</p>
      </footer>
    </div>
  );
}
