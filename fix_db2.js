const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stuckTickets = await prisma.queueTicket.findMany({
    where: {
      actualOrder: 0,
      status: { in: ['Queuing', 'Calling', 'Completed'] }
    },
    orderBy: { updatedAt: 'asc' }
  });

  console.log(`Found ${stuckTickets.length} stuck tickets.`);
  let count = 1;
  for (const ticket of stuckTickets) {
    await prisma.queueTicket.update({
      where: { id: ticket.id },
      data: { actualOrder: count }
    });
    console.log(`Updated ticket ${ticket.id} to actualOrder ${count}`);
    count++;
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
