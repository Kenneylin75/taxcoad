import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """let db_config = initGlobal('db_config', {
  fixedMonthlyRent: 3600,
  yearlyDiscountRate: 20,
  defaultSuperSalesRates: {
    distributorAuthRate: 15,
    templeSetupRate: 10,
    templeSetupType: 'percent',
    templeRentRates: [15, 12, 10]
  },
  distributorPlans: [
    { id: 'PLAN-A', name: '標準經銷方案', price: 1600000, durationYears: 2, nodes: 100, color: 'indigo' },
    { id: 'PLAN-B', name: '菁英經銷方案', price: 3200000, durationYears: 4, nodes: 250, color: 'emerald' },
    { id: 'PLAN-C', name: '企業戰略方案', price: 8000000, durationYears: 10, nodes: 1000, color: 'slate' }
  ],
  b2bPayment: {
    thirdParty: { enabled: true, merchantId: 'HQ_MERCHANT_999', hashKey: 'HQ_HASH_KEY', hashIV: 'HQ_HASH_IV' },
    linePay: { enabled: false, channelId: '', channelSecret: '' },
    customTransfer: { enabled: true, bankCode: '808', accountName: '天首科技有限公司', accountNo: '808-1234-5678-901' },
    serviceMapping: {
      'new-temple': ['customTransfer'],
      'monthly-rent': ['thirdParty', 'customTransfer'],
      'distributor-auth': ['customTransfer']
    }
  },"""

content = re.sub(r'let db_config = initGlobal\(\'db_config\', \{[\s\S]*?distributorPlans: \[[\s\S]*?\],', new_func, content, count=1)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
