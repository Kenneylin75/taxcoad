import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixData() {
  try {
    const brokenTemples = await prisma.temple.findMany({
      where: {
        creatorRole: 'dist-sales',
        salesId: null
      }
    });

    console.log(`Found ${brokenTemples.length} temples created by dist-sales but missing salesId.`);
    let fixedCount = 0;

    for (const temple of brokenTemples) {
      if (temple.creatorId) {
        // Find dist-sales with this name
        const ds = await prisma.distributorSales.findFirst({
          where: { name: temple.creatorId }
        });

        if (ds) {
          await prisma.temple.update({
            where: { id: temple.id },
            data: { salesId: ds.id }
          });
          console.log(`Fixed temple '${temple.name}' (ID: ${temple.id}) -> assigned to salesId: ${ds.id} (${ds.name})`);
          fixedCount++;
        } else {
          console.log(`Could not find dist-sales named '${temple.creatorId}' for temple '${temple.name}'`);
        }
      }
    }
    
    // Also fix super-sales if any
    const brokenSSTemples = await prisma.temple.findMany({
      where: {
        creatorRole: 'super-sales',
        superSalesId: null
      }
    });
    console.log(`Found ${brokenSSTemples.length} temples created by super-sales but missing superSalesId.`);
    for (const temple of brokenSSTemples) {
      if (temple.creatorId) {
        const ss = await prisma.user.findFirst({
          where: { name: temple.creatorId, role: 'SuperSales' }
        });
        if (ss) {
           await prisma.temple.update({
             where: { id: temple.id },
             data: { superSalesId: ss.id }
           });
           console.log(`Fixed temple '${temple.name}' -> assigned to superSalesId: ${ss.id}`);
        }
      }
    }

    console.log(`DB fix completed. Total fixed: ${fixedCount}`);
  } catch (error) {
    console.error('Error fixing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixData();
