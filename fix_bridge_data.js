const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  console.log("Starting data patch...");
  
  // Find all pending temples without a salesId
  const orphanTemples = await prisma.temple.findMany({
    where: {
      status: 'Pending',
      salesId: null
    }
  });
  
  if (orphanTemples.length === 0) {
    console.log("No orphan pending temples found.");
    return;
  }

  // Assuming they should belong to the first distributor sales (or we could search by name)
  const firstDistSales = await prisma.distributorSales.findFirst();
  if (!firstDistSales) {
    console.log("No Distributor Sales found to assign to.");
    return;
  }

  for (const temple of orphanTemples) {
    await prisma.temple.update({
      where: { id: temple.id },
      data: {
        salesId: firstDistSales.id,
        distributorId: firstDistSales.distributorId,
        creatorRole: 'DistSales',
        creatorId: firstDistSales.id
      }
    });
    console.log(`Patched Temple: ${temple.name || temple.templeName}`);
  }
  
  console.log("Patch complete!");
}

fixData().catch(e => console.error(e)).finally(() => prisma.$disconnect());
