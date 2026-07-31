import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const id = `ss-${Date.now()}`;
    const res = await prisma.distributorSales.create({
      data: {
        id,
        name: 'Test Super Sales',
        account: 'testsale123',
        password: 'password',
        role: 'SuperSales',
        status: 'Active',
        joinedAt: new Date().toISOString().split('T')[0],
      }
    });
    console.log("Success:", res);
  } catch (err) {
    console.error("Error creating:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
