const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Fix the stepper array
content = content.replace(
  /\{\[1,2,3\]\.map\(s => \(/,
  `{[1, 2].map(s => (`
);

// 2. Fix the stepper labels
content = content.replace(
  /\{s === 1 \? '選項目' : s === 2 \? '選人員' : '選時段'\}/,
  `{s === 1 ? '選項目' : '選時段'}`
);

// 3. Update the logical transition from 3 to 2
content = content.replace(
  /setSelectedStaff\(null\);\n\s*setBookingStep\(3\);/g,
  `setSelectedStaff(null);\n                      setBookingStep(2);`
);

// 4. Update the step 3 render condition to step 2
content = content.replace(
  /\{bookingStep === 3 && \(/,
  `{bookingStep === 2 && (`
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Fixed stepper UI in page.tsx');
