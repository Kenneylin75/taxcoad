"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppRole, logoutAccount } from '@/app/actions';

export default function AdminShell({ children, currentRole, currentUser }: { children: React.ReactNode, currentRole: AppRole, currentUser: { name: string, avatar: string } }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: '系統總覽', href: '/admin', icon: '🌍', show: true },
    
    { category: '核心管理', show: true, items: [
      { name: '組織管理', href: '/admin/organizations', icon: '🏛️', show: true },
      { name: '人員權限', href: '/admin/personnel', icon: '👥', show: true },
      { name: '系統日誌', href: '/admin/audit', icon: '📜', show: true },
      { name: '全局數據', href: '/admin/analytics', icon: '📈', show: true },
    ]},

    { category: '開發者工具', show: true, items: [
      { name: 'AI 核心大腦', href: '/admin/ai-settings', icon: '🧠', show: true },
      { name: '中央連接器', href: '/admin/connector', icon: '🔌', show: true },
      { name: '模組註冊', href: '/admin/modules', icon: '📦', show: true },
    ]},
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 font-sans text-slate-100">
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#020617] text-white transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="flex flex-col h-full border-r border-white/5">
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-rose-500/40 text-white font-black">S</div>
                <span className="font-black text-xl tracking-tighter text-white">SUPER <span className="text-rose-500">ADMIN</span></span>
              </div>
            )}
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400">{isCollapsed ? '→' : '←'}</button>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-6">
            {navigation.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                {section.category && !isCollapsed && <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-3 mb-2">{section.category}</div>}
                {section.items?.map(item => (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${pathname === item.href ? 'bg-rose-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}>
                    <span className="text-lg">{item.icon}</span>
                    {!isCollapsed && <span className="text-sm font-bold">{item.name}</span>}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <header className="h-16 bg-slate-900 border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-30">
          <h2 className="text-sm font-bold">PIVOT CENTRAL CONTROL</h2>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
