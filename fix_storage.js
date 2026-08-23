const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.temple.findFirst({ where: { account: 'admin2201' } });
  if(!t) return;
  const billDueDate = new Date().toISOString().split('T')[0];
  await prisma.templeBill.create({
    data: {
      id: 'BILL-STORAGE-' + Date.now(),
      templeId: t.id,
      type: 'StorageMonthly',
      amount: 600,
      billingDate: new Date().toISOString().substring(0, 7),
      dueDate: billDueDate,
      status: 'Unpaid',
      payeeRole: 'SuperAdmin',
      payeeId: 'system-hq',
      timestamp: new Date().toISOString(),
      itemName: '雲端空間專案 - A方案 (SP-1787242420385)',
    }
  });
  console.log('Storage bill created!');
}
main().catch(console.error).finally(() => prisma.$disconnect());