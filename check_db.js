const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const temples = await prisma.temple.findMany({ where: { name: { contains: '鎮安堂' } } });
  console.log('Temples:', JSON.stringify(temples.map(t => ({ id: t.id, name: t.name, salesId: t.salesId, distributorId: t.distributorId, superSalesId: t.superSalesId })), null, 2));
  
  const distSales = await prisma.distributorSales.findMany();
  console.log('DistSales:', JSON.stringify(distSales.map(d => ({ id: d.id, name: d.name, distributorId: d.distributorId })), null, 2));

  const superSales = await prisma.user.findMany({ where: { role: 'SuperSales' }});
  console.log('SuperSales:', JSON.stringify(superSales.map(d => ({ id: d.id, name: d.name })), null, 2));

  const dists = await prisma.distributor.findMany();
  console.log('Distributors:', JSON.stringify(dists.map(d => ({ id: d.id, name: d.name })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
