const fs = require('fs');
const content = fs.readFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', 'utf8');
const lines = content.split('\\n');
const start = lines.findIndex(l => l.includes('{/* Dashboard Config */}'));
if (start !== -1) {
  // Find the closing div of this block
  // Since it is 22 lines long (based on previous check), let's just splice it out.
  // Or better, let's find the exact end.
  let openBraces = 0;
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].includes('<div')) openBraces++;
    if (lines[i].includes('</div')) {
      if (openBraces === 0) {
        end = i;
        break;
      }
      openBraces--;
    }
  }
  
  if (end !== -1) {
    lines.splice(start, end - start + 1);
    fs.writeFileSync('src/app/[templeId]/admin/analytics/AnalyticsClient.tsx', lines.join('\\n'), 'utf8');
    console.log('Successfully removed Dashboard Config block.');
  } else {
    console.log('Could not find end of Dashboard Config block.');
  }
} else {
  console.log('Dashboard Config not found.');
}
