const fs = require("fs");
let code = fs.readFileSync("src/app/actions.ts", "utf8");

const toClear = [
  "db_slots", "db_appointments", "db_queue_events", "db_queue_tickets", 
  "db_event_registrations", "db_events", "db_sales_visits", "db_admin_logs", 
  "db_finance_records", "db_sync_queue", "db_temple_applications", 
  "db_temple_notifications", "db_guests", "db_notifications", "db_guest_files", 
  "db_lamp_records"
];

toClear.forEach(name => {
  const regex = new RegExp(`let ${name}.*?initGlobal\\(.*?\\, \\[\\s*[\\s\\S]*?\\s*\\]\\);`);
  code = code.replace(regex, `let ${name}: any[] = initGlobal("${name}", []);`);
});

fs.writeFileSync("src/app/actions.ts", code);
console.log("Cleared mock data arrays!");

