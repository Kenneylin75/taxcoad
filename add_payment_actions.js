const fs = require('fs');

let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const paymentCode = `
// ==========================================
// 金流收款設定 (Payment Configurations)
// ==========================================
let db_temple_payment_configs: any[] = initGlobal("db_temple_payment_configs", []);

export interface TemplePaymentConfig {
  templeId: string;
  linePay: { enabled: boolean; channelId: string; channelSecret: string; };
  thirdParty: { enabled: boolean; provider: string; merchantId: string; hashKey: string; hashIV: string; };
  customTransfer: { enabled: boolean; bankCode: string; bankName: string; accountName: string; accountNo: string; };
  customQR: { enabled: boolean; qrImageUrl: string; description: string; };
}

export async function fetchPaymentConfig() {
  const templeId = await getDynamicTempleId();
  const config = db_temple_payment_configs.find(c => c.templeId === templeId);
  return config || null;
}

export async function savePaymentConfig(data: TemplePaymentConfig) {
  const templeId = await getDynamicTempleId();
  const idx = db_temple_payment_configs.findIndex(c => c.templeId === templeId);
  if (idx > -1) {
    db_temple_payment_configs[idx] = { ...data, templeId };
  } else {
    db_temple_payment_configs.push({ ...data, templeId });
  }
  revalidatePath('/temple/payment-setup');
  return { success: true };
}
`;

// Insert it right before "export async function executeEmergencyReschedule" which is around line 430
content = content.replace(
  /export async function executeEmergencyReschedule/,
  paymentCode + '\nexport async function executeEmergencyReschedule'
);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Added payment config to actions.ts');
