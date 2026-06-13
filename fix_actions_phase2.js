const fs = require('fs');
const filePath = 'C:\\Users\\KenneyLin\\.gemini\\antigravity\\scratch\\temple-app\\src\\app\\actions.ts';
let content = fs.readFileSync(filePath, 'utf8');

function replaceFunction(name, newBody) {
  const regex = new RegExp(`export async function ${name}\\([\\s\\S]*?\\)\\s*\\{[\\s\\S]*?\\n\\}`, 'g');
  const matches = content.match(regex);
  if (matches && matches.length === 1) {
    content = content.replace(matches[0], newBody);
    console.log(`Replaced ${name}`);
  } else {
    // try finding with a more relaxed regex, matching until the next export async function or end of file
    const relaxedRegex = new RegExp(`export async function ${name}\\([\\s\\S]*?\\)\\s*\\{[\\s\\S]*?(?=\\nexport async function |\\n// |\\n$|\\nexport let|\\nlet)`, '');
    const match = content.match(relaxedRegex);
    if (match) {
        content = content.replace(match[0], newBody);
        console.log(`Replaced ${name} (relaxed)`);
    } else {
        console.log(`Failed to find ${name}`);
    }
  }
}

const fetchServiceDefinitionsBody = `export async function fetchServiceDefinitions() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const currentServices = gStore.db_services || db_services;
      return currentServices.filter((x: any) => x.templeId === templeId);
    } else {
      await client.query(\`
        CREATE TABLE IF NOT EXISTS services (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          price INTEGER DEFAULT 0,
          duration VARCHAR(50),
          description TEXT,
          color VARCHAR(50),
          status VARCHAR(50) DEFAULT 'Active',
          assigned_staff TEXT[],
          PRIMARY KEY (id, temple_id)
        )
      \`);
      const res = await client.query('SELECT * FROM services WHERE temple_id = $1', [templeId]);
      if (res.rowCount === 0) {
        // Seed default services
        const DEFAULT_SERVICES = [
          { id: '1', name: '光明燈祈福', price: 600, duration: '30 min', description: '消災解厄，前途光明', assignedStaff: ['1', '2'], color: '#f59e0b' },
          { id: '2', name: '文昌開運', price: 800, duration: '45 min', description: '金榜題名，智慧大開', assignedStaff: ['3'], color: '#3b82f6' },
          { id: '3', name: '太歲安奉', price: 1000, duration: '20 min', description: '歲歲平安，諸事順遂', assignedStaff: ['1'], color: '#ef4444' },
          { id: '4', name: '問事服務', price: 0, duration: '20 min', description: '指點迷津，解惑人生', assignedStaff: ['1', '2'], color: '#8b5cf6' },
          { id: '5', name: '例行祈福', price: 0, duration: '30 min', description: '日常平安祈福', assignedStaff: ['1'], color: '#10b981' }
        ];
        for (const s of DEFAULT_SERVICES) {
          await client.query(
            'INSERT INTO services (id, temple_id, name, price, duration, description, color, assigned_staff) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [s.id, templeId, s.name, s.price, s.duration, s.description, s.color, s.assignedStaff]
          );
        }
        const retryRes = await client.query('SELECT * FROM services WHERE temple_id = $1', [templeId]);
        return retryRes.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price, duration: r.duration, description: r.description, color: r.color, status: r.status, assignedStaff: r.assigned_staff || [] }));
      }
      return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price, duration: r.duration, description: r.description, color: r.color, status: r.status, assignedStaff: r.assigned_staff || [] }));
    }
  });
}`;

const saveServiceDefinitionBody = `export async function saveServiceDefinition(data: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const id = data.id || \`s-\${Date.now()}\`;
    const newColor = data.color || '#6366f1';
    
    if (!client) {
      let currentServices = gStore.db_services || db_services;
      const idx = currentServices.findIndex((s: any) => s.id === id);
      if (idx > -1) {
        currentServices[idx] = { ...currentServices[idx], ...data };
      } else {
        currentServices.push({ id, status: 'Active', color: newColor, ...data , templeId});
      }
      gStore.db_services = [...currentServices];
      db_services = gStore.db_services;
    } else {
      const res = await client.query('SELECT 1 FROM services WHERE id = $1 AND temple_id = $2', [id, templeId]);
      if (res.rowCount > 0) {
        await client.query(
          'UPDATE services SET name = $1, price = $2, duration = $3, description = $4, color = $5, assigned_staff = $6, status = $7 WHERE id = $8 AND temple_id = $9',
          [data.name, data.price || 0, data.duration || '', data.description || '', newColor, data.assignedStaff || [], data.status || 'Active', id, templeId]
        );
      } else {
        await client.query(
          'INSERT INTO services (id, temple_id, name, price, duration, description, color, assigned_staff, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [id, templeId, data.name, data.price || 0, data.duration || '', data.description || '', newColor, data.assignedStaff || [], data.status || 'Active']
        );
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}`;

const deleteServiceDefinitionBody = `export async function deleteServiceDefinition(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      let currentServices = gStore.db_services || db_services;
      gStore.db_services = currentServices.filter((s: any) => !(s.id === id && s.templeId === templeId));
      db_services = gStore.db_services;
    } else {
      await client.query('DELETE FROM services WHERE id = $1 AND temple_id = $2', [id, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}`;

const fetchAvailableSlotsBody = `export async function fetchAvailableSlots() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [...(gStore.db_slots || db_slots)].filter(x => x.templeId === templeId);
    await client.query(\`
      CREATE TABLE IF NOT EXISTS slots (
        id SERIAL PRIMARY KEY,
        temple_id VARCHAR(50) NOT NULL,
        date VARCHAR(50),
        time VARCHAR(50),
        staff VARCHAR(255),
        description TEXT,
        location VARCHAR(255),
        bound_service_id VARCHAR(50),
        price INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Available',
        guest_name VARCHAR(255)
      )
    \`);
    const res = await client.query('SELECT * FROM slots WHERE temple_id = $1 ORDER BY date, time', [templeId]);
    return res.rows.map(r => ({
      id: r.id,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      time: r.time,
      staff: r.staff,
      description: r.description,
      location: r.location,
      bound_service_id: r.bound_service_id,
      price: r.price,
      status: r.status,
      guestName: r.guest_name
    }));
  });
}`;

const createSlotBody = `export async function createSlot(data: any) {
  let datesStr = ''; let time = ''; let staff = ''; let description = ''; let location = ''; let bound_service_id = ''; let price = 0;
  if (data instanceof FormData) {
    datesStr = data.get("dates") as string || data.get("date") as string;
    time = data.get("time") as string;
    staff = data.get("staff") as string;
    description = data.get("description") as string;
    location = data.get("location") as string;
    bound_service_id = data.get("bound_service_id") as string || data.get("serviceId") as string;
    price = Number(data.get("price")) || 0;
  } else {
    datesStr = data.dates || data.date; time = data.time; staff = data.staff; description = data.description || ''; location = data.location || ''; bound_service_id = data.bound_service_id || data.serviceId; price = Number(data.price) || 0;
  }
  if (!datesStr) return { success: false, message: "無效的日期" };
  const dateList = datesStr.includes(',') ? datesStr.split(",") : [datesStr];
  const templeId = await getDynamicTempleId();

  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const currentSlots = gStore.db_slots || db_slots;
      const now = Date.now();
      dateList.forEach((date, idx) => {
        currentSlots.push({ id: now + idx + Math.floor(Math.random() * 1000), date, time, staff, description, location, bound_service_id, price, status: "Available", templeId });
      });
      gStore.db_slots = [...currentSlots];
      db_slots = gStore.db_slots;
    } else {
      for (const date of dateList) {
        await client.query(
          'INSERT INTO slots (temple_id, date, time, staff, description, location, bound_service_id, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [templeId, date, time, staff, description, location, bound_service_id, price, 'Available']
        );
      }
    }
    await revalidateTemple();
    return { success: true, count: dateList.length };
  });
}`;

const removeSingleSlotBody = `export async function removeSingleSlot(id: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      let currentSlots = gStore.db_slots || db_slots;
      const filtered = currentSlots.filter((s: any) => String(s.id) !== String(id));
      gStore.db_slots = [...filtered];
      db_slots = gStore.db_slots;
    } else {
      await client.query('DELETE FROM slots WHERE id = $1 AND temple_id = $2', [id, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}`;

const fetchAppointmentsBody = `export async function fetchAppointments() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const filtered = db_appointments.filter((a: any) => !a.templeId || a.templeId === templeId);
      filtered.forEach((app: any) => {
        if (!app.serviceId) {
          const slot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff && s.templeId === templeId);
          if (slot && (slot.bound_service_id || slot.serviceId)) { app.serviceId = slot.bound_service_id || slot.serviceId; }
        }
        if (app.serviceId) {
          const svc = db_services.find((s: any) => s.id === app.serviceId && s.templeId === templeId);
          if (svc) { app.service = svc.name; if (app.amount === undefined) app.amount = svc.price; }
        }
      });
      return [...filtered];
    } else {
      await client.query(\`
        CREATE TABLE IF NOT EXISTS appointments (
          id SERIAL PRIMARY KEY,
          temple_id VARCHAR(50) NOT NULL,
          date VARCHAR(50),
          time VARCHAR(50),
          staff VARCHAR(255),
          guest_name VARCHAR(255),
          service VARCHAR(255),
          service_id VARCHAR(50),
          status VARCHAR(50) DEFAULT 'Pending',
          phone VARCHAR(255),
          payment_method VARCHAR(50),
          payment_ref VARCHAR(255),
          payment_status VARCHAR(50) DEFAULT 'Pending',
          amount INTEGER DEFAULT 0
        )
      \`);
      const res = await client.query('SELECT * FROM appointments WHERE temple_id = $1 ORDER BY date, time', [templeId]);
      return res.rows.map(r => ({
        id: r.id,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        time: r.time,
        staff: r.staff,
        guestName: r.guest_name,
        service: r.service,
        serviceId: r.service_id,
        status: r.status,
        phone: r.phone,
        paymentMethod: r.payment_method,
        paymentRef: r.payment_ref,
        paymentStatus: r.payment_status,
        amount: r.amount
      }));
    }
  });
}`;

// Replaces
replaceFunction('fetchServiceDefinitions', fetchServiceDefinitionsBody);
replaceFunction('saveServiceDefinition', saveServiceDefinitionBody);
replaceFunction('deleteServiceDefinition', deleteServiceDefinitionBody);
replaceFunction('fetchAvailableSlots', fetchAvailableSlotsBody);
replaceFunction('createSlot', createSlotBody);
replaceFunction('removeSingleSlot', removeSingleSlotBody);
replaceFunction('fetchAppointments', fetchAppointmentsBody);

// We need to fix bookAppointment's insert logic to match the new appointments schema with service_id, payment_method, etc.
// Since bookAppointment is very long, we'll replace the SQL INSERT specifically.
const oldInsertQuery = "INSERT INTO appointments (temple_id, date, time, staff, guest_name, service, status, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id";
const newInsertQuery = "INSERT INTO appointments (temple_id, date, time, staff, guest_name, service, service_id, status, phone, payment_method, payment_ref, payment_status, amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id";
if (content.includes(oldInsertQuery)) {
  content = content.replace(
    /await client\.query\(\s*'INSERT INTO appointments[^;]+;/,
    `await client.query(
        '${newInsertQuery}',
        [templeId, slot.date, slot.time, slot.staff, guestName, slot.description || '日常預約', slot.bound_service_id || null, 'Confirmed', phone, paymentMethod || null, paymentRef || null, paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending', amount || 0]
      );`
  );
  console.log('Replaced bookAppointment INSERT query');
}

fs.writeFileSync(filePath, content, 'utf8');
