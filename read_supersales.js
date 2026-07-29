
const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const funcs = ['fetchSuperSalesProfile', 'updateSuperSalesBankInfo', 'updateSuperSalesBasicInfo', 'createSuperSalesAccount', 'fetchSuperSalesAccounts', 'approveTempleBySuperAdmin', 'rejectTempleBySuperAdmin', 'approveDistributorBySuperAdmin'];

funcs.forEach(f => {
  const func = sourceFile.getFunction(f);
  if (func) {
    console.log('--- ' + f + ' ---');
    console.log(func.getText());
  }
});

