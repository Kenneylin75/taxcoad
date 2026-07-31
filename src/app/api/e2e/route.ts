import { NextResponse } from 'next/server';
import { 
  createSuperSalesAccount,
  createDistributorAccount,
  createDistributorSales,
  createTempleAccount,
  fetchDistributorFinanceSummary,
  fetchDistributorSalesPerformance
} from '@/app/actions';
import prisma from '@/lib/prisma';

export async function GET() {
  const results: any[] = [];
  try {
    const timestamp = Date.now();
    const postfix = `${timestamp}`;

    // 1. Create SuperSales
    const ssAccount = `ss_${postfix}`;
    await createSuperSalesAccount({
      name: `E2E SuperSales ${postfix}`,
      account: ssAccount,
      password: 'password123',
      phone: '0900000000',
      email: `ss_${postfix}@test.com`
    });
    results.push('✅ SuperSales created');

    // Fetch the created SuperSales to get its ID
    const ssUser = await prisma.distributorSales.findFirst({ where: { account: ssAccount } });
    if (!ssUser) throw new Error("SuperSales not found in DB");

    // 2. Create Distributor
    const distAccount = `dist_${postfix}`;
    await createDistributorAccount({
      name: `E2E Distributor ${postfix}`,
      contactName: 'Dist Contact',
      contactPhone: '0911111111',
      email: `dist_${postfix}@test.com`,
      account: distAccount,
      password: 'password123',
      status: 'Active',
      bankCode: '808',
      bankAccount: '123456789',
      bankName: 'Test Bank',
      nodes: 5,
      superSalesId: ssUser.id
    });
    results.push('✅ Distributor created');

    const dist = await prisma.distributor.findFirst({ where: { account: distAccount } });
    if (!dist) throw new Error("Distributor not found in DB");

    // 3. Create DistSales
    const dsAccount = `ds_${postfix}`;
    await createDistributorSales(dist.id, {
      name: `E2E DistSales ${postfix}`,
      phone: '0922222222',
      email: `ds_${postfix}@test.com`,
      account: dsAccount,
      password: 'password123',
      role: 'DistSales',
      bankAccountInfo: { bankCode: '808', account: '987654321', name: 'Test Bank' },
      setupRate: 10,
      rentYear1Rate: 10,
      rentYear2Rate: 10,
      rentYear3PlusRate: 10
    });
    results.push('✅ DistSales created');

    const ds = await prisma.distributorSales.findFirst({ where: { account: dsAccount } });
    if (!ds) throw new Error("DistSales not found in DB");

    // Give distributor some quota so Temple creation succeeds
    // await prisma.distributor.update({
    //   where: { id: dist.id },
    //   data: { quota: 10 } as any
    // });

    // 4. Create Temple
    const templeAccount = `temple_${postfix}`;
    const templeRes = await createTempleAccount({
      name: `E2E Temple Admin ${postfix}`,
      templeName: `E2E Temple ${postfix}`,
      account: templeAccount,
      password: 'password123',
      region: '北部',
      city: '台北市',
      address: 'Test Address 123',
      phone: '0933333333',
      email: `temple_${postfix}@test.com`,
      planId: 'plan_1',
      setupFee: 1000,
      monthlyRent: 500,
      paymentCycle: 'Monthly',
      salesId: ds.id,
      distributorId: dist.id
    });
    if (templeRes && templeRes.success === false) {
      throw new Error(`Temple creation failed: ${templeRes.message}`);
    }
    results.push('✅ Temple created');

    const temple = await prisma.temple.findFirst({ where: { account: templeAccount } });
    if (!temple) throw new Error("Temple not found in DB");

    // Verify Temple associations
    const tUser = await prisma.user.findFirst({ where: { account: templeAccount } });
    if (!tUser) throw new Error("Temple Admin user not found");
    
    const tBill = await prisma.templeBill.findFirst({ where: { templeId: temple.id } });
    if (!tBill) throw new Error("Initial TempleBill not generated");

    const tStorage = await prisma.templeStorage.findFirst({ where: { templeId: temple.id } });
    if (!tStorage) throw new Error("TempleStorage not provisioned");

    results.push('✅ Temple automatically provisioned User, TempleBill, TempleStorage');

    // 5. End User (Guest) Action - simulating payment
    await prisma.financeRecord.create({
       data: { 
         templeId: temple.id, 
         type: 'INCOME', 
         category: 'LAMP', 
         amount: 1200, 
         description: `E2E 點燈付款`, 
         date: new Date().toISOString().split('T')[0]
       }
    });
    // And mark a TempleBill as Paid so the commission can be calculated
    await prisma.templeBill.update({
      where: { id: tBill.id },
      data: { status: 'Paid', amount: 1500 }
    });

    results.push('✅ Guest payment simulated (FinanceRecord created, TempleBill Paid)');

    // 6. Check Dashboard
    const financeSummary = await fetchDistributorFinanceSummary(dist.id);
    if (!financeSummary) throw new Error("Failed to fetch finance summary");
    results.push('✅ fetchDistributorFinanceSummary executed successfully');

    const salesPerformance = await fetchDistributorSalesPerformance(dist.id);
    if (!salesPerformance) throw new Error("Failed to fetch sales performance");
    results.push('✅ fetchDistributorSalesPerformance executed successfully');

    return NextResponse.json({ success: true, results, salesPerformance });

  } catch (error: any) {
    console.error("E2E API Error:", error);
    return NextResponse.json({ success: false, results, error: error.message, stack: error.stack });
  }
}
