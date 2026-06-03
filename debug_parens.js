const fs = require('fs');
const content = fs.readFileSync('src/app/[templeId]/admin/DashboardContainer.tsx', 'utf8');
const lines = content.split('\n');

let openParens = 0;
let openBraces = 0;
let parensStack = [];
let bracesStack = [];

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  // Ignore comments for simple check
  if (line.trim().startsWith('//')) continue;
  
  for (let i = 0; i < line.length; i++) {
    // very naive, won't handle strings properly, but good enough for finding the mismatch line if it's structural
    if (line[i] === '(') { openParens++; parensStack.push(lineIdx + 1); }
    if (line[i] === ')') { openParens--; parensStack.pop(); }
    if (line[i] === '{') { openBraces++; bracesStack.push(lineIdx + 1); }
    if (line[i] === '}') { openBraces--; bracesStack.pop(); }
  }
}
console.log('Unclosed Parens lines:', parensStack);
console.log('Unclosed Braces lines:', bracesStack);
