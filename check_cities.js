const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const temples = await prisma.temple.findMany({ select: { city: true } });
  const cities = new Set(temples.map(t => t.city));
  console.log(Array.from(cities));
}
main().finally(() => prisma.$disconnect());
