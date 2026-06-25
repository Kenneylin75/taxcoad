import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function upgradeTempleStorage(templeId: string, planId: string, cycle: 'Monthly' | 'Yearly', isManualGrant: boolean = false) {
  return withTempleSession(templeId, true, async (client) => {
    if (!client) {
      const plan = db_storage_plans.find((p: any) => p.id === planId);
      if (!plan) return { success: false, message: '找不到選定的空間方案' };

      const discount = db_config.yearlyDiscountRate || 20;
      const priceFactor = cycle === 'Yearly' ? (12 * (1 - discount / 100)) : 1;
      const finalAmount = Math.round(plan.priceMonthly * priceFactor);

      if (!isManualGrant) {
        const adminWallet = db_wallets.find(w => w.role === 'SuperAdmin');
        if (adminWallet) {
          adminWallet.balance += finalAmount;
        }

        const temple = db_temples.find(t => t.id === templeId);
        db_finance_records.unshift({
          id: F-,
          type: 'INCOME',
          category: 'SPACE_UPGRADE',
          amount: finalAmount,
          source: ${temple?.templeName || '宮廟'}-升級空間 GB (),
          date: new Date().toISOString().split('T')[0]
        });
      }

      let storage = db_temple_storages.find(s => s.templeId === templeId);
      if (!storage) {
        const temple = db_temples.find(t => t.id === templeId);
        storage = {
          id: TS--,
          templeId,
          templeName: temple?.templeName || temple?.name || '未知宮廟',
          city: temple?.city || '未設定',
          usedBytes: 0,
          quotaGb: 5,
          planName: '免費 5GB 空間'
        };
        db_temple_storages.push(storage);
      }
      storage.quotaGb = plan.sizeGb;
      storage.planName = ${plan.name} (GB);

      return { success: true };
    }
    // ... rest of pg code if needed
    return { success: false };
  });
}
"""

content = re.sub(r"export async function upgradeTempleStorage\(templeId: string, planId: string, cycle: 'Monthly' \| 'Yearly'\) \{[\s\S]*?return \{ success: false \};\s*\}\);\s*\}", new_func, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
