import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  try {
    const temple = await prisma.temple.findFirst({ where: { account: 'admin1001' } });
    if (!temple) return;
    const storage = await prisma.templeStorage.findUnique({ where: { templeId: temple.id } });
    console.log('TempleStorage:', storage ? {
      ...storage,
      allocatedBytes: storage.allocatedBytes.toString(),
      usedBytes: storage.usedBytes.toString()
    } : 'null');
    const aiConfig = await prisma.temple.findUnique({ where: { id: temple.id }, select: { planId: true } });
    console.log('Temple planId:', aiConfig?.planId);
  } finally {
    await prisma.$disconnect();
  }
}
check();
