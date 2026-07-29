
const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const funcs = ['fetchGuestHistory', 'fetchGuestRecords', 'fetchGuestByPhone', 'getGuestLineId', 'updateDeepRecord', 'updateAppointmentPayment'];

funcs.forEach(f => {
  const func = sourceFile.getFunction(f);
  if (func) {
    console.log('--- ' + f + ' ---');
    console.log(func.getText());
  }
});

