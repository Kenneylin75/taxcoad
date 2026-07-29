
const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const regexes = [
  /export async function fetchSalesProfileById[\s\S]*?\} catch\(e\) \{[\s\S]*?return \{ name, parentDistributor, account \};\n  \}\n\}/,
  /export async function fetchSalesPerformance[\s\S]*?\}\n\}/,
  /export async function updateDistSalesBankInfo[\s\S]*?return \{ success: false, error: String\(e\) \};\n  \}\n\}/
];

for (let r of regexes) {
  const match = code.match(r);
  if (match) console.log(match[0] + '\n---');
}

