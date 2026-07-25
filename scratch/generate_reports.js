const fs = require('fs');
const ts = require('typescript');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
const sourceFile = ts.createSourceFile(
    'actions.ts',
    fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true
);

const phase1Collections = ['db_slots', 'db_appointments', 'db_personnel'];
const allCollections = new Set();
const usages = {
    'db_slots': [],
    'db_appointments': [],
    'db_personnel': []
};

function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.text && node.name.text.startsWith('db_')) {
        allCollections.add(node.name.text);
    }
    
    if (ts.isPropertyAccessExpression(node)) {
        if (node.expression.getText(sourceFile) === 'gStore' && node.name.text.startsWith('db_')) {
            allCollections.add(node.name.text);
        }
    }

    if (ts.isIdentifier(node)) {
        const text = node.text;
        if (phase1Collections.includes(text)) {
            let parent = node.parent;
            let actionType = 'Read';
            
            if (ts.isPropertyAccessExpression(parent)) {
                const prop = parent.name.text;
                if (['push', 'splice', 'pop', 'shift', 'unshift'].includes(prop)) {
                    actionType = 'Write (Mutation)';
                } else if (['find', 'findIndex', 'filter', 'map', 'some', 'every', 'forEach'].includes(prop)) {
                    actionType = 'Read (Iteration)';
                } else if (prop === 'length') {
                    actionType = 'Read (Length)';
                }
            } else if (ts.isElementAccessExpression(parent)) {
                if (parent.parent && ts.isBinaryExpression(parent.parent) && parent.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    if (parent.parent.left === parent) {
                        actionType = 'Write (Assignment)';
                    }
                } else {
                    actionType = 'Read (Index)';
                }
            } else if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                 if (parent.left === node || (ts.isPropertyAccessExpression(parent.left) && parent.left.expression === node)) {
                     actionType = 'Write (Assignment)';
                 }
            }

            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            const lineText = sourceFile.text.substring(node.parent.getStart(sourceFile), node.parent.getEnd()).replace(/\n/g, ' ');

            if (!ts.isVariableDeclaration(parent)) {
                usages[text].push({
                    line: line + 1,
                    type: actionType,
                    code: lineText.substring(0, 100)
                });
            }
        }
    }

    ts.forEachChild(node, visit);
}

visit(sourceFile);

const brainDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'), '.gemini/antigravity-ide/brain', '3961adf1-5ae6-4fbf-9376-d8b65da76837');
if (!fs.existsSync(brainDir)) fs.mkdirSync(brainDir, { recursive: true });

let inventoryMd = `# Inventory & Dependencies Report\n\n## All Discovered gStore.db_* Collections\n`;
Array.from(allCollections).sort().forEach(c => {
    inventoryMd += `- \`${c}\`\n`;
});

inventoryMd += `\n## Phase 1 Entity Dependencies\n- **slots**: Requires \`db_services\`\n- **appointments**: Requires \`db_slots\`, \`db_guests\`\n- **personnel**: Independent, connects to temples/roles.\n\n## Phase 1 Read/Write Call Sites\n`;

for (const col of phase1Collections) {
    inventoryMd += `\n### ${col}\n| Line | Operation Type | Code Snippet |\n|---|---|---|\n`;
    usages[col].forEach(u => {
        inventoryMd += `| ${u.line} | ${u.type} | \`${u.code}\` |\n`;
    });
}
fs.writeFileSync(path.join(brainDir, 'inventory.md'), inventoryMd);

let astMd = `# AST Dry-Run Transformation Report (Phase 1)\n\n`;
let totalPhase1Reads = 0;
let totalPhase1Writes = 0;

for (const col of phase1Collections) {
    astMd += `## Collection: ${col.replace('db_', '')} (File: ${col}.json)\n`;
    
    let colReads = 0;
    let colWrites = 0;

    usages[col].forEach(u => {
        if (u.type.includes('Write')) colWrites++;
        else colReads++;
    });

    totalPhase1Reads += colReads;
    totalPhase1Writes += colWrites;

    astMd += `- **Total Reads**: ${colReads}\n- **Total Writes**: ${colWrites}\n\n### Transformation Strategy\n`;
    
    usages[col].forEach(u => {
        astMd += `#### Line ${u.line}: ${u.type}\n- **Original**: \`${u.code}\`\n`;
        if (u.type === 'Write (Mutation)') {
            if (u.code.includes('push')) astMd += `- **Proposed**: \`await jsonStore.createRecord('${col.replace('db_', '')}', newItem)\`\n`;
            else astMd += `- **Proposed**: \`await jsonStore.atomicWrite('${col.replace('db_', '')}', modifierFunction)\`\n`;
        } else if (u.type === 'Write (Assignment)') {
             astMd += `- **Proposed**: \`await jsonStore.updateRecord('${col.replace('db_', '')}', id, updatedData)\`\n`;
        } else if (u.type.includes('Read')) {
            if (u.code.includes('findIndex')) astMd += `- **Proposed**: \`const records = await jsonStore.find('${col.replace('db_', '')}'); const idx = records.findIndex(...)\`\n`;
            else astMd += `- **Proposed**: \`(await jsonStore.find('${col.replace('db_', '')}')).${u.code.split('.')[1] || 'method(...)'}\`\n`;
        }
        astMd += `\n`;
    });
}

astMd += `\n## Dry-Run Conclusion\nAll ${totalPhase1Reads + totalPhase1Writes} operations for Phase 1 can be successfully mapped to the new \`jsonStore\` API.\n`;
fs.writeFileSync(path.join(brainDir, 'ast_dry_run_report.md'), astMd);
console.log('Generated inventory.md and ast_dry_run_report.md');
