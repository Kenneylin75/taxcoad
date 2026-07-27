const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFilesAtPaths("src/app/actions.ts");

const sourceFile = project.getSourceFile("src/app/actions.ts");

let changed = false;

// Remove jsonStore import
const importDecls = sourceFile.getImportDeclarations();
for (const imp of importDecls) {
  if (imp.getModuleSpecifierValue().includes('jsonStore')) {
    imp.remove();
    changed = true;
    console.log("Removed jsonStore import");
  }
}

// Find all if (!client) and replace with just the else block
const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
const toReplace = [];

for (const ifStmt of ifStatements) {
  const expr = ifStmt.getExpression();
  if (expr.getKind() === SyntaxKind.PrefixUnaryExpression) {
    if (expr.getOperatorToken() === SyntaxKind.ExclamationToken && expr.getOperand().getText() === 'client') {
      toReplace.push(ifStmt);
    }
  }
}

// We iterate backwards to not mess up AST indices during removal
for (let i = toReplace.length - 1; i >= 0; i--) {
  const ifStmt = toReplace[i];
  const elseStmt = ifStmt.getElseStatement();
  if (elseStmt) {
    // Replace the entire if (!client) { A } else { B } with B
    if (elseStmt.getKind() === SyntaxKind.Block) {
      ifStmt.replaceWithText(elseStmt.getStatements().map(s => s.getText()).join('\n'));
    } else {
      ifStmt.replaceWithText(elseStmt.getText());
    }
    changed = true;
  } else {
    // if (!client) { A } without else
    ifStmt.remove();
    changed = true;
  }
}

if (changed) {
  sourceFile.saveSync();
  console.log("actions.ts updated to remove if (!client) dead code.");
}
