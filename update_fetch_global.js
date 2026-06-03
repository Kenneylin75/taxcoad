const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldFunc = `export async function fetchGlobalTempleData() {
  return {
    analyticsSettings: {},
    analyticsData: { todayAppointments: 12 },
    raw: {
      apps: [],
      agiStats: {},
      guests: [],
      storageInfo: {},
      qActive: []
    }
  };
}`;

const newFunc = `export async function fetchGlobalTempleData() {
  const templeId = await getDynamicTempleId();
  const now = new Date();
  
  // Format today's date YYYY-MM-DD in local timezone roughly
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  // 1. Today's Appointments
  let todayAppointments = 0;
  let completedAppointments = 0;
  let totalServices = 0;
  const serviceCounts: Record<string, number> = {};

  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    
    // Service Heat Calculation
    if (a.service) {
      serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
      totalServices++;
    }

    // Today's appointments Calculation
    if (a.date === todayStr) {
      todayAppointments++;
      if (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid') {
        // Just as an example, count completed/paid as completed for today
        completedAppointments++;
      }
    }
  });

  // Top 3 Services
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count], index) => {
       const colors = ['bg-indigo-500', 'bg-blue-400', 'bg-sky-300'];
       return {
         label,
         val: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100),
         color: colors[index % colors.length]
       };
    });

  if (sortedServices.length === 0) {
     sortedServices.push({ label: '目前無預約', val: 0, color: 'bg-slate-200' });
  }

  // 2. Queue Summary (Live Queue)
  const validEventIds = db_queue_events.filter((e: any) => e.status === 'Active' && (!e.templeId || e.templeId === templeId));
  const qActive = validEventIds.map((evt: any) => {
    const tix = db_queue_tickets.filter((t: any) => t.eventId === evt.id);
    const waiting = tix.filter((t: any) => t.status === 'Queuing').length;
    const completed = tix.filter((t: any) => t.status === 'Completed').length;
    return { title: evt.title, waiting, completed };
  });

  // 3. Total Guests
  let totalGuests = 0;
  db_guests.forEach((g: any) => {
    if (templeId && g.templeId && g.templeId !== templeId) return;
    totalGuests++;
  });

  // 4. Lamp Stats
  let totalLamps = 0;
  let activeLamps = 0;
  db_lamp_records.forEach((l: any) => {
    if (templeId && l.templeId && l.templeId !== templeId) return;
    totalLamps++;
    if (l.status === 'Active' || l.paymentStatus === 'Paid') activeLamps++;
  });

  // Storage info (mocked/static for now)
  const storageInfo = { used: 12.5, total: 100 };

  return {
    analyticsSettings: {},
    analyticsData: { 
      todayAppointments,
      completedAppointments,
      totalGuests,
      lampStats: { totalLamps, activeLamps },
      serviceHeat: sortedServices
    },
    raw: {
      apps: [],
      agiStats: {},
      guests: [],
      storageInfo,
      qActive
    }
  };
}`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync('src/app/actions.ts', content, 'utf8');
  console.log('Successfully updated fetchGlobalTempleData.');
} else {
  console.log('Could not find old fetchGlobalTempleData to replace.');
}
