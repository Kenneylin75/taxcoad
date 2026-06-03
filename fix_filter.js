const fs = require('fs');

let content = fs.readFileSync('src/app/super-admin/SuperAdminClient.tsx', 'utf8');

// The table uses initialAccounts.filter(a => a.role === 'TempleAdmin')
// But initialAccounts creates them as a.role === 'Temple'
content = content.replace(
  /initialAccounts\.filter\(a => a\.role === 'TempleAdmin'\)/g,
  "initialAccounts.filter(a => a.role === 'Temple')"
);

fs.writeFileSync('src/app/super-admin/SuperAdminClient.tsx', content, 'utf8');
console.log('Fixed SuperAdminClient Temple filtering bug');
