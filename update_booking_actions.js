const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

// 1. Update bookAppointment signature and logic
content = content.replace(
  /export async function bookAppointment\(slotId: number, guestName: string, phone: string, paymentMethod\?: string, paymentRef\?: string\) \{/,
  `export async function bookAppointment(slotId: number, guestName: string, phone: string, paymentMethod?: string, paymentRef?: string, amount?: number) {`
);

content = content.replace(
  /paymentStatus: paymentMethod === 'Cash' \|\| paymentMethod === 'LinePayApi' \|\| paymentMethod === 'ThirdPartyApi' \? 'Paid' : 'Pending'\n\s*\};/,
  `paymentStatus: paymentMethod === 'Cash' || paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending',\n        amount\n      };`
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated bookAppointment with amount parameter');
