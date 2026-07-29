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

replaceFunction('fetchAuditLogs', `
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    
    const logs = await prisma.auditLog.findMany({
      where: { templeId },
      orderBy: { timestamp: 'desc' }
    });
    return logs;
  } catch (e) {
    console.error('fetchAuditLogs error', e);
    return [];
  }
`);

replaceFunction('fetchAdminLogs', `
  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { timestamp: 'desc' }
    });
    return logs;
  } catch (e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('fetchDistributorLogs', `
  try {
    const logs = await prisma.adminLog.findMany({
      where: { target: { contains: distributorId } },
      orderBy: { timestamp: 'desc' }
    });
    return logs;
  } catch (e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('fetchSaasOrders', `
  return []; // Currently unused in new system
`);

replaceFunction('fetchNotifications', `
  try {
    let whereClause: any = {};
    if (userRole !== 'SuperAdmin') {
      whereClause = {
        OR: [
          { targetUser: userName },
          { title: { notIn: ['新宮廟核定申請', '新經銷體系授權申請', '密碼重設申請', '手動獎金撥發通知'] } },
          { 
            title: { in: ['新宮廟核定申請', '新經銷體系授權申請', '密碼重設申請', '手動獎金撥發通知'] },
            content: { contains: userName || '' }
          }
        ]
      };
    }
    
    return await prisma.notification.findMany({
      where: whereClause,
      orderBy: { date: 'desc' }
    });
  } catch (e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('fetchPasswordResets', `
  try {
    return await prisma.passwordReset.findMany({
      orderBy: { date: 'desc' }
    });
  } catch (e) {
    console.error(e);
    return [];
  }
`);

replaceFunction('updateAccountStatus', `
  try {
    if (role === 'TempleAdmin' || role === 'Temple') {
      await prisma.temple.update({ where: { id }, data: { status } });
      await prisma.user.updateMany({ where: { templeId: id }, data: { status } });
    } else if (role === 'Distributor') {
      await prisma.distributor.update({ where: { id }, data: { status } });
    } else if (role === 'SuperSales' || role === 'DistSales') {
      await prisma.distributorSales.update({ where: { id }, data: { status } });
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

replaceFunction('updateAccountPassword', `
  try {
    if (role === 'Temple' || id.startsWith('temple-')) {
      await prisma.temple.update({ where: { id }, data: { password: newPass } });
      
      const user = await prisma.user.findFirst({ where: { templeId: id } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { password: newPass } });
      } else {
        const temple = await prisma.temple.findUnique({ where: { id } });
        if (temple) {
          await prisma.user.create({
            data: {
              id: \`p-\${Date.now()}\`,
              templeId: id,
              name: temple.templeName || '宮廟管理員',
              account: temple.account || \`admin-\${id.slice(-4)}\`,
              password: newPass,
              role: 'TempleAdmin',
              status: 'Active'
            }
          });
        }
      }
    } else if (role === 'Distributor') {
      await prisma.distributor.update({ where: { id }, data: { password: newPass } });
    } else if (role === 'SuperSales' || role === 'DistSales') {
      await prisma.distributorSales.update({ where: { id }, data: { password: newPass } });
    } else {
      await prisma.user.update({ where: { id }, data: { password: newPass } });
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

replaceFunction('transferTemples', `
  try {
    if (targetRole === 'HQ') {
      await prisma.temple.updateMany({
        where: { id: { in: templeIds } },
        data: { distributorId: null, salesId: null }
      });
    } else if (targetRole === 'Distributor') {
      await prisma.temple.updateMany({
        where: { id: { in: templeIds } },
        data: { distributorId: targetId, salesId: null }
      });
    } else if (targetRole === 'SuperSales') {
      await prisma.temple.updateMany({
        where: { id: { in: templeIds } },
        data: { distributorId: null, salesId: targetId }
      });
    }
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
`);

sourceFile.saveSync();
console.log('Saved actions.ts for Admin functions');
