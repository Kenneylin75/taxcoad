"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getAdminNotifications, markNotificationAsRead } from '@/app/actions_payment_proof';
import { getTempleBasicInfo } from '@/app/actions';
import { useRouter, useParams } from 'next/navigation';

export default function AdminBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'PENDING_REVIEW'>('PENDING_REVIEW');
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const params = useParams();
  const templeId = params.templeId as string;
  const loadNotifications = async () => {
    const data = await getAdminNotifications() || [];
    let notifs = [...data];
    try {
      const templeInfo = await getTempleBasicInfo(templeId);
      if (templeInfo && (templeInfo as any).billingStartDate) {
         const expDate = new Date((templeInfo as any).billingStartDate);
         const now = new Date();
         const diffTime = expDate.getTime() - now.getTime();
         const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
         if (diffDays >= 0 && diffDays <= 5) {
            notifs.unshift({
               id: 'sys-billing-alert',
               templeId: templeId,
               guestId: null,
               message: `您的試用期/免費期間即將於 ${diffDays} 天後到期，請盡快前往帳務管理完成繳費，以免系統自動鎖定。`,
               category: 'GENERAL',
               isRead: false,
               createdAt: new Date().toISOString(),
               linkPath: `/${templeId}/admin/billing`
            });
         }
      }
    } catch(e) {}
    setNotifications(notifs);
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead && n.category === 'PENDING_REVIEW').length;

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      loadNotifications();
    }
    if (notif.linkPath) {
      router.push(notif.linkPath);
      setIsOpen(false);
    }
  };

  const filteredNotifs = notifications.filter(n => n.category === activeTab);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[450px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-black text-slate-800 flex items-center justify-between">
              通知中心 
              <button onClick={() => loadNotifications()} className="text-[10px] text-slate-400 hover:text-amber-600">↻ 重新整理</button>
            </h3>
          </div>

          <div className="flex border-b border-slate-100">
            {[
              { id: 'GENERAL', label: '一般資料' },
              { id: 'PENDING_REVIEW', label: '待確認' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 text-[11px] font-bold tracking-wider uppercase transition-colors relative ${
                  activeTab === tab.id ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />
                )}
                {notifications.filter(n => n.category === tab.id && !n.isRead).length > 0 && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredNotifs.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center opacity-50">
                <span className="text-3xl mb-2">📭</span>
                <p className="text-xs font-bold text-slate-500">目前沒有相關通知</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredNotifs.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-4 cursor-pointer hover:bg-amber-50/50 transition-colors ${!notif.isRead ? 'bg-amber-50/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className="mt-0.5">
                        {!notif.isRead ? <div className="w-2 h-2 rounded-full bg-amber-500" /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={`text-xs ${!notif.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {new Date(notif.createdAt).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-slate-100 flex items-center justify-between bg-slate-50">
             <button className="text-[10px] font-bold text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-colors">
               標記全部為已讀
             </button>
             <button 
               onClick={() => {
                 setIsOpen(false);
                 const templeId = window.location.pathname.split('/')[1];
                 router.push(`/${templeId}/admin/audit?tab=notifications`);
               }}
               className="text-[10px] font-black text-amber-600 hover:text-amber-700 uppercase tracking-widest transition-colors"
             >
               查看更多 ➔
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
