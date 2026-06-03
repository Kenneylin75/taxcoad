const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(
  `alert('付款狀態已更新，等待宮廟對帳。');
                                  loadData();`,
  `alert('付款狀態已更新，等待宮廟對帳。');
                                  if (guestUser) await refreshAllData(guestUser.phone);`
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
console.log('Fixed loadData reference');
