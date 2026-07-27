const fs = require('fs');
let code = fs.readFileSync('schema.prisma', 'utf8');

if (!code.includes('setupFee')) {
  code = code.replace(
    /status\s+String\s+@default\("Active"\)/g,
    'status        String   @default("Active")\n  setupFee      Int      @default(0)\n  monthlyRent   Int      @default(0)\n  paymentCycle  String   @default("Yearly")'
  );
}

if (!code.includes('itemName')) {
  code = code.replace(
    /type\s+String\?/g,
    'type          String?\n  itemName      String?\n  billingDate   DateTime? @default(now())\n  payeeId       String?\n  timestamp     DateTime? @default(now())'
  );
}

fs.writeFileSync('schema.prisma', code);
console.log('schema.prisma updated');
