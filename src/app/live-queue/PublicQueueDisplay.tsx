"use client";

import React, { useState, useEffect } from 'react';

export default function PublicQueueDisplay({ events, tickets }: { events: any[], tickets: any[] }) {
  const activeEvent = events.find(e => e.status === 'Active');
  const currentlyCalling = tickets.find((t: any) => t.status === 'Calling' && t.eventId === activeEvent?.id);
  const queuingTickets = tickets.filter((t: any) => t.status === 'Queuing' && t.eventId === activeEvent?.id)
                                .sort((a,b) => (a.actualOrder || 0) - (b.actualOrder || 0));

  if (!activeEvent) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="text-8xl animate-bounce">⛩️</div>
        <h2 className="text-3xl font-black text-slate-900 tracking-widest italic">目前無進行中的活動</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest">請稍後再試，或洽詢宮廟人員</p>
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

      <footer className="pt-20 text-center opacity-20">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[1.5em]">SECURE LIVE STREAMING • CLOUD QUEUE v4.0</p>
      </footer>
    </div>
  );
}
