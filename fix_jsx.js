const fs = require('fs');
let content = fs.readFileSync('src/app/components/TempleApplicationForm.tsx', 'utf8');

content = content.replace(
  /\{form\.freeType !== 'Permanent' && \(\s*<div className="grid grid-cols-2 gap-3">/,
  `{form.freeType !== 'Permanent' && (\n               <>\n             <div className="grid grid-cols-2 gap-3">`
);

content = content.replace(
  /<\/div>\n             \)\}\n              \n              <div className="grid grid-cols-2 gap-3">/,
  `</div>\n             </>\n             )}\n              \n              <div className="grid grid-cols-2 gap-3">`
);

fs.writeFileSync('src/app/components/TempleApplicationForm.tsx', content, 'utf8');
console.log('Fixed JSX fragment issue');
