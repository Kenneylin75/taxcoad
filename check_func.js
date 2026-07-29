
const { Project } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');
console.log(sourceFile.getFunction('fetchAllAccountsForAdmin').getText());

