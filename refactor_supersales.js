const { Project } = require('ts-morph');
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

replaceFunction('fetchSuperSalesProfile', `
  try {
    const sales = await prisma.distributorSales.findUnique({
      where: { id: salesId }
    });
    return sales;
  } catch (e) {
    console.error(e);
    return null;
  }
`);

replaceFunction('updateSuperSalesBankInfo', `
  try {
    await prisma.distributorSales.update({
      where: { id: salesId },
      data: { bankAccount: bankInfo }
    });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-sales/[salesId]', 'page');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Account not found' };
  }
`);

replaceFunction('updateSuperSalesBasicInfo', `
  try {
    await prisma.distributorSales.update({
      where: { id: salesId },
      data: { phone: data.phone, email: data.email }
    });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-sales/[salesId]', 'page');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Account not found' };
  }
`);

replaceFunction('createSuperSalesAccount', `
  try {
    const existing = await prisma.distributorSales.findUnique({ where: { account: data.account } });
    if (existing) {
      return { success: false, error: '帳號已被使用，請更換其他帳號' };
    }
    const id = \`ss-\${Date.now()}\`;
    
    const commissionRules = {
      distributorAuthRate: Number(data.distributorAuthRate) || 15,
      templeSetupRate: Number(data.templeSetupRate) || 10,
      templeSetupType: data.templeSetupType || 'percent',
      templeRentRates: [
        Number(data.rentY1) || 15,
        Number(data.rentY2) || 12,
        Number(data.rentY3) || 10
      ]
    };

    await prisma.distributorSales.create({
      data: {
        id,
        name: data.name,
        account: data.account,
        password: data.password || '',
        role: 'SuperSales',
        status: 'Active',
        commissionRules,
        joinedAt: new Date().toISOString().split('T')[0]
      }
    });

    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    return { success: true, id };
  } catch (e) {
    console.error(e);
    return { success: false, error: String(e) };
  }
`);

replaceFunction('fetchSuperSalesAccounts', `
  try {
    const sales = await prisma.distributorSales.findMany({
      where: { role: 'SuperSales' }
    });
    
    // We should parse commissionRules back to rates if needed
    return sales.map(s => {
      const parsedRates = s.commissionRules && typeof s.commissionRules === 'object' 
        ? s.commissionRules 
        : { templeSetupRate: 20 };
      return {
        ...s,
        rates: parsedRates
      };
    });
  } catch (e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('approveTempleBySuperAdmin', `
  try {
    const temple = await prisma.temple.findUnique({ where: { id } });
    if (temple) {
      await prisma.temple.update({
        where: { id },
        data: { status: 'Active' }
      });
      await generateInitialBills(temple);
      
      if (temple.account && temple.password) {
         await prisma.user.upsert({
           where: { account: temple.account },
           update: {},
           create: {
             id: \`p-\${Date.now()}\`,
             templeId: id,
             name: temple.templeName || '宮廟管理員',
             account: temple.account,
             password: temple.password,
             role: 'TempleAdmin',
             status: 'Active'
           }
         });
      }
    }
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

replaceFunction('rejectTempleBySuperAdmin', `
  try {
    await prisma.temple.delete({ where: { id } });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

replaceFunction('approveDistributorBySuperAdmin', `
  try {
    const app = await prisma.distributorApplication.findUnique({ where: { id } });
    if (app) {
      await prisma.distributorApplication.update({
        where: { id },
        data: { status: 'Active' }
      });

      const distId = 'dist-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      let actualSalesId = app.submittedBy;
      if (actualSalesId) {
         const sales = await prisma.distributorSales.findFirst({ where: { name: actualSalesId } });
         if (sales) actualSalesId = sales.id;
      }
      
      const newQuota = overrideQuota !== undefined ? overrideQuota : Number(app.nodes || 100);

      await prisma.distributor.upsert({
        where: { account: app.account || app.name },
        update: { status: 'Active' },
        create: {
          id: distId,
          name: app.name,
          account: app.account || app.name,
          password: app.password || 'pivot2026',
          planId: app.planId || 'PLAN-A',
          planName: '標準代理方案',
          price: Number(app.price || 0),
          status: 'Active',
          quota: newQuota,
          nodes: newQuota,
          customNodes: newQuota,
          joinedAt: new Date().toISOString().split('T')[0],
          expirationDate: app.expirationDate || '',
          creatorSalesId: actualSalesId || '',
          phone: app.phone || '',
          email: app.email || '',
          address: app.address || '',
          contactName: app.contactName || '',
          taxId: app.taxId || '',
          bankCode: '',
          bankAccount: '',
          bankName: ''
        }
      });
    }
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

sourceFile.saveSync();
console.log('Saved actions.ts for SuperSales');
