
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');
const index = lines.findIndex(l => l.includes('export async function deleteTool'));
if (index >= 0) {
  console.log(lines.slice(index - 10, index + 20).join('\n'));
} else {
  console.log('Not found');
}

