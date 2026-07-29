
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

// The most robust way is just regex replace.
// But we need to make sure we don't break Prisma or actual functionality.
// Replacing (await []) with [] is functionally identical since it resolves to [] anyway.
code = code.replace(/\(await \[\]\)/g, '[]');
fs.writeFileSync('src/app/actions.ts', code);

