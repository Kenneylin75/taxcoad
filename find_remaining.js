
const fs = require('fs');
const code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');

const results = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('(await [])')) {
    // find the closest export async function before this line
    let funcName = 'unknown';
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('export async function') || lines[j].includes('export function') || lines[j].includes('async function')) {
        funcName = lines[j].trim();
        break;
      }
    }
    if (!results.includes(funcName)) {
      results.push(funcName);
    }
  }
}
console.log(results.join('\n'));

