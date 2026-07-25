const fs = require('fs');
const ts = require('typescript');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/actions.ts');
const sourceFile = ts.createSourceFile('actions.ts', fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true);

const phase2TargetCollections = ['db_temples', 'db_guests', 'db_admins'];
const lines = sourceFile.text.split('\n');

const report = {
    collections: {},
    callSites: []
};

phase2TargetCollections.forEach(c => {
    report.collections[c] = { reads: 0, writes: 0, sites: [] };
});

function visit(node) {
    if (ts.isIdentifier(node)) {
        const name = node.text;
        if (phase2TargetCollections.includes(name)) {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            const parent = node.parent;
            
            // Determine if it's a read or write
            let isWrite = false;
            let originalCode = '';
            
            if (ts.isPropertyAccessExpression(parent) && parent.name.text === name) {
                // e.g. gStore.db_temples
                const grandParent = parent.parent;
                if (ts.isBinaryExpression(grandParent) && grandParent.left === parent && grandParent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    isWrite = true;
                    originalCode = lines[line - 1].trim();
                } else {
                    originalCode = parent.getText(sourceFile);
                }
            } else if (ts.isBinaryExpression(parent) && parent.left === node && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                isWrite = true;
                originalCode = lines[line - 1].trim();
            } else if (ts.isVariableDeclaration(parent) && parent.name === node) {
                isWrite = true; // initialization
                originalCode = lines[line - 1].trim();
            } else {
                originalCode = lines[line - 1].trim();
            }

            if (isWrite) report.collections[name].writes++;
            else report.collections[name].reads++;

            report.collections[name].sites.push({
                line,
                type: isWrite ? 'Write' : 'Read',
                code: originalCode
            });
        }
    }
    ts.forEachChild(node, visit);
}

visit(sourceFile);

let mdContent = '# AST Dry-Run Transformation Report (Phase 2)\n\n';

for (const [col, data] of Object.entries(report.collections)) {
    const jsonName = col.replace('db_', '');
    mdContent += `## Collection: ${jsonName} (File: ${col}.json)\n`;
    mdContent += `- **Total Reads**: ${data.reads}\n`;
    mdContent += `- **Total Writes**: ${data.writes}\n\n`;
    mdContent += `### Transformation Strategy\n`;
    
    // De-duplicate sites by line number for a cleaner report
    const uniqueSites = [];
    const seen = new Set();
    data.sites.forEach(s => {
        const key = `${s.line}-${s.type}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueSites.push(s);
        }
    });

    uniqueSites.forEach(s => {
        mdContent += `#### Line ${s.line}: ${s.type}\n`;
        mdContent += `- **Original**: \`${s.code}\`\n`;
        
        let proposed = '';
        if (s.type === 'Read') {
            proposed = `\`(await jsonStore.find('${jsonName}'))\``;
        } else {
            proposed = `\`await jsonStore.atomicWrite('${jsonName}', () => newData)\` (or similar)`;
        }
        mdContent += `- **Proposed**: ${proposed}\n\n`;
    });
}

const reportPath = path.join(__dirname, '../ast_dry_run_report_phase2.md');
fs.writeFileSync(reportPath, mdContent);
console.log('Phase 2 AST report generated at ' + reportPath);
