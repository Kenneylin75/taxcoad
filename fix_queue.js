const fs = require('fs');
const file = 'src/app/actions.ts';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/export async function fetchQueueEvents\(\) \{/g, 'export async function fetchQueueEvents() { const templeId = await getDynamicTempleId();');
c = c.replace(/return db_queue_events\.map/g, 'return db_queue_events.filter(e => !e.templeId || e.templeId === templeId).map');

c = c.replace(/export async function fetchActiveQueues\(\) \{ return db_queue_events\.filter\(e => e\.status === 'Active'\); \}/g, 'export async function fetchActiveQueues() { const templeId = await getDynamicTempleId(); return db_queue_events.filter(e => e.status === \'Active\' && (!e.templeId || e.templeId === templeId)); }');

c = c.replace(/export async function createQueueEvent\(data: any\) \{/g, 'export async function createQueueEvent(data: any) { const templeId = await getDynamicTempleId();');
c = c.replace(/db_queue_events\.push\(\{ id: \qe-\\\$\{Date\.now\(\)\}\, \.\.\.data, status: 'Draft' \}\);/g, 'db_queue_events.push({ id: \qe-\\, templeId, ...data, status: \'Draft\' });');

c = c.replace(/export async function fetchActiveQueueCount\(\): Promise<number> \{/g, 'export async function fetchActiveQueueCount(): Promise<number> { const templeId = await getDynamicTempleId();');
c = c.replace(/const activeEventIds = db_queue_events\.filter\(e => e\.status === 'Active'\)/g, 'const activeEventIds = db_queue_events.filter(e => e.status === \'Active\' && (!e.templeId || e.templeId === templeId))');

fs.writeFileSync(file, c);

