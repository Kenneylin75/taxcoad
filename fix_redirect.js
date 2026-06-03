const fs = require('fs');
let saContent = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

saContent = saContent.replace(
  /if\(res\.success\) window\.location\.href = res\.redirectPath; \}\)/g,
  `if(res.success && res.redirectPath) window.location.href = res.redirectPath; })`
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', saContent, 'utf8');
console.log('Fixed redirectPath typing');
