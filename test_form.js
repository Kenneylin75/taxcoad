const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Creating form...");
    const form = await prisma.form.create({
      data: {
        id: 'test-form-123',
        templeId: 'temple-kw3wcg5v',
        name: 'Test Form',
        fields: []
      }
    });
    console.log("Created:", form);
    
    const count = await prisma.form.count();
    console.log("Total forms:", count);
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
