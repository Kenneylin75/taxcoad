
const { Project, SyntaxKind } = require('ts-morph');
const project = new Project();
const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

const funcsWithAwaitArray = [];
for (const func of sourceFile.getFunctions()) {
  if (func.getText().includes('(await [])')) {
    funcsWithAwaitArray.push(func.getName());
  }
}

console.log(funcsWithAwaitArray.join(', '));

