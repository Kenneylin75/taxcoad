import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function updateDistributorPaymentConfig(distId: string, paymentConfig: any) {
  const dist = db_distributors.find(d => d.id === distId);
  if (dist) {
    dist.b2bPayment = paymentConfig;
    
    // add to audit log
    if (!gStore.db_admin_logs) gStore.db_admin_logs = [];
    gStore.db_admin_logs.push({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      adminId: distId,
      adminName: dist.name,
      action: 'UPDATE_DIST_PAYMENT',
      target: distId,
      details: '經銷商更新了B2B收款設定'
    });
    
    return { success: true };
  }
  return { success: false, error: 'Distributor not found' };
}
"""

content = content + new_func

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
