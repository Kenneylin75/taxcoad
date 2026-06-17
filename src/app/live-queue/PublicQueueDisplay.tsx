"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { registerGuestForQueue } from '@/app/actions';

export default function PublicQueueDisplay({ events, tickets }: { events: any[], tickets: any[] }) {
  const activeEvent = events.find(e => e.status === 'Active');
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.status === 'Draft' && e.date >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [isPending, startTransition] = useTransition();

  const handlePreRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvents.length === 0) return alert('請至少選擇一場活動');
    if (!regName || !regPhone) return alert('請填寫完整資訊');

    startTransition(async () => {
      let msgs = [];
      for (const eventId of selectedEvents) {
        const res = await registerGuestForQueue(eventId, { guestName: regName, phone: regPhone, isOnline: true });
        if (res.success) {
          const evt = upcomingEvents.find(x => x.id === eventId);
          msgs.push(`「${evt?.title}」預約成功！號碼：${res.ticket.assignedNumber}`);
        } else {
          msgs.push(`預約失敗：${res.error}`);
        }
      }
      alert(msgs.join('\n') + '\n\n請務必於活動開始時，抵達現場掃描 QR Code 完成實名報到！');
      setSelectedEvents([]);
      setRegName('');
      setRegPhone('');
    });
  };

  const currentlyCalling = tickets.find((t: any) => t.status === 'Calling' && t.eventId === activeEvent?.id);
  const queuingTickets = tickets.filter((t: any) => t.status === 'Queuing' && t.eventId === activeEvent?.id)
                                .sort((a,b) => (a.actualOrder || 0) - (b.actualOrder || 0));

  if (!activeEvent) {
    return (
      <div className="space-y-12 animate-in fade-in duration-1000">
        <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[50px] border-4 border-slate-100 shadow-xl">
          <div className="text-8xl animate-bounce">⛩️</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-widest italic">目前無進行中的活動</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest">請稍後再試，或預約下方即將開始的活動</p>
        </div>
        
      {/* Upcoming Events Registration */}
      <div className="mt-20 border-t-4 border-slate-200 pt-16 animate-in slide-in-from-bottom-10 duration-1000">
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">即將到來的活動 (PRE-REGISTRATION)</h2>
          <p className="text-slate-500 font-bold tracking-widest text-sm">您可以預先領取號碼，活動當日請務必至現場掃描 QR Code 報到，否則無法叫號。</p>
        </div>

        {upcomingEvents.length === 0 ? (
           <p className="text-center text-slate-400 font-bold text-lg">目前無即將開放的活動</p>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-4">
                 {upcomingEvents.map((evt) => (
                    <label key={evt.id} className={`block cursor-pointer bg-white border-2 rounded-[30px] p-6 transition-all ${selectedEvents.includes(evt.id) ? 'border-indigo-600 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300'}`}>
                       <div className="flex items-center gap-6">
                          <input 
                            type="checkbox" 
                            checked={selectedEvents.includes(evt.id)}
                            onChange={(e) => {
                              if(e.target.checked) setSelectedEvents(prev => [...prev, evt.id]);
                              else setSelectedEvents(prev => prev.filter(id => id !== evt.id));
                            }}
                            className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <div className="flex-1">
                             <h4 className="text-xl font-black text-slate-900">{evt.title}</h4>
                             <p className="text-sm font-bold text-slate-500 mt-1">📍 {evt.location} | 📅 {evt.date} ({evt.startTime}-{evt.endTime})</p>
                          </div>
                          <div className="text-right">
                             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">目前預約</span>
                             <span className="text-2xl font-black text-indigo-600">{evt.participantCount || 0}</span>
                             <span className="text-xs text-slate-400">/{evt.maxCapacity || '∞'}</span>
                          </div>
                       </div>
                    </label>
                 ))}
              </div>
              <div className="lg:col-span-4">
                 <form onSubmit={handlePreRegister} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-2xl space-y-6 sticky top-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-4">確認預約資訊</h3>
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">姓名 Name</label>
                          <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" placeholder="例如：王大明" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">電話 Phone</label>
                          <input type="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} pattern="^09\d{8}$" minLength={10} maxLength={10} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" placeholder="例如：0912345678" />
                       </div>
                    </div>
                    <button type="submit" disabled={isPending || selectedEvents.length === 0} className="w-full bg-slate-900 text-amber-500 py-4 rounded-2xl font-black text-xs tracking-[0.3em] uppercase hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 shadow-xl">
                       {isPending ? '處理中...' : `送出 ${selectedEvents.length} 筆預約 ➔`}
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed mt-4">
                       ⚠️ 提醒您：線上預約僅為「保留名額與領取預約號碼」，您必須在活動當日抵達現場，並掃描主辦方提供的 QR Code，才算正式完成報到與排隊喔！
                    </p>
                 </form>
              </div>
           </div>
        )}
      </div>

      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-block px-6 py-2 bg-slate-900 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-xl">
          LIVE QUEUE MONITOR
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter italic leading-none">
          {activeEvent.title}
        </h1>
        <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mt-4">
           📍 {activeEvent.location} | 📅 {activeEvent.date} ({activeEvent.startTime || '09:00'} - {activeEvent.endTime || '17:00'})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Main Calling Display */}
        <div className="bg-white p-12 md:p-20 rounded-[80px] shadow-[0_80px_150px_-30px_rgba(0,0,0,0.1)] border-4 border-slate-900 text-center space-y-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          
          <div className="space-y-4">
            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.5em]">目前服務號碼</h3>
            <div className="text-[250px] md:text-[320px] font-black bg-gradient-to-b from-slate-800 to-slate-950 bg-clip-text text-transparent leading-none font-serif tracking-tighter drop-shadow-2xl animate-pulse">
              {currentlyCalling ? currentlyCalling.actualOrder : '--'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="px-12 py-5 bg-emerald-500 text-white rounded-[40px] inline-block shadow-2xl shadow-emerald-200">
               <span className="text-2xl font-black uppercase tracking-[0.3em]">
                 {currentlyCalling ? `${currentlyCalling.assignedNumber} 號` : '請等待呼叫'}
               </span>
            </div>
            {currentlyCalling && (
              <p className="text-xl font-black text-slate-900 mt-4 italic">{currentlyCalling.guestName} 先生/女士</p>
            )}
          </div>
        </div>

        {/* Next List */}
        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl">
              <h3 className="text-xl font-black text-amber-500 italic tracking-tight">後續等候順位</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next in line</p>
                <span className="text-amber-500 font-black text-xl">{queuingTickets.length} <span className="text-[10px] uppercase">人等候中</span></span>
              </div>
           </div>

           <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {queuingTickets.slice(0, 8).map((t: any, idx: number) => (
                <div key={t.id} className={`p-8 rounded-[40px] border-2 flex items-center justify-between transition-all ${idx === 0 ? 'bg-white border-indigo-600 shadow-xl scale-[1.02]' : 'bg-white border-slate-50 opacity-60'}`}>
                  <div className="flex items-center gap-8">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl font-black italic font-serif ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      #{t.actualOrder}
                    </div>
                    <div>
                      <p className="text-2xl font-black text-slate-900">{t.assignedNumber} 號</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.guestName.charAt(0)} * {t.guestName.charAt(t.guestName.length-1)}</p>
                    </div>
                  </div>
                  {idx === 0 && <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">準備中 ➔</span>}
                </div>
              ))}
              {queuingTickets.length === 0 && (
                <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[50px] opacity-20">
                  <p className="text-xl font-black italic">尚無人在排隊</p>
                </div>
              )}
              {queuingTickets.length > 8 && (
                <div className="text-center py-6 text-slate-300 font-black italic text-sm">
                  還有 {queuingTickets.length - 8} 位信眾在後續等候中...
                </div>
              )}
           </div>
        </div>
      </div>


      {/* Upcoming Events Registration */}
      <div className="mt-20 border-t-4 border-slate-200 pt-16 animate-in slide-in-from-bottom-10 duration-1000">
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">即將到來的活動 (PRE-REGISTRATION)</h2>
          <p className="text-slate-500 font-bold tracking-widest text-sm">您可以預先領取號碼，活動當日請務必至現場掃描 QR Code 報到，否則無法叫號。</p>
        </div>

        {upcomingEvents.length === 0 ? (
           <p className="text-center text-slate-400 font-bold text-lg">目前無即將開放的活動</p>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-4">
                 {upcomingEvents.map((evt) => (
                    <label key={evt.id} className={`block cursor-pointer bg-white border-2 rounded-[30px] p-6 transition-all ${selectedEvents.includes(evt.id) ? 'border-indigo-600 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300'}`}>
                       <div className="flex items-center gap-6">
                          <input 
                            type="checkbox" 
                            checked={selectedEvents.includes(evt.id)}
                            onChange={(e) => {
                              if(e.target.checked) setSelectedEvents(prev => [...prev, evt.id]);
                              else setSelectedEvents(prev => prev.filter(id => id !== evt.id));
                            }}
                            className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <div className="flex-1">
                             <h4 className="text-xl font-black text-slate-900">{evt.title}</h4>
                             <p className="text-sm font-bold text-slate-500 mt-1">📍 {evt.location} | 📅 {evt.date} ({evt.startTime}-{evt.endTime})</p>
                          </div>
                          <div className="text-right">
                             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">目前預約</span>
                             <span className="text-2xl font-black text-indigo-600">{evt.participantCount || 0}</span>
                             <span className="text-xs text-slate-400">/{evt.maxCapacity || '∞'}</span>
                          </div>
                       </div>
                    </label>
                 ))}
              </div>
              <div className="lg:col-span-4">
                 <form onSubmit={handlePreRegister} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-2xl space-y-6 sticky top-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-4">確認預約資訊</h3>
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">姓名 Name</label>
                          <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" placeholder="例如：王大明" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">電話 Phone</label>
                          <input type="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} pattern="^09\d{8}$" minLength={10} maxLength={10} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" placeholder="例如：0912345678" />
                       </div>
                    </div>
                    <button type="submit" disabled={isPending || selectedEvents.length === 0} className="w-full bg-slate-900 text-amber-500 py-4 rounded-2xl font-black text-xs tracking-[0.3em] uppercase hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 shadow-xl">
                       {isPending ? '處理中...' : `送出 ${selectedEvents.length} 筆預約 ➔`}
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed mt-4">
                       ⚠️ 提醒您：線上預約僅為「保留名額與領取預約號碼」，您必須在活動當日抵達現場，並掃描主辦方提供的 QR Code，才算正式完成報到與排隊喔！
                    </p>
                 </form>
              </div>
           </div>
        )}
      </div>

      <footer className="pt-20 text-center opacity-20">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[1.5em]">SECURE LIVE STREAMING • CLOUD QUEUE v4.0</p>
      </footer>
    </div>
  );
}
