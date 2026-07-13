const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/app/[templeId]/admin/customers/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const funcsToFix = [
  'confirmPayment',
  'revertPayment',
  'activateLampRecord',
  'deactivateLampRecord',
  'cancelServiceRecord',
  'markAppointmentAsArrived',
  'cancelAppointment',
  'deleteGuestFile'
];

funcsToFix.forEach(func => {
    // We are looking for something like: await confirmPayment(...));
    // Since we don't know exactly what arguments, let's use a regex to match until ));
    const regex = new RegExp(`await\\s+${func}\\(([^)]+)\\)\\);`, 'g');
    content = content.replace(regex, `await ${func}($1);`);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed extra parentheses.');
