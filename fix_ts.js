
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
code = code.replace('return config.value;', 'return config.value as any;');
code = code.replace('return defaultConfig;', 'return defaultConfig as any;');
fs.writeFileSync('src/app/actions.ts', code);
console.log('Fixed TypeScript errors in fetchSystemConfig.');

