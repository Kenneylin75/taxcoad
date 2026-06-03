const fs = require('fs');
let content = fs.readFileSync('src/app/actions.ts', 'utf8');

const oldInterface = `  cash?: { enabled: boolean; description: string; };`;
const newInterface = `  cash?: { 
    enabled: boolean; 
    description: string; 
    allowBooking?: boolean;
    allowLamp?: boolean;
    allowEvent?: boolean;
    allowQueue?: boolean;
  };`;

content = content.replace(oldInterface, newInterface);

const oldInit = `  if (config && !config.cash) {
    config.cash = { enabled: true, description: '現場現金付款' };
  }`;

const newInit = `  if (config && !config.cash) {
    config.cash = { 
      enabled: true, 
      description: '現場現金付款',
      allowBooking: true,
      allowLamp: true,
      allowEvent: true,
      allowQueue: true
    };
  }`;

content = content.replace(oldInit, newInit);

fs.writeFileSync('src/app/actions.ts', content, 'utf8');
console.log('Updated actions.ts for granular cash config');
