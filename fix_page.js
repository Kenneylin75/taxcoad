const fs = require('fs');
let c = fs.readFileSync('src/app/super-sales/[salesId]/page.tsx', 'utf8');

const regex = /<\/div>\s*a\.download = [\s\S]*?\)}\s*<\/div>\s*\);\s*};/;
if (regex.test(c)) {
  c = c.replace(regex, '</div>\n  );\n};');
  fs.writeFileSync('src/app/super-sales/[salesId]/page.tsx', c);
  console.log('Fixed regex 1');
} else {
  // alternative
  const idx = c.indexOf('a.download = activeToolPreview.title || \'download\';');
  if (idx > -1) {
    const startIdx = c.lastIndexOf('</div>', idx);
    const endIdx = c.indexOf(')}', idx) + 2;
    if (startIdx > -1 && endIdx > -1) {
      c = c.substring(0, startIdx) + c.substring(endIdx);
      fs.writeFileSync('src/app/super-sales/[salesId]/page.tsx', c);
      console.log('Fixed index match');
    }
  }
}
