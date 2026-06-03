const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/TempleShell.tsx', 'utf8');

// Insert after '帳務管理'
content = content.replace(
  /\{ name: '帳務管理', href: \`\$\{basePath\}\/billing\`, icon: '💳', show: true \},/,
  `{ name: '帳務管理', href: \`\$\{basePath\}/billing\`, icon: '💳', show: true },\n      { name: '金流收款', href: \`\$\{basePath\}/payment-setup\`, icon: '💰', show: true },`
);

fs.writeFileSync('src/app/[templeId]/admin/TempleShell.tsx', content, 'utf8');
console.log('Added payment menu to TempleShell.tsx');
