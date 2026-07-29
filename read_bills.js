
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');

const funcs = ['export async function approveBill'];

funcs.forEach(f => {
  const idx = lines.findIndex(l => l.includes(f));
  if (idx !== -1) {
    console.log('--- ' + f + ' ---');
    console.log(lines.slice(idx, idx + 100).join('\n'));
  }
});

