const fs = require('fs');

const filepath = 'src/app/actions.ts';
let content = fs.readFileSync(filepath, 'utf8');

function processSql(text, quoteType) {
  // Replace unescaped quotes with escaped quotes if they match quoteType
  const q = (str) => {
    if (quoteType === '"') return `\\"${str}\\"`;
    return `"${str}"`;
  };

  text = text.replace(/\btemples\b/g, q("Temple"));
  text = text.replace(/\btemple_name\b/g, 'name');
  text = text.replace(/\bdistributor_id\b/g, q("distributorId"));
  text = text.replace(/\bsales_id\b/g, q("salesId"));
  text = text.replace(/\bplan_id\b/g, q("planId"));
  text = text.replace(/,\s*setup_fee\s*,\s*monthly_rent\s*,\s*payment_cycle/g, '');
  text = text.replace(/,\s*\$6\s*,\s*\$7\s*,\s*\$8/g, '');
  text = text.replace(/,\s*\$7\s*,\s*\$8\s*,\s*\$9/g, '');
  
  text = text.replace(/\bpersonnel\b/g, q("User"));
  
  if (text.includes(q("User")) || text.includes(q("TempleBill")) || text.includes(q("Temple"))) {
    text = text.replace(/\btemple_id\b/g, q("templeId"));
    text = text.replace(/\bcreated_at\b/g, q("createdAt"));
    text = text.replace(/\bupdated_at\b/g, q("updatedAt"));
  }
  
  text = text.replace(/\btemple_bills\b/g, q("TempleBill"));
  if (text.includes(q("TempleBill"))) {
    text = text.replace(/\bitem_name\b/g, q("itemName"));
    text = text.replace(/\bbilling_date\b/g, q("billingDate"));
    text = text.replace(/\bdue_date\b/g, q("dueDate"));
    text = text.replace(/\bpayee_role\b/g, q("payeeRole"));
    text = text.replace(/\bpayee_id\b/g, q("payeeId"));
  }

  text = text.replace(/\bwithdrawals\b/g, q("Withdrawal"));
  if (text.includes(q("Withdrawal"))) {
    text = text.replace(/\bsales_name\b/g, q("salesName"));
    text = text.replace(/\breceipt_url\b/g, q("receiptUrl"));
  }

  text = text.replace(/\bdistributor_sales\b/g, 'dist_sales');
  
  return text;
}

// Regex to match string literals (single, double, and backtick) safely
const stringLiteralRegex = /(['"`])((?:\\.|(?!\1).)*)\1/g;

content = content.replace(stringLiteralRegex, (match, quote, innerString) => {
  if (/(SELECT|INSERT|UPDATE|DELETE|FROM|JOIN|INTO)/i.test(innerString)) {
    if (/(temples|personnel|distributor_sales|temple_bills|withdrawals)/.test(innerString)) {
      const replaced = processSql(innerString, quote);
      return quote + replaced + quote;
    }
  }
  return match;
});

fs.writeFileSync(filepath, content, 'utf8');
console.log('actions.ts processed.');
