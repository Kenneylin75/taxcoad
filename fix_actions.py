import sys
import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add missing functions at the end
missing_functions = '''
export async function fetchDistributorLogs(distributorId: string) { return (globalThis as any).db_admin_logs?.filter((l: any) => l.target && l.target.includes(distributorId)) || []; }
export async function requestBonus(...args: any[]) { return { success: true }; }
export async function fetchSalesBonusRequests(salesId: string) { return (globalThis as any).db_bonus_requests?.filter((r: any) => r.salesId === salesId) || []; }
export async function uploadReceiptAndApproveBonus(...args: any[]) { return { success: true }; }
export async function fetchSaasOrders() { return (globalThis as any).db_saas_orders || []; }
export async function logDistributorAction(...args: any[]) {
  const gStore = globalThis as any;
  if (!gStore.db_admin_logs) gStore.db_admin_logs = [];
  gStore.db_admin_logs.push({
    id: log-,
    timestamp: new Date().toISOString(),
    adminId: 'super_admin',
    adminName: '系統管理員',
    action: 'Distributor Action',
    target: args[0] || 'Unknown',
    details: 'Log'
  });
}

export async function grantTempleStorageVip(templeId: string, isVip: boolean = true) {
  const gStore = globalThis as any;
  if (!gStore.db_temple_storages) gStore.db_temple_storages = [];
  let storage = gStore.db_temple_storages.find((s: any) => s.templeId === templeId);
  if (!storage) {
    storage = { templeId, isVip, planName: isVip ? '無限免費方案' : '免費 5GB 空間', usedBytes: 0, capacityGb: isVip ? 999999 : 5 };
    gStore.db_temple_storages.push(storage);
  } else {
    storage.isVip = isVip;
    if (isVip) {
      storage.planName = '無限免費方案';
      storage.capacityGb = 999999;
    }
  }
  return { success: true };
}

export async function purchaseAiPlanByAdmin(templeId: string, planId: string) {
  const gStore = globalThis as any;
  if (!gStore.db_temple_ai_usage) gStore.db_temple_ai_usage = [];
  const plan = (gStore.db_ai_plans || []).find((p: any) => p.id === planId) || { name: '自訂方案', tokenLimit: 100000 };
  let ai = gStore.db_temple_ai_usage.find((a: any) => a.templeId === templeId);
  if (!ai) {
    ai = { templeId, planId, planName: plan.name, usedTokens: 0, monthlyTokenLimit: plan.tokenLimit, isVip: false };
    gStore.db_temple_ai_usage.push(ai);
  } else {
    ai.planId = planId;
    ai.planName = plan.name;
    ai.monthlyTokenLimit = plan.tokenLimit;
    ai.isVip = false;
  }
  return { success: true };
}
'''

if 'grantTempleStorageVip' not in content:
    content += missing_functions

# 2. Fix grantTempleAiVip
pattern = re.compile(r'export async function grantTempleAiVip\(templeId: string, isVip: boolean\) \{.*?\n\}', re.DOTALL)
replacement = '''export async function grantTempleAiVip(templeId: string, isVip: boolean = true) {
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (!usage) {
    usage = { templeId, enabled: true, planId: 'VIP', planName: isVip ? '無限免費方案' : '基礎智慧助理方案', usedCount: 0, usedTokens: 0, monthlyTokenLimit: isVip ? 999999 : 1000, expiryDate: new Date().toISOString(), isVip };
    db_temple_ai_usage.push(usage);
  } else {
    usage.isVip = isVip;
    if (isVip) {
      usage.planName = '無限免費方案';
      usage.monthlyTokenLimit = 999999;
    }
  }
  gStore.db_temple_ai_usage = db_temple_ai_usage;
  return { success: true };
}'''

content = pattern.sub(replacement, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
