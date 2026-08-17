const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    let dist = await prisma.distributor.findFirst({ where: { account: 'admin1100' } });
    if (!dist) {
        dist = await prisma.distributor.findFirst({ where: { id: 'admin1100' } });
    }
    
    if (dist) {
        console.log(`Distributor Found: ID=${dist.id}, Name=${dist.name}, Account=${dist.account}, Quota=${dist.quota}, Nodes=${dist.nodes}`);
    } else {
        console.log("Distributor 'admin1100' not found");
    }
    
    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
