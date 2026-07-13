const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/app/[templeId]/admin/customers/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace("await cancelAppointment(Number(event.id)));", "await cancelAppointment(Number(event.id));");
content = content.replace("await confirmPayment(event.id.toString(), 'Appointment'));", "await confirmPayment(event.id.toString(), 'Appointment');");
content = content.replace("await revertPayment(event.id.toString(), 'Appointment'));", "await revertPayment(event.id.toString(), 'Appointment');");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed parens');
