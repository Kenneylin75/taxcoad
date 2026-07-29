const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const replaceFunction = (funcName, newBody) => {
  const func = sourceFile.getFunction(funcName);
  if (func) {
    func.setBodyText(newBody);
    console.log('Updated ' + funcName);
  }
};

replaceFunction('fetchAggregatedAnalytics', `
  try {
    const currentYear = targetYear || new Date().getFullYear().toString();
    const totalTemples = await prisma.temple.count();
    const activeTemples = await prisma.temple.count({ where: { status: 'Active' } });
    const totalDistributors = await prisma.distributor.count();
    const totalSuperSales = await prisma.distributorSales.count({ where: { role: 'SuperSales' } });
    
    const bills = await prisma.templeBill.findMany({ where: { status: 'Paid' } });
    const monthlyRevenue = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    
    const temples = await prisma.temple.findMany({ where: { status: 'Active' }, select: { city: true, address: true } });
    const regionCounts: Record<string, number> = {};
    const majorRegions = ['基隆', '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投', '雲林', '嘉義', '台南', '高雄', '屏東', '宜蘭', '花蓮', '台東', '澎湖', '金門', '連江'];
    
    temples.forEach((t: any) => {
      let region = t.city || (t.address ? t.address.substring(0, 2) : '');
      const shortRegion = region.substring(0, 2);
      const matchedRegion = majorRegions.find(r => shortRegion?.includes(r));
      if (matchedRegion) {
         regionCounts[matchedRegion] = (regionCounts[matchedRegion] || 0) + 1;
      }
    });

    const regionalDistribution = Object.entries(regionCounts).map(([region, count]) => ({ region, count }));
    
    const allTemples = await prisma.temple.findMany({ select: { createdAt: true } });
    const growthTrend = Array.from({ length: 12 }).map((_, i) => {
      const month = String(i + 1).padStart(2, '0');
      const prefix = \`\${currentYear}-\${month}\`;
      const count = allTemples.filter(t => t.createdAt && new Date(t.createdAt).toISOString().startsWith(prefix)).length;
      return { date: prefix, count };
    });
    
    return {
      overview: { totalTemples, activeTemples, totalDistributors, totalSuperSales, monthlyRevenue, systemHealth: 98 },
      regionalDistribution,
      growthTrend
    };
  } catch(e) {
    console.error(e);
    return { overview: { totalTemples: 0, activeTemples: 0, totalDistributors: 0, totalSuperSales: 0, monthlyRevenue: 0, systemHealth: 98 }, regionalDistribution: [], growthTrend: [] };
  }
`);

replaceFunction('fetchDistributorTemples', `
  try {
    const temples = await prisma.temple.findMany({
      where: {
        OR: [
          { distributorId },
          { sales: { distributorId, role: { not: 'SuperSales' } } }
        ]
      },
      include: { sales: true }
    });
    
    const sysConfig = await prisma.systemConfig.findFirst();
    const discountRate = sysConfig?.yearlyDiscountRate || 20;
    
    return temples.map((t: any) => {
       const { paymentStatusLabel, contractEndDate, trialDaysRemaining } = enrichTempleWithFinancialStatus(t);
       return { ...t, paymentStatusLabel, contractEndDate, trialDaysRemaining, appliedDiscountRate: discountRate };
    });
  } catch(e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('fetchAiApiModels', `
  try {
    return await prisma.aiApiModel.findMany();
  } catch(e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('getTempleBasicInfo', `
  try {
    const tId = templeId || await getDynamicTempleId();
    if (!tId) return null;
    const t = await prisma.temple.findUnique({ where: { id: tId } });
    if (!t) return null;
    return { ...t, templeName: t.templeName || t.name };
  } catch(e) {
    console.error(e);
    return null;
  }
`);

sourceFile.saveSync();
console.log('Saved actions.ts');
