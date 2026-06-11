const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const confirmPaymentReplacement = `export async function confirmPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {
  if (recordType === 'Lamp') {
    const idx = db_lamp_records.findIndex(r => r.id === recordId);
    if (idx > -1) {
      db_lamp_records[idx].status = 'Active';
      db_lamp_records[idx].paymentStatus = 'Paid';
    }
  }
  if (recordType === 'Appointment') {
    const idx = db_appointments.findIndex(r => r.id.toString() === recordId.toString());
    if (idx > -1) {
      db_appointments[idx].status = 'Confirmed';
      db_appointments[idx].paymentStatus = 'Paid';
    }
  }
  if (recordType === 'Event') {
    const idx = db_event_registrations.findIndex(r => r.id === recordId);
    if (idx > -1) {
      db_event_registrations[idx].paymentStatus = 'Paid';
    }
  }
  if (recordType === 'Queue') {
    if (typeof db_queue_tickets !== 'undefined') {
      const idx = db_queue_tickets.findIndex(r => r.id === recordId);
      if (idx > -1) {
        db_queue_tickets[idx].paymentStatus = 'Paid';
      }
    }
  }
  revalidatePath('/');
  revalidatePath('/[templeId]/admin/customers');
  return { success: true };
}`;

code = code.replace(/export async function confirmPayment[\s\S]*?return \{ success: true \};\n\}/, confirmPaymentReplacement);

fs.writeFileSync('src/app/actions.ts', code);
console.log('Done confirming');
