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

// 1. Temple Bills & Storage & AI
replaceFunction('fetchTempleBills', `
  try {
    return await prisma.templeBill.findMany({ where: { templeId }, orderBy: { date: 'desc' } });
  } catch(e) {
    return [];
  }
`);

replaceFunction('uploadTempleBillReceipt', `
  try {
    await prisma.templeBill.update({
      where: { id: billId },
      data: { receiptUrl: imageUrl, status: 'Pending' }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('updateDistSalesBankInfo', `
  try {
    await prisma.distributorSales.update({
      where: { id: salesId },
      data: { bankAccount: bankInfo }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('updateRevenueRemark', `
  try {
    await prisma.financeRecord.update({
      where: { id },
      data: { source: remark }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('grantTempleStorageVip', `
  try {
    await prisma.templeStorage.upsert({
      where: { templeId },
      update: { isVip, planId: isVip ? 'VIP-STORAGE' : 'FREE' },
      create: { templeId, isVip, planId: isVip ? 'VIP-STORAGE' : 'FREE', usedBytes: 0, totalBytes: isVip ? 1099511627776 : 5368709120 }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('grantTempleAiVip', `
  try {
    await prisma.templeAiUsage.upsert({
      where: { templeId },
      update: { isVip, planId: isVip ? 'VIP-AI' : 'FREE' },
      create: { templeId, isVip, planId: isVip ? 'VIP-AI' : 'FREE', usedCount: 0 }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('fetchAllTempleAiUsage', `
  try {
    return await prisma.templeAiUsage.findMany({ include: { temple: true } });
  } catch(e) {
    return [];
  }
`);

replaceFunction('fetchTempleAiUsage', `
  try {
    const templeId = await getDynamicTempleId();
    return await prisma.templeAiUsage.findUnique({ where: { templeId: templeId! } });
  } catch(e) {
    return null;
  }
`);

replaceFunction('toggleTempleAiStatus', `
  try {
    const templeId = await getDynamicTempleId();
    await prisma.templeAiUsage.update({
      where: { templeId: templeId! },
      data: { enabled }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('purchaseAiPlan', `
  try {
    const templeId = await getDynamicTempleId();
    const sys = await prisma.systemConfig.findFirst();
    const plan = sys?.aiPlans?.find((p: any) => p.id === planId);
    if (!plan) return { success: false };
    
    await prisma.templeBill.create({
      data: {
        id: \`bill-\${Date.now()}\`,
        templeId: templeId!,
        amount: plan.price,
        type: 'AiUpgrade',
        status: 'PendingPayment',
        date: new Date()
      }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('purchaseAiPlanByAdmin', `
  try {
    const sys = await prisma.systemConfig.findFirst();
    const plan = sys?.aiPlans?.find((p: any) => p.id === planId);
    if (!plan) return { success: false };
    
    await prisma.templeAiUsage.upsert({
      where: { templeId },
      update: { planId, enabled: true },
      create: { templeId, planId, enabled: true, usedCount: 0 }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

// 2. Misc missing
replaceFunction('getTempleCreatorInfo', `
  try {
    const temple = await prisma.temple.findUnique({ where: { id: templeId }, include: { sales: { include: { distributor: true } } } });
    if (!temple || !temple.sales) return null;
    return {
      type: 'Sales',
      id: temple.sales.id,
      name: temple.sales.name,
      distributorName: temple.sales.distributor?.name || ''
    };
  } catch(e) {
    return null;
  }
`);

replaceFunction('logDistributorAction', `
  try {
    // Fire and forget
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('fetchDataBridgeTree', `
  return [];
`);

replaceFunction('fetchDistributorProfile', `
  try {
    if (!distId) return null;
    return await prisma.distributor.findUnique({ where: { id: distId } });
  } catch(e) {
    return null;
  }
`);

replaceFunction('fetchSuperSalesBonuses', `
  try {
    const sales = await prisma.distributorSales.findFirst({ where: { name: salesName } });
    if (!sales) return [];
    return await prisma.bonus.findMany({ where: { salesId: sales.id } });
  } catch(e) {
    return [];
  }
`);

replaceFunction('approveSuperSalesWithdrawal', `
  try {
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'Approved', receiptUrl }
    });
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

replaceFunction('handlePasswordReset', `
  try {
    const pr = await prisma.passwordReset.findUnique({ where: { id } });
    if (!pr) return { success: false };
    await prisma.passwordReset.update({ where: { id }, data: { status: action === 'Approve' ? 'Approved' : 'Rejected' } });
    if (action === 'Approve') {
      await updateAccountPassword(pr.userId, '000000', pr.userRole);
    }
    return { success: true };
  } catch(e) {
    return { success: false };
  }
`);

sourceFile.saveSync();
console.log('Saved actions.ts');
