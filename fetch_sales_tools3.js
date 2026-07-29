
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');
const index = lines.findIndex(l => l.includes('export async function uploadTool'));
if (index >= 0) {
  console.log(lines.slice(index, index + 40).join('\n'));
} else {
  console.log('Not found');
}

