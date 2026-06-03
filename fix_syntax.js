const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', 'utf8');

// The issue is I escaped the backticks in className={\`...\`} which resulted in actual \` inside the file!
// e.g. className={\`bg-white ...\`}
content = content.replace(/\\`/g, '\`');

fs.writeFileSync('src/app/[templeId]/admin/payment-setup/page.tsx', content, 'utf8');
console.log('Fixed syntax error');
