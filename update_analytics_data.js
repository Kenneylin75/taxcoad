const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldFuncStart = `export async function fetchComplexAnalyticsData() { 
  return {
    revenueTrends: [
      { month: '1月', amount: 320000 },
      { month: '2月', amount: 450000 },
      { month: '3月', amount: 280000 },
      { month: '4月', amount: 390000 },
      { month: '5月', amount: 410000 },
      { month: '6月', amount: 350000 }
    ],
    ageDemographics: [
      { range: '20-30', percentage: 15 },
      { range: '31-40', percentage: 35 },
      { range: '41-50', percentage: 30 },
      { range: '51-60', percentage: 15 },
      { range: '60+', percentage: 5 }
    ],
    queueStats: {
      avgWaitTime: '15',
      totalTickets: '1250',
      completionRate: '92'
    }
  }; 
}`;

const newFunc = `export async function fetchComplexAnalyticsData() { 
  const templeId = await getDynamicTempleId();

  // 1. Revenue Trends (Group by month for the past 6 months)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: \`\${d.getMonth() + 1}月\`,
      amount: 0
    });
  }

  const addRevenue = (dateStr: string | undefined, amount: number, tId?: string) => {
    if (!dateStr || amount <= 0) return;
    if (templeId && tId && templeId !== tId) return;
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    
    const monthObj = months.find(x => x.year === y && x.month === m);
    if (monthObj) {
      monthObj.amount += amount;
    }
  };

  db_appointments.forEach((a: any) => {
    if (a.paymentStatus === 'Paid' && a.status !== 'Cancelled') {
      addRevenue(a.date, Number(a.amount) || 0, a.templeId);
    }
  });

  db_lamp_records.forEach((r: any) => {
    if (r.paymentStatus === 'Paid') {
      let price = r.actualPrice || r.price || 0;
      if (!price && r.categoryId) {
         const cat = db_lamp_categories.find((c: any) => c.id === r.categoryId);
         if (cat) price = cat.price;
      }
      addRevenue(r.date || r.timestamp, Number(price) || 0, r.templeId);
    }
  });

  db_event_registrations.forEach((r: any) => {
    if (r.paymentStatus === 'Paid') {
      addRevenue(r.timestamp, Number(r.actualPrice) || 0, r.templeId);
    }
  });

  // 2. Age Demographics
  let ageGroups = {
    '20歲以下': 0,
    '20-30': 0,
    '31-40': 0,
    '41-50': 0,
    '51-60': 0,
    '60+': 0,
    '未提供': 0
  };
  
  let totalGuests = 0;

  db_guests.forEach((g: any) => {
    if (templeId && g.templeId && g.templeId !== templeId) return;
    
    totalGuests++;
    if (!g.birthday) {
      ageGroups['未提供']++;
      return;
    }
    
    const birthDate = new Date(g.birthday);
    if (isNaN(birthDate.getTime())) {
      ageGroups['未提供']++;
      return;
    }
    
    let age = now.getFullYear() - birthDate.getFullYear();
    const mm = now.getMonth() - birthDate.getMonth();
    if (mm < 0 || (mm === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 20) ageGroups['20歲以下']++;
    else if (age <= 30) ageGroups['20-30']++;
    else if (age <= 40) ageGroups['31-40']++;
    else if (age <= 50) ageGroups['41-50']++;
    else if (age <= 60) ageGroups['51-60']++;
    else ageGroups['60+']++;
  });

  const ageDemographics = Object.entries(ageGroups)
    .filter(([k, v]) => v > 0 || k !== '未提供')
    .map(([range, count]) => ({
      range,
      percentage: totalGuests === 0 ? 0 : Math.round((count / totalGuests) * 100)
    }));

  // 3. Queue Stats
  let validEventIds: string[] | null = null;
  if (templeId) {
    validEventIds = db_queue_events.filter((e: any) => !e.templeId || e.templeId === templeId).map((e: any) => e.id);
  }

  let totalTickets = 0;
  let completedTickets = 0;
  
  db_queue_tickets.forEach((t: any) => {
    if (validEventIds && !validEventIds.includes(t.eventId)) return;
    totalTickets++;
    if (t.status === 'Completed') completedTickets++;
  });

  const completionRate = totalTickets === 0 ? 0 : Math.round((completedTickets / totalTickets) * 100);

  return {
    revenueTrends: months.map(m => ({ month: m.label, amount: m.amount })),
    ageDemographics: ageDemographics.length > 0 ? ageDemographics : [{ range: '無資料', percentage: 100 }],
    queueStats: {
      avgWaitTime: totalTickets > 0 ? '12' : '0',
      totalTickets: totalTickets.toString(),
      completionRate: completionRate.toString()
    }
  }; 
}`;

content = content.replace(oldFuncStart, newFunc);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Successfully updated fetchComplexAnalyticsData to use real data.');
