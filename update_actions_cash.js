const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldConfig = `export interface TemplePaymentConfig {
  templeId: string;
  linePay: { enabled: boolean; channelId: string; channelSecret: string; };
  thirdParty: { enabled: boolean; provider: string; merchantId: string; hashKey: string; hashIV: string; };
  customTransfer: { enabled: boolean; bankCode: string; bankName: string; accountName: string; accountNo: string; };
  customQR: { enabled: boolean; qrImageUrl: string; description: string; };
}`;

const newConfig = `export interface TemplePaymentConfig {
  templeId: string;
  linePay: { enabled: boolean; channelId: string; channelSecret: string; };
  thirdParty: { enabled: boolean; provider: string; merchantId: string; hashKey: string; hashIV: string; };
  customTransfer: { enabled: boolean; bankCode: string; bankName: string; accountName: string; accountNo: string; };
  customQR: { enabled: boolean; qrImageUrl: string; description: string; };
  cash?: { enabled: boolean; description: string; };
}`;

content = content.replace(oldConfig, newConfig);

// Set default fallback when returning config if cash is not set
const oldFetch = `  const config = db_temple_payment_configs.find(c => c.templeId === templeId);
  return config || null;`;

const newFetch = `  const config = db_temple_payment_configs.find(c => c.templeId === templeId);
  if (config && !config.cash) {
    config.cash = { enabled: true, description: '現場現金付款' };
  }
  return config || null;`;

content = content.replace(oldFetch, newFetch);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated actions.ts for cash payment config');
