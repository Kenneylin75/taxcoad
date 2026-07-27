const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.ts");
project.addSourceFilesAtPaths("src/**/*.tsx");

function processSqlText(text, quoteType) {
  let changed = false;
  let newText = text;

  const q = (str) => {
    if (quoteType === '"') return `\\\\"${str}\\\\"`;
    return `"${str}"`;
  };

  const regexes = [
    { search: /\btemples\b/g, replace: q("Temple") },
    { search: /\btemple_name\b/g, replace: 'name' },
    { search: /\bdistributor_id\b/g, replace: q("distributorId") },
    { search: /\bsales_id\b/g, replace: q("salesId") },
    { search: /\bplan_id\b/g, replace: q("planId") },
    { search: /,\s*setup_fee\s*,\s*monthly_rent\s*,\s*payment_cycle/g, replace: '' },
    { search: /,\s*\$6\s*,\s*\$7\s*,\s*\$8/g, replace: '' },
    { search: /,\s*\$7\s*,\s*\$8\s*,\s*\$9/g, replace: '' },
    
    { search: /\bpersonnel\b/g, replace: q("User") },
    { search: /\btemple_bills\b/g, replace: q("TempleBill") },
    { search: /\bwithdrawals\b/g, replace: q("Withdrawal") },
    { search: /\bdistributor_sales\b/g, replace: 'dist_sales' }
  ];

  for (const r of regexes) {
    if (r.search.test(newText)) {
      newText = newText.replace(r.search, r.replace);
      changed = true;
    }
  }

  if (newText.includes(q("User")) || newText.includes(q("TempleBill")) || newText.includes(q("Temple"))) {
    if (/\btemple_id\b/.test(newText)) { newText = newText.replace(/\btemple_id\b/g, q("templeId")); changed = true; }
    if (/\bcreated_at\b/.test(newText)) { newText = newText.replace(/\bcreated_at\b/g, q("createdAt")); changed = true; }
    if (/\bupdated_at\b/.test(newText)) { newText = newText.replace(/\bupdated_at\b/g, q("updatedAt")); changed = true; }
  }

  if (newText.includes(q("TempleBill"))) {
    if (/\bitem_name\b/.test(newText)) { newText = newText.replace(/\bitem_name\b/g, q("itemName")); changed = true; }
    if (/\bbilling_date\b/.test(newText)) { newText = newText.replace(/\bbilling_date\b/g, q("billingDate")); changed = true; }
    if (/\bdue_date\b/.test(newText)) { newText = newText.replace(/\bdue_date\b/g, q("dueDate")); changed = true; }
    if (/\bpayee_role\b/.test(newText)) { newText = newText.replace(/\bpayee_role\b/g, q("payeeRole")); changed = true; }
    if (/\bpayee_id\b/.test(newText)) { newText = newText.replace(/\bpayee_id\b/g, q("payeeId")); changed = true; }
  }

  if (newText.includes(q("Withdrawal"))) {
    if (/\bsales_name\b/.test(newText)) { newText = newText.replace(/\bsales_name\b/g, q("salesName")); changed = true; }
    if (/\breceipt_url\b/.test(newText)) { newText = newText.replace(/\breceipt_url\b/g, q("receiptUrl")); changed = true; }
  }

  return { changed, newText };
}

let changedFiles = 0;

project.getSourceFiles().forEach(sourceFile => {
  let fileChanged = false;
  
  const allNodes = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.TemplateExpression)
  ];

  allNodes.forEach(node => {
    const text = node.getText();
    if (/(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO)/i.test(text)) {
      if (/(temples|personnel|distributor_sales|temple_bills|withdrawals)/.test(text)) {
        const quoteType = text[0];
        const { changed, newText } = processSqlText(text, quoteType);
        if (changed) {
          node.replaceWithText(newText);
          fileChanged = true;
        }
      }
    }
  });

  if (fileChanged) {
    sourceFile.saveSync();
    console.log(`Updated SQL in ${sourceFile.getFilePath()}`);
    changedFiles++;
  }
});

console.log(`\nCompleted! Modified ${changedFiles} files.`);
