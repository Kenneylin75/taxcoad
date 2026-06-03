const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// Update createLampRecord fields extraction
content = content.replace(
  /let notice = '';/,
  `let notice = '';\n  let paymentMethod = '';\n  let paymentRef = '';`
);

content = content.replace(
  /notice = data\.get\('notice'\) as string;/,
  `notice = data.get('notice') as string;\n    paymentMethod = data.get('paymentMethod') as string || 'Cash';\n    paymentRef = data.get('paymentRef') as string || '';`
);

content = content.replace(
  /notice = data\.notice;/,
  `notice = data.notice;\n    paymentMethod = data.paymentMethod || 'Cash';\n    paymentRef = data.paymentRef || '';`
);

// Update newRecord object
content = content.replace(
  /status: 'Active',/,
  `status: paymentMethod === 'Cash' || paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Active' : 'Pending',\n    paymentMethod,\n    paymentRef,\n    paymentStatus: paymentMethod === 'Cash' || paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending',`
);

// Add confirmPayment action
const confirmCode = `
export async function confirmPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue') {
  if (recordType === 'Lamp') {
    const idx = db_lamp_records.findIndex(r => r.id === recordId);
    if (idx > -1) {
      db_lamp_records[idx].status = 'Active';
      db_lamp_records[idx].paymentStatus = 'Paid';
    }
  }
  revalidatePath('/temple/lamps');
  return { success: true };
}
`;

content = content.replace(
  /export async function deleteLampCategory/,
  confirmCode + '\nexport async function deleteLampCategory'
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated actions.ts for payments');
