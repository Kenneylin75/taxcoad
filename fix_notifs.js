const fs = require('fs');
const file = 'src/app/actions.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/return \\[\.\.\.db_temple_notifications\\]\.sort/g, 'return db_temple_notifications.filter(n => !n.templeId || n.templeId === templeId).sort');
c = c.replace(/return db_temple_notifications\r?\n\s*\.filter\(n => new Date\(n\.sendTime\)\.getTime\(\) <= now\.getTime\(\)\)/g, 'return db_temple_notifications\n        .filter(n => (!n.templeId || n.templeId === templeId) && new Date(n.sendTime).getTime() <= now.getTime())');
c = c.replace(/db_temple_notifications\.unshift\(newNotif\);/g, 'db_temple_notifications.unshift({ templeId, ...newNotif });');

fs.writeFileSync(file, c);

