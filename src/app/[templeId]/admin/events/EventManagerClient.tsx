"use client";

import React, { useState, useTransition } from 'react';
import { EventItem, saveEvent, deleteEvent, fetchEventRegistrationsByEventId, markRegistrationAsPaid } from '@/app/actions';

export default function EventManagerClient({ initialEvents }: { initialEvents: EventItem[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'manage'>('list');
  const [managingEvent, setManagingEvent] = useState<EventItem | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await saveEvent(fd);
      if (res.success) {
        alert(editingEvent ? '✅ 活動已成功更新！' : '✅ 活動已成功建立！');
        // Let revalidatePath do its job but we also reload page or optimistic update
        if (editingEvent) {
           setEvents(events.map(e => e.id === editingEvent.id ? {
              ...e,
              title: fd.get('title') as string,
              date: fd.get('date') as string,
              location: fd.get('location') as string,
              price: Number(fd.get('price')),
              capacity: Number(fd.get('capacity')),
              status: fd.get('status') as 'Active' | 'Draft' | 'Completed' || 'Draft'
           } : e));
        } else {
           setEvents([...events, {
             id: Date.now().toString(),
             title: fd.get('title') as string,
             date: fd.get('date') as string,
             location: fd.get('location') as string,
             price: Number(fd.get('price')),
             capacity: Number(fd.get('capacity')),
             enrolled: 0,
             status: 'Draft'
           }]);
        }
        setActiveTab('list');
        setEditingEvent(null);
      }
    });
  };

  const handleEdit = (event: EventItem) => {
    setEditingEvent(event);
    setActiveTab('create');
  };

  const handleDelete = (id: string) => {
    if (!confirm('確定要刪除此活動嗎？')) return;
    startTransition(async () => {
      const res = await deleteEvent(id);
      if (res.success) {
        setEvents(events.filter(e => e.id !== id));
      } else {
        alert(res.error);
      }
    });
  };

  const handleManage = (event: EventItem) => {
    startTransition(async () => {
      const regs = await fetchEventRegistrationsByEventId(event.id);
      setRegistrations(regs);
      setManagingEvent(event);
      setActiveTab('manage');
    });
  };

  const handleMarkPaid = (regId: string, basePrice: number) => {
    let actualPrice = basePrice;
    if (basePrice === 0) {
      const amountStr = prompt('請輸入信眾實際隨喜功德金額：', '100');
      if (amountStr === null) return; // User clicked Cancel
      actualPrice = Number(amountStr) || 0;
    } else {
      if (!confirm(`確認該信眾已完成付款 $${basePrice} 嗎？`)) return;
    }

    startTransition(async () => {
      const res = await markRegistrationAsPaid(regId, actualPrice);
      if (res.success) {
        setRegistrations(regs => regs.map(r => r.id === regId ? { ...r, paymentStatus: 'Paid', actualPrice } : r));
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">法會與活動管理</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Event Deployment Matrix</p>
         </div>

         <div className="flex bg-slate-200/50 p-1 rounded-xl shadow-inner border border-slate-200">
            <button 
              onClick={() => setActiveTab('list')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              活動總覽清冊
            </button>
            <button 
              onClick={() => { setEditingEvent(null); setActiveTab('create'); }}
              className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${activeTab === 'create' && !editingEvent ? 'bg-slate-900 text-amber-500 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
            >
              部署新活動
            </button>
         </div>
      </div>

      {activeTab === 'create' && (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border-2 border-slate-200 shadow-xl relative overflow-hidden group">
          {editingEvent && <input type="hidden" name="id" value={editingEvent.id} />}
          <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl group-hover:scale-110 transition-transform duration-700 pointer-events-none">🎪</div>
          
          <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-4 mb-6">{editingEvent ? '編輯活動' : '活動參數設定'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">活動名稱 (Event Title)</label>
              <input required name="title" defaultValue={editingEvent?.title} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：中元普渡祈安大法會" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">舉辦日期 (Event Date)</label>
              <input required name="date" defaultValue={editingEvent?.date} type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">舉辦地點 (Location)</label>
              <input required name="location" defaultValue={editingEvent?.location} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：本宮大殿 / 戶外廣場" />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">宣傳圖片 (IMAGE) - 網址或上傳皆可</label>
              <div className="flex gap-2 items-center">
                 <input name="imageUrl" defaultValue={editingEvent?.imageUrl} type="url" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：https://example.com/img.jpg" />
                 <span className="text-xs font-bold text-slate-400 uppercase">或</span>
                 <input name="imageFile" type="file" accept="image/*" className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">功德金 (Price - 填 0 為免費/隨喜)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-bold">$</span>
                <input required name="price" defaultValue={editingEvent?.price} type="number" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="1200" />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">人數限制 (Max Capacity)</label>
              <input required name="capacity" defaultValue={editingEvent?.capacity} type="number" min="1" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all" placeholder="例如：500" />
            </div>

            {editingEvent && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">狀態 (Status)</label>
                <select name="status" defaultValue={editingEvent.status} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all">
                   <option value="Draft">草稿/籌備中</option>
                   <option value="Active">開放報名中</option>
                   <option value="Completed">已結束</option>
                </select>
              </div>
            )}
          </div>

            <button 
              type="button"
              onClick={() => { setActiveTab('list'); setEditingEvent(null); }}
              className="bg-white text-slate-500 border border-slate-200 px-8 py-3 rounded-xl font-black text-xs tracking-widest shadow-sm hover:bg-slate-50 transition-all uppercase"
            >
              取消設定
            </button>
            <button 
              type="submit" 
              disabled={isPending}
              className="bg-slate-900 text-amber-500 px-8 py-3 rounded-xl font-black text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2 uppercase disabled:opacity-50"
            >
              {isPending ? (editingEvent ? '更新中...' : '部署中...') : (editingEvent ? '確認更新活動 🚀' : '確認部署活動 🚀')}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">目前無任何活動紀錄</p>
            </div>
          ) : (
            events.map(event => (
              <div key={event.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:border-amber-300 transition-all">
                <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                        event.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                        event.status === 'Draft' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {event.status === 'Active' ? '開放報名中' : event.status === 'Draft' ? '草稿/籌備中' : '已結束'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-amber-600 transition-colors">{event.title}</h3>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(event)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="編輯活動">✏️</button>
                    <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="刪除活動">🗑️</button>
                  </div>
                </div>
                
                <div className="p-5 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">活動日期</p>
                      <p className="text-sm font-bold text-slate-700">{event.date}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">功德金</p>
                      <p className="text-sm font-bold text-slate-700">{event.price === 0 ? '免費 / 隨喜' : `NT$ ${event.price}`}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">舉辦地點</p>
                      <p className="text-sm font-bold text-slate-700 flex items-center gap-1">📍 {event.location}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">報名狀況</span>
                      <span className="text-sm font-black text-slate-800">{event.enrolled} <span className="text-[10px] text-slate-400">/ {event.capacity} 人</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${event.enrolled >= event.capacity ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min((event.enrolled / event.capacity) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border-t border-slate-800">
                  <button onClick={() => handleManage(event)} className="w-full py-2 text-xs font-black text-amber-500 uppercase tracking-widest hover:text-white transition-colors">
                    管理報名名單 →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'manage' && managingEvent && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => setActiveTab('list')} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm border border-slate-200 transition-all">
              ←
            </button>
            <div>
              <h2 className="text-xl font-black text-slate-900">{managingEvent.title}</h2>
              <p className="text-xs font-bold text-slate-500 mt-1">日期：{managingEvent.date} | 地點：{managingEvent.location}</p>
            </div>
          </div>

          {/* 數據儀表板 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">總報名人數</p>
              <p className="text-4xl font-black text-slate-900">{registrations.length} <span className="text-sm text-slate-400 font-bold">人</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">已收總收入</p>
              <p className="text-4xl font-black text-emerald-600">
                <span className="text-xl mr-1">$</span>
                {registrations.filter(r => r.paymentStatus === 'Paid').reduce((acc, r) => acc + (r.actualPrice || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">尚未繳費人數</p>
              <p className="text-4xl font-black text-rose-500">{registrations.filter(r => r.paymentStatus !== 'Paid').length} <span className="text-sm text-rose-300 font-bold">人</span></p>
            </div>
          </div>

          {/* 名單列表 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">信眾姓名</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">聯絡電話</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">報名時間</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">金額 / 隨喜</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">付款狀態</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold text-sm">目前尚未有信眾報名</td>
                    </tr>
                  ) : (
                    registrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{reg.guestName}</td>
                        <td className="px-6 py-4 font-bold text-slate-500">{reg.phone}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{reg.timestamp}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            {managingEvent.price === 0 ? (
                               <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit">隨喜功德</span>
                            ) : (
                               <span className="text-sm font-bold text-slate-700">${managingEvent.price}</span>
                            )}
                            {reg.paymentStatus === 'Paid' && (
                              <span className="text-[10px] font-bold text-emerald-600 mt-1">實收: ${reg.actualPrice}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {reg.paymentStatus === 'Paid' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              已付款
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                              未付款
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {reg.paymentStatus !== 'Paid' && (
                            <button 
                              onClick={() => handleMarkPaid(reg.id, managingEvent.price)}
                              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:shadow-md transition-all"
                            >
                              標記已付款
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
