
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');
const index = lines.findIndex(l => l.includes('export async function fetchAllWithdrawals'));
if (index >= 0) {
  console.log(lines.slice(index, index + 35).join('\n'));
} else {
  console.log('Not found');
}

