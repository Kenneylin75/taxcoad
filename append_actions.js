const fs = require('fs');

const contentToAppend = `

// --- AI Plan & Usage Management ---
export async function fetchAiApiModels() {
  return [...db_ai_api_models];
}

export async function saveAiApiModels(models: any[]) {
  db_ai_api_models = [...models];
  gStore.db_ai_api_models = db_ai_api_models;
  return { success: true };
}

export async function fetchAllTempleAiUsage() {
  // Returns AI usage for all temples, joining with temple profiles and plans
  return db_temple_ai_usage.map(usage => {
    const temple = db_temple_profiles.find(t => t.id === usage.templeId) || { name: '未知宮廟' };
    const plan = db_ai_plans.find(p => p.id === usage.planId) || { name: '無方案', chatLimit: 0 };
    return { ...usage, templeName: temple.name, planName: plan.name, chatLimit: plan.chatLimit || 0 };
  });
}

export async function grantTempleAiVip(templeId: string, isVip: boolean) {
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (!usage) {
    usage = { templeId, enabled: true, planId: 'AI-500', usedCount: 0, expiryDate: new Date().toISOString(), isVip };
    db_temple_ai_usage.push(usage);
  } else {
    usage.isVip = isVip;
  }
  gStore.db_temple_ai_usage = db_temple_ai_usage;
  return { success: true };
}

export async function fetchTempleAiUsage() {
  const templeId = await getDynamicTempleId();
  if (!templeId) return null;
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (!usage) {
    // Default 1-month trial
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    usage = { templeId, enabled: false, planId: 'AI-500', usedCount: 0, expiryDate: thirtyDaysLater.toISOString(), isVip: false };
    db_temple_ai_usage.push(usage);
    gStore.db_temple_ai_usage = db_temple_ai_usage;
  }
  const plan = db_ai_plans.find(p => p.id === usage.planId) || { chatLimit: 0, name: '無方案', monthlyFee: 0 };
  return { ...usage, chatLimit: plan.chatLimit, planName: plan.name, monthlyFee: plan.monthlyFee };
}

export async function toggleTempleAiStatus(enabled: boolean) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (usage) {
    usage.enabled = enabled;
    gStore.db_temple_ai_usage = db_temple_ai_usage;
  }
  return { success: true };
}

export async function purchaseAiPlan(planId: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  
  if (usage) {
    usage.planId = planId;
    usage.expiryDate = thirtyDaysLater.toISOString();
    usage.usedCount = 0; // Reset usage
    usage.enabled = true;
  } else {
    usage = { templeId, enabled: true, planId, usedCount: 0, expiryDate: thirtyDaysLater.toISOString(), isVip: false };
    db_temple_ai_usage.push(usage);
  }
  gStore.db_temple_ai_usage = db_temple_ai_usage;
  return { success: true };
}
`;

fs.appendFileSync('src/app/actions.ts', contentToAppend);
console.log('Appended AI functions to actions.ts');
