const fs = require('fs');
const file = 'src/app/actions.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace all occurrences of phone.replace(/\D/g, '') with normalizePhone(phone)
content = content.replace(/([a-zA-Z0-9_\.]+)\.replace\(\/\\D\/g,\s*''\)/g, 'normalizePhone()');

// Fix the implementation of normalizePhone itself
content = content.replace('return phone ? normalizePhone() : \'\';', 'return phone ? phone.replace(/\\D/g, \'\') : \'\';');
content = content.replace('return phone ? normalizePhone(phone) : \'\';', 'return phone ? phone.replace(/\\D/g, \'\') : \'\';');

fs.writeFileSync(file, content);

