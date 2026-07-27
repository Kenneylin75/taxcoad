const fs = require('fs');
let c = fs.readFileSync('src/app/actions.ts', 'utf8');
c = c.replace(/const \{ dbQuery \} = await import\('@\/db\/db'\);/g, '/* removed duplicate import */');
fs.writeFileSync('src/app/actions.ts', c);
console.log('Fixed duplicate dbQuery');
