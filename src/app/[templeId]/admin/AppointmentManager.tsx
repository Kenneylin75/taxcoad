// @ts-nocheck
"use client";

import React, { useState, useMemo, useTransition } from 'react';
import { markAppointmentCompleted, rescheduleSingleAppointment, fetchAvailableSlots } from '@/app/actions';

interface Appointment {
  id: number;
  guestName: string;
  phone: string;
  service: string;
  staff: string;
  time: string;
  status: string;
  [key: string]: any;
}

interface AppointmentManagerProps {
  initialAppointments: Appointment[];
}

type TabType = 'today' | 'pending' | 'completed' | 'all';

export default function AppointmentManager({ initialAppointments }: AppointmentManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isDataViewOpen, setIsDataViewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 改期相關狀態
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedRescheduleApp, setSelectedRescheduleApp] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlotsForReschedule, setAvailableSlotsForReschedule] = useState<any[]>([]);
  const [selectedNewSlotId, setSelectedNewSlotId] = useState<number | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);

  React.useEffect(() => {
    if (!rescheduleDate || !selectedRescheduleApp) {
      setAvailableSlotsForReschedule([]);
      return;
    }
    const fetchSlots = async () => {
      const slots = await fetchAvailableSlots();
      const filtered = slots.filter((s: any) => 
        s.date === rescheduleDate && 
        s.status === 'Available' && 
        (s.service === selectedRescheduleApp.service || s.description === selectedRescheduleApp.service)
      );
      setAvailableSlotsForReschedule(filtered);
    };
    fetchSlots();
  }, [rescheduleDate, selectedRescheduleApp]);

  const handleRescheduleClick = (app: Appointment) => {
    setSelectedRescheduleApp(app);
    setRescheduleDate(app.time.split(' ')[0]);
    setSelectedNewSlotId(null);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRescheduleApp || !selectedNewSlotId) return;
    setIsRescheduling(true);
    try {
      const res = await rescheduleSingleAppointment(selectedRescheduleApp.id, selectedNewSlotId);
      if (res.success) {
        alert('✅ 改期成功！已發送通知給信眾。');
        setShowRescheduleModal(false);
        window.location.reload();
      } else {
        alert('❌ 改期失敗：' + res.message);
      }
    } catch (err) {
      alert('❌ 改期失敗，請稍後再試。');
    } finally {
      setIsRescheduling(false);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const todayStr = useMemo(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }, []);

  const filteredAppointments = useMemo(() => {
    const result = initialAppointments.filter(app => {
      const matchesSearch = 
        app.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.phone?.includes(searchTerm);
      
      if (!matchesSearch) return false;
      if (dateFilter && !app.time.startsWith(dateFilter)) return false;
      if (activeTab === 'today') return app.time.startsWith(todayStr);
      if (activeTab === 'pending') return app.status === 'Pending';
      if (activeTab === 'completed') return app.status === 'Completed';
      return true;
    });
    
    const sortedResult = result.sort((a, b) => b.id - a.id);
    setCurrentPage(1);
    return sortedResult;
  }, [initialAppointments, activeTab, searchTerm, dateFilter, todayStr]);

  const totalPages = Math.ceil(filteredAppointments.length / pageSize);
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAppointments.slice(start, start + pageSize);
  }, [filteredAppointments, currentPage]);

  const handleMarkCompleted = (id: number) => {
    if(!confirm("確定要將此預約標記為已完成嗎？")) return;
    startTransition(async () => {
      await markAppointmentCompleted(id);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg border border-slate-800">📅</div>
           <div>
              <h3 className="text-lg font-black text-slate-800">預約報到管理</h3>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">系統核定紀錄</span>
                 <span className="bg-white text-amber-600 px-2 py-0.5 rounded text-[10px] font-black border border-slate-200 shadow-sm">
                    {filteredAppointments.length} 筆
                 </span>
              </div>
           </div>
        </div>
        
        <button 
          onClick={() => setIsDataViewOpen(!isDataViewOpen)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs tracking-widest transition-all shadow-sm border ${
            isDataViewOpen 
            ? 'bg-amber-500 text-slate-900 border-amber-600' 
            : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
          }`}
        >
          <span>{isDataViewOpen ? '✕ 關閉搜尋' : '🔍 進階檢索'}</span>
        </button>
      </div>

      {/* Filter Panel */}
      <div className={`overflow-hidden transition-all duration-500 ${isDataViewOpen ? 'max-h-[400px] border-b border-slate-100 bg-white' : 'max-h-0'}`}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">快速分類</label>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               {(['today', 'pending', 'completed', 'all'] as TabType[]).map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                     activeTab === tab 
                     ? 'bg-white text-slate-900 shadow-sm' 
                     : 'text-slate-400 hover:text-slate-600'
                   }`}
                 >
                   {tab === 'today' ? '今日' : tab === 'pending' ? '待處理' : tab === 'completed' ? '已完成' : '全部'}
                 </button>
               ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">日期查詢</label>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-amber-500 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾姓名/電話</label>
            <input 
              type="text" 
              placeholder="搜尋..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-amber-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">報到時間</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾資訊</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">服務項目</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">指派人員</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">管理操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedAppointments.map((app) => (
              <tr key={app.id} className="hover:bg-slate-50/50 transition-all group">
                <td className="px-6 py-4">
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{app.time.split(' ')[0]}</span>
                      <span className="text-[10px] text-amber-600 font-black font-mono">{app.time.split(' ')[1]}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-800">{app.guestName}</span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{app.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-600 border border-slate-200 uppercase tracking-widest">
                    {app.service}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                     <div className="w-6 h-6 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center text-[10px] border border-slate-100 group-hover:bg-white transition-all">👤</div>
                     <span className="text-xs font-black text-slate-800">{app.staff}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a 
                      href={`/admin/customers?phone=${app.phone}`}
                      className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-800 hover:border-slate-300 transition-all shadow-sm"
                    >
                      📜
                    </a>
                    {app.status === 'Pending' ? (
                      <div className="flex gap-2 items-center">
                        <button 
                          onClick={() => handleRescheduleClick(app)}
                          className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white shadow-sm transition-all"
                        >
                          🔄 改期
                        </button>
                        <button 
                          onClick={() => handleMarkCompleted(app.id)}
                          disabled={isPending}
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 shadow-sm transition-all"
                        >
                          {isPending ? '處理中...' : '⚔️ 核定報到'}
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest italic">
                        <span>✓</span> 已報到
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            顯示第 <span className="text-slate-800">{(currentPage - 1) * pageSize + 1}</span> 至 <span className="text-slate-800">{Math.min(currentPage * pageSize, filteredAppointments.length)}</span> 筆，共 <span className="text-slate-800">{filteredAppointments.length}</span> 筆紀錄
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 disabled:opacity-20 hover:text-slate-800 hover:border-slate-300 transition-all flex items-center justify-center text-xs font-black shadow-sm"
            >
              ←
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-black transition-all flex items-center justify-center border ${
                    currentPage === page 
                    ? 'bg-slate-900 text-amber-500 border-slate-800 shadow-md scale-110' 
                    : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 disabled:opacity-20 hover:text-slate-800 hover:border-slate-300 transition-all flex items-center justify-center text-xs font-black shadow-sm"
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedRescheduleApp && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-lg flex items-center gap-2">
                   <span>🔄</span> 手動改期作業
                 </h3>
                 <button onClick={() => setShowRescheduleModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">×</button>
              </div>
              <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-6">
                 <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-2">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">信眾當前預約資訊</p>
                    <div className="flex justify-between items-center">
                       <span className="text-sm font-black text-slate-800">{selectedRescheduleApp.guestName}</span>
                       <span className="text-xs font-bold text-slate-500">{selectedRescheduleApp.service}</span>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-500">{selectedRescheduleApp.time}</p>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">請選擇欲改期之新日期</label>
                    <input 
                      type="date" 
                      required
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" 
                    />
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">可選擇之新時段 (限原服務)</label>
                    {availableSlotsForReschedule.length > 0 ? (
                      <select 
                        required
                        value={selectedNewSlotId || ''}
                        onChange={(e) => setSelectedNewSlotId(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all"
                      >
                         <option value="">請選擇空檔時段...</option>
                         {availableSlotsForReschedule.map(slot => (
                           <option key={slot.id} value={slot.id}>
                             {slot.time.split(' ')[1]} - {slot.staff} 老師
                           </option>
                         ))}
                      </select>
                    ) : (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-xs font-bold text-rose-600">
                         {rescheduleDate ? '該日期目前沒有可選的同服務空檔。' : '請先選擇上方日期。'}
                      </div>
                    )}
                 </div>

                 <div className="pt-4 border-t border-slate-100 flex gap-4">
                    <button type="button" onClick={() => setShowRescheduleModal(false)} className="flex-1 py-3 bg-white text-slate-600 font-black rounded-xl border border-slate-200 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs">取消</button>
                    <button type="submit" disabled={!selectedNewSlotId || isRescheduling} className="flex-1 py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 disabled:opacity-50 tracking-widest uppercase transition-all shadow-md text-xs">
                       {isRescheduling ? "處理中..." : "確認改期並發送通知"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
