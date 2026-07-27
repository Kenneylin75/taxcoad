const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

async function main() {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

  // Reverse array to process from bottom-up/inner-out
  let calls = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).reverse();
  for (const call of calls) {
    if (call.wasForgotten()) continue;
    const exprNode = call.getExpression();
    if (!exprNode || exprNode.wasForgotten()) continue;
    const expr = exprNode.getText();
    if (expr === 'jsonStore.find' || expr === 'jsonStore.readJson' || expr === 'getSafeJsonArray') {
      call.replaceWithText('[]');
    } else if (expr === 'jsonStore.createRecord' || expr === 'jsonStore.updateRecord' || expr === 'jsonStore.atomicWrite' || expr === 'jsonStore.deleteRecord') {
      call.replaceWithText('null');
    }
  }

  // Find all TryStatements that are just swallowing errors for dbQuery
  let tryStatements = sourceFile.getDescendantsOfKind(SyntaxKind.TryStatement).reverse();
  for (const tryStmt of tryStatements) {
    if (tryStmt.wasForgotten()) continue;
    const catchClause = tryStmt.getCatchClause();
    if (catchClause) {
      const block = catchClause.getBlock();
      if (block.getStatements().length === 0) {
        // Empty catch block!
        const tryBlock = tryStmt.getTryBlock();
        const statements = tryBlock.getStatements().map(s => s.getText()).join('\n');
        tryStmt.replaceWithText(statements);
      }
    }
  }

  sourceFile.saveSync();
  console.log('Successfully eliminated jsonStore calls and unwrapped try-catch blocks.');
}

main().catch(console.error);
