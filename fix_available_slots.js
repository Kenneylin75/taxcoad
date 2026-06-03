const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// The line is: const hasSlots = slots.some(s => s.date === dateStr && (!selectedStaff || s.staff === selectedStaff.name));
content = content.replace(
  /const hasSlots = slots\.some\(s => s\.date === dateStr && \(\!selectedStaff \|\| s\.staff === selectedStaff\.name\)\);/g,
  `const hasSlots = slots.some(s => s.date === dateStr && s.status === 'Available' && (!selectedStaff || s.staff === selectedStaff.name));`
);

// We should also make sure the slots below the calendar are only available slots.
content = content.replace(
  /\{slots\n\s*\.filter\(s => s\.date === selectedDate && \(\!selectedStaff \|\| s\.staff === selectedStaff\.name\)\)/,
  `{slots\n                    .filter(s => s.date === selectedDate && s.status === 'Available' && (!selectedStaff || s.staff === selectedStaff.name))`
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Fixed calendar hasSlots check for available slots');
