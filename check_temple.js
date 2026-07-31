const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.temple.findUnique({ where: { id: 'temple-gsjems2l' } });
  console.log('Temple details:', {
     id: t.id,
     name: t.name,
     address: t.address,
     phone: t.phone,
     salesId: t.salesId,
     superSalesId: t.superSalesId,
     distributorId: t.distributorId
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
