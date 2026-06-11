const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

code = code.replace(/paymentStatus:\s*paymentMethod\s*===\s*'Cash'\s*\|\|\s*paymentMethod\s*===\s*'LinePayApi'\s*\|\|\s*paymentMethod\s*===\s*'ThirdPartyApi'\s*\?\s*'Paid'\s*:\s*'Pending'/g, "paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending'");

code = code.replace(/status:\s*paymentMethod\s*===\s*'Cash'\s*\|\|\s*paymentMethod\s*===\s*'LinePayApi'\s*\|\|\s*paymentMethod\s*===\s*'ThirdPartyApi'\s*\?\s*'Confirmed'\s*:\s*'Pending'/g, "status: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Confirmed' : 'Pending'");

code = code.replace(/status:\s*paymentMethod\s*===\s*'Cash'\s*\|\|\s*paymentMethod\s*===\s*'LinePayApi'\s*\|\|\s*paymentMethod\s*===\s*'ThirdPartyApi'\s*\?\s*'Active'\s*:\s*'Pending'/g, "status: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Active' : 'Pending'");

code = code.replace(/paymentStatus:\s*pr\s*>\s*0\s*\?\s*'Paid'\s*:\s*'Unpaid'/g, "paymentStatus: pr > 0 ? 'Pending' : 'Unpaid'");

code = code.replace(/if\s*\(\s*paymentMethod\s*===\s*'Cash'\s*\|\|\s*paymentMethod\s*===\s*'LinePayApi'\s*\|\|\s*paymentMethod\s*===\s*'ThirdPartyApi'\s*\)\s*\{/g, "if (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') {");

fs.writeFileSync('src/app/actions.ts', code);
console.log('Done');
