const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const replaceFunction = (funcName, newBody) => {
  const func = sourceFile.getFunction(funcName);
  if (func) {
    func.setBodyText(newBody);
    console.log(`Updated ${funcName}`);
  } else {
    console.log(`Function ${funcName} not found`);
  }
};

replaceFunction('fetchGuestHistory', `
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { files: [], records: [], appointments: [], lampRecords: [], activities: [], queueTickets: [], eventRegistrations: [] };
    const normPhone = p.replace(/-/g, '');
    
    // We fetch everything based on phone containing the digits (since normPhone is just digits)
    const files = await prisma.guestFile.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { uploadedAt: 'desc' } });
    const appointments = await prisma.appointment.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
    const lampRecords = await prisma.lampRecord.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
    const queueTickets = await prisma.queueTicket.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
    const eventRegistrations = await prisma.eventRegistration.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });

    return {
      files,
      records: appointments,
      appointments,
      lampRecords,
      activities: [],
      queueTickets,
      eventRegistrations
    };
  } catch (error) {
    console.error('fetchGuestHistory error:', error);
    return { files: [], records: [], appointments: [], lampRecords: [], activities: [], queueTickets: [], eventRegistrations: [] };
  }
`);

replaceFunction('fetchGuestRecords', `
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    const normPhone = phone.replace(/-/g, '');
    return await prisma.appointment.findMany({
      where: { templeId, phone: { contains: normPhone } },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('fetchGuestRecords error:', error);
    return [];
  }
`);

replaceFunction('fetchGuestByPhone', `
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return null;
    const normPhone = p.replace(/-/g, '');
    return await prisma.guest.findFirst({
      where: { templeId, phone: { contains: normPhone } }
    });
  } catch (error) {
    console.error('fetchGuestByPhone error:', error);
    return null;
  }
`);

replaceFunction('getGuestLineId', `
  try {
    const guest = await prisma.guest.findFirst({
      where: { templeId, phone }
    });
    return guest?.lineId || null;
  } catch (error) {
    console.error('getGuestLineId error:', error);
    return null;
  }
`);

replaceFunction('updateDeepRecord', `
  try {
    const app = await prisma.appointment.findUnique({ where: { id: recordId } });
    if (app) {
      await prisma.appointment.update({
        where: { id: recordId },
        data: values
      });
      return { success: true, message: '紀錄已更新' };
    }
    return { success: false, message: '找不到指定的案卷紀錄' };
  } catch (error) {
    console.error('updateDeepRecord error:', error);
    return { success: false, message: '更新失敗' };
  }
`);

replaceFunction('updateAppointmentPayment', `
  try {
    const id = String(appId);
    const app = await prisma.appointment.findUnique({ where: { id } });
    if (!app) return { success: false, message: '找不到該預約' };
    
    let paymentStatus = 'Pending';
    let status = 'Pending';
    if (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') {
      paymentStatus = 'Paid';
      status = 'Confirmed';
    }
    
    await prisma.appointment.update({
      where: { id },
      data: { paymentMethod, paymentRef, paymentStatus, status }
    });
    return { success: true };
  } catch (error) {
    console.error('updateAppointmentPayment error:', error);
    return { success: false, message: '更新失敗' };
  }
`);

sourceFile.saveSync();
console.log('Saved actions.ts');
