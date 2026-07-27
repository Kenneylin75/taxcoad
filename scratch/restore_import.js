const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');
content = 'import * as jsonStore from "@/lib/jsonStore";\n' + content;
fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Restored jsonStore import');
