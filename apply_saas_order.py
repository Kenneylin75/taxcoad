import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function verifySaasOrder(orderId: string, status: 'paid' | 'rejected') {
  const order = db_saas_orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    return { success: true };
  }
  return { success: false, error: 'Order not found' };
}
"""

content = content + new_func

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
