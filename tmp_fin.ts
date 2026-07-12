export async function fetchSuperAdminFinancials() {
  const records = db_finance_records;
  
  const totalRevenue = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const totalCommission = db_bonuses.reduce((s, b) => s + b.amount, 0);
  const netProfit = totalRevenue - totalCommission;

  // 取得宮廟與帳單狀態
  const allTemples = typeof gStore !== 'undefined' ? (gStore.db_temples || db_temples) : db_temples;
  let templeBills: any[] = typeof gStore !== 'undefined' ? (gStore.db_temple_bills || db_temple_bills) : db_temple_bills;
  try {
    const { dbQuery } = await import('@/db/db');
    const res = await dbQuery("SELECT * FROM temple_bills", [], () => null) as any;
    const rows = res?.rows;
    if (rows) templeBills = rows;
  } catch(e) {}

  const templePayments = allTemples.filter((t: any) => !t.distributorId).map((t: any) => {
    const bills = templeBills.filter(b => b.temple_id === t.id || b.templeId === t.id);
    const unpaidBills = bills.filter(b => b.status === 'Unpaid' || b.status === 'PendingVerification');
    const hasUnpaid = unpaidBills.length > 0;
    const isPending = unpaidBills.some(b => b.status === 'PendingVerification');

    const isYearly = t.paymentCycle === 'Yearly';
    const discountRate = db_config.yearlyDiscountRate || 20;
    const discountMultiplier = 1 - discountRate / 100;
    const calcPrice = isYearly ? ((t.monthlyRent || 3600) * 12 * discountMultiplier) : (t.monthlyRent || 3600);
    const rentAmount = t.freeType === 'Permanent' ? 0 : calcPrice;

    return {
      id: t.id,
      name: t.templeName || t.name,
      monthlyRent: t.monthlyRent || 3600,
      rentAmount: rentAmount,
      paymentCycle: t.paymentCycle || 'Monthly',
      status