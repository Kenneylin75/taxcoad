const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');
content = content.replace(/export async function grantTempleAiVip[\s\S]*?return \{ success: true \};\n\}/, 
export async function grantTempleAiVip(templeId: string, isVip: boolean = true) {
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
});
fs.writeFileSync('src/app/actions.ts', content);
