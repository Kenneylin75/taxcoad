import sys

with open('src/app/actions.ts', 'a', encoding='utf-8') as f:
    f.write('''
export async function fetchDataBridgeTree() {
  const superSales = await fetchSuperSalesAccounts();
  const gStore = globalThis as any;
  const distributors = gStore.db_distributors || [];
  const distSales = gStore.db_dist_sales || [];
  const temples = gStore.db_temples || [];
  
  return {
    superSales,
    distributors,
    distSales,
    temples
  };
}
''')
