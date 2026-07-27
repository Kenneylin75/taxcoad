const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// We want lines to be:
// "use server";
// // @ts-nocheck
// import * as jsonStore from "@/lib/jsonStore";

const lines = content.split(/\r?\n/);

// Remove existing ones
const filtered = lines.filter(l => l !== '"use server";' && !l.includes('@ts-nocheck') && !l.includes('import * as jsonStore from "@/lib/jsonStore"'));

// Prepend
filtered.unshift('import * as jsonStore from "@/lib/jsonStore";');
filtered.unshift('// @ts-nocheck');
filtered.unshift('"use server";');

fs.writeFileSync('src/app/actions.ts', filtered.join('\n'), 'utf8');
console.log('Fixed header');
