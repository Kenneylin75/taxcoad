const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

// Fix temple_bills
code = code.replace(
  /INSERT INTO temple_bills \(\s*id,\s*temple_id,\s*type,\s*item_name,\s*amount,\s*billing_date,\s*due_date,\s*status,\s*payee_role,\s*payee_id,\s*timestamp\s*\)/g,
  'INSERT INTO "TempleBill" (id, "templeId", type, "itemName", amount, "billingDate", "dueDate", status, "payeeRole", "payeeId", "timestamp")'
);

// Fix temples (with 9 columns)
code = code.replace(
  /INSERT INTO temples \(\s*id,\s*temple_name,\s*city,\s*status,\s*sales_id,\s*distributor_id,\s*setup_fee,\s*monthly_rent,\s*payment_cycle\s*\)/g,
  'INSERT INTO "Temple" (id, name, city, status, "salesId", "distributorId", "setupFee", "monthlyRent", "paymentCycle")'
);
// Fix temples (with 8 columns)
code = code.replace(
  /INSERT INTO temples \(\s*id,\s*temple_name,\s*city,\s*status,\s*sales_id,\s*setup_fee,\s*monthly_rent,\s*payment_cycle\s*\)/g,
  'INSERT INTO "Temple" (id, name, city, status, "salesId", "setupFee", "monthlyRent", "paymentCycle")'
);

// Fix personnel (7 columns)
code = code.replace(
  /INSERT INTO personnel \(\s*id,\s*temple_id,\s*name,\s*account,\s*password,\s*role,\s*status\s*\)/g,
  'INSERT INTO "User" (id, "templeId", name, account, password, role, status)'
);
// Fix personnel (8 columns)
code = code.replace(
  /INSERT INTO personnel \(\s*id,\s*temple_id,\s*name,\s*role,\s*account,\s*phone,\s*password,\s*status\s*\)/g,
  'INSERT INTO "User" (id, "templeId", name, role, account, phone, password, status)'
);
// Fix personnel (10 columns)
code = code.replace(
  /INSERT INTO personnel \(\s*id,\s*temple_id,\s*name,\s*role,\s*account,\s*phone,\s*password,\s*status,\s*avatar,\s*permissions\s*\)/g,
  'INSERT INTO "User" (id, "templeId", name, role, account, phone, password, status, avatar, permissions)'
);

// Fix distributor_sales
code = code.replace(
  /INSERT INTO distributor_sales \(\s*id,\s*distributor_id,\s*name,\s*account,\s*password,\s*role,\s*status,\s*joined_at\s*\)/g,
  'INSERT INTO dist_sales (id, distributor_id, name, account, password, role, status, created_at)'
);

fs.writeFileSync('src/app/actions.ts', code);
console.log('Fixed legacy SQL insertions in actions.ts');
