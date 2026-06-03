
const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

content = content.replace(/currentSlots\.push\(\{ id: \s-\\\$\{now\}\\\$-\\\$\{idx\}\, date, time, staff, description, bound_service_id \}\);/g,
  'currentSlots.push({ id: \s-\-\\, date, time, staff, description, bound_service_id, templeId });');

content = content.replace(/currentAppointments\.push\(\{ id: newId, \.\.\.data \}\);/g,
  'currentAppointments.push({ id: newId, templeId, ...data });');

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Done update_writers_2');

