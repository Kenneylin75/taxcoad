const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const newAction = `
export async function updateAppointmentPayment(appId: number, paymentMethod: string, paymentRef?: string) {
  return withTempleSession(null, false, async (client) => {
    const idx = db_appointments.findIndex(a => a.id === appId);
    if (idx === -1) return { success: false, message: '找不到該預約' };
    
    db_appointments[idx].paymentMethod = paymentMethod;
    if (paymentRef) db_appointments[idx].paymentRef = paymentRef;
    
    if (paymentMethod === 'Cash' || paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') {
      db_appointments[idx].paymentStatus = 'Paid';
      db_appointments[idx].status = 'Confirmed';
    } else {
      db_appointments[idx].paymentStatus = 'Pending';
      db_appointments[idx].status = 'Pending';
    }
    
    revalidatePath('/');
    revalidatePath('/[templeId]/admin/calendar');
    return { success: true };
  });
}
`;

content += newAction;
fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Added updateAppointmentPayment');
