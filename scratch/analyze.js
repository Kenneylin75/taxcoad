const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFilesAtPaths("src/app/actions.ts");
const sourceFile = project.getSourceFile("src/app/actions.ts");

const functions = sourceFile.getFunctions();
let unmodifiedFunctions = [];
let hybridFunctions = [];

functions.forEach(func => {
  const text = func.getText();
  if (text.includes('jsonStore.')) {
    if (text.includes('dbQuery') || text.includes('client.query')) {
      hybridFunctions.push(func.getName());
    } else {
      unmodifiedFunctions.push(func.getName());
    }
  }
});

console.log("Hybrid Functions (has both PG and jsonStore):", hybridFunctions.join(', '));
console.log("\nUnmodified Functions (only jsonStore):", unmodifiedFunctions.join(', '));
