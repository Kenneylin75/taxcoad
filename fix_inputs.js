
const fs = require('fs');
let content = fs.readFileSync('src/app/distributor/DistributorClient.tsx', 'utf8');

content = content.replace(/value=\{editProfileForm\.([a-zA-Z0-9_]+)\}/g, 'value={editProfileForm.$1 || \'\'}');
content = content.replace(/value=\{editProfileForm\.([a-zA-Z0-9_]+) \|\| '' \|\| ''\}/g, 'value={editProfileForm.$1 || \'\'}'); 
content = content.replace(/value=\{b2bPayment\.customTransfer\.([a-zA-Z0-9_]+)\}/g, 'value={b2bPayment?.customTransfer?.$1 || \'\'}');
content = content.replace(/value=\{b2bPayment\.linePay\.([a-zA-Z0-9_]+)\}/g, 'value={b2bPayment?.linePay?.$1 || \'\'}');
content = content.replace(/value=\{\(newSalesForm as any\)\[item\.key\]\}/g, 'value={(newSalesForm as any)[item.key] || 0}');
content = content.replace(/value=\{\(editingRates as any\)\[k\.key\]\}/g, 'value={(editingRates as any)[k.key] || 0}');

fs.writeFileSync('src/app/distributor/DistributorClient.tsx', content);
console.log('Fixed potential uncontrolled inputs.');

