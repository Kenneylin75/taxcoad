import re

with open('src/app/[templeId]/GuestAppClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_render_events = '''  const renderEvents = () => {
    // Filter by the selected Year and Month
    const eventsOnSelectedMonth = events.filter(e => {
      if (!e.date) return false;
      const [y, m] = e.date.split('-');
      return parseInt(y) === currentYear && parseInt(m) === (currentMonth + 1);
    });
    
    return (
      <div className="min-h-screen pb-32">
        <TopNav title="活動" onBack={() => setActiveView('home')} />
        <div className="max-w-md mx-auto px-5 pt-6 space-y-6">
          <div className="text-center space-y-1 mb-6">
            <h3 className="text-xl font-bold text-gray-900">近期活動</h3>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Events</p>
          </div>

          {/* Month Selector */}
          <div className="app-card p-4">
            <div className="flex justify-between items-center px-2">
              <button onClick={() => {
                if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(v => v - 1); }
                else setCurrentMonth(v => v - 1);
              }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">◀</button>
              
              <div className="text-center">
                <span className="font-bold text-xl text-gray-900">{currentYear}年 {currentMonth + 1}月</span>
              </div>

              <button onClick={() => {
                if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(v => v + 1); }
                else setCurrentMonth(v => v + 1);
              }} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">▶</button>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">{currentYear}年 {currentMonth + 1}月 活動列表</h5>
            <div className="grid gap-6">
              {eventsOnSelectedMonth.length > 0 ? eventsOnSelectedMonth.map(evt => {
                const isRegistered = guestRegistrations.some(r => r.eventId === evt.id && r.status !== 'Cancelled');
                // Registration stats logic
                const enrolled = evt.enrolled || 0;
                const capacity = evt.capacity || 0;
                const progressPercent = capacity > 0 ? Math.min(100, Math.round((enrolled / capacity) * 100)) : 0;
                const isFull = capacity > 0 && enrolled >= capacity;

                return (
                <div key={evt.id} className="app-card overflow-hidden bg-white shadow-sm border border-gray-100 rounded-3xl">
                  {/* Image Section */}
                  <div className="h-56 w-full relative bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center overflow-hidden">
                    <div className="text-amber-500/20 text-7xl absolute">🏮</div>
                    {evt.imageUrl ? (
                      <img src={evt.imageUrl} className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => { e.currentTarget.style.display='none'; }} />
                    ) : null}
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-5">
                    {/* Basic Info */}
                    <div className="flex justify-between items-start gap-3">
                       <div>
                         <h4 className="text-xl font-bold text-gray-900 leading-tight mb-1">{evt.title}</h4>
                         <p className="text-sm font-bold text-red-600">{evt.date}</p>
                       </div>
                       <span className="font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-xl text-sm border border-red-100 shrink-0">
                         
                       </span>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed">{evt.description}</p>

                    {/* Precautions Block */}
                    {evt.precautions && (
                      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-3">
                        <div className="text-orange-500 mt-0.5">⚠️</div>
                        <div>
                          <h5 className="text-sm font-bold text-orange-800 mb-1">注意資料 / 報到須知</h5>
                          <p className="text-xs text-orange-700 leading-relaxed">{evt.precautions}</p>
                        </div>
                      </div>
                    )}

                    {/* Registration Stats */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                       <div className="flex justify-between text-xs font-bold">
                         <span className="text-gray-500">能接受 {capacity > 0 ? capacity : '無限制'} 人</span>
                         <span className={isFull ? "text-red-500" : "text-emerald-600"}>已經報名 {enrolled} 人</span>
                       </div>
                       {capacity > 0 && (
                         <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                           <div className={'h-2.5 rounded-full ' + (isFull ? 'bg-red-500' : 'bg-emerald-500')} style={{ width: progressPercent + '%' }}></div>
                         </div>
                       )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                       <button 
                         onClick={() => {
                           if (isFull && !isRegistered) {
                             alert('很抱歉，此活動已額滿！');
                             return;
                           }
                           setDetailContent({
                             title: evt.title,
                             category: '活動',
                             price: \結緣價 $\\,
                             precautions: evt.precautions || '請於活動前 15 分鐘報到，並領取法器。',
                             description: \活動內容：\\\n日期：\\,
                             onConfirm: isRegistered ? undefined : async () => {
                               initiatePayment(evt.price || 0, 'Event', async (method: string) => {
                                 const res = await registerForEvent(evt.id, guestUser.phone, guestUser.name, evt.price || 0, method);
                                 if (res && res.success !== false) {
                                   if (method === 'ecpay' || method === 'linepay') {
                                     handleOnlinePaymentRedirect(method, res.id || Date.now().toString(), evt.price || 0);
                                     return;
                                   }
                                   setSuccessInfo({ title: '報名成功', message: method === 'Cash' ? '您已成功報名法會活動，請於當日現場完成繳費報到。' : method === 'Free' ? '報名成功！隨喜功德，平安喜樂。' : '您已成功報名法會活動與付款。' });
                                   refreshAllData(guestUser.phone);
                                 } else {
                                   alert(\❌ 報名失敗: \\);
                                 }
                               });
                             }
                           });
                           setIsDetailModalOpen(true);
                         }}
                         className={\w-full py-3.5 rounded-2xl font-black text-[15px] tracking-wide transition-all \\}
                       >
                         {isRegistered ? '已報名' : isFull ? '已額滿' : '立即報名'}
                       </button>
                    </div>
                  </div>
                </div>
                );
              }) : (
                <div key="no-events" className="py-16 text-center app-card">
                  <div className="text-5xl mb-4 opacity-50">🗓️</div>
                  <p className="text-gray-500 font-bold text-sm">此月份暫無法會活動</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQueue = () => {'''

new_content = re.sub(
    r'  const renderEvents = \(\) => \{.*?\n  const renderQueue = \(\) => \{', 
    new_render_events, 
    content, 
    flags=re.DOTALL
)

with open('src/app/[templeId]/GuestAppClient.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Replacement done.")
