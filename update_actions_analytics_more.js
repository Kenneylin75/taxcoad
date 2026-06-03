const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldFuncEnd = `  return {
    revenueTrends: months.map(m => ({ month: m.label, amount: m.amount })),
    ageDemographics: ageDemographics.length > 0 ? ageDemographics : [{ range: '無資料', percentage: 100 }],
    queueStats: {
      avgWaitTime: totalTickets > 0 ? '12' : '0',
      totalTickets: totalTickets.toString(),
      completionRate: completionRate.toString()
    }
  }; 
}`;

const newFuncEnd = `
  // --- New Analytics Sections ---
  // A. Overview
  let totalRevenue = 0;
  months.forEach(m => totalRevenue += m.amount); // From the revenue loop above
  
  // Calculate Conversion Rate
  let totalOrders = 0;
  let paidOrders = 0;
  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    totalOrders++;
    if (a.paymentStatus === 'Paid') paidOrders++;
  });
  const conversionRate = totalOrders === 0 ? 0 : Math.round((paidOrders / totalOrders) * 100);

  // B. Gender Demographics
  let male = 0;
  let female = 0;
  db_guests.forEach((g: any) => {
    if (templeId && g.templeId && g.templeId !== templeId) return;
    // Guess gender from name if gender field doesn't exist
    if (g.name?.includes('先生') || g.gender === 'M') male++;
    else if (g.name?.includes('小姐') || g.gender === 'F') female++;
  });
  const totalGender = male + female;
  const malePercentage = totalGender === 0 ? 50 : Math.round((male / totalGender) * 100);
  const femalePercentage = totalGender === 0 ? 50 : 100 - malePercentage;

  // C. Service Heat
  const serviceCounts: Record<string, number> = {};
  let totalServices = 0;
  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    if (a.service) {
      serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
      totalServices++;
    }
  });
  
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count], index) => {
       const colors = ['bg-slate-900', 'bg-amber-500', 'bg-slate-300', 'bg-slate-200'];
       return {
         label,
         val: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100),
         color: colors[index % colors.length]
       };
    });

  if (sortedServices.length === 0) {
     sortedServices.push({ label: '暫無資料', val: 0, color: 'bg-slate-200' });
  }

  return {
    revenueTrends: months.map(m => ({ month: m.label, amount: m.amount })),
    ageDemographics: ageDemographics.length > 0 ? ageDemographics : [{ range: '無資料', percentage: 100 }],
    queueStats: {
      avgWaitTime: totalTickets > 0 ? '12' : '0',
      totalTickets: totalTickets.toString(),
      completionRate: completionRate.toString()
    },
    overview: {
      totalRevenue: totalRevenue,
      totalGuests: totalGuests,
      conversionRate: conversionRate,
      avgProcessingTime: totalTickets > 0 ? 12 : 0
    },
    genderDemographics: {
      male: malePercentage,
      female: femalePercentage,
      hasData: totalGender > 0
    },
    serviceHeat: sortedServices
  }; 
}`;

content = content.replace(oldFuncEnd, newFuncEnd);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated fetchComplexAnalyticsData with overview, gender, and service heat.');
