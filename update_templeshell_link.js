const fs = require('fs');
let content = fs.readFileSync('src/app/[templeId]/admin/TempleShell.tsx', 'utf8');

// The original line is: { name: '客戶前台', href: '/', icon: '📱', show: true },
content = content.replace(/{ name: '客戶前台', href: '\/', icon: '📱', show: true }/g, "{ name: '客戶前台', href: `/${templeId}`, icon: '📱', show: true }");

// Let's also check if templeId is available in the scope of navigation definition.
// Wait, the navigation array is defined inside TempleShell component.
// Let's see how navigation is defined in TempleShell.tsx.
fs.writeFileSync('src/app/[templeId]/admin/TempleShell.tsx', content, 'utf8');
console.log('TempleShell.tsx updated with correct client portal link');
