
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');

const funcs = ['export async function createDistributorSales', 'export async function fetchSalesProfileById', 'export async function fetchSalesName', 'export async function fetchSalesOverview', 'export async function fetchSalesPerformance', 'export async function updateSalesBankAccount'];

funcs.forEach(f => {
  const idx = lines.findIndex(l => l.includes(f));
  if (idx !== -1) {
    console.log('--- ' + f + ' ---');
    console.log(lines.slice(idx, idx + 20).join('\n'));
  } else {
    console.log(f, 'not found');
  }
});

