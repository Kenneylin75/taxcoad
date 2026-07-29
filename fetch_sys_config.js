
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const index = code.indexOf('export async function fetchSystemConfig()');
if (index !== -1) {
  console.log(code.substring(index, index + 500));
} else {
  console.log('Not found');
}

