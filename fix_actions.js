const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(
  /const newTemple = \{\s*id,\s*\.\.\.rest,\s*creatorRole,/g,
  `const newTemple = {
    id,
    templeNo,
    templeName: data.name,
    ...rest,
    creatorRole,`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('actions.ts newTemple fixed');
