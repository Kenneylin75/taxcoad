const fs = require('fs');
let code = fs.readFileSync('src/app/actions.ts', 'utf8');

const newRecordStr = `const newRecord = {
    id: \`LMP-\${Date.now()}\`,
    templeId,
    phone,
    guestName,
    categoryId: cat.id,
    categoryName: cat.name,
    price: cat.price,
    durationDays: cat.durationDays || 365,
    notice: notice || '',
    startDate: today.toISOString().split('T')[0],
    expiryDate: exp.toISOString().split('T')[0],
    status: 'Active',
    paymentMethod,
    paymentRef,
    paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending',
    createdAt: new Date().toISOString()
  };`;

code = code.replace(/const newRecord = \{\s*id: `LMP-\$\{Date\.now\(\)\}`,\s*templeId,[\s\S]*?createdAt: new Date\(\)\.toISOString\(\)\s*\};/, newRecordStr);

fs.writeFileSync('src/app/actions.ts', code);
console.log('Lamp created updated');
