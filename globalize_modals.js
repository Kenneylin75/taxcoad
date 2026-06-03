const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Remove local renders
const localRenders = [
  '{renderDetailModal()}',
  '{renderPaymentModal()}',
  '{successInfo && renderActionSuccess()}'
];

localRenders.forEach(renderText => {
  // We use regex to replace all occurrences EXCEPT if we want to place it in the global return
  // So let's just globally remove them first, then add them back in the specific place.
  content = content.replace(new RegExp(renderText.replace(/[.*+?^\${}()|[\\]\\]/g, '\\\\$&'), 'g'), '');
});

// 2. Add to global main return block
const mainReturnMatch = `{renderNotificationsModal()}
      
      {/* Native Bottom Tab Bar */}`;

const mainReturnReplacement = `{renderNotificationsModal()}
      {renderDetailModal()}
      {renderPaymentModal()}
      {successInfo && renderActionSuccess()}
      
      {/* Native Bottom Tab Bar */}`;

content = content.replace(mainReturnMatch, mainReturnReplacement);

// Just in case there are blank lines left from replacements, we can clean up but it's not strictly necessary.

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Globalized modals successfully!');
