const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/queue/QueueManagerClient.tsx', 'utf8');

// Add import for fetchQueueDashboard
content = content.replace(
  "import { \n  QueueEvent, createQueueEvent, completeQueueService, activateQueueEvent, deleteQueueEvent,\n  checkInWithQr, callNextInQueue, updateQueueStatus, registerGuestForQueue \n} from '@/app/actions';",
  `import { 
  QueueEvent, createQueueEvent, completeQueueService, activateQueueEvent, deleteQueueEvent,
  checkInWithQr, callNextInQueue, updateQueueStatus, registerGuestForQueue, fetchQueueDashboard
} from '@/app/actions';`
);

// 1. Handle createQueueEvent error
content = content.replace(
  `  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return alert('請填寫完整資訊。');
    startTransition(async () => {
      await createQueueEvent({ 
        title, 
        date, 
        location, 
        maxCapacity: parseInt(maxCapacity), 
        serviceType: useCustomService ? customService : serviceType,
        price: parseInt(price),
        startTime,
        endTime
      });
      alert('✅ 排隊活動已成功部署！');
      setTitle(''); setDate(''); setServiceType(''); setPrice('0');
    });
  };`,
  `  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date) return alert('請填寫完整資訊。');
    startTransition(async () => {
      const res = await createQueueEvent({ 
        title, 
        date, 
        location, 
        maxCapacity: parseInt(maxCapacity), 
        serviceType: useCustomService ? customService : serviceType,
        price: parseInt(price),
        startTime,
        endTime
      });
      if (!res.success) {
        alert('❌ 部署失敗：' + res.error);
        return;
      }
      alert('✅ 排隊活動已成功部署！');
      setTitle(''); setDate(''); setServiceType(''); setPrice('0');
    });
  };`
);

// Add history expanded state
content = content.replace(
  "const [isRegistering, setIsRegistering] = useState(false);",
  `const [isRegistering, setIsRegistering] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [historyTickets, setHistoryTickets] = useState<any[]>([]);
  
  const loadHistoryTickets = async (eventId: string) => {
    if (expandedHistoryId === eventId) {
      setExpandedHistoryId(null);
      return;
    }
    const res = await fetchQueueDashboard(eventId);
    setHistoryTickets(res.tickets || []);
    setExpandedHistoryId(eventId);
  };`
);

// 2. Update QR code URL and add error check if activeEvent is missing
// The current code already checks `if (!activeEvent)`. I will ensure the QR URL is correct.
content = content.replace(
  `encodeURIComponent(\`SECURE_CHECKIN_\${activeEvent.id}_\${new Date().toISOString().split('T')[0]}\`)`,
  `encodeURIComponent(\`\${baseUrl}/\${activeEvent.templeId || 'temple-1'}/checkin?eventId=\${activeEvent.id}\`)`
);

// 3. Add History "查看名單" button and UI
content = content.replace(
  `                             <p className="text-[10px] font-black text-slate-400 mt-2">參與人數：{evt.participantCount || 0} 人</p>
                          </div>
                       </div>
                       <div className="flex gap-2">`,
  `                             <p className="text-[10px] font-black text-slate-400 mt-2">參與人數：{evt.participantCount || 0} 人</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => loadHistoryTickets(evt.id)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                             {expandedHistoryId === evt.id ? '收起名單' : '查看名單'}
                          </button>`
);

// Insert expanded view for history
const historyExpandUi = `
                       {expandedHistoryId === evt.id && (
                          <div className="col-span-full mt-4 bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                             <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">活動報名名單與到場紀錄</h5>
                             {historyTickets.length === 0 ? (
                                <p className="text-sm font-bold text-slate-400 text-center py-6">尚無任何報名紀錄</p>
                             ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   {historyTickets.map((t: any) => (
                                      <div key={t.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                         <div>
                                            <p className="text-sm font-black text-slate-800">{t.guestName} <span className="text-[10px] text-slate-400 ml-2">{t.phone}</span></p>
                                            <p className="text-[10px] font-bold text-slate-500 mt-1">取號：{t.assignedNumber}</p>
                                         </div>
                                         <div className="text-right">
                                            {t.status === 'Registered' ? (
                                               <span className="inline-block px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-black tracking-widest">未到場</span>
                                            ) : (
                                               <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black tracking-widest">已報到參加</span>
                                            )}
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                       )}
`;

content = content.replace(
  `                       </div>
                    </div>
                 ))}
                 {filteredHistory.length === 0 && (`,
  `                       </div>
                    ${historyExpandUi}
                    </div>
                 ))}
                 {filteredHistory.length === 0 && (`
);

fs.writeFileSync('src/app/[templeId]/admin/queue/QueueManagerClient.tsx', content);
console.log('Done QueueManagerClient update');
