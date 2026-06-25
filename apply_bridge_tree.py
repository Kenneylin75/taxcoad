import re

with open('src/app/actions.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """
export async function fetchDataBridgeTree() {
  const superSales = await fetchSuperSalesAccounts();
  const gStore = globalThis as any;
  const distributors = gStore.db_distributors || [];
  const distSales = gStore.db_dist_sales || [];
  const temples = gStore.db_temples || [];
  
  // Build a tree
  return superSales.map((ss: any) => {
     const myDists = distributors.filter((d: any) => d.superSalesId === ss.id);
     return {
        id: ss.id,
        name: ss.name,
        type: 'super-sales',
        children: myDists.map((d: any) => {
           const mySales = distSales.filter((ds: any) => ds.distributorId === d.id);
           return {
              id: d.id,
              name: d.name,
              type: 'distributor',
              children: mySales.map((s: any) => {
                 const myTemples = temples.filter((t: any) => t.salesId === s.id);
                 return {
                    id: s.id,
                    name: s.name,
                    type: 'dist-sales',
                    children: myTemples.map((t: any) => ({
                       id: t.id,
                       name: t.name,
                       type: 'temple'
                    }))
                 };
              })
           };
        })
     };
  });
}
"""

content = re.sub(r'export async function fetchDataBridgeTree\(\) \{[\s\S]*?return \{\s*superSales,\s*distributors,\s*distSales,\s*temples\s*\};\s*\}', new_func, content)

with open('src/app/actions.ts', 'w', encoding='utf-8') as f:
    f.write(content)
