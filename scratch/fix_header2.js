const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const lines = content.split(/\r?\n/);
const filtered = lines.filter(l => l !== '"use server";' && !l.includes('@ts-nocheck') && !l.includes('import * as jsonStore from "@/lib/jsonStore"'));

// Prepend correctly
filtered.unshift('import * as jsonStore from "@/lib/jsonStore";');
filtered.unshift('"use server";');
filtered.unshift('// @ts-nocheck');

fs.writeFileSync('src/app/actions.ts', filtered.join('\n'), 'utf8');
console.log('Fixed header');
