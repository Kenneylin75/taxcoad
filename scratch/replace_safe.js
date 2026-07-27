const fs = require('fs');
const path = require('path');

function processSql(text) {
  text = text.replace(/\btemples\b/g, '\\"Temple\\"');
  text = text.replace(/\btemple_name\b/g, 'name');
  text = text.replace(/\bdistributor_id\b/g, '\\"distributorId\\"');
  text = text.replace(/\bsales_id\b/g, '\\"salesId\\"');
  text = text.replace(/\bplan_id\b/g, '\\"planId\\"');
  text = text.replace(/,\s*setup_fee\s*,\s*monthly_rent\s*,\s*payment_cycle/g, '');
  text = text.replace(/,\s*\$6\s*,\s*\$7\s*,\s*\$8/g, '');
  text = text.replace(/,\s*\$7\s*,\s*\$8\s*,\s*\$9/g, '');
  
  text = text.replace(/\bpersonnel\b/g, '\\"User\\"');
  
  if (text.includes('\\"User\\"') || text.includes('\\"TempleBill\\"') || text.includes('\\"Temple\\"')) {
    text = text.replace(/\btemple_id\b/g, '\\"templeId\\"');
    text = text.replace(/\bcreated_at\b/g, '\\"createdAt\\"');
    text = text.replace(/\bupdated_at\b/g, '\\"updatedAt\\"');
  }
  
  text = text.replace(/\btemple_bills\b/g, '\\"TempleBill\\"');
  if (text.includes('\\"TempleBill\\"')) {
    text = text.replace(/\bitem_name\b/g, '\\"itemName\\"');
    text = text.replace(/\bbilling_date\b/g, '\\"billingDate\\"');
    text = text.replace(/\bdue_date\b/g, '\\"dueDate\\"');
    text = text.replace(/\bpayee_role\b/g, '\\"payeeRole\\"');
    text = text.replace(/\bpayee_id\b/g, '\\"payeeId\\"');
  }

  text = text.replace(/\bwithdrawals\b/g, '\\"Withdrawal\\"');
  if (text.includes('\\"Withdrawal\\"')) {
    text = text.replace(/\bsales_name\b/g, '\\"salesName\\"');
    text = text.replace(/\breceipt_url\b/g, '\\"receiptUrl\\"');
  }

  text = text.replace(/\bdistributor_sales\b/g, 'dist_sales');
  
  return text;
}

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO)/i.test(line)) {
      if (/(temples|personnel|distributor_sales|temple_bills|withdrawals)/.test(line)) {
        lines[i] = processSql(line);
        changed = true;
      }
    }
  }
  if (changed) {
    fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
    console.log(`Updated ${filepath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        walk(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk('src');
console.log('All files processed.');
