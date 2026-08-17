const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const distId = 'dist-8UD3WMMB';
    
    // 1. Quota Usage
    const temples = await prisma.temple.findMany({ where: { distributorId: distId } });
    console.log(`Temples count for dist: ${temples.length}`);
    
    const salesIdsForCapacity = temples.map(t => t.salesId).filter(Boolean);
    const salesData = await prisma.distributorSales.findMany({
        where: { id: { in: salesIdsForCapacity } }
    });
    const used = temples.filter(t => {
        const s = salesData.find(sd => sd.id === t.salesId);
        return !s || s.role !== 'SuperSales';
    }).length;
    console.log(`Used count (calculated in actions.ts): ${used}`);

    // 2. 當下業務菁英
    const distSales = await prisma.distributorSales.findMany({ where: { distributorId: distId } });
    console.log(`Sales count for dist: ${distSales.length}`);
    console.log(`Sales array: ${JSON.stringify(distSales.map(s => s.name))}`);
    
    // 3. 待處理審核
    const allApps = await prisma.templeApplication.findMany();
    console.log(`Total TempleApplications: ${allApps.length}.`);
    if(allApps.length > 0) {
        console.log(`Sample app: ${JSON.stringify(allApps[0])}`);
    }

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
