
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');
const index = lines.findIndex(l => l.includes('export async function rejectWithdrawal'));
if (index >= 0) {
  console.log(lines.slice(index, index + 25).join('\n'));
} else {
  console.log('Not found');
}

