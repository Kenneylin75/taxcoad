
const fs = require('fs');
const content = fs.readFileSync('C:/Users/KenneyLin/Desktop/®c¼qºÞ²zv10/src/app/[templeId]/admin/customers/page.tsx', 'utf8');
const start = content.indexOf('guestSubTab === \'queue\'');
if (start > -1) {
    console.log(content.substring(start - 200, start + 3000));
}

