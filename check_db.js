const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const temples = await prisma.temple.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  console.log('--- 最近新增的三筆宮廟 ---');
  console.table(temples.map(t => ({ id: t.id, name: t.name, status: t.status, phone: t.phone, setupFee: t.setupFee, account: t.account })));

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  console.log('\n--- 最近新增的三個使用者 ---');
  console.table(users.map(u => ({ id: u.id, name: u.name, role: u.role, account: u.account, templeId: u.templeId })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
