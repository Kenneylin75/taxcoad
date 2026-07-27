const fs = require('fs');

const filepath = 'src/app/actions.ts';
let content = fs.readFileSync(filepath, 'utf8');

// A function to process SQL fragments
function processSql(text) {
  // 1. temples -> "Temple"
  text = text.replace(/\btemples\b/g, '"Temple"');
  text = text.replace(/\btemple_name\b/g, 'name');
  text = text.replace(/\bdistributor_id\b/g, '"distributorId"');
  text = text.replace(/\bsales_id\b/g, '"salesId"');
  text = text.replace(/\bplan_id\b/g, '"planId"');
  text = text.replace(/,\s*setup_fee\s*,\s*monthly_rent\s*,\s*payment_cycle/g, '');
  
  // 2. personnel -> "User"
  text = text.replace(/\bpersonnel\b/g, '"User"');
  
  if (text.includes('"User"') || text.includes('"TempleBill"') || text.includes('"Temple"')) {
    text = text.replace(/\btemple_id\b/g, '"templeId"');
    text = text.replace(/\bcreated_at\b/g, '"createdAt"');
    text = text.replace(/\bupdated_at\b/g, '"updatedAt"');
  }
  
  // 3. temple_bills -> "TempleBill"
  text = text.replace(/\btemple_bills\b/g, '"TempleBill"');
  if (text.includes('"TempleBill"')) {
    text = text.replace(/\bitem_name\b/g, '"itemName"');
    text = text.replace(/\bbilling_date\b/g, '"billingDate"');
    text = text.replace(/\bdue_date\b/g, '"dueDate"');
    text = text.replace(/\bpayee_role\b/g, '"payeeRole"');
    text = text.replace(/\bpayee_id\b/g, '"payeeId"');
  }

  // 4. withdrawals -> "Withdrawal"
  text = text.replace(/\bwithdrawals\b/g, '"Withdrawal"');
  if (text.includes('"Withdrawal"')) {
    text = text.replace(/\bsales_name\b/g, '"salesName"');
    text = text.replace(/\breceipt_url\b/g, '"receiptUrl"');
  }

  // 5. distributor_sales -> dist_sales
  text = text.replace(/\bdistributor_sales\b/g, 'dist_sales');
  
  return text;
}

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  let line = lines[i];
  if (/(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO)/i.test(line)) {
    lines[i] = processSql(line);
  }
}

// Write back
fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
console.log('actions.ts processed.');
