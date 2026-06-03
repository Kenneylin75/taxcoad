const fs = require('fs');
const content = fs.readFileSync('src/app/[templeId]/admin/calendar/page.tsx', 'utf8');
const lines = content.split('\n');

console.log('--- SLOTS RENDER ---');
lines.forEach((l, i) => {
  if (l.includes('slot.description')) {
    console.log(i + ':', l.trim());
  }
});

console.log('\n--- APPOINTMENTS RENDER ---');
lines.forEach((l, i) => {
  if (l.includes('app.service')) {
    console.log(i + ':', l.trim());
  }
});
