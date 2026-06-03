const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/TempleShell.tsx', 'utf8');

content = content.replace(
  /\{ name: '現場排隊', href: \`\$\{basePath\}\/queue\`, icon: '🚶', show: \['TempleAdmin', 'Staff'\]\.includes\(currentRole\) \},/,
  `{ name: '現場排隊', href: \`\$\{basePath\}/queue\`, icon: '🚶', show: ['TempleAdmin', 'Staff', 'SuperAdmin'].includes(currentRole) },`
);

fs.writeFileSync('src/app/[templeId]/admin/TempleShell.tsx', content, 'utf8');
console.log('Fixed queue menu visibility');
