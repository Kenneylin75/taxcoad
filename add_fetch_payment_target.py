import os

path = 'src/app/actions.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function fetchTemplePaymentTarget(templeId: string) {
  const t = await getTempleBasicInfo(templeId);
  if (!t) return null;
  
  let targetBank = { bankCode: '808', bankName: '玉山銀行', accountNo: '1234-5678-9012', accountName: '星宇科技服務有限公司' };
  
  const distId = t.distributorId;
  if (distId) {
     const dist = await fetchDistributorProfile(distId);
     if (dist) {
        if (dist.b2bPayment?.customTransfer?.enabled) {
           targetBank = {
              bankCode: dist.b2bPayment.customTransfer.bankCode || '',
              bankName: dist.b2bPayment.customTransfer.bankName || '',
              accountNo: dist.b2bPayment.customTransfer.accountNo || '',
              accountName: dist.b2bPayment.customTransfer.accountName || ''
           };
        } else if (dist.bankInfo?.bankCode || dist.bankInfo?.accountNumber) {
           targetBank = {
              bankCode: dist.bankInfo.bankCode || '',
              bankName: dist.bankInfo.bankName || '',
              accountNo: dist.bankInfo.accountNumber || '',
              accountName: dist.bankInfo.accountName || dist.name
           };
        }
     }
  }
  return targetBank;
}
"""

content = content + new_func

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added fetchTemplePaymentTarget")
