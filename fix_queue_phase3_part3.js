const fs = require('fs');
const filePath = 'C:\\Users\\KenneyLin\\.gemini\\antigravity\\scratch\\temple-app\\src\\app\\actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /export async function createQueueEvent\([\s\S]*?\)\s*\{[\s\S]*?(?=\nexport async function |\n\/\/ |\n$|\nexport let|\nlet|\nconst )/;

const match = content.match(regex);
if (match) {
  content = content.replace(match[0], `export async function createQueueEvent(data: any) { 
  const templeId = await getDynamicTempleId(); 
  return withTempleSession(templeId, false, async (client) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.date <= todayStr) return { success: false, error: '只能部屬明日之後的活動。' };

    if (!client) {
      const overlapping = db_queue_events.find((e:any) => e.templeId === templeId && e.date === data.date && e.status !== 'Cancelled' && (data.startTime < e.endTime && data.endTime > e.startTime));
      if (overlapping) return { success: false, error: \`同一日時段有重複（與 "\${overlapping.title}" 衝突），無法部屬。\` };
      db_queue_events.push({ id: \`qe-\${Date.now()}\`, ...data, templeId, status: 'Draft' });
    } else {
      const overlapRes = await client.query('SELECT title FROM queue_events WHERE temple_id = $1 AND date = $2 AND status != \\'Cancelled\\' AND start_time < $3 AND end_time > $4 LIMIT 1', [templeId, data.date, data.endTime, data.startTime]);
      if (overlapRes.rowCount > 0) return { success: false, error: \`同一日時段有重複（與 "\${overlapRes.rows[0].title}" 衝突），無法部屬。\` };
      await client.query('INSERT INTO queue_events (id, temple_id, title, date, start_time, end_time, location, service_type, price, max_capacity, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [\`qe-\${Date.now()}\`, templeId, data.title, data.date, data.startTime, data.endTime, data.location, data.serviceType, data.price, data.maxCapacity, 'Draft']);
    }
    await revalidateTemple();
    return { success: true };
  });
}`);
  console.log('Replaced createQueueEvent');
  fs.writeFileSync(filePath, content, 'utf8');
} else {
  console.log('Could not find createQueueEvent block');
}
