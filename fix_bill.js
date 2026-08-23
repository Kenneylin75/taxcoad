const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.temple.findFirst({ where: { account: 'admin2201' } });
  if(!t) return;
  const setupFee = t.setupFee ?? 12000;
  const billDueDate = new Date().toISOString().split('T')[0];
  await prisma.templeBill.create({
    data: {
      id: 'BILL-SETUP-' + Date.now(),
      templeId: t.id,
      type: 'SetupFee',
      amount: setupFee,
      billingDate: new Date().toISOString().substring(0, 7),
      dueDate: billDueDate,
      status: 'Unpaid',
      payeeRole: 'Distributor',
      payeeId: t.distributorId,
      timestamp: new Date().toISOString(),
      itemName: 'SetupFee',
    }
  });
  console.log('Setup fee bill created!');
}
main().catch(console.error).finally(() => prisma.$disconnect());