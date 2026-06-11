// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  fetchFreeApplications, 
  fetchSalesPerformance,
  fetchVisitationRecords,
  addVisitationRecord,
  fetchSalesTools,
  fetchEContracts,
  submitEContract,
  fetchDistributorCapacity,
  fetchCommissionHistory,
  fetchSalesProfile,
  fetchRentPlans
} from "@/app/actions";
import { TAIWAN_CITIES } from "@/app/shared-types";
import TempleApplicationForm from "@/app/components/TempleApplicationForm";

// Icons (Simulated)
const IconHome = () => <span>🏠</span>;
const IconBuilding = () => <span>🏛️</span>;
const IconCalendar = () => <span>📅</span>;
const IconChart = () => <span>📈</span>;
const IconTools = () => <span>🛠️</span>;
const IconPlus = () => <span>➕</span>;
const IconArrowRight = () => <span>→</span>;
const IconPlay = () => <span>▶️</span>;
const IconFile = () => <span>📄</span>;
const IconSignature = () => <span>✍️</span>;
const IconSearch = () => <span>🔍</span>;
const IconFilter = () => <span>📂</span>;

type TabType = 'overview' | 'temples' | 'calendar' | 'commission' | 'tools' | 'profile';

import { useParams } from "next/navigation";

export default function DistSalesPage() {
  const params = useParams();
  const distId = params.distId as string;
  const salesId = params.salesId as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [salesName] = useState("王業務");
  const [performance, setPerformance] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [activeToolPreview, setActiveToolPreview] = useState<any>(null);
  const [tools, setTools] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [capacity, setCapacity] = useState<any>(null);
  const [commission, setCommission] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [rentPlans, setRentPlans] = useState<any[]>([]);

  // Search & Filter States
  const [templeSearch, setTempleSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  // Financial Filtering
  const [commYear, setCommYear] = useState("2026");
  const [commMonth, setCommMonth] = useState("05");

  // Calendar Dynamic States
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(5); // 1-indexed
  const [selectedDay, setSelectedDay] = useState<number | null>(5); // Default to highlighted day

  // Form States
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);


  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({
    templeName: "",
    date: new Date().toISOString().split('T')[0],
    visitIndex: 1,
    notes: "",
    status: 'Planned' as any,
    importance: 'Medium' as any
  });

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [contractTemple, setContractTemple] = useState("");

  const [selectedCalendarItem, setSelectedCalendarItem] = useState<any>(null);

  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    visits.forEach(v => {
       events.push({ ...v, eventType: 'visit', date: v.date || v.timestamp?.split('T')[0] });
    });
    applications.filter(t => t.status === 'Active').forEach(t => {
       events.push({
          id: `activation-${t.id}`,
          eventType: 'activation',
          date: t.timestamp?.split('T')[0],
          templeName: t.templeName,
          salesName: salesName,
          notes: `宮廟帳戶已正式開通並完成部署。`,
          importance: 'High',
          timestamp: t.timestamp
       });
    });
    return events;
  }, [visits, applications]);

  const loadData = async () => {
    const [perf, apps, visitData, toolData, conData, capData, profData, plans] = await Promise.all([
      fetchSalesPerformance(salesName),
      fetchFreeApplications(),
      fetchVisitationRecords(salesName),
      fetchSalesTools(),
      fetchEContracts(salesName),
      fetchDistributorCapacity(),
      fetchSalesProfile(salesName),
      fetchRentPlans()
    ]);
    setPerformance(perf);
    setApplications(apps.filter(a => a.submittedBy === salesName).sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    setVisits(visitData);
    setTools(toolData);
    setContracts(conData);
    setCapacity(capData);
    setProfile(profData);
    setRentPlans(plans);
  };

  const loadCommission = async () => {
    const commData = await fetchCommissionHistory(salesName, commYear, commMonth);
    setCommission(commData);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCommission();
  }, [commYear, commMonth]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const date = new Date(calYear, calMonth - 1, 1);
    const days = [];
    const firstDay = date.getDay(); 
    const totalDays = new Date(calYear, calMonth, 0).getDate();

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);
    
    return days;
  }, [calYear, calMonth]);

  const getDayEvents = (day: number) => {
    const dateStr = `${calYear}-${calMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return calendarEvents.filter(v => v.date === dateStr);
  };

  const getDayColor = (day: number) => {
    const events = getDayEvents(day);
    if (events.length === 0) return '';
    const hasHigh = events.some(e => e.importance === 'High');
    const hasMed = events.some(e => e.importance === 'Medium');
    if (hasHigh) return 'bg-rose-500 text-white shadow-rose-200';
    if (hasMed) return 'bg-amber-500 text-white shadow-amber-200';
    return 'bg-emerald-500 text-white shadow-emerald-200';
  };

  const filteredTemples = useMemo(() => {
    return applications.filter(app => {
      const matchSearch = app.templeName.includes(templeSearch) || 
                          app.chairpersonName?.includes(templeSearch) || 
                          app.contactPhone?.includes(templeSearch);
      const matchLocation = !locationFilter || app.city === locationFilter;
      return matchSearch && matchLocation;
    });
  }, [applications, templeSearch, locationFilter]);



  const handleVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVisitationRecord({ ...visitForm, salesName });
    setIsVisitModalOpen(false);
    loadData();
  };

  const handleSignContract = async () => {
    await submitEContract({ templeName: contractTemple, salesName, templateName: "標準服務合約 V4 (Official)" });
    setIsContractModalOpen(false);
    loadData();
  };

  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Info */}
      <section className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-200">👤</div>
            <div>
               <h3 className="font-black text-slate-900">{profile?.name}</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">直屬：{profile?.parentDistributor}</p>
            </div>
         </div>
         <button onClick={() => setActiveTab('profile')} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"><IconArrowRight /></button>
      </section>

      {/* Performance Metrics */}
      <section className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">開發總量</p>
          <p className="text-4xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{performance?.total || 0}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] font-bold text-emerald-600">已核准 {performance?.approved || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">本月業績 ({commMonth}月)</p>
          <p className="text-4xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">${(commission?.totalEarned || 0).toLocaleString()}</p>
          <p className="text-[10px] font-bold text-emerald-600 mt-2">餘額：${(commission?.balance || 0).toLocaleString()}</p>
        </div>
      </section>

      {/* C-6: Synced Distributor Quota */}
      <section className="bg-emerald-950 text-white p-8 rounded-[40px] shadow-xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
         <div className="relative z-10 space-y-5">
            <div className="flex justify-between items-center">
               <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">經銷商帳號配額 (同步中)</p>
                  <h4 className="text-sm font-black mt-1">{capacity?.plan}</h4>
               </div>
               <div className="text-right">
                  <p className="text-2xl font-black">{capacity?.used}<span className="text-xs text-emerald-500/60 font-bold ml-1">/ {capacity?.total}</span></p>
               </div>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" 
                 style={{ width: `${(capacity?.used / capacity?.total) * 100}%` }}
               ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-emerald-500/60 uppercase">
               <span>已使用 {Math.round(((capacity?.used || 0) / (capacity?.total || 1)) * 100)}%</span>
               <span>剩餘 {(capacity?.total || 100) - (capacity?.used || 0)} 帳戶</span>
            </div>
         </div>
      </section>

      {/* Main Actions */}
      <section className="grid grid-cols-2 gap-4">
         <button 
           onClick={() => setIsAppModalOpen(true)}
           className="bg-slate-900 text-white p-6 rounded-[32px] shadow-xl flex flex-col items-center gap-4 active:scale-95 hover:bg-emerald-600 transition-all duration-500"
         >
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-2xl"><IconPlus /></div>
            <span className="text-sm font-black">宮廟開戶申請</span>
         </button>
         <button 
           onClick={() => {
             setVisitForm({...visitForm, date: `${calYear}-${calMonth.toString().padStart(2, '0')}-01`});
             setIsVisitModalOpen(true);
           }}
           className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center gap-4 active:scale-95 hover:border-emerald-200 transition-all"
         >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-sm"><IconCalendar /></div>
            <span className="text-sm font-black text-slate-700">新增拜訪紀錄</span>
         </button>
      </section>
    </div>
  );

  const renderTemples = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
       <div className="bg-white p-6 rounded-b-[40px] shadow-sm border-b border-slate-100 -mx-6 -mt-8 space-y-4 pt-10">
          <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center gap-3">
             <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
             管理中宮廟
          </h3>
          <div className="flex gap-3 px-2">
             <div className="flex-1 bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                <span className="text-slate-400"><IconSearch /></span>
                <input 
                  type="text" 
                  placeholder="搜尋宮廟、主委、電話..." 
                  value={templeSearch}
                  onChange={e => setTempleSearch(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-sm font-bold placeholder:text-slate-300"
                />
             </div>
             <select 
               value={locationFilter}
               onChange={e => setLocationFilter(e.target.value)}
               className="bg-slate-50 rounded-2xl px-4 py-3 text-sm font-bold outline-none border-none cursor-pointer hover:bg-emerald-50 transition-colors"
             >
                <option value="">全台地域</option>
                {TAIWAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
       </div>
       
       <div className="space-y-4">
          {filteredTemples.map(app => (
            <div key={app.id} className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-5 space-y-4 hover:shadow-md hover:border-emerald-100 transition-all">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl shadow-lg">🏛️</div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900">{app.templeName}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase ${app.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'}`}>
                             {app.status === 'Active' ? '已開通營運' : '待經銷商審核'}
                          </span>
                       </div>
                       <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.city}{app.district} | {app.chairpersonName}</p>
                          {app.currentUsers !== undefined && (
                             <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[8px] font-black border border-emerald-100">
                                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span>{app.currentUsers} 位使用者 (中心同步)</span>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">方案：<span className="text-emerald-600">${app.monthlyRent.toLocaleString()}</span>/月</p>
                 <button 
                   onClick={() => {
                     setVisitForm({ ...visitForm, templeName: app.templeName, date: `${calYear}-${calMonth.toString().padStart(2, '0')}-01` });
                     setIsVisitModalOpen(true);
                   }}
                   className="text-emerald-600 text-xs font-black hover:translate-x-1 transition-transform"
                 >
                   新增開發紀錄 →
                 </button>
              </div>
            </div>
          ))}
       </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
       <div className="bg-white rounded-[40px] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 px-2">
             <div className="flex gap-2">
                <select 
                  value={calYear} 
                  onChange={e => {setCalYear(parseInt(e.target.value)); setSelectedDay(null);}} 
                  className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-black outline-none border-none hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                   <option value={2026}>2026年</option>
                   <option value={2027}>2027年</option>
                </select>
                <select 
                  value={calMonth} 
                  onChange={e => {setCalMonth(parseInt(e.target.value)); setSelectedDay(null);}} 
                  className="bg-slate-50 rounded-xl px-4 py-2.5 text-sm font-black outline-none border-none hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                   {Array.from({length: 12}).map((_, i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
                </select>
             </div>
             <button 
               onClick={() => {
                 const d = selectedDay || 1;
                 setVisitForm({...visitForm, date: `${calYear}-${calMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`});
                 setIsVisitModalOpen(true);
               }}
               className="bg-emerald-600 text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-emerald-100"
             >
               + 新增計畫
             </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-300 mb-6 uppercase tracking-[0.3em]">
             {['日','一','二','三','四','五','六'].map(d => <span key={d}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-3 text-center">
             {calendarDays.map((day, i) => {
               const isSelected = selectedDay === day;
               const colorClass = day ? getDayColor(day) : '';
               return (
                 <div 
                   key={i} 
                   onClick={() => day && setSelectedDay(day)}
                   className={`h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all relative ${
                     day === null ? 'opacity-0' : 
                     isSelected ? 'bg-slate-900 text-white shadow-xl scale-110 z-10' : 
                     colorClass ? `${colorClass} shadow-md` : 'text-slate-700 bg-slate-50 hover:bg-emerald-50 cursor-pointer'
                   }`}
                 >
                   {day}
                   {colorClass && !isSelected && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white bg-inherit"></div>
                   )}
                 </div>
               );
             })}
          </div>
          
          <div className="mt-8 flex gap-4 px-2">
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-black text-slate-400">高度重要</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[10px] font-black text-slate-400">中度重要</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] font-black text-slate-400">一般計畫</span>
             </div>
          </div>
       </div>

       <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 px-2 flex items-center justify-between">
             <span>{selectedDay ? `${calMonth}月${selectedDay}日 預約紀錄` : `${calMonth}月 紀錄清單`}</span>
             <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{selectedDay ? 'Selected Day' : 'Monthly View'}</span>
          </h3>
          
          {(() => {
             const filtered = calendarEvents.filter(v => {
               const monthMatch = v.date?.startsWith(`${calYear}-${calMonth.toString().padStart(2, '0')}`);
               if (!selectedDay) return monthMatch;
               return monthMatch && v.date?.endsWith(`-${selectedDay.toString().padStart(2, '0')}`);
             });

             if (filtered.length === 0) return (
                <div className="bg-white py-16 rounded-[40px] border border-dashed border-slate-200 text-center space-y-3">
                   <p className="text-slate-400 font-bold">此日期暫無排定行程</p>
                   <button 
                     onClick={() => setIsVisitModalOpen(true)}
                     className="text-xs font-black text-emerald-600 underline"
                   >
                     點此新增預約
                   </button>
                </div>
             );

             return filtered.map(v => (
               <div key={v.id} onClick={() => setSelectedCalendarItem(v)} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex gap-5 animate-in slide-in-from-bottom-2 duration-300 hover:border-emerald-200 transition-colors cursor-pointer group">
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                    v.eventType === 'activation' ? 'bg-amber-50 text-amber-600' :
                    v.importance === 'High' ? 'bg-rose-50 text-rose-600' : 
                    v.importance === 'Medium' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-600'
                  }`}>
                     {v.eventType === 'activation' ? <span className="text-2xl">🎉</span> : (
                       <>
                         <span className="text-[8px] font-black uppercase tracking-widest">NO.{v.visitIndex || 1}</span>
                         <span className="text-lg font-black">{v.date?.split('-')[2]}</span>
                       </>
                     )}
                  </div>
                  <div className="flex-1 space-y-1">
                     <div className="flex justify-between items-start">
                        <h4 className={`font-black tracking-tighter transition-colors ${v.eventType === 'activation' ? 'text-amber-600 group-hover:text-amber-700' : 'text-slate-900 group-hover:text-emerald-600'}`}>{v.templeName}</h4>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${
                          v.eventType === 'activation' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          v.status === 'Completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>{v.eventType === 'activation' ? '宮廟開通' : v.status}</span>
                     </div>
                     <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">{v.notes}</p>
                  </div>
               </div>
             ));
          })()}
       </div>
    </div>
  );

  const renderCommission = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
       {/* 階梯式分潤協議 */}
       {commission?.rules && (
         <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-4">
            <h3 className="text-sm font-black text-slate-900 px-2 flex items-center gap-2">
               <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
               專屬分潤協議
            </h3>
            <div className="grid grid-cols-4 gap-4 px-2">
               <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase">開辦費分潤</p>
                  <p className="text-2xl font-black text-emerald-600">{commission.rules.setupFeePercent}%</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase">第一年月租</p>
                  <p className="text-2xl font-black text-slate-900">{commission.rules.rentYear1Percent}%</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1 opacity-80">
                  <p className="text-[10px] font-black text-slate-500 uppercase">第二年月租</p>
                  <p className="text-2xl font-black text-slate-900">{commission.rules.rentYear2Percent}%</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center space-y-1 opacity-60">
                  <p className="text-[10px] font-black text-slate-500 uppercase">第三年後月租</p>
                  <p className="text-2xl font-black text-slate-900">{commission.rules.rentYear3PlusPercent}%</p>
               </div>
            </div>
         </div>
       )}

       {/* Filter Header */}
       <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex gap-4">
          <div className="flex-1 space-y-1">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">查詢年份</p>
             <select value={commYear} onChange={e => setCommYear(e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-black outline-none hover:bg-emerald-50 transition-colors">
                <option value="2026">2026年</option>
                <option value="2025">2025年</option>
             </select>
          </div>
          <div className="flex-1 space-y-1">
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">查詢月份</p>
             <select value={commMonth} onChange={e => setCommMonth(e.target.value)} className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-black outline-none hover:bg-emerald-50 transition-colors">
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1}月</option>
                ))}
             </select>
          </div>
       </div>

       <div className="bg-emerald-950 text-white p-8 rounded-[48px] shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex justify-between items-start relative z-10">
             <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">{commYear}/{commMonth} 收益</p>
                <h2 className="text-5xl font-black tracking-tight">${commission?.totalEarned.toLocaleString()}</h2>
             </div>
             <button className="bg-emerald-500 text-white px-6 py-4 rounded-[24px] text-xs font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">申請提領</button>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5 relative z-10">
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">總可用餘額</p>
                <p className="text-2xl font-black text-emerald-50">${commission?.balance?.toLocaleString() || '0'}</p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">已提領總額</p>
                <p className="text-2xl font-black text-emerald-500">${commission?.totalWithdrawn?.toLocaleString() || '0'}</p>
             </div>
          </div>
       </div>

       <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-900 px-2 flex items-center gap-2">
             <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
             歷史收入明細
          </h3>
          <div className="space-y-4">
             {commission?.records.length === 0 ? (
               <div className="py-20 text-center text-slate-400 font-bold bg-white rounded-[40px] border border-slate-100">該月份尚無收益紀錄</div>
             ) : commission?.records.map((rec: any) => (
                <div key={rec.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300 hover:border-emerald-100">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl">🏛️</div>
                      <div>
                         <h4 className="font-black text-slate-900">{rec.templeName}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rec.date} | {rec.type}</p>
                      </div>
                   </div>
                   <span className="text-lg font-black text-emerald-600">+${rec.amount.toLocaleString()}</span>
                </div>
             ))}
          </div>
       </div>
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
             {tools.filter(t => ['video', 'photo'].includes(t.type)).map(tool => (
                <div key={tool.id} onClick={() => setActiveToolPreview(tool)} className="group relative bg-white rounded-[45px] shadow-2xl border border-white overflow-hidden aspect-[16/10] hover:shadow-blue-200 transition-all duration-700 cursor-pointer">
                   <img src={tool.thumbnail || tool.url || 'https://images.unsplash.com/photo-1528642463367-12544dd1479d?q=80&w=800&auto=format&fit=crop'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2s]" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-10 flex flex-col justify-end">
                      <p className="text-[9px] font-black text-blue-400 uppercase mb-3 tracking-[0.3em] bg-blue-500/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">{tool.category}</p>
                      <h5 className="text-2xl font-black text-white leading-tight italic tracking-tighter">{tool.title}</h5>
                      <div className="mt-8 flex items-center gap-4">
                         <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl shadow-2xl shadow-blue-500/40 group-hover:scale-110 group-hover:bg-blue-500 transition-all duration-500">▶️</div>
                         <span className="text-[10px] font-black text-white/60 uppercase tracking-widest group-hover:text-white transition-colors">點擊檢閱資源</span>
                      </div>
                   </div>
                </div>
             ))}
          </div>
       </section>

       {/* Document & Assets Section */}
       <section className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">業務開發與法律文件 (官方規範)</h4>

          <div className="grid grid-cols-2 gap-4">
             {tools.filter(t => ['document', 'contract'].includes(t.type)).map(doc => (
                <div key={doc.id} onClick={() => setActiveToolPreview(doc)} className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] border border-white shadow-xl flex flex-col items-center text-center space-y-4 hover:border-blue-500 transition-all duration-500 group cursor-pointer">
                   <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">{doc.type === 'contract' ? '📑' : '📄'}</div>
                   <div>
                      <h6 className="text-xs font-black text-slate-900 tracking-tight">{doc.title}</h6>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{doc.category}</p>
                   </div>
                </div>
             ))}
          </div>
       </section>

       
    </div>
  );

  
  const renderProfile = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
       <div className="bg-white p-10 rounded-[48px] shadow-sm border border-slate-100 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6">
             <div className="w-28 h-28 rounded-[40px] bg-emerald-950 text-emerald-400 flex items-center justify-center text-5xl shadow-2xl relative">
                👤
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white">✓</div>
             </div>
             <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{profile?.name}</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-2">Certified Distribution Partner</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-6 bg-slate-50 rounded-[32px] space-y-1.5 group hover:bg-emerald-50 transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">直屬經銷商</p>
                <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{profile?.parentDistributor}</p>
             </div>
             <div className="p-6 bg-slate-50 rounded-[32px] space-y-1.5 group hover:bg-emerald-50 transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">登入帳號</p>
                <p className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{profile?.account}</p>
             </div>
          </div>
          <button className="w-full py-6 bg-rose-50 text-rose-600 rounded-[32px] font-black text-sm active:scale-95 hover:bg-rose-100 transition-all tracking-widest uppercase">登出系統</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      <div className="max-w-md mx-auto px-6 pt-10 flex justify-between items-end">
         <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-600 mb-1">Terminal V7</p>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900">
               {activeTab === 'overview' && '業務概覽'}
               {activeTab === 'temples' && '宮廟管理'}
               {activeTab === 'calendar' && '拜訪計畫'}
               {activeTab === 'commission' && '業績中心'}
               {activeTab === 'tools' && '官方工具'}
               {activeTab === 'profile' && '個人中心'}
            </h1>
         </div>
         <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-xl rotate-3">
            {profile?.name?.substring(0, 1)}
         </div>
      </div>

      <main className="max-w-md mx-auto px-6 mt-8 relative z-20">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'temples' && renderTemples()}
        {activeTab === 'calendar' && renderCalendar()}
        {activeTab === 'commission' && renderCommission()}
        {activeTab === 'tools' && renderTools()}
        {activeTab === 'profile' && renderProfile()}
      </main>

      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/90 backdrop-blur-2xl rounded-[44px] px-4 py-4 flex justify-between items-center shadow-2xl z-50 border border-emerald-100/30">
         {[
           {id: 'overview', icon: <IconHome />, label: '首頁'},
           {id: 'temples', icon: <IconBuilding />, label: '管理'},
           {id: 'calendar', icon: <IconCalendar />, label: '日曆'},
           {id: 'commission', icon: <IconChart />, label: '業績'},
           {id: 'tools', icon: <IconTools />, label: '工具'}
         ].map(t => (
           <button 
             key={t.id} 
             onClick={() => setActiveTab(t.id as TabType)}
             className={`flex flex-col items-center gap-1.5 transition-all duration-500 w-16 ${activeTab === t.id ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
           >
              <span className={`text-2xl transition-all duration-500 ${activeTab === t.id ? 'drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]' : ''}`}>{t.icon}</span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === t.id ? 'opacity-100 translate-y-0' : 'opacity-40 -translate-y-1'}`}>{t.label}</span>
           </button>
         ))}
      </nav>

      {/* Application Modal */}
      {isAppModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-md flex items-end justify-center z-[100] animate-in fade-in duration-500">
           <div className="bg-white w-full max-w-xl rounded-t-[60px] p-10 pb-20 max-h-[95vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-full duration-700">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
              <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tighter italic">宮廟開戶申請</h2>
              <p className="text-xs text-emerald-600 font-bold mb-12 uppercase tracking-widest">Official Registration Form V6</p>
               <TempleApplicationForm 
                 role="dist-sales"
                 submittedBy={salesName}
                 onSuccess={() => {
                   setIsAppModalOpen(false);
                   loadData();
                 }}
                 onCancel={() => setIsAppModalOpen(false)}
               />
            </div>
         </div>
       )}

      {/* Visit Record Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in zoom-in duration-500">
           <div className="bg-white w-full max-w-md rounded-[56px] p-10 space-y-10 shadow-2xl">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">紀錄拜訪計畫</h2>
                 <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Visitation Log System V6</p>
              </div>
              <form onSubmit={handleVisitSubmit} className="space-y-6">
                 <input 
                   type="text" 
                   placeholder="宮廟名稱" 
                   value={visitForm.templeName} 
                   onChange={e => setVisitForm({...visitForm, templeName: e.target.value})} 
                   className="app-input-v6" 
                 />
                 <div className="grid grid-cols-2 gap-4">
                    <select 
                      value={visitForm.importance} 
                      onChange={e => setVisitForm({...visitForm, importance: e.target.value})} 
                      className="app-input-v6"
                    >
                       <option value="High">🔴 高度重要</option>
                       <option value="Medium">🟡 中度重要</option>
                       <option value="Low">🟢 一般計畫</option>
                    </select>
                    <input 
                      type="date" 
                      value={visitForm.date} 
                      onChange={e => setVisitForm({...visitForm, date: e.target.value})} 
                      className="app-input-v6" 
                    />
                 </div>
                 <textarea 
                   placeholder="請輸入本次行程的詳細紀錄或預約內容..." 
                   value={visitForm.notes} 
                   onChange={e => setVisitForm({...visitForm, notes: e.target.value})} 
                   className="app-input-v6 min-h-[160px] resize-none" 
                 />
                 <div className="grid grid-cols-2 gap-5">
                    <button type="button" onClick={() => setIsVisitModalOpen(false)} className="py-5 rounded-[28px] font-black text-slate-400 bg-slate-50">取消</button>
                    <button type="submit" className="py-5 rounded-[28px] font-black text-white bg-emerald-600 shadow-xl shadow-emerald-500/20">儲存拜訪行為</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Contract Modal */}
      {isContractModalOpen && (
        <div className="fixed inset-0 bg-emerald-950/95 backdrop-blur-2xl flex items-center justify-center z-[120] p-6 animate-in zoom-in duration-500">
           <div className="bg-white w-full max-w-md rounded-[60px] p-12 space-y-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
              <div className="text-center space-y-4">
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter">官方數位合約</h2>
                 <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em]">Design Originated from Super Admin</p>
              </div>
              <input type="text" placeholder="輸入受約宮廟名稱" value={contractTemple} onChange={e => setContractTemple(e.target.value)} className="app-input-v6 text-center text-xl bg-emerald-50/50 border-emerald-100" />
              <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] flex items-center justify-center text-slate-300 font-black italic">在此進行法定電子簽署</div>
              <div className="grid grid-cols-2 gap-5">
                 <button onClick={() => setIsContractModalOpen(false)} className="py-6 rounded-[32px] font-black text-slate-400 bg-slate-50">取消簽署</button>
                 <button onClick={handleSignContract} className="py-6 rounded-[32px] font-black text-white bg-slate-900 shadow-2xl">正式啟動官方契約</button>
              </div>
           </div>
        </div>
      )}

      {/* Calendar Details Modal */}
      {selectedCalendarItem && (
        <div className="fixed inset-0 bg-emerald-950/90 backdrop-blur-md flex items-center justify-center z-[200] p-6 animate-in zoom-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[48px] p-10 space-y-8 shadow-2xl relative">
              <button onClick={() => setSelectedCalendarItem(null)} className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center font-black hover:bg-slate-100 hover:text-slate-600 transition-colors">✕</button>
              
              <div className="space-y-2">
                 <h2 className="text-2xl font-black text-slate-900 tracking-tighter pr-8">
                    {selectedCalendarItem.eventType === 'activation' ? '🎉 宮廟開通明細' : '🤝 拜訪紀錄明細'}
                 </h2>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{selectedCalendarItem.date}</p>
              </div>

              <div className="space-y-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">目標宮廟</p>
                    <p className="text-xl font-black text-slate-900">{selectedCalendarItem.templeName}</p>
                 </div>
                 
                 {selectedCalendarItem.timestamp && (
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統紀錄時間戳</p>
                       <p className="text-xs font-bold text-slate-500 font-mono bg-white px-3 py-2 rounded-xl mt-1 inline-block border border-slate-100">{selectedCalendarItem.timestamp}</p>
                    </div>
                 )}
                 
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">詳細內容與紀錄</p>
                    <p className="text-sm font-bold text-slate-700 bg-white p-5 rounded-[24px] border border-slate-100 mt-2 leading-relaxed shadow-sm min-h-[100px]">
                       {selectedCalendarItem.notes}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .app-input-v6 {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 28px;
          padding: 22px 28px;
          font-weight: 800;
          font-size: 15px;
          outline: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .app-input-v6:focus {
          background: #fff;
          border-color: #10b981;
          box-shadow: 0 10px 40px -10px rgba(16,185,129,0.15);
          transform: translateY(-2px);
        }
        ::placeholder { color: #cbd5e1; }
      `}</style>
    {/* --- TOOL PREVIEW MODAL --- */}
       {activeToolPreview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveToolPreview(null)}></div>
             <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                   <div>
                      <h3 className="font-black text-slate-900 text-lg">{activeToolPreview.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeToolPreview.category} • {activeToolPreview.type}</p>
                   </div>
                   <button onClick={() => setActiveToolPreview(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
                </div>
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center flex-col gap-6">
                   {activeToolPreview.type === 'photo' ? (
                      <img src={activeToolPreview.url || activeToolPreview.thumbnail} className="max-w-full max-h-full rounded-2xl shadow-sm" />
                   ) : activeToolPreview.type === 'video' ? (
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
       {isEditBankModalOpen && (
         <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-end animate-in fade-in duration-300">
            <form onSubmit={handleSaveBankInfo} className="bg-white w-full rounded-t-[60px] p-12 pb-20 shadow-2xl space-y-8 animate-in slide-in-from-bottom-20 duration-500 max-w-xl mx-auto relative">
               <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-4">
                  <div className="space-y-1">
                     <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">編輯銀行帳戶資訊</h3>
                     <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Bank Account Information</p>
                  </div>
                  <button type="button" onClick={() => setIsEditBankModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">✕</button>
               </div>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">解付銀行</label>
                     <input required type="text" value={editBankForm.bankName} onChange={e => setEditBankForm({...editBankForm, bankName: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" placeholder="例：國泰世華銀行 (013)" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">帳戶名稱</label>
                     <input required type="text" value={editBankForm.accountName} onChange={e => setEditBankForm({...editBankForm, accountName: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">銀行帳號</label>
                     <input required type="text" value={editBankForm.accountNumber} onChange={e => setEditBankForm({...editBankForm, accountNumber: e.target.value})} className="w-full bg-slate-50 text-slate-900 px-6 py-4 rounded-2xl font-black text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
               </div>
               
               <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-sm shadow-[0_15px_30px_rgba(37,99,235,0.3)] hover:bg-blue-500 transition-all">儲存變更</button>
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
       {/* --- TOOL PREVIEW MODAL --- */}
       {activeToolPreview && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveToolPreview(null)}></div>
             <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                   <div>
                      <h3 className="font-black text-slate-900 text-lg">{activeToolPreview.title}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{activeToolPreview.category} • {activeToolPreview.type}</p>
                   </div>
                   <button onClick={() => setActiveToolPreview(null)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">✕</button>
                </div>
                <div className="p-8 overflow-y-auto bg-slate-50 flex-1 flex items-center justify-center flex-col gap-6">
                   {activeToolPreview.type === 'photo' ? (
                      <img src={activeToolPreview.url || activeToolPreview.thumbnail} className="max-w-full max-h-full rounded-2xl shadow-sm" />
                   ) : activeToolPreview.type === 'video' ? (
                      <video src={activeToolPreview.url || activeToolPreview.thumbnail} controls className="w-full aspect-video bg-black rounded-2xl shadow-lg" />
                   ) : (
                      <div className="text-center space-y-4">
                         <span className="text-6xl block">📄</span>
                         <p className="text-sm font-black text-slate-900">{activeToolPreview.title}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase">文件已被安全保護，請點擊下方按鈕下載檢閱</p>
                      </div>
                   )}
                </div>
                <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
                   <button 
                     onClick={() => {
                        if (['video', 'photo'].includes(activeToolPreview.type)) {
                           const fileUrl = activeToolPreview.url || activeToolPreview.thumbnail;
                           if (fileUrl.startsWith('data:')) {
                             const a = document.createElement('a');
                             a.href = fileUrl;
                             a.download = activeToolPreview.title || 'download';
                             document.body.appendChild(a);
                             a.click();
                             document.body.removeChild(a);
                           } else {
                             const a = document.createElement('a');
                             a.href = fileUrl;
                             a.download = activeToolPreview.title || 'download';
                             a.target = '_blank';
                             document.body.appendChild(a);
                             a.click();
                             document.body.removeChild(a);
                           }
                        } else {
                           const fileUrl = activeToolPreview.url || activeToolPreview.thumbnail;
                           if (fileUrl.startsWith('data:')) {
                             const arr = fileUrl.split(',');
                             const bstr = atob(arr[1]);
                             let n = bstr.length;
                             const u8arr = new Uint8Array(n);
                             while(n--){
                                 u8arr[n] = bstr.charCodeAt(n);
                             }
                             const blob = new Blob([u8arr], {type: arr[0].match(/:(.*?);/)[1]});
                             const url = URL.createObjectURL(blob);
                             const a = document.createElement('a');
                             a.href = url;
                             a.download = activeToolPreview.title || 'download';
                             a.target = '_blank';
                             document.body.appendChild(a);
                             a.click();
                             document.body.removeChild(a);
                             URL.revokeObjectURL(url);
                           } else {
                             const a = document.createElement('a');
                             a.href = fileUrl;
                             a.download = activeToolPreview.title || 'download';
                             a.target = '_blank';
                             document.body.appendChild(a);
                             a.click();
                             document.body.removeChild(a);
                           }
                        }
                     }} 
                     className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 transition-all active:scale-95"
                   >
                     確認下載檔案
                   </button>
                </div>
             </div>
          </div>
       )}
    
</div>
  );
}