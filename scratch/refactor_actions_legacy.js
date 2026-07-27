const { Project } = require('ts-morph');
const fs = require('fs');

async function main() {
  const project = new Project();
  const sourceFile = project.addSourceFileAtPath('src/app/actions.ts');

  // Remove `ensureStorage` function and its calls
  const ensureStorageFn = sourceFile.getFunction('ensureStorage');
  if (ensureStorageFn) {
    ensureStorageFn.remove();
  }

  // Remove `ensurePlatformTables` function and its calls
  const ensurePlatformTablesFn = sourceFile.getFunction('ensurePlatformTables');
  if (ensurePlatformTablesFn) {
    ensurePlatformTablesFn.remove();
  }

  // Remove calls to these functions
  const callExpressions = sourceFile.getDescendantsOfKind(require('ts-morph').SyntaxKind.CallExpression);
  for (const call of callExpressions) {
    const text = call.getText();
    if (text.startsWith('ensureStorage(') || text.startsWith('ensurePlatformTables(')) {
      // Remove the entire ExpressionStatement (or AwaitExpression inside ExpressionStatement)
      const stmt = call.getFirstAncestorByKind(require('ts-morph').SyntaxKind.ExpressionStatement);
      if (stmt) {
        try {
          stmt.remove();
        } catch(e) {}
      }
    }
  }

  // Remove `let _isStorageInit = false;`
  const varDecls = sourceFile.getVariableStatements();
  for (const v of varDecls) {
    if (v.getText().includes('_isStorageInit')) {
      v.remove();
    }
  }

  // Remove jsonStore and storageInit imports
  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    if (moduleSpecifier === '@/lib/jsonStore' || moduleSpecifier === '@/lib/storageInit') {
      imp.remove();
    }
  }

  sourceFile.saveSync();
  console.log('Successfully refactored actions.ts initialization logic.');
}

main().catch(console.error);
