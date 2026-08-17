const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const events = await prisma.queueEvent.findMany({ where: { status: 'Cancelled' } });
  for (const event of events) {
    const res = await prisma.queueTicket.updateMany({
      where: { eventId: event.id, status: { not: 'Cancelled' } },
      data: { status: 'Cancelled' }
    });
    console.log('Updated ' + res.count + ' tickets for event ' + event.id);
  }
  
  // 順便把 eventId 為 null 的孤兒票券也標記取消
  const res2 = await prisma.queueTicket.updateMany({
    where: { eventId: null, status: { not: 'Cancelled' } },
    data: { status: 'Cancelled' }
  });
  console.log('Updated ' + res2.count + ' orphan tickets');
}
run().catch(console.error).finally(() => prisma.$disconnect());
