
const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const funcs = ['fetchAuditLogs', 'fetchAdminLogs', 'fetchDistributorLogs', 'fetchSaasOrders', 'fetchNotifications', 'fetchPasswordResets', 'updateAccountStatus', 'updateAccountPassword', 'transferTemples'];

funcs.forEach(f => {
  const func = sourceFile.getFunction(f);
  if (func) {
    console.log('--- ' + f + ' ---');
    console.log(func.getText());
  }
});

