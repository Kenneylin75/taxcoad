"use client";

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AppRole, createPersonnel, deletePersonnel } from '@/app/actions';

interface Account {
  id: string;
  name: string;
  role: AppRole;
  account: string;
  status: string;
  phone: string;
  serviceCount: number;
  avatar?: string;
  permissions?: string[];
}

interface PersonnelManagerClientProps {
  initialAccounts: Account[];
  currentRole: AppRole;
}

export default function PersonnelManagerClient({ initialAccounts, currentRole }: PersonnelManagerClientProps) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingPermissionsAccount, setEditingPermissionsAccount] = useState<Account | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  // New state for Role Selection Cards
  const [selectedRole, setSelectedRole] = useState<string>('Staff');

  const permissionCategories = [
    { id: 'calendar', name: '預約行程日曆', icon: '📅' },
    { id: 'customers', name: '信眾檔案中心', icon: '📜' },
    { id: 'lamps', name: '點燈紀錄管理', icon: '🏮' },
    { id: 'services', name: '服務項目設定', icon: '📍' },
    { id: 'analytics', name: '數據分析中心', icon: '📈' },
    { id: 'slots', name: '預約時段設定', icon: '⏰' },
    { id: 'queue', name: '排隊管理模組', icon: '🚶' },
    { id: 'events', name: '活動服務管理', icon: '🧧' },
    { id: 'settings', name: '系統核心設定', icon: '⚙️' },
    { id: 'billing', name: '帳務管理中心', icon: '💳' },
  ];

  const handleOpenPermissions = (acc: Account) => {
    setEditingPermissionsAccount(acc);
    setSelectedPerms(acc.permissions || []);
  };

  const togglePermission = (permId: string) => {
    setSelectedPerms(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    );
  };

  const handleSavePermissions = () => {
    if (!editingPermissionsAccount) return;
    startTransition(async () => {
      const { updateAccountPermissions } = await import('@/app/actions');
      await updateAccountPermissions(editingPermissionsAccount.id, selectedPerms);
      setEditingPermissionsAccount(null);
      alert('✅ 帳號權限已更新！');
      router.refresh();
    });
  };

  const handleUpdatePassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPermissionsAccount) return;
    const formData = new FormData(e.currentTarget);
    const newPass = formData.get('newPassword') as string;
    if (!newPass) return alert('請輸入新密碼');
    
    startTransition(async () => {
      const { updateAccountPassword } = await import('@/app/actions');
      await updateAccountPassword(editingPermissionsAccount.id, newPass);
      alert('✅ 密碼已重設！');
      (e.target as HTMLFormElement).reset();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除此帳號嗎？此操作不可還原。')) return;
    startTransition(async () => {
      const res = await deletePersonnel(id);
      if (res && res.success === false) {
        alert(res.message);
      } else {
        router.refresh();
      }
    });
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createPersonnel(formData);
      setShowAdd(false);
      router.refresh();
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'TempleAdmin': return { label: '系統管理員', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'Staff': return { label: '行政營運人員', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 'Service': return { label: '專業服務師傅', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      default: return { label: role, color: 'bg-gray-50 text-gray-500 border-gray-200' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">帳戶權限管理</h1>
          <p className="text-slate-500 text-sm mt-1">PIVOT 數位身分與權限中心</p>
        </div>

        <button 
          onClick={() => { setShowAdd(true); setSelectedRole('Staff'); }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-700 transition-all shadow-sm flex items-center gap-2"
        >
           <span>＋</span> 建立數位身分
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">總帳號數</p>
               <p className="text-2xl font-bold text-slate-800 mt-1">{initialAccounts.length}</p>
            </div>
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-2xl text-slate-400">👥</div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">啟動中</p>
               <p className="text-2xl font-bold text-emerald-600 mt-1">{initialAccounts.filter(a => a.status === 'Active').length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl text-emerald-500">🟢</div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">管理權限</p>
               <p className="text-2xl font-bold text-indigo-600 mt-1">{initialAccounts.filter(a => a.role === 'TempleAdmin').length}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl text-indigo-500">🛡️</div>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">成員名稱 / 帳號</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">角色分類</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">聯絡電話</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">狀態</th>
                     <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">管理決策</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {initialAccounts.map((acc) => {
                    const badge = getRoleBadge(acc.role);
                    return (
                      <tr key={acc.id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border border-slate-200 shadow-sm ${acc.role === 'TempleAdmin' ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                                 {acc.role === 'TempleAdmin' ? '🛡️' : '👤'}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{acc.name}</p>
                                 <p className="text-xs font-medium text-slate-400">@{acc.account}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${badge.color}`}>
                              {badge.label}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           <span className="text-sm font-medium text-slate-600">{acc.phone}</span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${acc.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                              <span className={`text-xs font-bold ${acc.status === 'Active' ? 'text-emerald-600' : 'text-rose-600'}`}>{acc.status === 'Active' ? '啟動中' : '已停用'}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                              <button 
                                onClick={() => handleOpenPermissions(acc)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold hover:bg-indigo-50 hover:text-indigo-700 transition-all border border-slate-200"
                              >
                                 權限配置
                              </button>
                              {acc.role !== 'TempleAdmin' && (
                                 <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 rounded-md shadow-sm transition-all">✕</button>
                              )}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h3 className="text-lg font-bold text-slate-800">建立數位身分</h3>
                    <p className="text-xs text-slate-500 mt-1">請填寫基本資料並選擇角色分類</p>
                 </div>
                 <button onClick={() => setShowAdd(false)} className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">✕</button>
              </div>
              <form onSubmit={handleCreate} className="p-6 space-y-6">
                 <div className="space-y-4">
                    <p className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">基本資料</p>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">真實姓名</label>
                          <input type="text" name="name" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="例：王小明" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">系統帳號</label>
                          <input type="text" name="account" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="例：ming.wang" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">聯絡電話</label>
                          <input type="tel" name="phone" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="例：0912345678" pattern="^09\d{8}$" minLength={10} maxLength={10} title="請輸入 10 碼電話號碼" onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/\D/g, ''); }} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600">初始密碼</label>
                          <input type="password" name="password" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 outline-none transition-colors" placeholder="設定登入密碼" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-2">
                    <p className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">職務角色分類</p>
                    {/* Hidden input to pass the role value to the form */}
                    <input type="hidden" name="role" value={selectedRole} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button 
                         type="button"
                         onClick={() => setSelectedRole('Staff')}
                         className={`p-4 rounded-xl border text-left transition-all ${selectedRole === 'Staff' ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                       >
                          <div className="flex items-center gap-3 mb-2">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${selectedRole === 'Staff' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>💻</div>
                             <h4 className={`font-bold text-sm ${selectedRole === 'Staff' ? 'text-indigo-800' : 'text-slate-700'}`}>行政營運人員</h4>
                          </div>
                          <p className={`text-xs ${selectedRole === 'Staff' ? 'text-indigo-600/80' : 'text-slate-500'}`}>負責日常行政、信眾資料建立與基礎營運維護。可分配大部分一般模組權限。</p>
                       </button>
                       
                       <button 
                         type="button"
                         onClick={() => setSelectedRole('Service')}
                         className={`p-4 rounded-xl border text-left transition-all ${selectedRole === 'Service' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                       >
                          <div className="flex items-center gap-3 mb-2">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${selectedRole === 'Service' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>🧘</div>
                             <h4 className={`font-bold text-sm ${selectedRole === 'Service' ? 'text-blue-800' : 'text-slate-700'}`}>專業服務師傅</h4>
                          </div>
                          <p className={`text-xs ${selectedRole === 'Service' ? 'text-blue-600/80' : 'text-slate-500'}`}>負責執行各項專業服務項目。通常僅具備查看自身服務與客戶關聯檔案之權限。</p>
                       </button>

                       {currentRole === 'SuperAdmin' && (
                         <button 
                           type="button"
                           onClick={() => setSelectedRole('TempleAdmin')}
                           className={`p-4 rounded-xl border text-left transition-all md:col-span-2 ${selectedRole === 'TempleAdmin' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'bg-white border-slate-200 hover:border-amber-300'}`}
                         >
                            <div className="flex items-center gap-3 mb-2">
                               <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${selectedRole === 'TempleAdmin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>🛡️</div>
                               <h4 className={`font-bold text-sm ${selectedRole === 'TempleAdmin' ? 'text-amber-800' : 'text-slate-700'}`}>系統管理員 (Root)</h4>
                            </div>
                            <p className={`text-xs ${selectedRole === 'TempleAdmin' ? 'text-amber-700/80' : 'text-slate-500'}`}>最高權限角色。具備全系統所有模組的無限制存取權限，可管理其他成員。</p>
                         </button>
                       )}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-all">取消</button>
                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                       建立帳號
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Permissions Sidebar */}
      {editingPermissionsAccount && (
        <div className="fixed inset-0 z-[1100] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 border-l border-slate-200">
              <div className="p-6 border-b border-slate-100 flex flex-col bg-slate-50 relative">
                 <button onClick={() => setEditingPermissionsAccount(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center">✕</button>
                 <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-sm border border-indigo-100">🛡️</div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-800">{editingPermissionsAccount.name}</h3>
                       <p className="text-xs font-semibold text-slate-500 mt-1">權限配置面板</p>
                    </div>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                 <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">模組存取權限</h4>
                    <div className="grid grid-cols-1 gap-2">
                       {permissionCategories.map((cat) => {
                         const isSelected = selectedPerms.includes('all') || selectedPerms.includes(cat.id);
                         const isAll = selectedPerms.includes('all');
                         
                         return (
                           <div 
                             key={cat.id} 
                             onClick={() => !isAll && togglePermission(cat.id)}
                             className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                           >
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {cat.icon}
                                 </div>
                                 <span className={`font-semibold text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-600'}`}>{cat.name}</span>
                              </div>
                              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                                 {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 space-y-4">
                    <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">帳號安全管理</h4>
                    <form onSubmit={handleUpdatePassword} className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                       <label className="text-xs font-semibold text-slate-600 block">強制重設密碼</label>
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            name="newPassword" 
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none" 
                            placeholder="輸入新密碼..." 
                          />
                          <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-all">重設</button>
                       </div>
                    </form>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white flex gap-3">
                 <button onClick={() => setEditingPermissionsAccount(null)} className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">取消</button>
                 <button 
                   onClick={handleSavePermissions}
                   disabled={isPending || editingPermissionsAccount.role === 'TempleAdmin'}
                   className="flex-[2] bg-indigo-600 text-white font-medium py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50"
                 >
                    {isPending ? "儲存中..." : "儲存權限設定"}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
