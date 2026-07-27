const { Project, SyntaxKind } = require('ts-morph');

const project = new Project();
project.addSourceFilesAtPaths("src/**/*.ts");
project.addSourceFilesAtPaths("src/**/*.tsx");

const replacements = [
  // Personnel -> "User"
  { regex: /\bpersonnel\b/g, check: /FROM|JOIN|INTO|UPDATE/i, replacement: (match, fullStr) => fullStr.replace(/\bpersonnel\b/g, '"User"') },
  { regex: /\btemple_id\b/g, check: /"User"/i, replacement: (match, fullStr) => fullStr.replace(/\btemple_id\b/g, '"templeId"') },
  { regex: /\bcreated_at\b/g, check: /"User"/i, replacement: (match, fullStr) => fullStr.replace(/\bcreated_at\b/g, '"createdAt"') },
  { regex: /\bupdated_at\b/g, check: /"User"/i, replacement: (match, fullStr) => fullStr.replace(/\bupdated_at\b/g, '"updatedAt"') },

  // Temples -> "Temple"
  { regex: /\btemples\b/g, check: /FROM|JOIN|INTO|UPDATE/i, replacement: (match, fullStr) => fullStr.replace(/\btemples\b/g, '"Temple"') },
  { regex: /\btemple_name\b/g, check: /"Temple"/i, replacement: (match, fullStr) => fullStr.replace(/\btemple_name\b/g, 'name') },
  { regex: /\bdistributor_id\b/g, check: /"Temple"/i, replacement: (match, fullStr) => fullStr.replace(/\bdistributor_id\b/g, '"distributorId"') },
  { regex: /\bsales_id\b/g, check: /"Temple"/i, replacement: (match, fullStr) => fullStr.replace(/\bsales_id\b/g, '"salesId"') },
  { regex: /\bplan_id\b/g, check: /"Temple"/i, replacement: (match, fullStr) => fullStr.replace(/\bplan_id\b/g, '"planId"') },
  { regex: /\bcreated_at\b/g, check: /"Temple"/i, replacement: (match, fullStr) => fullStr.replace(/\bcreated_at\b/g, '"createdAt"') },
  { regex: /\bupdated_at\b/g, check: /"Temple"/i, replacement: (match, fullStr) => fullStr.replace(/\bupdated_at\b/g, '"updatedAt"') },
  { regex: /,\s*setup_fee,\s*monthly_rent,\s*payment_cycle/g, check: /"Temple"/i, replacement: () => '' },
  { regex: /,\s*\$7,\s*\$8,\s*\$9/g, check: /"Temple"/i, replacement: () => '' },

  // distributor_sales -> dist_sales
  { regex: /\bdistributor_sales\b/g, check: /FROM|JOIN|INTO|UPDATE/i, replacement: (match, fullStr) => fullStr.replace(/\bdistributor_sales\b/g, 'dist_sales') },
  
  // temple_bills -> "TempleBill"
  { regex: /\btemple_bills\b/g, check: /FROM|JOIN|INTO|UPDATE/i, replacement: (match, fullStr) => fullStr.replace(/\btemple_bills\b/g, '"TempleBill"') },
  { regex: /\btemple_id\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\btemple_id\b/g, '"templeId"') },
  { regex: /\bitem_name\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bitem_name\b/g, '"itemName"') },
  { regex: /\bbilling_date\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bbilling_date\b/g, '"billingDate"') },
  { regex: /\bdue_date\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bdue_date\b/g, '"dueDate"') },
  { regex: /\bpayee_role\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bpayee_role\b/g, '"payeeRole"') },
  { regex: /\bpayee_id\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bpayee_id\b/g, '"payeeId"') },
  { regex: /\bcreated_at\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bcreated_at\b/g, '"createdAt"') },
  { regex: /\bupdated_at\b/g, check: /"TempleBill"/i, replacement: (match, fullStr) => fullStr.replace(/\bupdated_at\b/g, '"updatedAt"') },

  // withdrawals -> "Withdrawal"
  { regex: /\bwithdrawals\b/g, check: /FROM|JOIN|INTO|UPDATE/i, replacement: (match, fullStr) => fullStr.replace(/\bwithdrawals\b/g, '"Withdrawal"') },
  { regex: /\bsales_name\b/g, check: /"Withdrawal"/i, replacement: (match, fullStr) => fullStr.replace(/\bsales_name\b/g, '"salesName"') },
  { regex: /\breceipt_url\b/g, check: /"Withdrawal"/i, replacement: (match, fullStr) => fullStr.replace(/\breceipt_url\b/g, '"receiptUrl"') },
];

let changedFiles = 0;

project.getSourceFiles().forEach(sourceFile => {
  let changed = false;
  
  const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
  const noSubstitutionTemplateLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.NoSubstitutionTemplateLiteral);
  const templateExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.TemplateExpression);

  const allStrings = [...stringLiterals, ...noSubstitutionTemplateLiterals, ...templateExpressions];

  allStrings.forEach(node => {
    let text = node.getText();
    if (text.match(/SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO/i)) {
      let originalText = text;
      
      for (let pass = 0; pass < 3; pass++) {
        for (const rule of replacements) {
          if (rule.check.test(text) && rule.regex.test(text)) {
            text = rule.replacement(text, text);
          }
        }
      }

      if (text !== originalText) {
        node.replaceWithText(text);
        changed = true;
      }
    }
  });

  if (changed) {
    sourceFile.saveSync();
    console.log(`Updated SQL in ${sourceFile.getFilePath()}`);
    changedFiles++;
  }
});

console.log(`\nCompleted! Modified ${changedFiles} files.`);
