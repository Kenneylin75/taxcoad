import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function fetchSuperSalesWithdrawals(salesId: string) {
  const allWithdrawals = await fetchAllWithdrawals();
  return allWithdrawals.filter((w: any) => w.userId === salesId);
}
"""

content = content + new_func

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
