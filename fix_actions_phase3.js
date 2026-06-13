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

// Events logic
replaceFunction('fetchEventRegistrationsByEventId', `export async function fetchEventRegistrationsByEventId(eventId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return db_event_registrations.filter(r => r.eventId === eventId && (!r.templeId || r.templeId === templeId));
    await client.query(\`CREATE TABLE IF NOT EXISTS event_registrations (id VARCHAR(50) PRIMARY KEY, event_id VARCHAR(50), temple_id VARCHAR(50), title VARCHAR(255), phone VARCHAR(50), guest_name VARCHAR(255), price INTEGER, payment_status VARCHAR(50), actual_price INTEGER, timestamp VARCHAR(50))\`);
    const res = await client.query('SELECT * FROM event_registrations WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
    return res.rows.map(r => ({ id: r.id, eventId: r.event_id, templeId: r.temple_id, title: r.title, phone: r.phone, guestName: r.guest_name, price: r.price, paymentStatus: r.payment_status, actualPrice: r.actual_price, timestamp: r.timestamp }));
  });
}`);

replaceFunction('markRegistrationAsPaid', `export async function markRegistrationAsPaid(registrationId: string, actualPrice: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const reg = db_event_registrations.find(r => r.id === registrationId && (!r.templeId || r.templeId === templeId));
      if (!reg) return { success: false, message: '找不到報名紀錄' };
      reg.paymentStatus = 'Paid';
      reg.actualPrice = actualPrice;
    } else {
      await client.query('UPDATE event_registrations SET payment_status = $1, actual_price = $2 WHERE id = $3 AND temple_id = $4', ['Paid', actualPrice, registrationId, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}`);

replaceFunction('registerForEvent', `export async function registerForEvent(id: any, phone: string, n: string, pr: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (await checkTempleSuspension()) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
    
    if (!client) {
      const ev = db_events.find(e => e.id === id && (!e.templeId || e.templeId === templeId));
      if (!ev) return { success: false };
      ev.enrolled += 1;
      db_event_registrations.push({ id: \`REG-\${Date.now()}\`, eventId: id, templeId, title: ev.title, phone, guestName: n, price: pr, paymentStatus: pr > 0 ? 'Pending' : 'Unpaid', actualPrice: pr > 0 ? pr : 0, timestamp: new Date().toISOString().replace('T', ' ').split('.')[0] });
    } else {
      const evRes = await client.query('SELECT title, enrolled, capacity FROM events WHERE id = $1 AND temple_id = $2', [id, templeId]);
      if (evRes.rowCount === 0) return { success: false };
      const ev = evRes.rows[0];
      if (ev.capacity > 0 && ev.enrolled >= ev.capacity) return { success: false, message: '名額已滿' };
      
      await client.query('UPDATE events SET enrolled = enrolled + 1 WHERE id = $1 AND temple_id = $2', [id, templeId]);
      await client.query('INSERT INTO event_registrations (id, event_id, temple_id, title, phone, guest_name, price, payment_status, actual_price, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [\`REG-\${Date.now()}\`, id, templeId, ev.title, phone, n, pr, pr > 0 ? 'Pending' : 'Unpaid', pr > 0 ? pr : 0, new Date().toISOString().replace('T', ' ').split('.')[0]]
      );
    }
    await revalidateTemple();
    return { success: true };
  });
}`);

// Guests logic
replaceFunction('fetchGuests', `export async function fetchGuests() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_guests.filter((g: any) => !g.templeId || g.templeId === templeId);
    } else {
      const res = await client.query('SELECT * FROM guests WHERE temple_id = $1 ORDER BY created_at DESC', [templeId]);
      return res.rows.map(r => ({
        id: r.id, templeId: r.temple_id, phone: r.phone, name: r.name, email: r.email,
        address: r.address, birthday: r.birthday, lunarBirthday: r.lunar_birthday,
        birthHour: r.birth_hour, lineId: r.line_id, status: r.status,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : r.created_at
      }));
    }
  });
}`);

// Lamps logic
replaceFunction('fetchLampCategories', `export async function fetchLampCategories() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return (gStore.db_lamp_categories || db_lamp_categories).filter((x: any) => !x.templeId || x.templeId === templeId);
    await client.query(\`CREATE TABLE IF NOT EXISTS lamp_categories (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), name VARCHAR(255), price INTEGER, description TEXT, color VARCHAR(50), is_active BOOLEAN DEFAULT true, type VARCHAR(50))\`);
    const res = await client.query('SELECT * FROM lamp_categories WHERE temple_id = $1', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price, description: r.description, color: r.color, isActive: r.is_active, type: r.type }));
  });
}`);

replaceFunction('fetchLampRecords', `export async function fetchLampRecords() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [...db_lamp_records].filter(r => !r.templeId || r.templeId === templeId).reverse();
    await client.query(\`CREATE TABLE IF NOT EXISTS lamp_records (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), guest_name VARCHAR(255), phone VARCHAR(50), lamp_type VARCHAR(255), amount INTEGER, status VARCHAR(50), created_at VARCHAR(50), payment_method VARCHAR(50), payment_ref VARCHAR(255), payment_status VARCHAR(50))\`);
    const res = await client.query('SELECT * FROM lamp_records WHERE temple_id = $1 ORDER BY created_at DESC', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, guestName: r.guest_name, phone: r.phone, lampType: r.lamp_type, amount: r.amount, status: r.status, createdAt: r.created_at, paymentMethod: r.payment_method, paymentRef: r.payment_ref, paymentStatus: r.payment_status }));
  });
}`);

// Queue logic
replaceFunction('verifyQueueTicket', `export async function verifyQueueTicket(eventId: any, phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const t = db_queue_tickets.find(t => t.eventId === eventId && normCompare(t.phone, phone) && (!t.templeId || t.templeId === templeId));
      if (!t) return { success: false, error: 'No ticket found' };
      if (t.status === 'Pending') { t.status = 'Queuing'; t.scannedAt = new Date().toLocaleTimeString(); t.actualOrder = db_queue_tickets.filter((x: any) => x.eventId === eventId && x.status !== 'Pending').length + 1; }
    } else {
      const tRes = await client.query('SELECT id, status FROM queue_tickets WHERE event_id = $1 AND REPLACE(phone, \\'-\\', \\'\\') = $2 AND temple_id = $3', [eventId, phone.replace(/-/g, ''), templeId]);
      if (tRes.rowCount === 0) return { success: false, error: 'No ticket found' };
      const t = tRes.rows[0];
      if (t.status === 'Pending') {
        const orderRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND status != \\'Pending\\' AND temple_id = $2', [eventId, templeId]);
        const actualOrder = parseInt(orderRes.rows[0].count) + 1;
        await client.query('UPDATE queue_tickets SET status = $1, scanned_at = $2, actual_order = $3 WHERE id = $4', ['Queuing', new Date().toLocaleTimeString(), actualOrder, t.id]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}`);

replaceFunction('joinQueue', `export async function joinQueue(eventId: any, phone: string, guestName: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const ev = db_queue_events.find((e: any) => e.id === eventId && (!e.templeId || e.templeId === templeId));
      if (!ev) return { success: false };
      const assignedNumber = \`A\${(db_queue_tickets.filter((t: any) => t.eventId === eventId).length + 1).toString().padStart(3, '0')}\`;
      const tix = { id: \`TIX-\${Date.now()}\`, eventId, templeId, eventTitle: ev.title, phone, guestName, status: 'Pending', assignedNumber, createdAt: new Date().toISOString().replace('T', ' ').split('.')[0] };
      db_queue_tickets.push(tix);
      return { success: true, ticket: tix };
    } else {
      const evRes = await client.query('SELECT title FROM queue_events WHERE id = $1 AND temple_id = $2', [eventId, templeId]);
      if (evRes.rowCount === 0) return { success: false };
      const countRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
      const assignedNumber = \`A\${(parseInt(countRes.rows[0].count) + 1).toString().padStart(3, '0')}\`;
      const newId = \`TIX-\${Date.now()}\`;
      const nowStr = new Date().toISOString().replace('T', ' ').split('.')[0];
      await client.query('INSERT INTO queue_tickets (id, event_id, temple_id, event_title, phone, guest_name, status, assigned_number, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [newId, eventId, templeId, evRes.rows[0].title, phone, guestName, 'Pending', assignedNumber, nowStr]);
      return { success: true, ticket: { id: newId, eventId, templeId, eventTitle: evRes.rows[0].title, phone, guestName, status: 'Pending', assignedNumber, createdAt: nowStr } };
    }
  });
}`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Phase 3 action functions replaced successfully.');
