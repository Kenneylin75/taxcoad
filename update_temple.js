const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const salesRes = await prisma.$queryRaw`SELECT id, name, distributor_id FROM dist_sales WHERE account = 'admin66' OR name = 'admin66'`;
  const sales = salesRes[0];
  
  if (sales) {
    console.log("Found sales:", sales);
    await prisma.$queryRaw`
      UPDATE "Temple"
      SET sales_id = ${sales.id},
          distributor_id = ${sales.distributor_id}
      WHERE id = 'temple-gsjems2l'
    `;
    console.log("Updated temple-gsjems2l with salesId:", sales.id);
  } else {
    console.log("Sales admin66 not found!");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
