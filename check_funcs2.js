
const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');
const funcs = ['fetchAggregatedAnalytics', 'fetchDistributorTemples', 'fetchAiApiModels', 'getTempleBasicInfo'];
funcs.forEach(f => {
  console.log('--- ' + f + ' ---');
  const fn = sourceFile.getFunction(f);
  if (fn) console.log(fn.getText());
});

