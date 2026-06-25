import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function updateDistributorProfile(distId: string, data: any) {
  const dist = db_distributors.find(d => d.id === distId);
  if (dist) {
    if (data.name) dist.name = data.name;
    if (data.account) dist.account = data.account;
    if (data.password) dist.password = data.password;
    if (data.bankInfo) dist.bankInfo = data.bankInfo;
    
    // add to audit log
    if (!gStore.db_admin_logs) gStore.db_admin_logs = [];
    gStore.db_admin_logs.push({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      adminId: distId,
      adminName: dist.name,
      action: 'UPDATE_DIST_PROFILE',
      target: distId,
      details: '經銷商更新了個人資料或銀行帳戶'
    });
    
    return { success: true };
  }
  return { success: false, error: 'Distributor not found' };
}
"""

content = content + new_func

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
