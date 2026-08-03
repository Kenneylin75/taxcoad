const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const temples = await prisma.temple.findMany({ orderBy: { createdAt: 'desc' }, take: 5 });
  console.log('Latest 5 temples:', JSON.stringify(temples, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
