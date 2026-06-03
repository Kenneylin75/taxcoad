const fs = require('fs');

// 1. lamps page
let lampsContent = fs.readFileSync('src/app/[templeId]/admin/lamps/page.tsx', 'utf8');
lampsContent = lampsContent.replace(
  /await deleteLampCategory\(editingCategory\.id\); await loadData\(\); setEditingCategory\(null\);/,
  `const res = await deleteLampCategory(editingCategory.id); if (!res.success) { alert(res.error); } else { await loadData(); setEditingCategory(null); }`
);
fs.writeFileSync('src/app/[templeId]/admin/lamps/page.tsx', lampsContent, 'utf8');
console.log('Fixed lamps page');

// 2. events page
let eventsContent = fs.readFileSync('src/app/[templeId]/admin/events/EventManagerClient.tsx', 'utf8');
eventsContent = eventsContent.replace(
  /const res = await deleteEvent\(id\);\s*if \(res\.success\) \{\s*setEvents\(events\.filter\(e => e\.id !== id\)\);\s*\}/,
  `const res = await deleteEvent(id);\n      if (res.success) {\n        setEvents(events.filter(e => e.id !== id));\n      } else {\n        alert(res.error);\n      }`
);
fs.writeFileSync('src/app/[templeId]/admin/events/EventManagerClient.tsx', eventsContent, 'utf8');
console.log('Fixed events page');

// 3. queue page
let queueContent = fs.readFileSync('src/app/[templeId]/admin/queue/QueueManagerClient.tsx', 'utf8');
queueContent = queueContent.replace(
  /await deleteQueueEvent\(id\);/,
  `const res = await deleteQueueEvent(id); if(!res.success) { alert(res.error); }`
);
fs.writeFileSync('src/app/[templeId]/admin/queue/QueueManagerClient.tsx', queueContent, 'utf8');
console.log('Fixed queue page');
