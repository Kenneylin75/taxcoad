const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const data = {
    distributorId: 'dist-RZ1ZPM8T',
    name: 'Test Sales',
    account: 'testsales01',
    password: 'password123',
    phone: '0912345678',
    setupFeePercent: 20,
    rentYear1Percent: 15,
    rentYear2Percent: 10,
    rentYear3PlusPercent: 5
  };
  const id = 'sales-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  try {
    await prisma.distributorSales.create({
      data: {
        id: id,
        distributorId: data.distributorId,
        name: data.name,
        account: data.account,
        password: data.password,
        phone: data.phone,
        role: 'DistSales',
        status: 'Active',
        joinedAt: new Date().toISOString().split('T')[0],
        commissionRules: {
          setupRate: data.setupFeePercent,
          rentYear1Rate: data.rentYear1Percent,
          rentYear2Rate: data.rentYear2Percent,
          rentYear3PlusRate: data.rentYear3PlusPercent
        }
      }
    });
    console.log('Success:', id);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
