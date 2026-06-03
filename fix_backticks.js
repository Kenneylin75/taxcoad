const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/customers/page.tsx', 'utf8');
content = content.split('\\`').join('`');
fs.writeFileSync('src/app/[templeId]/admin/customers/page.tsx', content, 'utf8');
console.log('Fixed backticks');
