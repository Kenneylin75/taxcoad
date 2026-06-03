const fs = require('fs');
let saContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

saContent = saContent.replace(
  /m\.impersonateTemple\(acc\.templeId \|\| acc\.id\)/g,
  `m.impersonateTemple((acc.templeId || acc.id) as string)`
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', saContent, 'utf8');
console.log('Fixed TS Error');
