const { Project, SyntaxKind } = require('ts-morph');

const project = new Project();
project.addSourceFileAtPath('src/app/actions.ts');
const sourceFile = project.getSourceFile('src/app/actions.ts');

console.log('Parsing actions.ts...');

// 1. Fix dbQuery calls (remove the fallback argument)
const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
let dbQueryCount = 0;
for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();
    if (expr.getText() === 'dbQuery') {
        const args = callExpr.getArguments();
        if (args.length === 3) {
            callExpr.removeArgument(2);
            dbQueryCount++;
        }
    }
}
console.log(`Fixed ${dbQueryCount} dbQuery calls.`);

// 2. Fix the specific malformed SQL strings
const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
let sqlCount = 0;
for (const stringLiteral of stringLiterals) {
    let text = stringLiteral.getLiteralText();
    if (text.includes('UPDATE appointments SET payment_status = , payment_method = WHERE id = RETURNING id')) {
        stringLiteral.setLiteralValue(text.replace(
            'UPDATE appointments SET payment_status = , payment_method = WHERE id = RETURNING id',
            'UPDATE appointments SET payment_status = $1, payment_method = $2 WHERE id = $3 RETURNING id'
        ));
        sqlCount++;
    } else if (text.includes('UPDATE queue_tickets SET payment_status = WHERE id = RETURNING id')) {
         stringLiteral.setLiteralValue(text.replace(
            'UPDATE queue_tickets SET payment_status = WHERE id = RETURNING id',
            'UPDATE queue_tickets SET payment_status = $1 WHERE id = $2 RETURNING id'
        ));
        sqlCount++;
    }
}
console.log(`Fixed ${sqlCount} malformed SQL strings.`);

// 3. Strip jsonStore fallback blocks.
// We will look for `if (!client)` statements and replace them.
const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
let ifCount = 0;
for (const ifStmt of ifStatements) {
    const expr = ifStmt.getExpression();
    if (expr.getText() === '!client') {
        const elseStatement = ifStmt.getElseStatement();
        if (elseStatement) {
            // Replace the entire if (!client) { ... } else { ... } with just the else block's contents
            if (elseStatement.getKind() === SyntaxKind.Block) {
                // If the else is a block, we unwrap its statements
                const elseText = elseStatement.getChildSyntaxList().getText();
                ifStmt.replaceWithText(elseText);
            } else {
                // Else is a single statement
                ifStmt.replaceWithText(elseStatement.getText());
            }
            ifCount++;
        } else {
            // It's just an `if (!client) return ...`
            ifStmt.remove();
            ifCount++;
        }
    }
}
console.log(`Removed ${ifCount} if (!client) blocks.`);

// 4. Also find and remove variables named 'gStore' and references to it
const varDecls = sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration);
for (const varDecl of varDecls) {
    if (varDecl.getName() === 'gStore') {
        const statement = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
        if (statement) statement.remove();
    }
    if (varDecl.getName() === 'pData') {
        const initializer = varDecl.getInitializer();
        if (initializer && initializer.getText().includes('jsonStore.find')) {
            const statement = varDecl.getFirstAncestorByKind(SyntaxKind.VariableStatement);
            if (statement) statement.remove();
        }
    }
}

// 5. Delete jsonStore import
const importDecls = sourceFile.getDescendantsOfKind(SyntaxKind.ImportDeclaration);
for (const importDecl of importDecls) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (moduleSpecifier === '@/lib/jsonStore') {
        importDecl.remove();
    }
    if (moduleSpecifier === '@/app/actions') {
        // sometimes imported getSafeJsonArray from self
        importDecl.remove();
    }
}

sourceFile.saveSync();
console.log('Saved actions.ts!');
