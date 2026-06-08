const fs = require('fs');

let content = fs.readFileSync('src/app/live-queue/PublicQueueDisplay.tsx', 'utf8');

// 1. Import registerGuestForQueue
content = content.replace(
  `import React, { useState, useEffect } from 'react';`,
  `import React, { useState, useEffect, useTransition } from 'react';
import { registerGuestForQueue } from '@/app/actions';`
);

// 2. Add state for upcoming events and registration
content = content.replace(
  `export default function PublicQueueDisplay({ events, tickets }: { events: any[], tickets: any[] }) {
  const activeEvent = events.find(e => e.status === 'Active');`,
  `export default function PublicQueueDisplay({ events, tickets }: { events: any[], tickets: any[] }) {
  const activeEvent = events.find(e => e.status === 'Active');
  const today = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.status === 'Draft' && e.date >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [isPending, startTransition] = useTransition();

  const handlePreRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvents.length === 0) return alert('請至少選擇一場活動');
    if (!regName || !regPhone) return alert('請填寫完整資訊');

    startTransition(async () => {
      let msgs = [];
      for (const eventId of selectedEvents) {
        const res = await registerGuestForQueue(eventId, { guestName: regName, phone: regPhone, isOnline: true });
        if (res.success) {
          const evt = upcomingEvents.find(x => x.id === eventId);
          msgs.push(\`「\${evt?.title}」預約成功！號碼：\${res.ticket.assignedNumber}\`);
        } else {
          msgs.push(\`預約失敗：\${res.error}\`);
        }
      }
      alert(msgs.join('\\n') + '\\n\\n請務必於活動開始時，抵達現場掃描 QR Code 完成實名報到！');
      setSelectedEvents([]);
      setRegName('');
      setRegPhone('');
    });
  };
`
);

// 3. Add Upcoming Events UI
const upcomingUi = `
      {/* Upcoming Events Registration */}
      <div className="mt-20 border-t-4 border-slate-200 pt-16 animate-in slide-in-from-bottom-10 duration-1000">
        <div className="text-center mb-10 space-y-4">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">即將到來的活動 (PRE-REGISTRATION)</h2>
          <p className="text-slate-500 font-bold tracking-widest text-sm">您可以預先領取號碼，活動當日請務必至現場掃描 QR Code 報到，否則無法叫號。</p>
        </div>

        {upcomingEvents.length === 0 ? (
           <p className="text-center text-slate-400 font-bold text-lg">目前無即將開放的活動</p>
        ) : (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-4">
                 {upcomingEvents.map((evt) => (
                    <label key={evt.id} className={\`block cursor-pointer bg-white border-2 rounded-[30px] p-6 transition-all \${selectedEvents.includes(evt.id) ? 'border-indigo-600 shadow-xl scale-[1.02]' : 'border-slate-100 hover:border-slate-300'}\`}>
                       <div className="flex items-center gap-6">
                          <input 
                            type="checkbox" 
                            checked={selectedEvents.includes(evt.id)}
                            onChange={(e) => {
                              if(e.target.checked) setSelectedEvents(prev => [...prev, evt.id]);
                              else setSelectedEvents(prev => prev.filter(id => id !== evt.id));
                            }}
                            className="w-6 h-6 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                          <div className="flex-1">
                             <h4 className="text-xl font-black text-slate-900">{evt.title}</h4>
                             <p className="text-sm font-bold text-slate-500 mt-1">📍 {evt.location} | 📅 {evt.date} ({evt.startTime}-{evt.endTime})</p>
                          </div>
                          <div className="text-right">
                             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">目前預約</span>
                             <span className="text-2xl font-black text-indigo-600">{evt.participantCount || 0}</span>
                             <span className="text-xs text-slate-400">/{evt.maxCapacity || '∞'}</span>
                          </div>
                       </div>
                    </label>
                 ))}
              </div>
              <div className="lg:col-span-4">
                 <form onSubmit={handlePreRegister} className="bg-white p-8 rounded-[40px] border-2 border-slate-100 shadow-2xl space-y-6 sticky top-8">
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-4">確認預約資訊</h3>
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">姓名 Name</label>
                          <input type="text" value={regName} onChange={e=>setRegName(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" placeholder="例如：王大明" />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">電話 Phone</label>
                          <input type="tel" value={regPhone} onChange={e=>setRegPhone(e.target.value)} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-600 outline-none transition-all" placeholder="例如：0912345678" />
                       </div>
                    </div>
                    <button type="submit" disabled={isPending || selectedEvents.length === 0} className="w-full bg-slate-900 text-amber-500 py-4 rounded-2xl font-black text-xs tracking-[0.3em] uppercase hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 shadow-xl">
                       {isPending ? '處理中...' : \`送出 \${selectedEvents.length} 筆預約 ➔\`}
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold leading-relaxed mt-4">
                       ⚠️ 提醒您：線上預約僅為「保留名額與領取預約號碼」，您必須在活動當日抵達現場，並掃描主辦方提供的 QR Code，才算正式完成報到與排隊喔！
                    </p>
                 </form>
              </div>
           </div>
        )}
      </div>
`;

// Replace `if (!activeEvent)` entirely so we still show Upcoming if no active event
content = content.replace(
  `  if (!activeEvent) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
        <div className="text-8xl animate-bounce">⛩️</div>
        <h2 className="text-3xl font-black text-slate-900 tracking-widest italic">目前無進行中的活動</h2>
        <p className="text-slate-400 font-bold uppercase tracking-widest">請稍後再試，或洽詢宮廟人員</p>
      </div>
    );
  }`,
  `  if (!activeEvent) {
    return (
      <div className="space-y-12 animate-in fade-in duration-1000">
        <div className="h-[40vh] flex flex-col items-center justify-center text-center space-y-6 bg-white rounded-[50px] border-4 border-slate-100 shadow-xl">
          <div className="text-8xl animate-bounce">⛩️</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-widest italic">目前無進行中的活動</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest">請稍後再試，或預約下方即將開始的活動</p>
        </div>
        ${upcomingUi}
      </div>
    );
  }`
);

// Inject Upcoming UI to the normal render as well
content = content.replace(
  `      <footer className="pt-20 text-center opacity-20">`,
  `${upcomingUi}
      <footer className="pt-20 text-center opacity-20">`
);

fs.writeFileSync('src/app/live-queue/PublicQueueDisplay.tsx', content);
console.log('Done PublicQueueDisplay update');
