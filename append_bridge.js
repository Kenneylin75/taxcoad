const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const newFunc = \nexport async function fetchDataBridgeTree() {
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
}\n;

if (!content.includes('fetchDataBridgeTree')) {
    content += newFunc;
    fs.writeFileSync('src/app/actions.ts', content);
}
