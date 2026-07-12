export async function fetchCommissionHistory(salesId: string, year: string, month: string) { 
  const sales = db_dist_sales.find(s => s.id === salesId);
  const salesName = sales?.name;
  
  const myTemples = [];
  for (const t of db_temples) {
    const creatorInfo = await getTempleCreatorInfo(t.id);
    if ((creatorInfo && creatorInfo.salesName === salesName) || t.salesId === salesId) {
      if (t.status === 'Active') {
        myTemples.push(t);
      }
    }
  }
  
  let totalEarned = 0;
  let totalRevenue = 0;
  const records: any[] = [];
  
  const overrides = salesName ? db_super_sales_overrides[salesName] : null;
  const rules = sales?.commissionRules || overrides || db_config.defaultSuperSalesRates;
  const setupRate = rules.templeSetupRate ?? rules.setupFeePercent ?? 20;
  const rentY1 = rules.templeRentRates?.[0] ?? rules.rentYear1Percent ?? 15;
  const rentY2 = rules.templeRentRates?.[1] ?? rules.rentYear2Percent ?? 12;
  const rentY3 = rules.templeRentRates?.[2] ?? rules.rentYear3PlusPercent ?? 10;

  const now = new Date();
  
  myTemples.forEach(t => {
    // Only count if payment is Paid, or if it's legacy active without paymentStatus
    const isPaid = t.paymentStatus === 'Paid' || (!t.paymentStatus && t.status === 'Active');
    if (!isPaid) return;

    const activeDate = new Date(t.timestamp);
    const monthsDiff = (now.getFullYear() - activeDate.getFullYear()) * 12 + (now.getMonth() - activeDate.getMonth());
    
    // Revenue Calculation (incorporating Yearly discounts)
    const baseSetupFee = t.setupFee || 12000;
    const baseMonthlyRent = t.monthlyRent || 3600;
    const isYearly = t.paymentCycle === 'Yearly';
    const discountRate = db_config.yearlyDiscountRate || 20;
    const currentRentValue = isYearly ? (baseMonthlyRent * 12 * (1 - discountRate / 100)) : baseMonthlyRent;
    
    // 1. 開辦費分潤 (只有第一個月才算)
    if (monthsDiff === 0) {
      const setupFeeCom = baseSetupFee * (setupRate / 100);
      totalEarned += setupFeeCom;
      totalRevenue += baseSetupFee;
      records.push({
        id: `${t.id}-setup`, 
        templeName: t.templeName, 
        date: t.timestamp.split('T')[0], 
        type: '開辦費分潤', 
        amount: setupFeeCom, 
        phase: 'Setup',
        calculation: `開辦費 $${baseSetupFee.toLocaleString()} * ${setupRate}%`
      });
    }

    // 2. 月/年租費分潤 (依據年份階梯)
    // 對於年繳，我們在首月（monthsDiff === 0）或每年週期（monthsDiff % 12 === 0）一次性發放/認列
    // 對於月繳，每月發放
    const shouldRecognizeRent = isYearly ? (monthsDiff % 12 === 0) : true;

    if (shouldRecognizeRent) {
      let rentPercent = rentY1;
      let yearLabel = '第一年';
      
      if (monthsDiff >= 12 && monthsDiff < 24) {
        rentPercent = rentY2;
        yearLabel = '第二年';
      } else if (monthsDiff >= 24) {
        rentPercent = rentY3;
        yearLabel = '第三年及以上';
      }
      
      const rentCom = currentRentValue * (rentPercent / 100);
      totalEarned += rentCom;
      totalRevenue += currentRentValue;
      
      records.push({
        id: `${t.id}-rent-${monthsDiff}`, 
        templeName: t.templeName, 
        date: new Date().toISOString().split('T')[0], 
        type: `${isYearly ? '年繳' : '月租'}提成 (${yearLabel})`, 
        amount: rentCom,
        percent: rentPercent,
        monthsDiff,
        calculation: `${isYearly ? '年繳' : '月租'} $${currentRentValue.toLocaleString()} * ${rentPercent}%`
      });
    }
  });
  
  // 3. 手動獎金覆寫 (Bonus Overrides)
  const myBonuses = db_bonuses.filter(b => b.salesName === salesName);
  myBonuses.forEach(b => {
    totalEarned += b.amount;
    records.push({
      id: b.id,
      templeName: '管理員手動發放',
      date: b.date,
      type: '手動獎金覆寫',
      amount: b.amount,
      phase: 'Bonus',
      calculation: `理由: ${b.reason}`
    });
  });
  
  const wallet = db_wallets.find(w => w.name === salesName);
  const myWithdrawals = db_withdrawals.filter(w => w.salesName === salesName);
  const pendingRequests = myWithdrawals.filter(w => w.status === 'Pending' || w.status === '審核中');
  
  const revenueRecords: any[] = [];
  myTemples.forEach(t => {
      const bills = db_temple_bills.filter(b => b.templeId === t.id && b.status !== 'Rejected');
      bills.forEach(b => {
          revenueRecords.push({
             id: b.id,
             templeName: t.templeName,
             date: b.date,
             type: b.type === 'Setup' ? '開辦費' : '營運費',
             amount: b.amount,
             status: b.status,
             receiptUrl: b.receiptUrl
          });
      });
  });
  
  return {
    totalEarned,
    totalRevenue,
    netProfit: totalRevenue - totalEarned,
    balance: wallet ? wallet.balance : totalEarned, 
    totalWithdrawn: myWithdrawals.filter(w => w.status === 'Verified' || w.status === 'Approved').reduce((acc, curr) => acc + curr.amount, 0),
    records,
    revenueRecords,
    rules,
    pendingRequests,
    withdrawals: myWithdrawals
  }; 
}

