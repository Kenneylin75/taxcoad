
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const regexes = [
  /export async function updateDistributorProfile[\s\S]*?return \{ success: true \};\n\}/,
  /export async function updateDistributorBankInfo[\s\S]*?return \{ success: true \};\n\}/,
  /export async function updateDistributorPaymentConfig[\s\S]*?return \{ success: true \};\n\}/,
  /export async function updateDistributorQuota[\s\S]*?revalidatePath\('\/super-admin'\);\n  return \{ success: true \};\n\}/,
];

for (let r of regexes) {
  const match = code.match(r);
  if (match) console.log(match[0] + '\n---');
  else console.log('Not found for', r);
}

