"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { AppRole, logoutAccount } from '@/app/actions';

export default function TempleShell({ children, currentRole, currentUser, templeId }: { children: React.ReactNode, currentRole: AppRole, currentUser: { name: string, avatar: string }, templeId: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const basePath = `/${templeId}/admin`;

  const navigation = [
    { name: '營運主控台', href: basePath, icon: '📊', show: true },
    
    { category: '服務核心業務', show: true, items: [
      { name: '信眾檔案', href: `${basePath}/customers`, icon: '📜', show: true },
      { name: '預約日曆', href: `${basePath}/calendar`, icon: '📅', show: true },
      { name: '現場排隊', href: `${basePath}/queue`, icon: '🎫', show: true },
      { name: '點燈管理', href: `${basePath}/lamps`, icon: '🏮', show: true },
      { name: '法會管理', href: `${basePath}/events`, icon: '🕉️', show: true },
    ]},

    { category: '服務系統設定', show: ['TempleAdmin', 'SuperAdmin'].includes(currentRole), items: [
      { name: '服務項目', href: `${basePath}/services`, icon: '⛩️', show: true },
      { name: '預約時段', href: `${basePath}/slots`, icon: '⏰', show: true },
      { name: '信眾通知', href: `${basePath}/notifications`, icon: '📢', show: true },
      { name: 'LINE 設定', href: `${basePath}/line-setup`, icon: '💬', show: true },
      { name: '人員管理', href: `${basePath}/personnel`, icon: '👥', show: true },
      { name: '帳務管理', href: `${basePath}/billing`, icon: '💳', show: true },
      { name: '金流收款', href: `${basePath}/payment-setup`, icon: '💰', show: true },
      { name: '數據分析', href: `${basePath}/analytics`, icon: '📈', show: true },
      { name: 'AI 監控', href: `${basePath}/ai-chat`, icon: '🤖', show: true },
      { name: '進階設定', href: `${basePath}/settings`, icon: '⚙️', show: true },
      { name: '系統日誌', href: `${basePath}/audit`, icon: '📜', show: true },
    ]},

    { category: '系統預覽', show: true, items: [
      { name: '客戶前台', href: `/${templeId}`, icon: '📱', show: true, target: '_blank' },
    ]},
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0F172A] text-white transition-all duration-300 ease-in-out shadow-xl ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between border-b border-slate-800/50">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/40 text-white font-black">P</div>
                <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter text-white leading-none">PIVOT</span>
                  <span className="text-indigo-300 text-[9px] font-black tracking-[0.2em] uppercase mt-1">Service Manager</span>
                </div>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400">{isCollapsed ? '→' : '←'}</button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {navigation.map((section, sIdx) => {
              if (section.category) {
                if (!section.show) return null;
                const visibleItems = section.items?.filter(i => i.show) || [];
                return (
                  <div key={sIdx} className="space-y-1">
                    {!isCollapsed && (
                      <div className="flex items-center gap-2 px-3 mb-2 mt-8">
                        <div className="w-1.5 h-4 bg-amber-500 rounded-full"></div>
                        <div className="text-[14px] font-black text-amber-400 tracking-wider uppercase">{section.category}</div>
                      </div>
                    )}
                    <div className="space-y-1">
                      {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        const linkTarget = 'target' in item ? (item as any).target : undefined;
                        return (
                          <Link key={item.href} href={item.href} target={linkTarget} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${isActive ? 'bg-amber-500 text-slate-900 shadow-lg font-black' : 'hover:bg-slate-800/80 text-slate-300'}`}>
                            <span className="text-lg">{item.icon}</span>
                            {!isCollapsed && <span className="text-sm font-bold">{item.name}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              const isActive = pathname === section.href;
              return (
                <Link key={section.href} href={section.href!} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-4 transition-all group ${isActive ? 'bg-indigo-600 text-white shadow-lg font-semibold' : 'hover:bg-slate-800 text-slate-200'}`}>
                  <span className="text-lg">{section.icon}</span>
                  {!isCollapsed && <span className="text-sm font-semibold">{section.name}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
              <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-500/20" />
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-slate-100">{currentUser.name}</p>
                  <p className="text-[10px] text-indigo-300/80 font-bold uppercase truncate">{currentRole}</p>
                </div>
              )}
            </div>
            
            {/* Return to Super Admin Button */}
            {currentRole === 'SuperAdmin' && !isCollapsed && (
              <button onClick={async () => {
                 const m = await import('@/app/actions');
                 const res = await m.returnToSuperAdmin();
                 if (res.success && res.redirectPath) {
                   window.location.href = res.redirectPath;
                 } else if (res.success) {
                   window.location.href = '/super-admin';
                 }
              }} className="w-full mt-2 py-2 px-4 rounded-lg border border-indigo-500/30 text-[10px] font-bold bg-indigo-500/10 hover:bg-indigo-600 hover:text-white transition-all text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2">
                 👑 退出上帝視角
              </button>
            )}

            {!isCollapsed && <button onClick={async () => {
              const res = await logoutAccount();
              if (res.success) {
                window.location.href = '/login';
              }
            }} className="w-full mt-4 py-2 px-4 rounded-lg border border-slate-800 text-[10px] font-bold hover:bg-rose-500 hover:text-white transition-all text-slate-500">登出系統 LOGOUT</button>}
          </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-4">
             <h1 className="text-xl font-black tracking-tight text-slate-900 italic">服務管理系統</h1>
             <h2 className="text-sm font-bold text-slate-400 flex items-center gap-2">
               <span className="text-slate-300">/</span>
               {navigation.flatMap(n => n.items || [n]).find(n => n.href === pathname)?.name || '服務管理'}
             </h2>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
