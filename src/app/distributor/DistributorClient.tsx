"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addSalesMember, approveTempleByDistributor, rejectTempleByDistributor, fetchRoleWallets } from '../actions';
import TempleApplicationForm from '../components/TempleApplicationForm';

type TabType = 'dashboard' | 'team' | 'temples' | 'calendar' | 'finance' | 'tools' | 'profile';

export default function DistributorClient({
  distributorId,
  initialTeam,
  initialTemples,
  initialVisits,
  initialFinance,
  initialTools = []
}: {
  distributorId: string;
  initialTeam: any[];
  initialTemples: any[];
  initialVisits: any[];
  initialFinance: any;
  initialTools?: any[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [team, setTeam] = useState(initialTeam);
  const [temples] = useState(initialTemples);
  const [visits] = useState(initialVisits);
  const [tools] = useState(initialTools);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  useEffect(() => {
    fetchRoleWallets().then(list => {
      const myWallet = list.find(w => w.role === 'Distributor');
      if (myWallet) setWalletBalance(myWallet.balance);
    });
  }, []);
  
  const calendarEvents = useMemo(() => {
    const events: any[] = [];
    visits.forEach(v => {
       events.push({ ...v, eventType: 'visit', date: v.date || v.timestamp.split('T')[0] });
    });
    temples.filter(t => t.status === 'Active').forEach(t => {
       events.push({
          id: `activation-${t.id}`,
          eventType: 'activation',
          date: t.timestamp.split('T')[0],
          templeName: t.templeName,
          salesName: team.find(s => s.id === t.salesId)?.name || '未知',
          notes: `宮廟帳戶已正式開通並完成部署。負責業務：${team.find(s => s.id === t.salesId)?.name || '未知'}`,
          importance: 'Critical',
          timestamp: t.timestamp
       });
    });
    return events.sort((a,b) => b.date.localeCompare(a.date));
  }, [visits, temples, team]);

  const [isAddSalesOpen, setIsAddSalesOpen] = useState(false);
  const [isAddTempleOpen, setIsAddTempleOpen] = useState(false);
  const [salesForm, setSalesForm] = useState({ 
    name: '', account: '', 
    setupFeePercent: 20, rentYear1Percent: 15, rentYear2Percent: 10, rentYear3PlusPercent: 5 
  });
  
  const [accountError, setAccountError] = useState('');
  
  const validateAccount = async (acc: string) => {
    if (!acc) { setAccountError(''); return; }
    try {
      const { checkAccountExists } = await import('../actions');
      const exists = await checkAccountExists(acc);
      if (exists) {
        setAccountError(`此帳號不可使用，建議使用：${acc}${Math.floor(Math.random()*900)+100}`);
      } else {
        setAccountError('');
      }
    } catch(e) {}
  };

  const handleAddSales = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountError) {
      alert("目前帳號不可使用，請依照系統建議更換！");
      return;
    }
    const data = { ...salesForm, distributorId };
    const res = await addSalesMember(data);
    if (res.success) {
      setTeam([...team, { id: res.id, ...data }]);
      setIsAddSalesOpen(false);
      setSalesForm({ name: '', account: '', setupFeePercent: 20, rentYear1Percent: 15, rentYear2Percent: 10, rentYear3PlusPercent: 5 });
      router.refresh();
      alert("業務菁英帳戶已成功開通！預設密碼為 12345678");
    }
  };

  const handleApprove = async (id: string) => {
    await approveTempleByDistributor(id);
    window.location.reload();
  };

  const handleReject = async (id: string) => {
    await rejectTempleByDistributor(id);
    window.location.reload();
  };

  // --- RENDERING COMPONENTS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">
       <section className="relative overflow-hidden bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[40px] p-8 shadow-[0_20px_50px_rgba(30,64,175,0.1)]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/10 rounded-full blur-[60px] -ml-10 -mb-10"></div>
          
          <div className="relative z-10 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full">HQ Performance</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Live Update</span>
             </div>
             <div>
                <h2 className="text-4xl font-black tracking-tighter text-slate-900 italic">
                   ${initialFinance.netProfit.toLocaleString()}
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">總計實時營運淨利</p>
             </div>
             <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="bg-white/80 rounded-2xl p-4 border border-blue-50 shadow-sm">
                   <p className="text-[8px] font-black text-blue-500 uppercase">轄區業務數量</p>
                   <p className="text-xl font-black text-slate-900">{team.length} <span className="text-[10px] opacity-20">Elite</span></p>
                </div>
                <div className="bg-white/80 rounded-2xl p-4 border border-blue-50 shadow-sm">
                   <p className="text-[8px] font-black text-blue-500 uppercase">全域節點總量</p>
                   <p className="text-xl font-black text-slate-900">{temples.length} <span className="text-[10px] opacity-20">Nodes</span></p>
                </div>
             </div>
          </div>
       </section>

       <div className="grid grid-cols-2 gap-4">
          <div onClick={() => setActiveTab('temples')} className="bg-slate-950 rounded-[35px] p-6 shadow-2xl relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
             <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl group-hover:bg-blue-500/40 transition-all"></div>
             <div className="relative z-10 flex flex-col justify-between h-32">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">📋</div>
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">待處理審核</p>
                   <h3 className="text-3xl font-black text-white">{temples.filter(t => t.status === 'Pending').length}</h3>
                </div>
             </div>
          </div>
          <div className="bg-white rounded-[35px] p-6 border border-slate-100 shadow-xl flex flex-col justify-between h-44">
             <div className="flex justify-between items-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">市場熱度趨勢</p>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
             </div>
             <div className="h-16 flex items-end gap-1.5 px-1">
                {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                   <div key={i} className="flex-1 bg-blue-50 rounded-md relative overflow-hidden">
                      <div className="absolute bottom-0 inset-x-0 bg-blue-500/40 rounded-md transition-all duration-1000" style={{ height: `${h}%` }}></div>
                   </div>
                ))}
             </div>
             <p className="text-[8px] font-bold text-center text-slate-300 uppercase tracking-widest mt-2">Past 7 Days Analytics</p>
          </div>
       </div>

       <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] italic">轄區最新活動紀錄 Real-time</h3>
             <button onClick={() => setIsAddTempleOpen(true)} className="text-[8px] font-black text-blue-600 uppercase border-b border-blue-200 pb-0.5">+ 快速代開帳戶</button>
          </div>
          <div className="space-y-3">
             {calendarEvents.slice(0, 3).map(event => (
                <div key={event.id} className="bg-white p-5 rounded-[30px] border border-slate-50 shadow-sm flex items-center justify-between group hover:border-blue-500 hover:shadow-xl transition-all duration-500">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center text-xl transition-transform group-hover:rotate-12 ${event.eventType === 'activation' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                         {event.eventType === 'activation' ? '⚡' : '🤝'}
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-slate-900">{event.templeName}</h4>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{event.salesName} • {event.date}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${event.eventType === 'activation' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                         {event.eventType === 'activation' ? 'Success' : 'Logged'}
                      </span>
                   </div>
                </div>
             ))}
          </div>
       </section>

       <button onClick={() => setActiveTab('team')} className="w-full py-6 bg-slate-900 text-white rounded-[35px] font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
          管理全台業務菁英團隊 👤
       </button>
    </div>
  );

  const renderTeam = () => (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-700 pb-20">
       <div className="flex justify-between items-end px-4">
          <div>
             <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Network Access</p>
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">業務團隊管理</h3>
          </div>
          <button onClick={() => setIsAddSalesOpen(true)} className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 active:rotate-90 transition-all duration-500">＋</button>
       </div>
       <div className="grid grid-cols-1 gap-4 px-2">
          {team.map(s => (
             <div key={s.id} className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-50 space-y-5 hover:shadow-2xl hover:border-blue-100 transition-all group">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-slate-50 text-slate-900 rounded-[22px] flex items-center justify-center text-xl font-black italic shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                         {s.name.substring(0,1)}
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-slate-900 tracking-tighter">{s.name}</h4>
                         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {s.account}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-emerald-500 uppercase">Active Nodes</p>
                      <p className="text-sm font-black text-slate-900">12 處</p>
                   </div>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-50">
                   {[
                      { l: '開辦提成', v: s.commissionRules?.setupFeePercent },
                      { l: '第一年', v: s.commissionRules?.rentYear1Percent },
                      { l: '第二年', v: s.commissionRules?.rentYear2Percent },
                      { l: '長期', v: s.commissionRules?.rentYear3PlusPercent }
                   ].map((item, i) => (
                      <div key={i} className="text-center p-2 rounded-xl bg-slate-50/50">
                         <p className="text-[7px] font-black text-slate-400 uppercase mb-1 leading-none">{item.l}</p>
                         <p className="text-[10px] font-black text-slate-900">{item.v}%</p>
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </div>
    </div>
  );

  const renderTemples = () => (
    <div className="space-y-6 animate-in slide-in-from-right-10 duration-700 pb-20">
       <div className="px-4">
          <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Verification Flow</p>
          <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">待核准帳戶審核</h3>
       </div>
       <div className="space-y-4 px-2">
          {temples.map(t => (
             <div key={t.id} className={`p-8 rounded-[40px] border transition-all duration-500 flex flex-col gap-6 ${t.status === 'Active' ? 'bg-white border-slate-100 shadow-sm opacity-50' : 'bg-white border-blue-100 shadow-[0_15px_40px_rgba(59,130,246,0.1)]'}`}>
                <div className="flex justify-between items-start">
                   <div>
                      <div className="flex items-center gap-3">
                         <h4 className="text-2xl font-black text-slate-900 tracking-tighter">{t.templeName}</h4>
                         <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm ${t.status === 'Active' ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white animate-pulse'}`}>
                            {t.status}
                         </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">
                         業務員：{team.find(s => s.id === t.salesId)?.name} | 
                         方案：${t.paymentCycle === 'Yearly' 
                            ? (t.monthlyRent * 12 * 0.8).toLocaleString() + '/年 (年繳)' 
                            : t.monthlyRent.toLocaleString() + '/月'
                         }
                      </p>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-slate-300 uppercase">Timestamp</p>
                      <p className="text-[10px] font-black text-slate-400">{t.timestamp.split('T')[0]}</p>
                   </div>
                </div>
                {t.status === 'Pending' && (
                   <div className="flex gap-3">
                      <button onClick={() => handleApprove(t.id)} className="flex-[2] py-5 bg-blue-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-slate-900 transition-all">核准並開通節點 🚀</button>
                      <button onClick={() => handleReject(t.id)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-[24px] text-[10px] font-black uppercase tracking-widest">退回申請</button>
                   </div>
                )}
             </div>
          ))}
          {temples.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase italic tracking-[0.4em]">No pending applications</div>}
       </div>
    </div>
  );

    const renderTools = () => (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
       <div className="px-2 space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">資源與工具中心</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Support & Assets</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool: any, idx: number) => (
             <div key={idx} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all cursor-pointer">
                <div className="aspect-video relative bg-slate-100 overflow-hidden">
                   <img src={tool.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-1000 opacity-80" />
                   <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <span className="text-4xl">
                         {tool.type === 'video' ? '▶️' : tool.type === 'photo' ? '🖼️' : tool.type === 'document' ? '📄' : '📝'}
                      </span>
                   </div>
                   <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                      {tool.type === 'video' ? '影片' : tool.type === 'photo' ? '照片' : tool.type === 'document' ? '文件' : '電子合約'}
                   </div>
                </div>
                <div className="p-8 space-y-3">
                   <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">{tool.category} • {tool.uploadedAt || '2026/05/19'}</p>
                   <h5 className="text-lg font-black text-slate-900 tracking-tight leading-tight">{tool.title}</h5>
                   <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase">HQ SYNCED</span>
                      <button className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">開啟檢視</button>
                   </div>
                </div>
             </div>
          ))}
          {tools.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px]">
                <span className="text-4xl mb-4 block opacity-50">📭</span>
                <p className="text-sm font-black text-slate-400">總部目前尚未發布任何資源</p>
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-32 overflow-x-hidden">
       
       <div className="max-w-md mx-auto px-7 pt-14 flex justify-between items-end mb-10">
          <div>
             <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                <p className="text-[8px] font-black uppercase tracking-[0.5em] text-blue-600">Terminal V7 HQ</p>
             </div>
             <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic leading-none">
                {activeTab === 'dashboard' && '控制總覽'}
                {activeTab === 'team' && '業務菁英'}
                {activeTab === 'temples' && '申請審核'}
                {activeTab === 'calendar' && '拜訪紀錄'}
                {activeTab === 'finance' && '分潤規則'}
                {activeTab === 'tools' && '資源工具'}
             </h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.05)] flex items-center justify-center text-xl hover:scale-110 transition-all cursor-pointer">
             🛰️
          </div>
       </div>

       <main className="max-w-md mx-auto px-6 relative z-20">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'team' && renderTeam()}
          {activeTab === 'temples' && renderTemples()}
          {activeTab === 'tools' && renderTools()}
          
          {activeTab === 'calendar' && (
             <div className="space-y-4 animate-in slide-in-from-right-10 duration-700 pb-20">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-4">全域日誌 Timeline</h3>
                {calendarEvents.map(e => (
                   <div key={e.id} className="bg-white p-6 rounded-[35px] border border-slate-100 shadow-sm flex items-center gap-5 group cursor-pointer hover:border-blue-500 transition-all">
                      <div className="w-14 h-14 bg-slate-50 rounded-[20px] flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                         {e.eventType === 'activation' ? '⭐' : '📅'}
                      </div>
                      <div>
                         <h4 className="text-base font-black text-slate-900">{e.templeName}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.salesName} • {e.date}</p>
                      </div>
                   </div>
                ))}
             </div>
          )}

          {activeTab === 'finance' && (
             <div className="space-y-8 animate-in slide-in-from-right-10 duration-700 pb-20">
                {/* 錢包餘額顯示 */}
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl flex items-center justify-between group hover:border-blue-100 transition-all">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分潤錢包帳戶餘額 (Live Wallet)</p>
                      <p className="text-3xl font-black italic mt-1 text-slate-900">${walletBalance.toLocaleString()}</p>
                   </div>
                   <button onClick={() => alert('💳 提領申請已成功提交至系統總部 (超級管理員)！')} className="bg-slate-950 text-white hover:bg-blue-600 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95">申請撥款 💸</button>
                </div>

                <section className="bg-slate-950 p-12 rounded-[50px] shadow-2xl text-white relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-[60px] -mr-10 -mt-10"></div>
                   <div className="relative z-10 space-y-10">
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Global Commission Matrix</p>
                         <h3 className="text-3xl font-black italic tracking-tighter underline decoration-blue-500 decoration-8 underline-offset-8">分潤結算規則</h3>
                      </div>
                      <div className="space-y-6">
                         <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">開辦費標配</span>
                            <span className="text-2xl font-black text-white">20% <span className="text-[10px] text-blue-500">SHARE</span></span>
                         </div>
                         <div className="flex justify-between items-center pb-4 border-b border-white/5">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">月租費標配</span>
                            <span className="text-2xl font-black text-white">15% <span className="text-[10px] text-blue-500">SHARE</span></span>
                         </div>
                      </div>
                   </div>
                </section>
                <button className="w-full py-7 bg-white border border-slate-100 text-slate-900 rounded-[35px] font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl transition-all">儲存全域系統參數並同步 🌐</button>
             </div>
          )}
       </main>

       <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-md bg-white/70 backdrop-blur-3xl rounded-[40px] px-3 py-3 flex justify-between items-center shadow-[0_25px_60px_rgba(0,0,0,0.15)] z-[100] border border-white/50">
          {[
            {id: 'dashboard', icon: '💎', label: '總覽'},
            {id: 'team', icon: '👤', label: '團隊'},
            {id: 'temples', icon: '⚡', label: '審核'},
            {id: 'tools', icon: '🛠️', label: '工具'},
            {id: 'calendar', icon: '📅', label: '日誌'},
            {id: 'finance', icon: '⚙️', label: '規則'}
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id as any)}
              className={`flex flex-col items-center gap-1.5 transition-all duration-500 w-[15%] ${activeTab === t.id ? 'text-blue-600 scale-110' : 'text-slate-300 hover:text-slate-500'}`}
            >
               <span className={`text-xl transition-all duration-500 ${activeTab === t.id ? 'drop-shadow-[0_0_12px_rgba(37,99,235,0.4)]' : ''}`}>{t.icon}</span>
               <span className={`text-[7px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'opacity-100' : 'opacity-40'}`}>{t.label}</span>
            </button>
          ))}
       </nav>

       {/* --- MODALS (AURORA STYLE) --- */}
       {isAddTempleOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in zoom-in-95 duration-500">
           <div className="bg-white w-full max-w-xl rounded-[55px] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)] relative overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6 mb-8">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic">代開宮廟帳戶</h2>
                 <button onClick={()=>setIsAddTempleOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors">✕</button>
              </div>
              <TempleApplicationForm role="distributor" submittedBy="總部直接開通" distributorId={distributorId} onSuccess={() => window.location.reload()} onCancel={() => setIsAddTempleOpen(false)} />
           </div>
        </div>
      )}

      {isAddSalesOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[400] flex items-center justify-center p-10 animate-in fade-in">
           <form onSubmit={handleAddSales} className="bg-white w-full max-w-2xl rounded-[55px] p-12 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tighter italic">新增業務員合約</h3>
                 <button type="button" onClick={()=>setIsAddSalesOpen(false)} className="text-slate-300 text-2xl font-bold hover:text-slate-900 transition-all">✕</button>
              </div>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="業務員姓名" value={salesForm.name} onChange={e => setSalesForm({...salesForm, name: e.target.value})} className="bg-slate-50 rounded-[20px] p-5 text-sm font-black outline-none border border-slate-100 focus:border-blue-500 transition-all" required />
                    <div className="space-y-1">
                      <input type="text" placeholder="系統登入 ID" value={salesForm.account} onChange={e => {
                         setSalesForm({...salesForm, account: e.target.value});
                         validateAccount(e.target.value);
                      }} className={`w-full bg-slate-50 rounded-[20px] p-5 text-sm font-black outline-none border transition-all ${accountError ? 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500' : 'border-slate-100 focus:border-blue-500'}`} required />
                      {accountError && <p className="text-[10px] text-rose-500 font-bold px-2">{accountError}</p>}
                    </div>
                 </div>
                 <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[30px] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-600 transition-all">正式開通菁英帳戶 🚀</button>
              </div>
           </form>
        </div>
      )}

    </div>
  );
}
