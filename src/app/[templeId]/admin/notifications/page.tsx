"use client";

import React, { useState, useEffect } from 'react';
import { 
  fetchTempleNotifications, 
  createNotification, 
  TempleNotification 
} from '@/app/actions';

export default function BelieverNotificationsPage() {
  const [notifications, setNotifications] = useState<TempleNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendType, setSendType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledTime, setScheduledTime] = useState('');

  // Expand State
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    const data = await fetchTempleNotifications();
    setNotifications(data);
    setIsLoading(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert("請填寫通知標題與內容！");
      return;
    }

    let finalSendTime = new Date().toISOString();
    if (sendType === 'scheduled') {
      if (!scheduledTime) {
        alert("請選擇預排發送時間！");
        return;
      }
      finalSendTime = new Date(scheduledTime).toISOString();
    }

    setIsSubmitting(true);
    const res = await createNotification(title, content, finalSendTime);
    setIsSubmitting(false);

    if (res.success) {
      alert("✨ 信眾通知公告發布成功！");
      setTitle('');
      setContent('');
      setSendType('immediate');
      setScheduledTime('');
      loadNotifications();
    } else {
      alert("❌ 發布失敗，請稍後再試。");
    }
  };

  // Helper to format date beautifully
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${date} ${hours}:${minutes}`;
  };

  // Check if sent
  const isSent = (sendTimeStr: string) => {
    return new Date(sendTimeStr).getTime() <= Date.now();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
          📢 信眾通知 <span className="text-amber-600 italic">公告發送中心</span>
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
          Unified Announcement Composer & Transmission Log
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Composer Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm tracking-wide">🆕 通知設計發送器</h3>
              <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full uppercase">Composer</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">通知標題</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  required
                  placeholder="例如：【祈福法會】歲末大典暨點燈登記開始..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-amber-500 focus:bg-white outline-none transition shadow-inner"
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">通知內容與詳情</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  required
                  rows={6}
                  placeholder="請輸入欲廣播給信眾的公告詳情..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-medium focus:border-amber-500 focus:bg-white outline-none transition resize-none leading-relaxed shadow-inner"
                ></textarea>
              </div>

              {/* Send Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">發送時程</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setSendType('immediate')}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${sendType === 'immediate' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    🚀 即時發送
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSendType('scheduled')}
                    className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition ${sendType === 'scheduled' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    🕒 預約發送
                  </button>
                </div>
              </div>

              {/* Scheduled Time input */}
              {sendType === 'scheduled' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">選擇定時發送時間</label>
                  <input 
                    type="datetime-local" 
                    value={scheduledTime}
                    onChange={e => setScheduledTime(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold focus:border-amber-500 focus:bg-white outline-none transition shadow-inner"
                  />
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white font-black py-3 rounded-xl text-xs tracking-widest shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? "發送封包中..." : "⚔️ 發佈此通知公告"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Transmission History Logs */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[480px]">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-black text-slate-800 text-sm tracking-wide">📜 歷史發送紀錄</h3>
              <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Log History</span>
            </div>

            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">讀取歷史公告數據...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-30">
                <span className="text-4xl">📭</span>
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">目前尚無任何發布公告紀錄</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                {notifications.map((notif) => {
                  const sent = isSent(notif.sendTime);
                  const isOpen = expandedIds[notif.id] || false;

                  return (
                    <div 
                      key={notif.id}
                      className="bg-slate-50/50 rounded-xl border border-slate-200/60 overflow-hidden transition-all duration-300 hover:border-slate-300"
                    >
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleExpand(notif.id)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{sent ? '🟢' : '🕒'}</span>
                          <div className="space-y-0.5">
                            <h4 className="font-black text-xs text-slate-800 tracking-tight leading-snug">{notif.title}</h4>
                            <p className="text-[9px] font-bold text-slate-400 font-mono">{formatDate(notif.sendTime)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${sent ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                            {sent ? '已發送' : '定時預排'}
                          </span>
                          <span className={`text-[10px] text-slate-400 font-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100 animate-in slide-in-from-top-1 duration-300">
                          <div className="p-3 bg-white rounded-lg border border-slate-100 mt-2">
                            <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                              {notif.content}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-3 px-1">
                            <span className="text-[8px] font-bold text-slate-300 font-mono">ID: {notif.id}</span>
                            <span className="text-[8px] font-bold text-slate-300 font-mono">CREATED: {formatDate(notif.createdAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
