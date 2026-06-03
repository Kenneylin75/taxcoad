const fs = require('fs');

let content = fs.readFileSync('src/app/[templeId]/admin/line-setup/page.tsx', 'utf8');

// The faulty map was:
// const allServices = [
//   ...servs.map((s: any) => ({ ...s, group: '預約服務' })),
//   ...lamps.map((l: any) => ({ ...l, group: '點燈服務' })),
//   ...evts.map((e: any) => ({ ...e, group: '法會活動' })),
//   ...queues.map((q: any) => ({ ...q, group: '現場排隊' }))
// ];

content = content.replace(
  /\.\.\.servs\.map\(\(s: any\) => \(\{ \.\.\.s, group: '預約服務' \}\)\),/,
  `...servs.map((s: any) => ({ id: s.id, name: s.name || '未命名服務', group: '預約服務' })),`
);
content = content.replace(
  /\.\.\.lamps\.map\(\(l: any\) => \(\{ \.\.\.l, group: '點燈服務' \}\)\),/,
  `...lamps.map((l: any) => ({ id: l.id, name: l.name || '未命名點燈', group: '點燈服務' })),`
);
content = content.replace(
  /\.\.\.evts\.map\(\(e: any\) => \(\{ \.\.\.e, group: '法會活動' \}\)\),/,
  `...evts.map((e: any) => ({ id: e.id, name: e.title || '未命名活動', group: '法會活動' })),`
);
content = content.replace(
  /\.\.\.queues\.map\(\(q: any\) => \(\{ \.\.\.q, group: '現場排隊' \}\)\)/,
  `...queues.map((q: any) => ({ id: q.id, name: q.eventName || '未命名排隊', group: '現場排隊' }))`
);

// Also gracefully handle service.name[0]
content = content.replace(
  /\{service\.name\[0\]\}/,
  `{service.name ? service.name[0] : '?'}`
);

fs.writeFileSync('src/app/[templeId]/admin/line-setup/page.tsx', content, 'utf8');
console.log('Fixed missing service name in line-setup');
