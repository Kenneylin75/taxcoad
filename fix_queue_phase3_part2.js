const fs = require('fs');
const filePath = 'C:\\Users\\KenneyLin\\.gemini\\antigravity\\scratch\\temple-app\\src\\app\\actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

function replaceFunction(name, newBody) {
  const relaxedRegex = new RegExp(`export async function ${name}\\([\\s\\S]*?\\)\\s*\\{[\\s\\S]*?(?=\\nexport (async )?function |\\n// |\\n$|\\nexport let|\\nexport type|\\nlet|\\nconst)`, '');
  const match = content.match(relaxedRegex);
  if (match) {
      content = content.replace(match[0], newBody);
      console.log(`Replaced ${name}`);
  } else {
      console.log(`Failed to find ${name}`);
  }
}

// 1. fetchQueueEvents
replaceFunction('fetchQueueEvents', `export async function fetchQueueEvents() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_queue_events.filter(e => !e.templeId || e.templeId === templeId).map(evt => {
        const participantCount = db_queue_tickets.filter(t => t.eventId === evt.id && t.status === 'Queuing').length;
        return { ...evt, participantCount };
      });
    } else {
      await client.query(\`CREATE TABLE IF NOT EXISTS queue_events (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), title VARCHAR(255), date VARCHAR(50), start_time VARCHAR(50), end_time VARCHAR(50), location VARCHAR(255), service_type VARCHAR(255), price INTEGER, max_capacity INTEGER, status VARCHAR(50))\`);
      const res = await client.query('SELECT * FROM queue_events WHERE temple_id = $1 ORDER BY date DESC, start_time DESC', [templeId]);
      
      const counts = await client.query('SELECT event_id, COUNT(*) as count FROM queue_tickets WHERE temple_id = $1 AND status = \\'Queuing\\' GROUP BY event_id', [templeId]);
      const countMap = counts.rows.reduce((acc, r) => ({...acc, [r.event_id]: parseInt(r.count)}), {});
      
      return res.rows.map(r => ({
        id: r.id, templeId: r.temple_id, title: r.title, date: r.date, startTime: r.start_time, endTime: r.end_time,
        location: r.location, serviceType: r.service_type, price: r.price, maxCapacity: r.max_capacity, status: r.status,
        participantCount: countMap[r.id] || 0
      }));
    }
  });
}`);

// 2. fetchActiveQueues
replaceFunction('fetchActiveQueues', `export async function fetchActiveQueues() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return db_queue_events.filter(e => e.status === 'Active' && (!e.templeId || e.templeId === templeId));
    const res = await client.query('SELECT * FROM queue_events WHERE status = \\'Active\\' AND temple_id = $1', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, title: r.title, date: r.date, startTime: r.start_time, endTime: r.end_time, location: r.location, serviceType: r.service_type, price: r.price, maxCapacity: r.max_capacity, status: r.status }));
  });
}`);

// 3. fetchQueueDashboard
replaceFunction('fetchQueueDashboard', `export async function fetchQueueDashboard(eventId?: string) {
  if (!eventId) return { tickets: [] };
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return { tickets: db_queue_tickets.filter(t => t.eventId === eventId) };
    const res = await client.query('SELECT * FROM queue_tickets WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
    return { tickets: res.rows.map(r => ({
      id: r.id, eventId: r.event_id, templeId: r.temple_id, eventTitle: r.event_title, phone: r.phone, guestName: r.guest_name,
      status: r.status, assignedNumber: r.assigned_number, createdAt: r.created_at, scannedAt: r.scanned_at, actualOrder: r.actual_order
    })) };
  });
}`);

// 4. fetchActiveQueueCount
replaceFunction('fetchActiveQueueCount', `export async function fetchActiveQueueCount(): Promise<number> {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const activeEventIds = db_queue_events.filter(e => e.status === 'Active' && (!e.templeId || e.templeId === templeId)).map(e => e.id);
      if (activeEventIds.length === 0) return 0;
      return db_queue_tickets.filter(t => activeEventIds.includes(t.eventId) && t.status === 'Queuing').length;
    } else {
      const res = await client.query('SELECT COUNT(qt.id) as count FROM queue_tickets qt JOIN queue_events qe ON qt.event_id = qe.id WHERE qe.status = \\'Active\\' AND qt.status = \\'Queuing\\' AND qt.temple_id = $1', [templeId]);
      return parseInt(res.rows[0].count) || 0;
    }
  });
}`);

// 5. createQueueEvent
replaceFunction('createQueueEvent', `export async function createQueueEvent(data: any) {
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

// 6. activateQueueEvent
replaceFunction('activateQueueEvent', `export async function activateQueueEvent(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      // Allow multiple active events by NOT completing other active events!
      db_queue_events = gStore.db_queue_events = db_queue_events.map((e: any) => e.id === id ? { ...e, status: 'Active' } : e);
    } else {
      await client.query('UPDATE queue_events SET status = \\'Active\\' WHERE id = $1 AND temple_id = $2', [id, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}`);

// 7. deleteQueueEvent
replaceFunction('deleteQueueEvent', `export async function deleteQueueEvent(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const hasTickets = db_queue_tickets.some((t: any) => t.eventId === id && (!t.templeId || t.templeId === templeId));
      if (hasTickets) {
        db_queue_events = gStore.db_queue_events = db_queue_events.map((e: any) => e.id === id ? { ...e, status: 'Cancelled' } : e);
      } else {
        db_queue_events = gStore.db_queue_events = db_queue_events.filter((e: any) => !(e.id === id && (!e.templeId || e.templeId === templeId)));
      }
    } else {
      const tRes = await client.query('SELECT 1 FROM queue_tickets WHERE event_id = $1 AND temple_id = $2 LIMIT 1', [id, templeId]);
      if (tRes.rowCount > 0) {
        await client.query('UPDATE queue_events SET status = \\'Cancelled\\' WHERE id = $1 AND temple_id = $2', [id, templeId]);
      } else {
        await client.query('DELETE FROM queue_events WHERE id = $1 AND temple_id = $2', [id, templeId]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating queue functions.');
