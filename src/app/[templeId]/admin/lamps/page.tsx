"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  fetchLampCategories, 
  fetchLampRecords, 
  fetchGuests, 
  fetchGuestByPhone,
  createOrUpdateGuest,
  createLampRecord, 
  checkLampNotifications,
  saveLampCategory,
  deleteLampCategory,
  confirmPayment,
  renewLampRecord,
  uploadCustomerMedia,
  LampCategory,
  LampRecord
} from '@/app/actions';

const CATEGORY_UI_CONFIG = [
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', fill: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-600', fill: 'bg-rose-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', fill: 'bg-emerald-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', fill: 'bg-violet-500' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', fill: 'bg-sky-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', fill: 'bg-orange-500' },
];

const getUIStyles = (index: number) => CATEGORY_UI_CONFIG[index % CATEGORY_UI_CONFIG.length];

export default function LampManagementPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic text-center">Karma Syncing...</p>
      </div>
    }>
      <LampManagementContent />
    </Suspense>
  );
}

function LampManagementContent() {
  const [categories, setCategories] = useState<LampCategory[]>([]);
  const [records, setRecords] = useState<LampRecord[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Active' | 'Expiring' | 'Expired'>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [tempCapacity, setTempCapacity] = useState<number>(1000);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [viewMode, setViewMode] = useState<'List' | 'Wall'>('List');

   useEffect(() => {
      if (selectedCategoryFilter) {
         const cat = categories.find(c => c.id === selectedCategoryFilter);
         if (cat) setTempCapacity(cat.totalSlots || 0);
      } else {
         const totalSum = categories.reduce((sum, c) => sum + (c.totalSlots || 0), 0);
         setTempCapacity(totalSum || 1000); // Default to 1000 if no categories yet
      }
   }, [selectedCategoryFilter, categories]);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<LampCategory> | null>(null);

  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [lampGuestName, setLampGuestName] = useState<string>('');
  const [price, setPrice] = useState<number>(0);
  const [duration, setDuration] = useState<number>(365);
  
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newGuestData, setNewGuestData] = useState({ name: '', phone: '' });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [cats, recs, gst] = await Promise.all([
        fetchLampCategories(),
        fetchLampRecords(),
        fetchGuests()
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setRecords(Array.isArray(recs) ? recs : []);
      setGuests(Array.isArray(gst) ? gst : []);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handlePhoneSearch = async (val: string) => {
    setGuestSearch(val);
    if (val.length === 10) {
      setIsSearchingGuest(true);
      try {
        const gst = await fetchGuestByPhone(val);
        if (gst) {
          setSelectedGuest(gst);
          setShowQuickCreate(false);
        } else {
          setSelectedGuest(null);
          setShowQuickCreate(true);
          setNewGuestData({ ...newGuestData, phone: val });
        }
      } catch (e) { console.error(e); }
      finally { setIsSearchingGuest(false); }
    } else {
      if (selectedGuest) setSelectedGuest(null);
      setShowQuickCreate(false);
    }
  };

  const handleQuickCreate = async () => {
    if (!newGuestData.name || !newGuestData.phone) return;
    setIsSubmitting(true);
    try {
      const res = await createOrUpdateGuest({ ...newGuestData, account: newGuestData.phone });
      if (res.success) {
        const gst = await fetchGuestByPhone(newGuestData.phone);
        setSelectedGuest(gst);
        setShowQuickCreate(false);
        alert("✨ 信眾資料已成功建立並選取！");
      }
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat) {
      setPrice(cat.price || 1200);
      setDuration(cat.durationDays || 365);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGuest || !selectedCategory) return;
    setIsSubmitting(true);
    const res = await createLampRecord({
      phone: selectedGuest.phone,
      guestName: lampGuestName || selectedGuest.name,
      categoryId: selectedCategory,
      categoryName: categories.find(c => c.id === selectedCategory)?.name || '未定義',
      price: price,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: duration
    });
    if (res.success) {
      await loadData();
      setIsModalOpen(false);
      resetForm();
      alert("🏮 點燈登記成功！");
    }
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setSelectedGuest(null);
    setGuestSearch('');
    setSelectedCategory('');
    setLampGuestName('');
    setPrice(0);
    setDuration(365);
    setShowQuickCreate(false);
    setNewGuestData({ name: '', phone: '' });
  };

  const filteredRecords = useMemo(() => {
    return (records || []).filter(r => {
      const matchesSearch = (r.guestName || '').includes(searchQuery) || (r.phone || '').includes(searchQuery) || (r.categoryName || '').includes(searchQuery);
      const matchesFilter = filter === 'All' || r.status === filter;
      const matchesCategory = !selectedCategoryFilter || r.categoryId === selectedCategoryFilter;
      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [records, searchQuery, filter, selectedCategoryFilter]);

  if (isLoading && records.length === 0) return <div className="h-screen bg-slate-50 flex items-center justify-center animate-pulse text-slate-300 font-bold uppercase tracking-widest italic text-2xl">Loading Karma...</div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">點燈管理中心</h1>
          <p className="text-slate-400 text-xs font-bold tracking-[0.4em] uppercase mt-2">Lamp Registry & Monitoring</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setIsCategoryModalOpen(true)} className="w-14 h-14 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center text-xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all">⚙️</button>
           <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-3"><span>✨</span> 新增登記</button>
        </div>
      </div>

      {/* 🚀 燈種現況概覽 */}
      <div className="space-y-5">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">服務資源監控 • CATEGORIES</h3>
            {selectedCategoryFilter && <button onClick={() => setSelectedCategoryFilter(null)} className="text-[10px] font-black text-indigo-600 hover:underline">顯示全部 ➔</button>}
         </div>
         <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide -mx-2 px-2">
            {categories.map((cat, idx) => {
               const styles = getUIStyles(idx);
               const count = records.filter(r => r.categoryId === cat.id).length;
               const usagePercent = Math.min(100, (count / (cat.totalSlots || 1000)) * 100);
               const isSelected = selectedCategoryFilter === cat.id;
               return (
                  <div key={cat.id} onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.id)} className={`min-w-[300px] p-9 rounded-[45px] border-2 transition-all cursor-pointer group ${isSelected ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-50 text-slate-900 hover:border-indigo-100 shadow-sm'}`}>
                     <div className="flex justify-between items-start mb-8">
                        <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center text-3xl border-4 shadow-sm transition-all ${isSelected ? 'bg-indigo-600 border-white/20' : `${styles.bg} ${styles.border}`}`}>🕯️</div>
                        <div className="text-right"><p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>已點燈位</p><p className="text-2xl font-black mt-1 leading-none">{count}</p></div>
                     </div>
                     <h4 className={`text-2xl font-black italic mb-8 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{cat.name}</h4>
                     <div className="space-y-3">
                        <div className="flex justify-between text-[9px] font-black uppercase"><span className={isSelected ? 'text-indigo-300' : 'text-slate-400'}>飽和度</span><span className={isSelected ? 'text-white' : 'text-slate-900'}>{Math.round(usagePercent)}%</span></div>
                        <div className={`h-2 w-full rounded-full overflow-hidden ${isSelected ? 'bg-slate-800' : 'bg-slate-50'}`}><div className={`h-full rounded-full transition-all duration-1000 ${isSelected ? 'bg-indigo-400 shadow-lg' : styles.fill}`} style={{ width: `${usagePercent}%` }}></div></div>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col xl:flex-row items-center justify-between gap-6 bg-white p-5 rounded-[40px] border-2 border-slate-50 shadow-sm">
         <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {['All', 'Active', 'Expiring', 'Expired'].map((f) => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>{f === 'All' ? '全部' : f === 'Active' ? '運行中' : f === 'Expiring' ? '即將屆期' : '已屆期'}</button>
            ))}
         </div>
         <div className="flex gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setViewMode('List')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${viewMode === 'List' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>清單</button>
               <button onClick={() => setViewMode('Wall')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${viewMode === 'Wall' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>視覺牆</button>
            </div>
            <div className="relative w-full xl:max-w-md">
               <input type="text" placeholder="搜尋姓名、電話..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-8 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all" />
            </div>
         </div>
      </div>

      {/* Records Grid */}
      {viewMode === 'List' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filteredRecords.map((record) => {
              const catIdx = categories.findIndex(c => c.id === record.categoryId);
              const styles = getUIStyles(catIdx === -1 ? 0 : catIdx);
              const start = new Date(record.startDate || '');
              const now = new Date();
              const totalDays = record.durationDays || categories.find(c => c.id === record.categoryId)?.durationDays || 365;
              const isActiveAndPaid = record.status === 'Active' && record.paymentStatus === 'Paid';
              const elapsedDays = isActiveAndPaid ? Math.ceil((now.getTime() - start.getTime()) / (1000*60*60*24)) : 0;
              const progress = isActiveAndPaid ? Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100)) : 0;
              const expiry = new Date(record.expiryDate || '');
              const daysLeft = isActiveAndPaid ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : totalDays;
              return (
                <div key={record.id} className="bg-white p-12 rounded-[60px] border-2 border-slate-50 shadow-sm hover:shadow-[0_50px_100px_rgba(0,0,0,0.06)] transition-all group flex flex-col h-full animate-in fade-in slide-in-from-bottom-4">
                   <div className="flex justify-between items-start mb-10">
                      <div className={`w-16 h-16 rounded-[28px] flex items-center justify-center text-4xl border-4 shadow-sm ${styles.bg} ${styles.border}`}>🕯️</div>
                      
<div className="flex flex-col items-end gap-2">
  <div className="flex gap-2">
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-sm ${record.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
      {record.paymentStatus === 'Paid' ? '已付款' : record.paymentStatus === 'Pending' ? '待確認對帳' : '待付款'}
    </span>
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-sm ${record.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : record.status === 'Pending' ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
      {record.status === 'Active' ? '服務中' : record.status === 'Pending' ? '等待安奉' : '即將到期'}
    </span>
  </div>
  {record.paymentStatus === 'Pending' && record.paymentRef && <span className="text-[10px] font-bold text-slate-400">對帳碼: {record.paymentRef}</span>}
</div>

                   </div>
                   <div className="flex-1 space-y-2">
                      <p className={`text-sm font-black uppercase tracking-widest mb-1 ${styles.text}`}>{record.categoryName}</p>
                      <h2 className="text-3xl font-black text-slate-950 tracking-tighter italic leading-tight">
                         {record.guestName}
                      </h2>
                      {(() => {
                         const accountName = guests.find(g => g.phone === record.phone)?.name;
                         if (accountName && accountName !== record.guestName) {
                            return <p className="text-xs text-indigo-600 font-bold mt-1 bg-indigo-50 inline-block px-2 py-1 rounded">代點人 (主帳號)：{accountName}</p>;
                         }
                         return null;
                      })()}
                      <p className="text-sm text-slate-400 font-bold mt-1 tracking-widest">{record.phone}</p>
                   </div>
                   <div className="mt-10 pt-10 border-t-2 border-slate-50 space-y-6">
                      <div className="space-y-2"><div className="flex justify-between text-[10px] font-black text-slate-300 uppercase"><span>消耗進度 ({totalDays}天)</span><span>{Math.round(progress)}%</span></div><div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden shadow-inner"><div className={`h-full rounded-full transition-all duration-1000 shadow-sm ${styles.fill}`} style={{ width: `${progress}%` }}></div></div></div>
                      <div className="flex items-center justify-between"><div className="text-center bg-slate-50 px-6 py-4 rounded-3xl border-2 border-slate-100 min-w-[100px] shadow-sm"><p className="text-2xl font-black text-slate-900 leading-none">{daysLeft > 0 ? daysLeft : 0}</p><p className="text-[10px] font-bold text-slate-400 uppercase mt-1">天 剩 餘</p></div><div className="text-right"><p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">結緣金</p><p className="text-2xl font-black text-slate-900 italic tracking-tight">NT$ {(record.price || 0).toLocaleString()}</p></div></div>
                      <div className="space-y-2 mt-4">
                        {(record.paymentStatus === 'Unpaid' || record.paymentStatus === 'Pending') && (
                          <button onClick={async () => {
                             if(confirm('確認已收到款項嗎？' + (record.paymentRef ? ' (對帳碼: ' + record.paymentRef + ')' : ''))) {
                               const res = await confirmPayment(record.id, 'Lamp');
                               if(res.success) { alert('✅ 已標記為已收款！'); await loadData(); }
                             }
                          }} className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-colors shadow-lg active:scale-95">
                             💵 標記為已收款
                          </button>
                        )}
                        {record.status === 'Pending' && (
                          <button onClick={async () => {
                             if(confirm('確定要啟動安奉嗎？')) {
                               const { activateLampRecord } = await import('@/app/actions');
                               const res = await activateLampRecord(record.id);
                               if(res.success) { alert('✅ 安奉已啟動！'); await loadData(); }
                             }
                          }} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs tracking-widest uppercase transition-colors shadow-lg active:scale-95">
                             🏮 啟動安奉
                          </button>
                        )}
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      ) : (
        <div className="bg-white p-8 md:p-12 lg:p-20 rounded-[80px] shadow-sm relative overflow-hidden border-8 border-slate-50">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-3xl shadow-[0_10px_30px_rgba(245,158,11,0.3)] animate-pulse">🏮</div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase leading-none">萬 佛 朝 宗 燈 牆</h3>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Macro Dynamics Monitoring</p>
                       <div className="h-4 w-px bg-slate-200"></div>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-indigo-600 uppercase">
                             {selectedCategoryFilter ? '單項席次規模:' : '全覽席次總和:'}
                          </span>
                          <input 
                            type="number" 
                            value={tempCapacity}
                            readOnly={!selectedCategoryFilter}
                            onChange={(e) => setTempCapacity(parseInt(e.target.value) || 0)}
                            onBlur={async () => {
                               if (selectedCategoryFilter) {
                                  const cat = categories.find(c => c.id === selectedCategoryFilter);
                                  if (cat) {
                                     await saveLampCategory({ ...cat, totalSlots: tempCapacity });
                                     await loadData();
                                  }
                               }
                            }}
                            onKeyDown={async (e) => {
                               if (e.key === 'Enter') {
                                  e.currentTarget.blur();
                               }
                            }}
                            className={`bg-slate-100 border-2 rounded-lg px-3 py-1 text-xs font-black text-slate-900 w-20 outline-none transition-all ${!selectedCategoryFilter ? 'border-transparent opacity-60 cursor-not-allowed' : 'border-transparent focus:border-indigo-500'}`}
                          />
                          {selectedCategoryFilter && (
                             <span className="text-[9px] font-bold text-slate-400 animate-pulse">← 按 Enter 儲存單項規模</span>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4">
                 {categories.map((c, i) => (
                    <button key={c.id} onClick={() => setSelectedCategoryFilter(c.id)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${selectedCategoryFilter === c.id ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                       {c.name}
                    </button>
                 ))}
                 <button onClick={() => setSelectedCategoryFilter(null)} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${!selectedCategoryFilter ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>全覽</button>
              </div>
           </div>

           <div className="relative z-10 grid grid-cols-8 sm:grid-cols-12 md:grid-cols-20 lg:grid-cols-25 gap-2 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              {[...Array(selectedCategoryFilter ? (categories.find(c => c.id === selectedCategoryFilter)?.totalSlots || 500) : 1000)].map((_, i) => {
                 const record = filteredRecords[i];
                 const catIdx = record ? categories.findIndex(c => c.id === record.categoryId) : -1;
                 const styles = getUIStyles(catIdx === -1 ? 0 : catIdx);
                 return (
                   <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-[10px] transition-all cursor-pointer relative group ${record ? 'bg-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] animate-pulse hover:scale-150 z-20' : 'bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-inner'}`}>
                      {record ? '🕯️' : ''}
                      {record && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-40 bg-slate-900 text-white p-4 rounded-2xl shadow-3xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[100] border-2 border-white/10 scale-75 group-hover:scale-100 origin-bottom">
                           <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-lg">🕯️</div>
                              <div>
                                 <p className="font-black text-sm">{record.guestName}</p>
                                 {(() => {
                                    const accountName = guests.find(g => g.phone === record.phone)?.name;
                                    if (accountName && accountName !== record.guestName) {
                                       return <p className="text-[9px] font-bold text-indigo-300 mt-0.5">主帳號：{accountName}</p>;
                                    }
                                    return null;
                                 })()}
                              </div>
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{record.categoryName}</p>
                           <p className="text-[9px] font-black text-amber-400 mt-1">{record.phone}</p>
                        </div>
                      )}
                   </div>
                 )
              })}
           </div>
           <div className="mt-12 flex flex-wrap justify-center gap-12 text-slate-900 border-t border-slate-100 pt-10">
              <div className="flex items-center gap-3"><span className="w-5 h-5 bg-amber-400 rounded-md shadow-[0_0_15px_rgba(251,191,36,0.5)]"></span><span className="text-xs font-black uppercase tracking-widest text-slate-400">已啟燈 (Active)</span></div>
              <div className="flex items-center gap-3"><span className="w-5 h-5 bg-white rounded-md border-2 border-slate-100"></span><span className="text-xs font-black uppercase tracking-widest text-slate-400">待結緣 (Vacant)</span></div>
              <div className="bg-slate-100 px-6 py-2 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
                 當前視角載入: {selectedCategoryFilter ? (categories.find(c => c.id === selectedCategoryFilter)?.totalSlots || 500) : 1000} 個席位
              </div>
           </div>
        </div>
      )}

      {/* 🏮 新增登記 Modal (修復搜尋邏輯與狀態顯示) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6 animate-in zoom-in-95 duration-300">
           <div className="w-full max-w-2xl bg-white border-4 border-slate-900 rounded-[60px] p-16 shadow-2xl overflow-y-auto max-h-[95vh]">
              <div className="flex justify-between items-center mb-12"><h3 className="text-4xl font-black italic uppercase">核 定 啟 燈 登 記</h3><button onClick={() => setIsModalOpen(false)} className="text-2xl">✕</button></div>
              <div className="space-y-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Step 1. 檢索信眾身分</label>
                    <div className="relative">
                      <input type="text" placeholder="請輸入 10 碼電話" value={guestSearch} onChange={(e) => handlePhoneSearch(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[35px] px-10 py-6 text-3xl font-black outline-none focus:border-indigo-600 transition-all placeholder:text-slate-200 text-center shadow-inner" maxLength={10} />
                      {isSearchingGuest && <div className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>}
                    </div>

                    {/* 快速建立信眾區塊 */}
                    {showQuickCreate && (
                      <div className="bg-indigo-50 border-4 border-indigo-100 p-10 rounded-[50px] space-y-6 animate-in slide-in-from-top-4 duration-500 shadow-xl">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-bounce">👤</div>
                            <div>
                               <p className="text-2xl font-black text-slate-900">檢索不到資料</p>
                               <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">請填寫基本資訊進行快速建檔</p>
                            </div>
                         </div>
                         <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">信眾姓名</label>
                               <input type="text" value={newGuestData.name} onChange={e => setNewGuestData({...newGuestData, name: e.target.value})} className="w-full bg-white border-2 border-indigo-100 rounded-3xl px-8 py-5 text-xl font-black outline-none focus:border-indigo-600 shadow-sm" placeholder="例如：王小明" />
                            </div>
                            <button onClick={handleQuickCreate} disabled={!newGuestData.name || isSubmitting} className="w-full py-6 bg-indigo-600 text-white rounded-[35px] font-black text-sm uppercase tracking-[0.3em] shadow-xl hover:bg-slate-900 transition-all">建立檔案並選取 ➔</button>
                         </div>
                      </div>
                    )}

                    {/* 搜尋不到時的提示 (原邏輯，現在有了快速建立) */}
                    {!isSearchingGuest && guestSearch.length === 10 && !selectedGuest && !showQuickCreate && (
                      <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[40px] flex items-center justify-between animate-in fade-in shadow-sm">
                         <div className="flex items-center gap-8"><div className="w-16 h-16 bg-rose-500 text-white rounded-[24px] flex items-center justify-center text-3xl shadow-xl">✕</div><div><p className="text-2xl font-black text-slate-900">無效的輸入</p><p className="text-xs font-bold text-rose-600 uppercase tracking-widest mt-1">請重新確認電話號碼</p></div></div>
                         <button onClick={() => { setGuestSearch(''); setSelectedGuest(null); }} className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest">重試 ✕</button>
                      </div>
                    )}

                    {/* 搜尋成功顯示 */}
                    {selectedGuest && (
                       <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[40px] flex items-center justify-between animate-in fade-in shadow-sm"><div className="flex items-center gap-8"><div className="w-16 h-16 bg-emerald-500 text-white rounded-[24px] flex items-center justify-center text-3xl border-4 border-white shadow-xl">✓</div><div><p className="text-2xl font-black text-slate-900">{selectedGuest.name}</p><p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">身分驗證成功</p></div></div><button onClick={() => { setGuestSearch(''); setSelectedGuest(null); }} className="text-xs font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest">重設 ✕</button></div>
                    )}
                 </div>

                  {selectedGuest && (
                     <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-10 border-t-2 border-slate-50">
                        <div className="space-y-6">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Step 2. 配置服務類別與點燈人</label>
                           <div className="grid grid-cols-1 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">點燈人姓名 (家人)</label>
                                 <input type="text" value={lampGuestName} onChange={(e) => setLampGuestName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-8 py-5 text-xl font-black outline-none focus:border-indigo-600 shadow-inner" placeholder={`預設為：${selectedGuest.name}`} />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-3"><select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] px-10 py-5 font-black text-xl outline-none focus:border-indigo-600 appearance-none shadow-sm"><option value="">選擇燈種</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                              <div className="relative flex items-center"><span className="absolute left-10 text-xl font-black text-slate-300">NT$</span><input type="number" value={price} onChange={e => setPrice(parseInt(e.target.value))} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[30px] pl-20 pr-10 py-5 text-2xl font-black outline-none focus:border-indigo-600 shadow-inner text-center" /></div>
                           </div>
                        </div>
                        <button onClick={handleSubmit} disabled={isSubmitting || !selectedCategory} className="w-full py-9 bg-slate-900 text-white rounded-[50px] font-black text-sm uppercase tracking-[0.5em] shadow-3xl hover:bg-indigo-600 transition-all active:scale-[0.98]">確 認 啟 燈 🚀</button>
                     </div>
                  )}
              </div>
           </div>
        </div>
      )}

      {/* ⚙️ 服務類別設定 Modal - 升級為通透亮色版面 */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-white/60 backdrop-blur-xl p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-[80px] p-10 lg:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col h-[85vh]">
              <div className="flex justify-between items-center mb-10">
                 <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl">⚙️</div>
                    <div>
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">服 務 類 別 設 定</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Lamp Service Configuration</p>
                    </div>
                 </div>
                 <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-2xl hover:bg-rose-50 hover:text-rose-500 transition-all hover:rotate-90">✕</button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row gap-10 overflow-hidden">
                 {/* 左側列表 */}
                 <div className="w-full lg:w-2/5 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
                    {categories.map((cat, idx) => {
                       const styles = getUIStyles(idx);
                       const isEditing = editingCategory?.id === cat.id;
                       return (
                          <div key={cat.id} onClick={() => setEditingCategory(cat)} className={`p-8 rounded-[40px] border-2 cursor-pointer transition-all relative overflow-hidden group ${isEditing ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-[1.02]' : 'bg-slate-50 border-transparent text-slate-900 hover:border-indigo-200 hover:bg-white hover:shadow-xl'}`}>
                             {isEditing && <div className="absolute top-0 right-0 p-4 animate-pulse">✨</div>}
                             <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${isEditing ? 'bg-white/10 border-white/20' : `${styles.bg} ${styles.border}`}`}>🕯️</div>
                                <div>
                                   <p className={`font-black text-2xl italic leading-tight ${isEditing ? 'text-white' : 'text-slate-900'}`}>{cat.name}</p>
                                   <div className={`flex gap-4 mt-2 text-[10px] font-black uppercase ${isEditing ? 'text-indigo-400' : 'text-slate-400'}`}>
                                      <span>NT$ {cat.price?.toLocaleString()}</span>
                                      <span>•</span>
                                      <span>{cat.durationDays} 天</span>
                                      <span>•</span>
                                      <span>{cat.totalSlots} 位</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                       );
                    })}
                    <button onClick={() => setEditingCategory({ name: '', price: 1200, durationDays: 365, totalSlots: 500 })} className="w-full p-10 border-4 border-dashed border-slate-100 rounded-[40px] text-slate-300 font-black text-xl uppercase tracking-widest hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all group">
                       <span className="group-hover:scale-125 transition-transform inline-block mr-3">＋</span> 新增服務類別
                    </button>
                 </div>

                 {/* 右側編輯器 - 修正垂直置中導致的截斷問題 */}
                 <div className="w-full lg:w-3/5 bg-slate-50/50 rounded-[60px] p-8 lg:p-14 border-2 border-slate-100 relative overflow-y-auto custom-scrollbar flex flex-col justify-start">
                    {editingCategory ? (
                       <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 relative z-10 py-4">
                          <div className="mb-4">
                             <h4 className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">{editingCategory.id ? '編輯現有項目' : '✨ 建立全新類別'}</h4>
                             <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{editingCategory.name || '未命名服務'}</p>
                          </div>

                          <div className="space-y-4 bg-white p-10 rounded-[40px] shadow-sm border-2 border-slate-100">
                             <label className="text-xs font-black text-slate-500 ml-2 uppercase tracking-widest block mb-2">1. 燈種名稱 (Required Name)</label>
                             <input 
                               type="text" 
                               value={editingCategory.name || ''} 
                               onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} 
                               className="w-full bg-slate-50 border-2 border-transparent rounded-[25px] px-8 py-5 text-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-200" 
                               placeholder="請輸入燈種名稱，例如：藥師燈" 
                               autoFocus
                             />
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                             <div className="space-y-4 bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
                                <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest block mb-2">2. 結緣金額 (NT$)</label>
                                <div className="relative">
                                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">$</span>
                                   <input type="number" value={editingCategory.price ?? ''} onChange={e => setEditingCategory({...editingCategory, price: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] pl-14 pr-6 py-4 text-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all text-center" />
                                </div>
                             </div>
                             <div className="space-y-4 bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
                                <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest block mb-2">3. 總燈位席次 (Slots)</label>
                                <div className="relative">
                                   <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">#</span>
                                   <input type="number" value={editingCategory.totalSlots ?? ''} onChange={e => setEditingCategory({...editingCategory, totalSlots: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] pl-14 pr-6 py-4 text-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all text-center" />
                                </div>
                             </div>
                          </div>

                          <div className="space-y-4 bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
                             <div className="flex justify-between items-center mb-2 px-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">4. 安奉有效天數 (Days)</label>
                                <div className="flex gap-2">
                                   <button onClick={() => setEditingCategory({...editingCategory, durationDays: 365})} className="text-[9px] font-black bg-slate-50 px-2 py-1 rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">一年</button>
                                   <button onClick={() => setEditingCategory({...editingCategory, durationDays: 180})} className="text-[9px] font-black bg-slate-50 px-2 py-1 rounded-md text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">半年</button>
                                </div>
                             </div>
                             <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-300">📅</span>
                                <input type="number" value={editingCategory.durationDays ?? ''} onChange={e => setEditingCategory({...editingCategory, durationDays: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] pl-16 pr-20 py-4 text-2xl font-black outline-none focus:border-indigo-600 focus:bg-white transition-all" placeholder="365" />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">Days</span>
                             </div>
                          </div>

                          <div className="space-y-4 bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
                             <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest block mb-2">5. 服務內容 (Description)</label>
                             <textarea 
                                value={editingCategory.description || ''} 
                                onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} 
                                className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all custom-scrollbar placeholder:text-slate-300 min-h-[120px] resize-y" 
                                placeholder="請輸入該燈種的保佑事項或服務內容介紹..." 
                             />
                          </div>

                          <div className="space-y-4 bg-white p-8 rounded-[40px] shadow-sm border-2 border-slate-100">
                              <label className="text-[10px] font-black text-slate-500 ml-2 uppercase tracking-widest block mb-2">6. 注意事項 (Precautions)</label>
                              <textarea 
                                 value={editingCategory.precautions || ''} 
                                 onChange={e => setEditingCategory({...editingCategory, precautions: e.target.value})} 
                                 className="w-full bg-slate-50 border-2 border-transparent rounded-[20px] px-6 py-4 text-sm font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all custom-scrollbar placeholder:text-slate-300 min-h-[80px] resize-y" 
                                 placeholder="點燈後將於三日內為您上燈，並寄送電子通知。" 
                              />
                           </div>

                           <div className="flex gap-4 pt-4">
                             <button onClick={async () => { if (!editingCategory.id) return; if(confirm("確定要刪除此燈種嗎？")) { const res = await deleteLampCategory(editingCategory.id); if (!res.success) { alert(res.error); } else { await loadData(); setEditingCategory(null); } } }} className="px-10 py-6 bg-rose-50 text-rose-500 rounded-[30px] font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all">刪除</button>
                             <button onClick={async () => { if (!editingCategory.name) return; await saveLampCategory(editingCategory); await loadData(); setEditingCategory(null); alert("✅ 服務配置已成功儲存"); }} className="flex-1 py-6 bg-slate-900 text-white rounded-[35px] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all hover:scale-[1.02] active:scale-[0.98]">保 存 配置 ✨</button>
                          </div>
                       </div>
                    ) : (
                       <div className="flex flex-col items-center justify-center space-y-8 animate-pulse text-slate-200">
                          <div className="w-32 h-32 bg-white rounded-[40px] flex items-center justify-center text-6xl shadow-inner border-2 border-slate-100">🏮</div>
                          <div className="text-center">
                             <p className="text-xs font-black uppercase tracking-[0.5em] italic">請選取左側項目進行修改</p>
                             <p className="text-[10px] font-bold mt-2 opacity-60">SELECT A CATEGORY TO BEGIN EDITING</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
