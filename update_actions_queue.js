const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Update createQueueEvent
content = content.replace(
  `export async function createQueueEvent(data: any) { const templeId = await getDynamicTempleId(); 
  db_queue_events.push({ id: \`qe-\${Date.now()}\`, ...data, status: 'Draft' });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}`,
  `export async function createQueueEvent(data: any) { 
  const templeId = await getDynamicTempleId(); 
  
  // Validation 1: Date must be > today
  const todayStr = new Date().toISOString().split('T')[0];
  if (data.date <= todayStr) {
    return { success: false, error: '只能部屬明日之後的活動。' };
  }

  // Validation 2: Time overlap
  const overlapping = db_queue_events.find(e => 
    e.templeId === templeId && 
    e.date === data.date && 
    e.status !== 'Cancelled' && 
    (data.startTime < e.endTime && data.endTime > e.startTime)
  );

  if (overlapping) {
    return { success: false, error: \`同一日時段有重複（與 "\${overlapping.title}" 衝突），無法部屬。\` };
  }

  db_queue_events.push({ id: \`qe-\${Date.now()}\`, ...data, templeId, status: 'Draft' });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}`
);

// 2. Update registerGuestForQueue
content = content.replace(
  `export async function registerGuestForQueue(eventId: string, data: { guestName: string, phone: string }) {
  const event = db_queue_events.find(e => e.id === eventId);
  if (!event) return { error: 'EVENT_NOT_FOUND' };
  
  const eventTickets = db_queue_tickets.filter(t => t.eventId === eventId);
  const nextNumber = \`A\${(eventTickets.length + 1).toString().padStart(3, '0')}\`;
  
  const newTicket = {
    id: \`t-\${Date.now()}\`,
    eventId,
    status: 'Queuing', // Direct check-in for manual registration
    assignedNumber: nextNumber,
    guestName: data.guestName,
    phone: data.phone,
    actualOrder: eventTickets.filter(t => t.status !== 'Pending').length + 1,
    scannedAt: new Date().toLocaleTimeString()
  };
  
  db_queue_tickets.push(newTicket);
  gStore.db_queue_tickets = db_queue_tickets;

  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true, ticket: newTicket }; 
}`,
  `export async function registerGuestForQueue(eventId: string, data: { guestName: string, phone: string, isOnline?: boolean }) {
  const event = db_queue_events.find(e => e.id === eventId);
  if (!event) return { error: 'EVENT_NOT_FOUND' };
  
  const eventTickets = db_queue_tickets.filter(t => t.eventId === eventId);
  
  // Capacity check
  if (event.maxCapacity && eventTickets.length >= event.maxCapacity) {
    return { error: '活動預約已額滿！' };
  }

  const nextNumber = \`A\${(eventTickets.length + 1).toString().padStart(3, '0')}\`;
  
  const newTicket = {
    id: \`t-\${Date.now()}\`,
    eventId,
    status: data.isOnline ? 'Registered' : 'Queuing', 
    assignedNumber: nextNumber,
    guestName: data.guestName,
    phone: data.phone,
    actualOrder: data.isOnline ? null : eventTickets.filter(t => t.status === 'Queuing' || t.status === 'Calling' || t.status === 'Completed').length + 1,
    scannedAt: data.isOnline ? null : new Date().toLocaleTimeString()
  };
  
  db_queue_tickets.push(newTicket);
  gStore.db_queue_tickets = db_queue_tickets;

  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true, ticket: newTicket }; 
}`
);

// 3. Update checkInWithQr
content = content.replace(
  `export async function checkInWithQr(ticketId: string) { 
  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => {
    if (t.id === ticketId) {
      const qCount = db_queue_tickets.filter(x => x.eventId === t.eventId && x.status !== 'Pending').length + 1;
      return { ...t, status: 'Queuing', actualOrder: qCount, scannedAt: new Date().toLocaleTimeString() };
    }
    return t;
  });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}`,
  `export async function checkInWithQr(ticketId: string, eventId?: string) { 
  const ticket = db_queue_tickets.find(t => t.id === ticketId);
  if (!ticket) return { success: false, error: '找不到票券' };
  if (ticket.status !== 'Registered') return { success: false, error: '票券狀態不正確' };
  if (eventId && ticket.eventId !== eventId) return { success: false, error: '活動不符，請掃描正確的活動QR碼' };

  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => {
    if (t.id === ticketId) {
      const qCount = db_queue_tickets.filter(x => x.eventId === t.eventId && (x.status === 'Queuing' || x.status === 'Calling' || x.status === 'Completed')).length + 1;
      return { ...t, status: 'Queuing', actualOrder: qCount, scannedAt: new Date().toLocaleTimeString() };
    }
    return t;
  });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}`
);

fs.writeFileSync('src/app/actions.ts', content);
console.log("Done updating actions.ts for queue system.");
