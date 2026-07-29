
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const startIdx = code.indexOf('export async function fetchSystemConfig() {');
const endIdx = code.indexOf('export async function updateSystemConfig(data: any) {');
const endEndIdx = code.indexOf('// --- 經銷業務 (Dist-Sales) ---');

if (startIdx !== -1 && endIdx !== -1 && endEndIdx !== -1) {
  const replacement = \export async function fetchSystemConfig() {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: 'global' } });
    if (config && config.value) {
      return config.value;
    }
    const defaultConfig = {
      fixedMonthlyRent: 3600,
      yearlyDiscountRate: 20,
      defaultSuperSalesRates: { distributorAuthRate: 15, templeSetupRate: 10, templeSetupType: 'percent', templeRentRates: [15, 12, 10] },
      distributorPlans: [
        { id: 'PLAN-A', name: '基礎體驗版', price: 1600000, durationYears: 2, nodes: 100, color: 'indigo' },
        { id: 'PLAN-B', name: '標準專業版', price: 3200000, durationYears: 4, nodes: 250, color: 'emerald' },
        { id: 'PLAN-C', name: '企業無限制', price: 8000000, durationYears: 10, nodes: 1000, color: 'slate' }
      ],
      b2bPayment: {
        thirdParty: { enabled: true, merchantId: 'HQ_MERCHANT_999', hashKey: 'HQ_HASH_KEY', hashIV: 'HQ_HASH_IV' },
        linePay: { enabled: false, channelId: '', channelSecret: '' },
        customTransfer: { enabled: true, bankCode: '808', accountName: '天樞科技股份有限公司', accountNo: '808-1234-5678-901' },
        serviceMapping: { 'new-temple': ['customTransfer'], 'monthly-rent': ['thirdParty', 'customTransfer'], 'distributor-auth': ['customTransfer'] }
      }
    };
    await prisma.systemConfig.upsert({
      where: { key: 'global' },
      update: { value: defaultConfig },
      create: { key: 'global', value: defaultConfig }
    });
    return defaultConfig;
  } catch (error) {
    console.error('fetchSystemConfig error:', error);
    return {};
  }
}

export async function updateSystemConfig(data: any) {
  try {
    const currentConfig = await fetchSystemConfig();
    const newConfig = { ...currentConfig, ...data };
    await prisma.systemConfig.upsert({
      where: { key: 'global' },
      update: { value: newConfig },
      create: { key: 'global', value: newConfig }
    });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    revalidatePath('/super-sales');
    return { success: true };
  } catch (error) {
    console.error('updateSystemConfig error:', error);
    return { success: false, error: String(error) };
  }
}

\;
  code = code.substring(0, startIdx) + replacement + code.substring(endEndIdx);
  fs.writeFileSync('src/app/actions.ts', code);
  console.log('Successfully updated system config functions.');
} else {
  console.log('Could not find indices.');
}

