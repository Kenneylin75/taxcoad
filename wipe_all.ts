import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function wipe() {
  try {
    // Delete all related records first to avoid foreign key constraints
    console.log('Deleting dependent records...');
    await prisma.activity.deleteMany();
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
    await prisma.lampRecord.deleteMany();
    await prisma.lampCategory.deleteMany();
    await prisma.queueTicket.deleteMany();
    await prisma.queueEvent.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.leaveRecord.deleteMany();
    await prisma.serviceSetting.deleteMany();
    await prisma.service.deleteMany();
    await prisma.printTemplate.deleteMany();
    await prisma.form.deleteMany();
    await prisma.slot.deleteMany();
    await prisma.templeBill.deleteMany();
    await prisma.templeStorage.deleteMany();
    await prisma.templeAiUsage.deleteMany();
    await prisma.syncQueue.deleteMany();
    await prisma.financeRecord.deleteMany();
    await prisma.templeNotification.deleteMany();
    await prisma.aiChatLog.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.deepRecord.deleteMany();
    await prisma.guest.deleteMany();
    await prisma.adminNotification.deleteMany();

    console.log('Deleting core records...');
    await prisma.user.deleteMany();
    await prisma.temple.deleteMany();
    await prisma.commission.deleteMany();
    await prisma.salesVisit.deleteMany();
    await prisma.distributorSales.deleteMany();
    await prisma.distributor.deleteMany();
    
    console.log('Successfully wiped test data.');
  } catch (e) {
    console.error('Error wiping data:', e);
  } finally {
    await prisma.$disconnect();
  }
}

wipe();
