const { Project, SyntaxKind } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const replaceFunction = (funcName, newBody) => {
  const func = sourceFile.getFunction(funcName);
  if (func) {
    func.setBodyText(newBody);
    console.log(`Updated ${funcName}`);
  } else {
    console.log(`Function ${funcName} not found`);
  }
};

replaceFunction('fetchSalesProfileById', `
  try {
    const sales = await prisma.distributorSales.findUnique({
      where: { id: salesId },
      include: { distributor: true }
    });
    if (sales) {
      return {
        name: sales.name,
        parentDistributor: sales.distributor?.name || '未指派',
        account: sales.account
      };
    }
    return { name: '未知', parentDistributor: '未指派', account: '' };
  } catch (error) {
    console.error('fetchSalesProfileById error:', error);
    return { name: '未知', parentDistributor: '未指派', account: '' };
  }
`);

replaceFunction('fetchDistributorCapacity', `
  try {
    let whereClause: any = {};
    if (distId) {
      whereClause = { distributorId: distId };
    }
    
    const temples = await prisma.temple.findMany({
      where: whereClause,
      include: { sales: true }
    });
    
    const used = temples.filter(t => !t.sales || t.sales.role !== 'SuperSales').length;
    
    let total = 0;
    if (distId) {
      const dist = await prisma.distributor.findUnique({ where: { id: distId } });
      total = dist?.nodes || 100;
    } else {
      const dists = await prisma.distributor.findMany();
      total = dists.reduce((acc, d) => acc + (d.nodes || 100), 0);
    }
    
    return { used, total, isUnlimited: total >= 1000 };
  } catch (error) {
    console.error('fetchDistributorCapacity error:', error);
    return { used: 0, total: 100, isUnlimited: false };
  }
`);

replaceFunction('updateDistributorQuota', `
  try {
    const dist = await prisma.distributor.findFirst({
      where: { OR: [{ id: distId }, { account: distId }] }
    });
    if (dist) {
      await prisma.distributor.update({
        where: { id: dist.id },
        data: { quota: newQuota, nodes: newQuota, customNodes: newQuota }
      });
      const { revalidatePath } = require('next/cache');
      revalidatePath('/super-admin');
      return { success: true };
    }
    return { success: false, error: 'Distributor not found' };
  } catch (error) {
    console.error('updateDistributorQuota error:', error);
    return { success: false, error: String(error) };
  }
`);

replaceFunction('fetchSalesPerformance', `
  try {
    const sales = await prisma.distributorSales.findFirst({ where: { name: salesName } });
    if (!sales) return { total: 0, approved: 0 };
    
    const temples = await prisma.temple.findMany({ where: { salesId: sales.id } });
    return {
      total: temples.length,
      approved: temples.filter(t => t.status === 'Active').length
    };
  } catch (error) {
    console.error('fetchSalesPerformance error:', error);
    return { total: 0, approved: 0 };
  }
`);

replaceFunction('fetchVisitationRecords', `
  try {
    const records = await prisma.salesVisit.findMany({
      where: { salesName }
    });
    return records;
  } catch (error) {
    console.error('fetchVisitationRecords error:', error);
    return [];
  }
`);

replaceFunction('approveTempleBill', `
  try {
    const bill = await prisma.templeBill.findUnique({ where: { id: billId } });
    if (!bill) return { success: false };
    
    await prisma.templeBill.update({
      where: { id: billId },
      data: { status: 'Paid' }
    });

    const templeId = bill.templeId;
    if (templeId) {
      await prisma.temple.update({
        where: { id: templeId },
        data: { paymentStatus: 'Paid', status: 'Active' }
      });
    }

    const temple = await prisma.temple.findUnique({ where: { id: templeId! } });

    // --- LOGIC FOR UPGRADES ---
    if (bill.type === 'StorageUpgrade' || bill.type === 'AiUpgrade') {
       const match = bill.itemName?.match(/\\(([^)]+)\\)$/);
       const planId = match ? match[1] : null;

       const adminWallet = await prisma.wallet.findFirst({ where: { role: 'SuperAdmin' } });
       if (adminWallet) {
          await prisma.wallet.update({
            where: { id: adminWallet.id },
            data: { balance: { increment: bill.amount } }
          });
       }

       await prisma.financeRecord.create({
         data: {
           type: 'INCOME',
           category: bill.type === 'StorageUpgrade' ? 'SPACE_UPGRADE' : 'AI_UPGRADE',
           amount: bill.amount,
           source: \`\${temple?.templeName || '宮廟'}-\${bill.type === 'StorageUpgrade' ? '雲端空間升級' : 'AI方案升級'} (後台審核)\`,
           date: new Date()
         }
       });

       if (bill.type === 'StorageUpgrade' && planId) {
          await upgradeTempleStorage(bill.templeId!, planId, 'Monthly', true);
       } else if (bill.type === 'AiUpgrade' && planId) {
          let usage = await prisma.templeAiUsage.findUnique({ where: { templeId: bill.templeId! } });
          const thirtyDaysLater = new Date();
          thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
          if (usage) {
             await prisma.templeAiUsage.update({
               where: { templeId: bill.templeId! },
               data: { planId, expiryDate: thirtyDaysLater, usedCount: 0, enabled: true }
             });
          } else {
             await prisma.templeAiUsage.create({
               data: { templeId: bill.templeId!, enabled: true, planId, usedCount: 0, expiryDate: thirtyDaysLater, isVip: false }
             });
          }
       }
    }
    // --- END LOGIC ---

    if (temple && temple.salesId) {
      const salesPerson = await prisma.distributorSales.findUnique({ where: { id: temple.salesId } });
      if (salesPerson) {
         const sysConfig = await fetchSystemConfig();
         const rates = salesPerson.commissionRules as any || sysConfig?.defaultSuperSalesRates || {};
         const rate = rates.templeSetupRate || 20; 
         const commissionAmt = Math.floor(bill.amount * (rate / 100));
         
         if (commissionAmt > 0) {
           await prisma.commission.create({
             data: {
               salesId: salesPerson.id,
               templeId: temple.id,
               billId: bill.id,
               amount: commissionAmt,
               date: new Date()
             }
           });
           
           const wallet = await prisma.wallet.findFirst({ where: { name: salesPerson.name } });
           if (wallet) {
             await prisma.wallet.update({
               where: { id: wallet.id },
               data: { balance: { increment: commissionAmt } }
             });
           } else {
             await prisma.wallet.create({
               data: {
                 ownerId: salesPerson.id,
                 name: salesPerson.name,
                 role: salesPerson.role,
                 balance: commissionAmt
               }
             });
           }
         }
      }
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

replaceFunction('rejectTempleBill', `
  try {
    const bill = await prisma.templeBill.findUnique({ where: { id: billId } });
    if (!bill) return { success: false };
    
    await prisma.templeBill.update({
      where: { id: billId },
      data: { status: 'PendingPayment', receiptUrl: null }
    });

    if (bill.templeId) {
      await prisma.temple.update({
        where: { id: bill.templeId },
        data: { paymentStatus: 'PendingPayment' }
      });
    }

    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

replaceFunction('updateDistributorProfile', `
  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.account) updateData.account = data.account;
    if (data.password) updateData.password = data.password;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.bankInfo) {
      updateData.bankCode = data.bankInfo.bankCode || '';
      updateData.bankAccount = data.bankInfo.accountNumber || '';
      updateData.bankName = data.bankInfo.bankName || '';
    }
    
    await prisma.distributor.update({
      where: { id: distId },
      data: updateData
    });
    
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    revalidatePath('/distributor');
    return { success: true };
  } catch (error) {
    console.error('updateDistributorProfile error:', error);
    return { success: false, error: String(error) };
  }
`);

replaceFunction('updateDistributorPaymentConfig', `
  try {
    await prisma.distributor.update({
      where: { id: distId },
      data: { b2bPayment: paymentConfig }
    });
    return { success: true };
  } catch (error) {
    console.error('updateDistributorPaymentConfig error:', error);
    return { success: false, error: String(error) };
  }
`);

replaceFunction('updateDistributorBankInfo', `
  try {
    await prisma.distributor.update({
      where: { id: distId },
      data: {
        bankCode: bankInfo.bankCode || '',
        bankAccount: bankInfo.accountNumber || '',
        bankName: bankInfo.bankName || ''
      }
    });
    return true;
  } catch (error) {
    console.error('updateDistributorBankInfo error:', error);
    return false;
  }
`);

replaceFunction('toggleBillStatusSimple', `
  try {
    await prisma.templeBill.update({
      where: { id: billId },
      data: { status }
    });
    return { success: true };
  } catch (error) {
    console.error('toggleBillStatusSimple error:', error);
    return { success: false };
  }
`);

sourceFile.saveSync();
console.log('Saved actions.ts');
