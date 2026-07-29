
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const regexes = [
  /export async function createDistributorSales[\s\S]*?return \{ success: true, data: newSales \};\n\}/,
  /export async function fetchSalesProfileById[\s\S]*?account: sales\?\.account \};\n  \}\n\}/,
  /export async function fetchSalesPerformance[\s\S]*?\}\n\}/,
  /export async function fetchSalesProfile\(salesName: string\)[\s\S]*?bankAccount: sales\?\.bankAccount \};\n\}/
];

for (let i = 0; i < regexes.length; i++) {
  const match = code.match(regexes[i]);
  if (match) {
    console.log('--- match', i, '---');
    console.log(match[0]);
  } else {
    console.log('not found', i);
  }
}

