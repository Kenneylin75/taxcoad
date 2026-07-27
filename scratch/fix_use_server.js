const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');
if (content.startsWith('import * as jsonStore from "@/lib/jsonStore";\n"use server";')) {
  content = content.replace('import * as jsonStore from "@/lib/jsonStore";\n"use server";', '"use server";\nimport * as jsonStore from "@/lib/jsonStore";');
  fs.writeFileSync('src/app/actions.ts', content, 'utf8');
  console.log('Fixed use server directive position');
} else {
  console.log('Did not match exact string');
  // fallback check
  const lines = content.split('\n');
  const importIdx = lines.findIndex(l => l.includes('jsonStore'));
  const useServerIdx = lines.findIndex(l => l.includes('"use server"'));
  if (importIdx < useServerIdx) {
    const importStr = lines[importIdx];
    lines[importIdx] = lines[useServerIdx];
    lines[useServerIdx] = importStr;
    fs.writeFileSync('src/app/actions.ts', lines.join('\n'), 'utf8');
    console.log('Fixed use server by swapping lines');
  }
}
