const fs = require('fs');
const code = `
export async function superAdminUpdateTemplePlans(templeId: string, storagePlanId: string, aiPlanId: string) {
  return withTempleSession(null, true, async (client) => {
    if (storagePlanId === 'FREE') {
      const ts = db_temple_storages.find((s: any) => s.templeId === templeId);
      if (ts) { ts.isVip = true; ts.planName = '無限空間方案'; } else { db_temple_storages.push({ templeId, usedBytes: 0, planName: '無限空間方案', isVip: true }); }
    } else {
      const plan = db_storage_plans.find((p: any) => p.id === storagePlanId);
      const ts = db_temple_storages.find((s: any) => s.templeId === templeId);
      if (ts) { ts.isVip = false; if (plan) ts.planName = plan.name; } else { db_temple_storages.push({ templeId, usedBytes: 0, planName: plan?.name || '無方案', isVip: false }); }
    }
    let aiUsage = db_temple_ai_usage.find((u: any) => u.templeId === templeId);
    if (!aiUsage) { aiUsage = { templeId, enabled: true, planId: aiPlanId === 'FREE' ? 'AI-VIP' : aiPlanId, usedCount: 0, expiryDate: new Date(Date.now() + 30*86400000).toISOString(), isVip: aiPlanId === 'FREE' }; db_temple_ai_usage.push(aiUsage); } else { if (aiPlanId === 'FREE') { aiUsage.isVip = true; aiUsage.planId = 'AI-VIP'; } else { aiUsage.isVip = false; aiUsage.planId = aiPlanId; } }
    const gStore = globalThis as any;
    gStore.db_temple_storages = db_temple_storages;
    gStore.db_temple_ai_usage = db_temple_ai_usage;
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin', 'layout');
    return { success: true };
  });
}
`;
fs.appendFileSync('src/app/actions.ts', code);
