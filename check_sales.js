
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');

const idx = lines.findIndex(l => l.includes('export async function fetchSalesProfileById'));
console.log(lines.slice(idx, idx + 10).join('\n'));

