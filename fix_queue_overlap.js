const fs = require('fs');
const filePath = 'C:\\Users\\KenneyLin\\.gemini\\antigravity\\scratch\\temple-app\\src\\app\\actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

const func = `
export async function createQueueEvent(data: any) { 
  const templeId = await getDynamicTempleId(); 
  return withTempleSession(templeId, false, async (client) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.date < todayStr) return { success: false, error: '不能部屬過去時間的活動。' };

    if (!client) {
      db_queue_events.push({ id: \`qe-\${Date.now()}\`, ...data, templeId, status: 'Draft' });
    } else {
      await client.query('INSERT INTO queue_events (id, temple_id, title, date, start_time, end_time, location, service_type, price, max_capacity, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [\`qe-\${Date.now()}\`, templeId, data.title, data.date, data.startTime, data.endTime, data.location, data.serviceType, data.price, data.maxCapacity, 'Draft']);
    }
    await revalidateTemple();
    return { success: true };
  });
}
`;

if (!content.includes('export async function createQueueEvent')) {
  content = content.replace('export async function activateQueueEvent', func + 'export async function activateQueueEvent');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Restored createQueueEvent');
} else {
  console.log('createQueueEvent already exists');
}
