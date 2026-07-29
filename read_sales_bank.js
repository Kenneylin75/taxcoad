
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');
console.log(lines.slice(7175, 7185).join('\n'));

