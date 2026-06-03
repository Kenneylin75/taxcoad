import React from 'react';

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="bg-rose-500/10 border border-rose-500/20 p-8 rounded-[2rem]">
        <h1 className="text-3xl font-black text-white">超級管理員控制台</h1>
        <p className="text-slate-400 mt-2 font-medium">系統核心監控與全局權限管理</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">系統節點</p>
          <h3 className="text-2xl font-black text-white">128 Nodes</h3>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">活躍用戶</p>
          <h3 className="text-2xl font-black text-white">4,290 Users</h3>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">模組健康度</p>
          <h3 className="text-2xl font-black text-white">100% OK</h3>
        </div>
      </div>
    </div>
  );
}
