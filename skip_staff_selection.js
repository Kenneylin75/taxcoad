const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Change the transition
content = content.replace(
  /setAvailableStaffList\(assigned\);\n\s*setBookingStep\(2\);/,
  `setAvailableStaffList(assigned);\n                      setSelectedStaff(null);\n                      setBookingStep(3);`
);

// Remove the bookingStep === 2 block completely
content = content.replace(
  /\{bookingStep === 2 && \([\s\S]*?<\/div>\n\s*\)\}/,
  `{/* Staff Selection Skipped */}`
);

// Fix the "Back" button in Step 3 so it goes back to Step 1 instead of Step 2
content = content.replace(
  /\{bookingStep === 3 && \([\s\S]*?<button onClick=\{\(\) => setBookingStep\(2\)\}/,
  match => match.replace(`setBookingStep(2)`, `setBookingStep(1)`)
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Updated booking flow to skip staff selection');
