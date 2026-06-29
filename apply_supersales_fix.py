import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function fetchSuperSalesAccounts() {
  return db_dist_sales.filter(s => s.role === 'SuperSales').map(ss => ({
    ...ss,
    rates: db_super_sales_overrides[ss.name] || db_config.defaultSuperSalesRates
  }));
}
"""

content = re.sub(r'export async function fetchSuperSalesAccounts\(\) \{[\s\S]*?return \[[\s\S]*?\];\s*\}', new_func, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
