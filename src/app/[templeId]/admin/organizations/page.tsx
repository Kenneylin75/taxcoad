// @ts-nocheck
"use client";
import React, { useState, useEffect } from 'react';
import { 
  fetchOrganizations, 
  fetchPersonnel, 
  Organization, 
  User, 
  AppRole,
  getCurrentRole
} from '@/app/actions';

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orgs' | 'users'>('orgs');
  const [userRole, setUserRole] = useState<AppRole | null>(null);

  useEffect(() => {
    async function loadData() {
      const [o, u, r] = await Promise.all([fetchOrganizations(), fetchPersonnel(), getCurrentRole()]);
      setOrgs(o);
      setUsers(u);
      setUserRole(r);
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">初始化組織系統中...</p>
      </div>
    );
  }

  // 根據角色進行過濾
  const filteredOrgs = orgs.filter(o => {
    if (userRole === 'SuperAgent') return o.type === 'Temple';
    if (userRole === 'Distributor') return o.type === 'Temple';
    return true; // SuperAdmin 顯示所有
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">
            {userRole === 'SuperAgent' ? '直屬服務宮廟管理' : 
             userRole === 'Distributor' ? '旗下服務宮廟管理' : '組織與帳戶管理中心'}
          </h1>
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mt-1">Identity Governance Hub</p>
        </div>

        {userRole === 'SuperAdmin' && (
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button 
              onClick={() => setActiveTab('orgs')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'orgs' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              組織清單
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'bg-[#0F172A] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              系統帳號
            </button>
          </div>
        )}
      </div>

      <main>
        {activeTab === 'orgs' ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg border border-slate-800">⛩️</div>
                 <div>
                    <h2 className="text-sm font-black text-slate-800">{userRole === 'SuperAgent' ? '我的直屬宮廟' : '全域組織清單'}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Enterprise Organizations</p>
                 </div>
              </div>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all shadow-sm flex items-center gap-2">
                <span>➕</span> 新增組織
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">組織名稱 / 標識</th>
                    {userRole === 'SuperAdmin' && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">屬性類型</th>}
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">運行狀態</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredOrgs.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg border border-slate-200">
                              ⛩️
                           </div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors">{o.name}</span>
                              <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {o.id}</span>
                           </div>
                        </div>
                      </td>
                      {userRole === 'SuperAdmin' && (
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                            o.type === 'Temple' ? 'bg-slate-900 text-amber-400 border-slate-800' : 
                            o.type === 'DistributorOffice' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            o.type === 'AgentOffice' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}>
                            {o.type}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                           <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                           {o.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                           ⚙️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-900 text-amber-500 rounded-xl flex items-center justify-center text-xl shadow-lg border border-slate-800">👥</div>
                 <div>
                    <h2 className="text-sm font-black text-slate-800">全系統人員管理</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Global Personnel Identity Provisioning</p>
                 </div>
              </div>
              <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all shadow-sm flex items-center gap-2">
                <span>➕</span> 建立管理帳號
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">人員姓名 / 帳號</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">系統權限角色</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">管理操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <img src={u.avatar} className="w-10 h-10 rounded-xl border border-slate-200 object-cover" alt="" />
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-800 group-hover:text-amber-600 transition-colors">{u.name}</span>
                              <span className="text-[10px] font-bold text-slate-400">@{u.account}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                           u.appRole === 'SuperAdmin' ? 'bg-[#0F172A] text-amber-400 border-slate-800' : 
                           ['SuperAgent', 'Distributor', 'DistSales'].includes(u.appRole) ? 'bg-blue-50 text-blue-600 border-blue-100' :
                           'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {u.appRole}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                           ⚙️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Cards (SuperAdmin only) */}
        {userRole === 'SuperAdmin' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="p-6 bg-[#0F172A] rounded-2xl text-white shadow-lg border border-slate-800 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl group-hover:scale-110 transition-transform">👑</div>
               <div className="font-black text-lg mb-2 text-amber-500">超級管理者</div>
               <div className="text-slate-400 text-xs leading-relaxed font-bold">擁有全域系統最高行政維度權限，可建立並核發任何級別的數位帳號能級。</div>
            </div>
            <div className="p-6 bg-white rounded-2xl text-slate-800 shadow-sm border border-slate-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-110 transition-transform">🚀</div>
               <div className="font-black text-lg mb-2">超級業務 / 經銷商</div>
               <div className="text-slate-500 text-xs leading-relaxed font-bold">開發並開通「全域宮廟」數位能級帳號，實時監控旗下經銷體系與業績數據。</div>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl text-slate-800 shadow-sm border border-slate-200 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 text-4xl group-hover:scale-110 transition-transform">⛩️</div>
               <div className="font-black text-lg mb-2 text-slate-700">宮廟管理員</div>
               <div className="text-slate-500 text-xs leading-relaxed font-bold">管理直屬宮廟內部的信眾數位案卷、全域預約、點燈紀錄與儀軌資料。</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

