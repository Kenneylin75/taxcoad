
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');
const lines = code.split('\n');

const funcs = ['export async function createDistributorSales', 'export async function fetchSalesProfileById', 'export async function fetchSalesPerformance', 'export async function fetchSalesProfile('];

funcs.forEach(f => {
  const idx = lines.findIndex(l => l.includes(f));
  if (idx !== -1) {
    console.log('--- ' + f + ' ---');
    console.log(lines.slice(idx, idx + 35).join('\n'));
  }
});

