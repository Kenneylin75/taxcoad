// @ts-nocheck
"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { withTempleSession, dbQuery } from "../db/db";

// Helper to dynamically get templeId from cookies or fallback

export async function revalidateTemple(templeId?: string) {
  try {
    const tId = templeId || await getDynamicTempleId();
    revalidatePath(`/${tId}`, 'layout');
    revalidatePath('/super-admin', 'layout');
    revalidatePath('/', 'layout');
  } catch(e) {}
}

export async function setGuestTempleContext(templeId: string) {
  try {
    const store = await cookies();
    store.set('templeId', templeId, { secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
  } catch (e: any) {
    // Silent fail if cookies can't be set
  }
}

export async function getDynamicTempleId() {
  try {
    const store = await cookies();
    return store.get('templeId')?.value || 'temple-1';
  } catch (e: any) {
    return 'temple-1';
  }
}

export async function checkTempleSuspension(templeId?: string) {
  const tId = templeId || await getDynamicTempleId();
  const today = new Date().toISOString().split('T')[0];
  const hasOverdue = db_temple_bills.some(
    b => b.templeId === tId && b.status === 'Unpaid' && b.dueDate < today
  );
  return hasOverdue;
}

// -------------------------------------------------------------------------
// 🛡️ 服務管理系統 - 核心資料持久化模擬 (Global Scope Persistence)
// -------------------------------------------------------------------------

const gStore = globalThis as any;

// Helper to initialize global state
const initGlobal = (key: string, defaultValue: any) => {
  if (!gStore[key]) gStore[key] = defaultValue;
  return gStore[key];
};

let db_slots: any[] = initGlobal("db_slots", []);
gStore.db_slots = db_slots;

let db_appointments: any[] = initGlobal("db_appointments", []);
gStore.db_appointments = db_appointments;

const DEFAULT_SERVICES = [
  { id: '1', name: '光明燈祈福', price: 600, duration: '30 min', description: '消災解厄，前途光明', assignedStaff: [1, 2], color: '#f59e0b' },
  { id: '2', name: '文昌開運', price: 800, duration: '45 min', description: '金榜題名，智慧大開', assignedStaff: [3], color: '#3b82f6' },
  { id: '3', name: '太歲安奉', price: 1000, duration: '20 min', description: '歲歲平安，諸事順遂', assignedStaff: [1], color: '#ef4444' },
  { id: '4', name: '問事服務', price: 0, duration: '20 min', description: '指點迷津，解惑人生', assignedStaff: [1, 2], color: '#8b5cf6' },
  { id: '5', name: '例行祈福', price: 0, duration: '30 min', description: '日常平安祈福', assignedStaff: [1], color: '#10b981' },
];

let db_services: any[] = initGlobal('db_services', []);

// Ensure core services are present and have correct colors, but DO NOT wipe other services
DEFAULT_SERVICES.forEach(ds => {
  const existing = db_services.find(s => s.id === ds.id);
  if (!existing) {
    db_services.push(ds);
  } else {
    existing.color = ds.color; // Force update color for demo consistency
  }
});
gStore.db_services = db_services;

let db_print_templates: any[] = initGlobal('db_print_templates', []);
let db_forms: any[] = initGlobal('db_forms', []);

let db_personnel: any[] = initGlobal('db_personnel', [
  { id: '4', name: "測試宮廟管理員", role: "TempleAdmin", account: "admin02", password: "admin02", status: "Active", phone: "0900-000-002", templeId: "temple-2" }
].map(x => x.templeId ? x : ({...x, templeId: 'temple-1'})));

let db_queue_events: any[] = initGlobal("db_queue_events", []);
let db_queue_tickets: any[] = initGlobal("db_queue_tickets", []);

// -------------------------------------------------------------------------
// 🚀 核心 Actions
// -------------------------------------------------------------------------

export type AppRole = 'SuperAdmin' | 'Distributor' | 'DistSales' | 'SuperSales' | 'SuperAgent' | 'TempleAdmin' | 'Staff' | 'Believer' | 'Admin';

export async function getCurrentRole(): Promise<AppRole> {
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  const role = cookieStore.get('admin_role')?.value as AppRole;
  return role || 'TempleAdmin';
}

export async function getCurrentUser() {
  return { 
    id: "admin-1", 
    name: "系統管理員", 
    role: "TempleAdmin", 
    avatar: "https://ui-avatars.com/api/?name=Admin&background=0F172A&color=fff" 
  };
}

export async function logoutAccount() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("admin_role");
    cookieStore.delete("admin_account");
    cookieStore.delete("templeId");
    cookieStore.delete("impersonated_temple");
  } catch (err) {
    console.error("Logout error", err);
  }
  return { success: true };
}

export async function loginAccount(formData: FormData) {
  const account = (formData.get("account") as string || "").trim();
  const password = (formData.get("password") as string || "").trim();

  if (!account || !password) return { success: false, error: "請輸入帳號密碼" };

  let redirectPath = "/admin";
  let success = false;
  let loggedInName = account;
  let assignedRole = "TempleAdmin";
  let loginStatus = "Active";

  await ensurePlatformTables();

  const searchAccount = account.toLowerCase();
  const pData = (gStore.db_personnel || db_personnel);

  if (account === "PIVOTADMIN01" && password === "PIVOTADMIN01") {
    success = true;
    redirectPath = "/super-admin";
    loggedInName = "超級總裁";
    assignedRole = "SuperAdmin";
  } else if (db_admins.some(a => (a.account || "").toLowerCase() === searchAccount && a.password === password)) {
    success = true;
    redirectPath = "/super-admin";
    assignedRole = "SuperAdmin";
  } else {
    // 首先嘗試從 PostgreSQL 獲取經銷商
    let distributor = null;
    try {
      const resDist = await dbQuery("SELECT * FROM distributors WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password], () => null) as any;
      if (resDist && resDist.rowCount > 0) {
        distributor = resDist.rows[0];
      }
    } catch (e) {}
    if (!distributor) distributor = db_distributors.find(d => (d.account || "").toLowerCase() === searchAccount && d.password === password);

    if (distributor) {
      if (distributor.status === "Inactive") { loginStatus = "Inactive"; }
      else {
        success = true;
        redirectPath = `/dist-admin-portal/${distributor.id}`;
        assignedRole = "Distributor";
      }
    } else {
      // 首先嘗試從 PostgreSQL 獲取業務員
      let salesPerson = null;
      try {
        const resSales = await dbQuery("SELECT * FROM dist_sales WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password], () => null) as any;
        if (resSales && resSales.rowCount > 0) {
          salesPerson = resSales.rows[0];
          // 為了兼容前後端屬性命名
          salesPerson.distributorId = salesPerson.distributor_id;
        }
      } catch (e) {}
      if (!salesPerson) salesPerson = db_dist_sales.find(s => (s.account || "").toLowerCase() === searchAccount && s.password === password);

      if (salesPerson) {
        if (salesPerson.status === "Inactive") { loginStatus = "Inactive"; }
        else {
          success = true;
          redirectPath = salesPerson.role === "SuperSales" ? `/super-sales/${salesPerson.id}` : `/dist-sales-portal/${salesPerson.distributorId || 'dist-hq'}/${salesPerson.id}`;
          assignedRole = salesPerson.role === "SuperSales" ? "SuperSales" : "DistSales";
        }
      } else {
        const person = pData.find((p: any) => ((p.account || p.name || "").toLowerCase() === searchAccount) && p.password === password);
        if (person) { 
          const temple = db_temples.find(t => t.id === person.templeId);
          if (temple && temple.status === "Inactive") {
             loginStatus = "Inactive";
          } else {
             success = true; 
             redirectPath = `/${person.templeId}/admin/services`; 
             assignedRole = "TempleAdmin"; 
          }
        }
      }
    }
  }

  if (loginStatus === "Inactive") {
     return { success: false, error: "該帳戶已被停權或關閉，無法登入" };
  }

  if (success) {
    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("admin_role", assignedRole);
    cookieStore.set("admin_account", account);
    if (assignedRole === "TempleAdmin" && redirectPath.split('/')[1]) {
       cookieStore.set("templeId", redirectPath.split('/')[1]);
    }
    
    const logMsg = "使用者 " + loggedInName + " (" + assignedRole + ") 登入成功";
    const newLog = {
      id: "log-" + Date.now(),
      action: "LOGIN",
      details: logMsg,
      timestamp: new Date().toISOString(),
      performedBy: loggedInName
    };
    db_admin_logs.push(newLog);

    withTempleSession("hq", true, async (client) => {
      if (client) {
         try {
           await client.query("CREATE TABLE IF NOT EXISTS admin_logs (id SERIAL PRIMARY KEY, action VARCHAR(100), details TEXT, timestamp VARCHAR(100), performed_by VARCHAR(100))");
           await client.query("INSERT INTO admin_logs (action, details, timestamp, performed_by) VALUES ($1, $2, $3, $4)", ["LOGIN", logMsg, newLog.timestamp, loggedInName]);
         } catch(e) { console.error("Log error", e); }
      }
    });
    
    await logSystemEvent('INFO', '帳號登入', logMsg, loggedInName, redirectPath.split('/')[1] || 'hq');

    return { success: true, redirectPath, role: assignedRole };
  }

  return { success: false, error: "帳號或密碼錯誤" };
}
export async function checkAccountExists(account: string) {
  if (!account) return false;
  const searchAccount = account.toLowerCase();
  const pData = (gStore.db_personnel || db_personnel);
  
  if (account === "PIVOTADMIN01") return true;
  if (db_admins.some(a => (a.account || "").toLowerCase() === searchAccount)) return true;
  if (db_distributors.some(d => (d.account || "").toLowerCase() === searchAccount)) return true;
  if (db_dist_sales.some(s => (s.account || "").toLowerCase() === searchAccount)) return true;
  if (pData.some((p: any) => (p.account || "").toLowerCase() === searchAccount)) return true;
  
  try {
    const resDist = await dbQuery("SELECT id FROM distributors WHERE LOWER(account) = $1", [searchAccount], () => null) as any;
    if (resDist && resDist.rowCount > 0) return true;
    
    const resSales = await dbQuery("SELECT id FROM dist_sales WHERE LOWER(account) = $1", [searchAccount], () => null) as any;
    if (resSales && resSales.rowCount > 0) return true;
  } catch(e) {}
  
  return false;
}

// 1. 抓取排班
export async function fetchAvailableSlots() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [...(gStore.db_slots || db_slots)].filter(x => x.templeId === templeId);
    await client.query(`
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
    `);
    const res = await client.query('SELECT * FROM slots WHERE temple_id = $1 ORDER BY date, time', [templeId]);
    return res.rows.map(r => ({
      id: r.id,
      date: r.date instanceof Date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}` : r.date,
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
}

// 2. 批量建立排班
export async function createSlot(data: any) {
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
}

export async function updateSlot(id: number, data: any) {
  let date = ''; let time = ''; let staff = ''; let description = ''; let location = ''; let bound_service_id = ''; let price = 0;
  if (data instanceof FormData) {
    date = data.get("date") as string;
    time = data.get("time") as string;
    staff = data.get("staff") as string;
    description = data.get("description") as string;
    location = data.get("location") as string;
    bound_service_id = data.get("bound_service_id") as string || data.get("serviceId") as string;
    price = Number(data.get("price")) || 0;
  } else {
    date = data.date; time = data.time; staff = data.staff; description = data.description || ''; location = data.location || ''; bound_service_id = data.bound_service_id || data.serviceId; price = Number(data.price) || 0;
  }

  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const currentSlots = gStore.db_slots || db_slots;
      const idx = currentSlots.findIndex((s: any) => s.id === id);
      if (idx !== -1) {
        currentSlots[idx] = { ...currentSlots[idx], date, time, staff, description, location, bound_service_id, price };
      }
      gStore.db_slots = [...currentSlots];
      db_slots = gStore.db_slots;
    } else {
      await client.query(
        'UPDATE slots SET date = $1, time = $2, staff = $3, description = $4, location = $5, bound_service_id = $6, price = $7 WHERE id = $8 AND temple_id = $9',
        [date, time, staff, description, location, bound_service_id, price, id, templeId]
      );
    }
    await revalidateTemple();
    return { success: true };
  });
}

// 3.5 信眾預約動作

// ==========================================
// 🚀 LINE 推播觸發引擎 (Simulation)
// ==========================================
export async function triggerLinePush(templeId: string, serviceId: string, targetName: string, targetPhone: string, serviceTitle: string) {
  const currentSettings = gStore.db_service_settings || db_service_settings;
  const tSettings = currentSettings.find((s: any) => s.templeId === templeId);
  if (!tSettings || !tSettings.pushConfigs) return;

  const config = tSettings.pushConfigs.find((c: any) => c.serviceId === serviceId);
  if (!config) return;

  // Find 'Immediate' stages that are enabled
  const immediateStages = config.stages.filter((s: any) => s.enabled && s.timeType === 'Immediate');
  
  immediateStages.forEach((stage: any) => {
    const logMsg = `[LINE 推播成功] 已發送【${serviceTitle}】通知至信眾 ${targetName} (${targetPhone}) | 內容: ${stage.content}`;
    const newLog = {
      id: "log-" + Date.now() + Math.random(),
      action: "LINE_PUSH",
      details: logMsg,
      timestamp: new Date().toISOString(),
      performedBy: 'System (Auto)'
    };
    db_audit_logs.push(newLog);
    gStore.db_audit_logs = db_audit_logs;
  });
}

export async function bookAppointment(slotId: number, guestName: string, phone: string, paymentMethod?: string, paymentRef?: string, amount?: number) {
  const templeId = await getDynamicTempleId();
  if (await checkTempleSuspension(templeId)) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
  return withTempleSession(templeId, false, async (client) => {
    let newId = Date.now();
    if (!client) {
      const slotIdx = db_slots.findIndex(s => s.id === slotId);
      if (slotIdx === -1) return { success: false, message: "找不到該時段" };
      
      const slot = db_slots[slotIdx];
      if (slot.status === "Booked") return { success: false, message: "該時段已被預約" };

      db_slots[slotIdx].status = "Booked";
      db_slots[slotIdx].guestName = guestName;

      const svcId = slot.bound_service_id || slot.serviceId;
      const svc = db_services.find((s: any) => s.id === svcId);
      const serviceName = svc ? svc.name : (slot.service || '一般預約');

      const newAppointment = {
        id: newId,
        date: slot.date,
        time: slot.time,
        staff: slot.staff,
        guestName,
        phone,
        service: serviceName,
        serviceId: svcId || null,
        status: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Confirmed' : 'Pending',
        paymentMethod,
        paymentRef,
        paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending',
        amount
      };
      db_appointments.push(newAppointment);

      // Automatically register guest profile if not already in-memory
      const normPhone = normalizePhone(phone);
      const hasGuest = db_guests.some((g: any) => normalizePhone(g.phone) === normPhone);
      if (!hasGuest) {
        db_guests.push({
          phone,
          name: guestName,
          status: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Active' : 'Pending',
    paymentMethod,
    paymentRef,
    paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=B91C1C&color=fff`
        });
        gStore.db_guests = db_guests;
      }
    } else {
      const slotRes = await client.query('SELECT * FROM slots WHERE id = $1', [slotId]);
      if ((slotRes.rowCount ?? 0) === 0) return { success: false, message: "找不到該時段" };
      const slot = slotRes.rows[0];
      if (slot.status === 'Booked') return { success: false, message: "該時段已被預約" };

      await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE id = $3', ['Booked', guestName, slotId]);

      const insRes = await client.query(
        'INSERT INTO appointments (temple_id, date, time, staff, guest_name, service, service_id, status, phone, payment_method, payment_ref, payment_status, amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id',
        [templeId, slot.date, slot.time, slot.staff, guestName, slot.description || '日常預約', slot.bound_service_id || null, 'Confirmed', phone, paymentMethod || null, paymentRef || null, paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending', amount || 0]
      );
      newId = insRes.rows[0].id;

      // Automatically register guest in PostgreSQL if they don't exist yet
      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL,
          PRIMARY KEY (temple_id, phone),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255),
          address TEXT,
          birthday VARCHAR(50),
          lunar_birthday VARCHAR(255),
          birth_hour VARCHAR(50),
          line_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      const normPhone = normalizePhone(phone);
      const guestCheck = await client.query('SELECT 1 FROM guests WHERE REPLACE(phone, \'-\', \'\') = $1', [normPhone]);
      if ((guestCheck.rowCount ?? 0) === 0) {
        await client.query(`
          INSERT INTO guests (temple_id, phone, name, status)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (temple_id, phone) DO NOTHING
        `, [templeId, phone, guestName, 'Active']);
      }
    }

    await revalidateTemple();
    return { success: true, id: newId };
  });
}

export async function cancelAppointment(appId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_appointments.findIndex(a => a.id === appId);
      if (appIdx === -1) return { success: false, message: '找不到該預約' };
      const app = db_appointments[appIdx];
      db_appointments[appIdx].status = 'Cancelled';
      
      const slot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff && s.templeId === templeId);
      if (slot) { slot.status = 'Available'; slot.guestName = ''; }
    } else {
      const appRes = await client.query('SELECT * FROM appointments WHERE id = $1 AND temple_id = $2', [appId, templeId]);
      if (appRes.rowCount === 0) return { success: false, message: '找不到該預約' };
      const app = appRes.rows[0];
      
      await client.query('UPDATE appointments SET status = $1 WHERE id = $2', ['Cancelled', appId]);
      await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE date = $3 AND time = $4 AND staff = $5 AND temple_id = $6 AND status = $7', 
        ['Available', null, app.date, app.time, app.staff, templeId, 'Booked']);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function rescheduleSingleAppointment(appointmentId: number, newSlotId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    let guestName = "";
    let oldTimeStr = "";
    let newTimeStr = "";

    if (!client) {
      const appIdx = db_appointments.findIndex(a => a.id === appointmentId && (!a.templeId || a.templeId === templeId));
      if (appIdx === -1) return { success: false, message: '找不到該預約' };
      const app = db_appointments[appIdx];
      guestName = app.guestName;
      oldTimeStr = `${app.date} ${app.time}`;
      
      const newSlotIdx = db_slots.findIndex(s => String(s.id) === String(newSlotId));
      if (newSlotIdx === -1) return { success: false, message: '找不到新選擇的時段' };
      const newSlot = db_slots[newSlotIdx];
      if (newSlot.status === 'Booked') return { success: false, message: '該新時段已被預約' };
      
      const oldSlot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff && s.templeId === templeId);
      if (oldSlot) {
        oldSlot.status = 'Available';
        oldSlot.guestName = '';
      }
      
      newSlot.status = 'Booked';
      newSlot.guestName = app.guestName;
      
      app.date = newSlot.date;
      app.time = newSlot.time;
      app.staff = newSlot.staff;
      app.serviceId = newSlot.bound_service_id || newSlot.serviceId;
      newTimeStr = `${newSlot.date} ${newSlot.time}`;
      
    } else {
      const appRes = await client.query('SELECT * FROM appointments WHERE id = $1 AND temple_id = $2', [appointmentId, templeId]);
      if (appRes.rowCount === 0) return { success: false, message: '找不到該預約' };
      const app = appRes.rows[0];
      guestName = app.guest_name;
      oldTimeStr = `${app.date} ${app.time}`;
      
      const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 AND temple_id = $2', [newSlotId, templeId]);
      if (slotRes.rowCount === 0) return { success: false, message: '找不到新選擇的時段' };
      const newSlot = slotRes.rows[0];
      if (newSlot.status === 'Booked') return { success: false, message: '該新時段已被預約' };
      
      await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE date = $3 AND time = $4 AND staff = $5 AND temple_id = $6 AND status = $7', 
        ['Available', null, app.date, app.time, app.staff, templeId, 'Booked']);
        
      await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE id = $3', ['Booked', app.guest_name, newSlotId]);
      
      await client.query('UPDATE appointments SET date = $1, time = $2, staff = $3, service_id = $4 WHERE id = $5', 
        [newSlot.date, newSlot.time, newSlot.staff, newSlot.bound_service_id, appointmentId]);
      
      newTimeStr = `${newSlot.date} ${newSlot.time}`;
    }

    const content = `親愛的信眾 ${guestName} 您好，您原本預約的 ${oldTimeStr} 時段，已由宮廟方為您手動改期至 ${newTimeStr}。造成不便敬請見諒，如有疑問請洽宮廟管理員。`;
    await createNotification('【系統通知】您的預約已改期', content, new Date().toISOString());
    await logSystemEvent('INFO', '預約單筆改期', `將預約 ${appointmentId} 改至時段 ${newSlotId}`, '系統管理員', templeId);

    await revalidateTemple();
    return { success: true };
  });
}

export async function cancelServiceRecord(recordId: string, type: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return { success: false, message: "記憶體模式暫不支援取消此服務" };

    try {
      if (type === '點燈') {
        await client.query('UPDATE lamp_records SET status = $1 WHERE id = $2 AND temple_id = $3', ['Cancelled', recordId, templeId]);
      } else if (type === '活動') {
        await client.query('UPDATE event_registrations SET payment_status = $1 WHERE id = $2 AND temple_id = $3', ['Cancelled', recordId, templeId]);
      } else if (type === '排隊') {
        await client.query('UPDATE queue_tickets SET status = $1 WHERE id = $2 AND temple_id = $3', ['Cancelled', recordId, templeId]);
      } else if (type === '預約') {
        await client.query('UPDATE appointments SET status = $1 WHERE id = $2 AND temple_id = $3', ['Cancelled', recordId, templeId]);
        
        // Also free up the slot
        const appRes = await client.query('SELECT * FROM appointments WHERE id = $1', [recordId]);
        if ((appRes.rowCount ?? 0) > 0) {
          const app = appRes.rows[0];
          await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE date = $3 AND time = $4 AND staff = $5 AND temple_id = $6', ['Available', null, app.date, app.time, app.staff, templeId]);
        }
      }
      await revalidateTemple();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  });
}

export async function modifyAppointment(appId: number, newSlotId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_appointments.findIndex(a => a.id === appId);
      if (appIdx === -1) return { success: false, message: '找不到該預約' };
      const app = db_appointments[appIdx];
      
      const newSlotIdx = db_slots.findIndex(s => s.id === newSlotId);
      if (newSlotIdx === -1) return { success: false, message: '找不到新時段' };
      const newSlot = db_slots[newSlotIdx];
      if (newSlot.status === 'Booked') return { success: false, message: '該時段已被預約' };

      const oldSlot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff && s.templeId === templeId);
      if (oldSlot) { oldSlot.status = 'Available'; oldSlot.guestName = ''; }

      newSlot.status = 'Booked';
      newSlot.guestName = app.guestName;
      
      db_appointments[appIdx].date = newSlot.date;
      db_appointments[appIdx].time = newSlot.time;
      db_appointments[appIdx].staff = newSlot.staff;
    } else {
      const appRes = await client.query('SELECT * FROM appointments WHERE id = $1 AND temple_id = $2', [appId, templeId]);
      if (appRes.rowCount === 0) return { success: false, message: '找不到該預約' };
      const app = appRes.rows[0];

      const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 AND temple_id = $2', [newSlotId, templeId]);
      if (slotRes.rowCount === 0) return { success: false, message: '找不到新時段' };
      const newSlot = slotRes.rows[0];
      if (newSlot.status === 'Booked') return { success: false, message: '新時段已被預約' };

      // Free old slot
      await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE date = $3 AND time = $4 AND staff = $5 AND temple_id = $6', 
        ['Available', null, app.date, app.time, app.staff, templeId]);

      // Book new slot
      await client.query('UPDATE slots SET status = $1, guest_name = $2 WHERE id = $3', ['Booked', app.guest_name, newSlotId]);

      // Update appointment
      await client.query('UPDATE appointments SET date = $1, time = $2, staff = $3 WHERE id = $4', [newSlot.date, newSlot.time, newSlot.staff, appId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

// 3.5 標記預約為已到場
export async function markAppointmentAsArrived(appointmentId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_appointments.findIndex((a: any) => a.id.toString() === appointmentId.toString() && (!a.templeId || a.templeId === templeId));
      if (appIdx === -1) return { success: false, message: "找不到該筆預約" };
      db_appointments[appIdx].status = "Arrived";
    } else {
      await client.query('UPDATE appointments SET status = $1 WHERE id = $2 AND temple_id = $3', ['Arrived', appointmentId, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

// 3.6 標記預約為已付款
export async function markAppointmentAsPaid(appointmentId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_appointments.findIndex((a: any) => a.id.toString() === appointmentId.toString() && (!a.templeId || a.templeId === templeId));
      if (appIdx === -1) return { success: false, message: "找不到該筆預約" };
      db_appointments[appIdx].status = "Paid";
    } else {
      await client.query("UPDATE appointments SET status = 'Paid' WHERE id = $1 AND temple_id = $2", [appointmentId, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}


// 4. 抓取預約紀錄
export async function fetchAppointments() {
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
      await client.query(`
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
      `);
      const res = await client.query('SELECT * FROM appointments WHERE temple_id = $1 ORDER BY date, time', [templeId]);
      return res.rows.map(r => ({
        id: r.id,
        date: r.date instanceof Date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}` : r.date,
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
}

// 5. 抓取與儲存服務項目
export async function fetchServiceDefinitions() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const currentServices = gStore.db_services || db_services;
      return currentServices.filter((x: any) => x.templeId === templeId);
    } else {
      await client.query(`
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
      `);
      await client.query('ALTER TABLE services ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0');
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
        return retryRes.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price !== undefined && r.price !== null ? Number(r.price) : 0, duration: r.duration, description: r.description, color: r.color, status: r.status, assignedStaff: r.assigned_staff || [] }));
      }
      return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price !== undefined && r.price !== null ? Number(r.price) : 0, duration: r.duration, description: r.description, color: r.color, status: r.status, assignedStaff: r.assigned_staff || [] }));
    }
  });
}

export async function saveServiceDefinition(data: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const id = data.id || `s-${Date.now()}`;
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
    await logSystemEvent('SUCCESS', '設定服務項目', `服務名稱：${data.name}`, '管理員', templeId);
    return { success: true };
  });
}

export async function deleteServiceDefinition(id: string) {
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
}

// 6. 抓取與儲存表單
export async function fetchPrintTemplates() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const current = gStore.db_print_templates || db_print_templates;
      const mine = current.filter((t: any) => t.templeId === templeId);
      return mine;
    }
    // DB impl omitted for now
    return [];
  });
}

export async function savePrintTemplate(template: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      template.templeId = templeId;
      const idx = db_print_templates.findIndex(t => t.id === template.id);
      if (idx !== -1) db_print_templates[idx] = template;
      else db_print_templates.push(template);
      return { success: true };
    }
    return { success: true };
  });
}

export async function deletePrintTemplate(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = db_print_templates.findIndex(t => t.id === id && t.templeId === templeId);
      if (idx !== -1) db_print_templates.splice(idx, 1);
      return { success: true };
    }
    return { success: true };
  });
}

export async function fetchForms() {
  const templeId = await getDynamicTempleId();
  const current = gStore.db_forms || db_forms;
  const mine = current.filter((f: any) => f.templeId === templeId);
  return mine;
}

export async function saveForm(data: any) {
  const templeId = await getDynamicTempleId();
  const id = data.id;
  const current = gStore.db_forms || db_forms;
  const exists = current.some((f: any) => f.id === id);
  if (exists) {
    gStore.db_forms = current.map((f: any) => f.id === id ? { ...f, ...data } : f);
  } else {
    gStore.db_forms = [...current, { id: id || Date.now().toString(), templeId, ...data }];
  }
  db_forms = gStore.db_forms;
  await revalidateTemple();
    return { success: true };
}

// 7. 抓取與管理人員 (修復 Build Error 關鍵)
export async function fetchPersonnel() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const myPersonnel = (gStore.db_personnel || db_personnel).filter((p: any) => p.templeId === templeId);
      if (myPersonnel.length === 0 && templeId) {
        // Seed default personnel for this new temple to ensure services have assigned staff
        const defaults = (gStore.db_personnel || db_personnel).filter((p: any) => p.templeId === 'temple-1').map((p: any) => ({
          ...p,
          templeId
        }));
        gStore.db_personnel = [...(gStore.db_personnel || db_personnel), ...defaults];
        db_personnel = gStore.db_personnel;
        return defaults;
      }
      return myPersonnel;
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS personnel (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL,
          account VARCHAR(255) NOT NULL,
          phone VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'Active',
          avatar VARCHAR(255),
          permissions TEXT[],
          PRIMARY KEY (id, temple_id)
        )
      `);
      const res = await client.query('SELECT * FROM personnel WHERE temple_id = $1', [templeId]);
      if ((res.rowCount ?? 0) === 0) {
        for (const p of db_personnel) {
          await client.query(`
            INSERT INTO personnel (id, temple_id, name, role, account, phone, password, status, avatar, permissions)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [p.id.toString(), templeId, p.name, p.role, p.account || p.name, p.phone || '0912-345-678', 'admin123', p.status || 'Active', p.avatar, p.permissions || []]);
        }
        const resRetry = await client.query('SELECT * FROM personnel WHERE temple_id = $1', [templeId]);
        return resRetry.rows.map(r => ({
          id: r.id,
          name: r.name,
          role: r.role,
          account: r.account,
          phone: r.phone,
          status: r.status,
          avatar: r.avatar,
          permissions: r.permissions || [],
          serviceCount: 0
        }));
      }
      return res.rows.map(r => ({
        id: r.id,
        name: r.name,
        role: r.role,
        account: r.account,
        phone: r.phone,
        status: r.status,
        avatar: r.avatar,
        permissions: r.permissions || [],
        serviceCount: 0
      }));
    }
  });
}

export async function fetchStaff() {
  const all = await fetchPersonnel();
  return all;
}

// 8. 刪除單個時段
export async function removeSingleSlot(id: any) {
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
}

// 8.1 批次刪除多個時段
export async function removeBatchSlots(ids: any[]) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      let currentSlots = gStore.db_slots || db_slots;
      const filtered = currentSlots.filter((s: any) => !ids.includes(s.id) && !ids.includes(String(s.id)));
      gStore.db_slots = [...filtered];
      db_slots = gStore.db_slots;
    } else {
      for (const id of ids) {
        await client.query('DELETE FROM slots WHERE id = $1 AND temple_id = $2', [id, templeId]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}

// 9. 智能分析受影響預約
export async function analyzeAffectedAppointments(staff: string, start: string, end: string) {
  return db_appointments.filter((app: any) => 
    app.staff === staff && 
    app.date >= start && 
    app.date <= end
  );
}

// 10. 執行緊急調度

// ==========================================
// 金流收款設定 (Payment Configurations)
// ==========================================
let db_temple_payment_configs: any[] = initGlobal("db_temple_payment_configs", []);

export interface TemplePaymentConfig {
  templeId: string;
  linePay: { enabled: boolean; channelId: string; channelSecret: string; allowBooking?: boolean; allowLamp?: boolean; allowEvent?: boolean; allowQueue?: boolean; };
  thirdParty: { enabled: boolean; provider: string; merchantId: string; hashKey: string; hashIV: string; allowBooking?: boolean; allowLamp?: boolean; allowEvent?: boolean; allowQueue?: boolean; };
  customTransfer: { enabled: boolean; bankCode: string; bankName: string; accountName: string; accountNo: string; allowBooking?: boolean; allowLamp?: boolean; allowEvent?: boolean; allowQueue?: boolean; };
  customQR: { enabled: boolean; qrImageUrl: string; description: string; allowBooking?: boolean; allowLamp?: boolean; allowEvent?: boolean; allowQueue?: boolean; };
  cash?: { 
    enabled: boolean; 
    description: string; 
    allowBooking?: boolean;
    allowLamp?: boolean;
    allowEvent?: boolean;
    allowQueue?: boolean;
  };
}

export async function fetchPaymentConfig() {
  const templeId = await getDynamicTempleId();
  const config = db_temple_payment_configs.find(c => c.templeId === templeId);
  if (config) {
    if (!config.cash) {
      config.cash = { enabled: true, description: '現場現金付款', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true };
    }
    ['linePay', 'thirdParty', 'customTransfer', 'customQR'].forEach(key => {
      if (config[key] && config[key].allowBooking === undefined) {
        config[key].allowBooking = true;
        config[key].allowLamp = true;
        config[key].allowEvent = true;
        config[key].allowQueue = true;
      }
    });
    return config;
  }

  // 強制預設僅開啟現場現金付款
  return {
    templeId: templeId,
    cash: { enabled: true, description: '現場現金付款', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
    linePay: { enabled: false },
    thirdParty: { enabled: false },
    customTransfer: { enabled: false },
    customQR: { enabled: false }
  } as TemplePaymentConfig;
}

export async function savePaymentConfig(data: TemplePaymentConfig) {
  const templeId = await getDynamicTempleId();
  const idx = db_temple_payment_configs.findIndex(c => c.templeId === templeId);
  if (idx > -1) {
    db_temple_payment_configs[idx] = { ...data, templeId };
  } else {
    db_temple_payment_configs.push({ ...data, templeId });
  }
  await revalidateTemple();
    return { success: true };
}

export async function executeEmergencyReschedule(formData: FormData) {
  await revalidateTemple();
    return { success: true };
}

// --- 其餘輔助函式 ---
export async function fetchLampRecords() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [...db_lamp_records].filter(r => !r.templeId || r.templeId === templeId).reverse();
    await client.query(`CREATE TABLE IF NOT EXISTS lamp_records (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), guest_name VARCHAR(255), phone VARCHAR(50), lamp_type VARCHAR(255), amount INTEGER, status VARCHAR(50), created_at VARCHAR(50), payment_method VARCHAR(50), payment_ref VARCHAR(255), payment_status VARCHAR(50))`);
    const res = await client.query('SELECT * FROM lamp_records WHERE temple_id = $1 ORDER BY created_at DESC', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, guestName: r.guest_name, phone: r.phone, lampType: r.lamp_type, amount: r.amount, status: r.status, createdAt: r.created_at, paymentMethod: r.payment_method, paymentRef: r.payment_ref, paymentStatus: r.payment_status }));
  });
}
let db_lamp_categories: any[] = initGlobal('db_lamp_categories', []);
export async function fetchLampCategories() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return (gStore.db_lamp_categories || db_lamp_categories).filter((x: any) => !x.templeId || x.templeId === templeId);
    await client.query(`CREATE TABLE IF NOT EXISTS lamp_categories (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), name VARCHAR(255), price INTEGER, description TEXT, color VARCHAR(50), is_active BOOLEAN DEFAULT true, type VARCHAR(50))`);
    const res = await client.query('SELECT * FROM lamp_categories WHERE temple_id = $1', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price, description: r.description, color: r.color, isActive: r.is_active, type: r.type }));
  });
}
let db_lamp_records: any[] = initGlobal("db_lamp_records", []);
export async function createLightingOrder(fd: FormData) { 
  return createLampRecord(fd);
}
export async function getGuestUser() {
  const store = await cookies();
  const templeId = await getDynamicTempleId();
  const phone = store.get(`guestPhone_${templeId}`)?.value;
  if (!phone) return null;
  
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return (gStore.db_guests || db_guests).find((g: any) => g.phone === phone && g.templeId === templeId) || null;
    }
    const res = await client.query('SELECT * FROM guests WHERE phone = $1 AND temple_id = $2', [phone, templeId]);
    if ((res.rowCount ?? 0) > 0) {
      const r = res.rows[0];
      return {
        templeId: r.temple_id,
        phone: r.phone,
        name: r.name,
        email: r.email,
        password: r.password,
        address: r.address,
        birthday: r.birthday,
        lunarBirthday: r.lunar_birthday,
        birthHour: r.birth_hour,
        lineId: r.line_id,
        status: r.status
      };
    }
    return null;
  });
}

export async function guestLogin(phone: string, inputName?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const normLogin = normalizePhone(phone);
    let existing: any = null;

    if (!client) {
      existing = (gStore.db_guests || db_guests).find((g: any) => normalizePhone(g.phone) === normLogin && g.templeId === templeId);
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL,
          PRIMARY KEY (temple_id, phone),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255),
          address TEXT,
          birthday VARCHAR(50),
          lunar_birthday VARCHAR(255),
          birth_hour VARCHAR(50),
          line_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const res = await client.query('SELECT * FROM guests WHERE REPLACE(phone, \'-\', \'\') = $1 AND temple_id = $2', [normLogin, templeId]);
      if ((res.rowCount ?? 0) > 0) {
        const r = res.rows[0];
        existing = {
          templeId: r.temple_id,
          phone: r.phone,
          name: r.name,
          email: r.email,
          password: r.password,
          address: r.address,
          birthday: r.birthday,
          lunarBirthday: r.lunar_birthday,
          birthHour: r.birth_hour,
          lineId: r.line_id,
          status: r.status
        };
      }
    }

    if (!existing && !inputName) {
      return { success: false, error: "首次登入請務必填寫您的真實姓名" };
    }

    const guestName = existing ? existing.name : inputName;
    const fullGuest = existing || {
      templeId,
      phone,
      name: guestName,
      status: 'Active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=B91C1C&color=fff`
    };

    if (!existing) {
      if (!client) {
        const currentGuests = gStore.db_guests || db_guests;
        gStore.db_guests = [...currentGuests, fullGuest];
        db_guests = gStore.db_guests;
      } else {
        await client.query(`
          INSERT INTO guests (temple_id, phone, name, status)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (temple_id, phone) DO NOTHING
        `, [templeId, phone, guestName, 'Active']);
      }
    }

    const store = await cookies();
    store.set(`guestPhone_${templeId}`, phone, { secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
    
    await revalidateTemple();
    return { success: true, guestName: fullGuest.name, fullGuest };
  });
}

export async function guestLogout() {
  const store = await cookies();
  const templeId = await getDynamicTempleId();
  store.delete(`guestPhone_${templeId}`);
  return { success: true };
}

export async function fetchGuestSettings() { return {}; }
export async function askAgiAssistant(q: string, h: number) {
  const store = await cookies();
  const templeId = await getDynamicTempleId();
  const phone = store.get(`guestPhone_${templeId}`)?.value || 'unknown';

  // 簡單的 AI 回應邏輯 (此處可未來串接真實 LLM API)
  let reply = "好的，我已經收到您的訊息。如果有更詳細的問題，歡迎隨時告訴我！";
  if (q.includes('預約') || q.includes('掛號')) reply = "您想了解預約相關的服務嗎？您可以點擊下方的「立刻線上預約」來查看目前可用的時段喔！";
  if (q.includes('點燈')) reply = "我們提供多種點燈服務（如太歲燈、光明燈），歡迎前往「線上點燈」了解詳情與價格！";

  return withTempleSession(templeId, false, async (client) => {
    if (client) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_chat_logs (
          id SERIAL PRIMARY KEY,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL,
          user_query TEXT NOT NULL,
          ai_reply TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await client.query(
        'INSERT INTO ai_chat_logs (temple_id, phone, user_query, ai_reply) VALUES ($1, $2, $3, $4)',
        [templeId, phone, q, reply]
      );
    }
    return { reply, suggestedAction: "none" };
  });
}

export async function fetchAiChatLogs() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [];
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_logs (
        id SERIAL PRIMARY KEY,
        temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
        phone VARCHAR(50) NOT NULL,
        user_query TEXT NOT NULL,
        ai_reply TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const res = await client.query('SELECT * FROM ai_chat_logs WHERE temple_id = $1 ORDER BY created_at DESC LIMIT 100', [templeId]);
    return res.rows.map(r => ({
      id: r.id,
      phone: r.phone,
      userQuery: r.user_query,
      aiReply: r.ai_reply,
      createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
    }));
  });
}

const normCompare = (p1: string, p2: string) => {
  if (!p1 || !p2) return false;
  return normalizePhone(p1) === normalizePhone(p2);
};

export async function fetchGuestAppointments(p: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_appointments.filter((a: any) => normCompare(a.phone, p) && (!a.templeId || a.templeId === templeId));
    }
    const normPhone = normalizePhone(p);
    const res = await client.query(`
      SELECT id, temple_id as "templeId", date, time, staff, guest_name as "guestName", service, service_id as "serviceId", status, phone, payment_method as "paymentMethod", payment_ref as "paymentRef", payment_status as "paymentStatus", amount
      FROM appointments 
      WHERE REPLACE(phone, '-', '') = $1 AND temple_id = $2
      ORDER BY date DESC, time DESC
    `, [normPhone, templeId]);
    return res.rows;
  });
}
let db_service_settings_mock: any[] = initGlobal('db_service_settings_mock', []);
export async function fetchServiceSettings() { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const s = db_service_settings_mock.find(x => x.templeId === templeId);
      return s || { 
        cancelHoursBefore: 24, 
        modifyHoursBefore: 24, 
        allowCancel: true, 
        allowModify: true, 
        pushConfigs: [],
        modules: { calendar: true, lamps: true, queue: true, events: true, analytics: true, agi: true }
      };
    }
    await client.query(`
      CREATE TABLE IF NOT EXISTS temple_settings (
        temple_id VARCHAR(50) PRIMARY KEY REFERENCES temples(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    const res = await client.query('SELECT settings FROM temple_settings WHERE temple_id = $1', [templeId]);
    if (res.rowCount > 0) {
      const s = res.rows[0].settings;
      return {
        ...s,
        cancelHoursBefore: s.cancelHoursBefore ?? 24,
        modifyHoursBefore: s.modifyHoursBefore ?? 24,
        allowCancel: s.allowCancel ?? true,
        allowModify: s.allowModify ?? true,
        pushConfigs: s.pushConfigs || []
      };
    }
    return { cancelHoursBefore: 24, modifyHoursBefore: 24, allowCancel: true, allowModify: true, pushConfigs: [], modules: { calendar: true, lamps: true, queue: true, events: true, analytics: true, agi: true } };
  });
}

let db_guest_files: any[] = initGlobal("db_guest_files", []);
export async function fetchGuestFiles(phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_guest_files.filter(f => normCompare(f.phone, phone));
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guest_files (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL ,
          url TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          folder VARCHAR(50) NOT NULL,
          uploaded_by VARCHAR(50) NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id, temple_id)
        )
      `);
      
      const normPhone = normalizePhone(phone);
      const guestRes = await client.query("SELECT phone FROM guests WHERE REPLACE(phone, '-', '') = $1", [normPhone]);
      const dbPhone = guestRes.rows[0]?.phone || phone;
      
      const res = await client.query('SELECT * FROM guest_files WHERE temple_id = $1 AND phone = $2 ORDER BY uploaded_at DESC', [templeId, dbPhone]);
      return res.rows.map(r => ({
        id: r.id,
        phone: r.phone,
        url: r.url,
        type: r.type,
        name: r.name,
        folder: r.folder,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.uploaded_at instanceof Date ? r.uploaded_at.toISOString().replace('T', ' ').slice(0, 19) : r.uploaded_at
      }));
    }
  });
}

let db_event_registrations: any[] = initGlobal("db_event_registrations", []);

export async function fetchEventRegistrationsByEventId(eventId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return db_event_registrations.filter(r => r.eventId === eventId && (!r.templeId || r.templeId === templeId));
    await client.query(`CREATE TABLE IF NOT EXISTS event_registrations (id VARCHAR(50) PRIMARY KEY, event_id VARCHAR(50), temple_id VARCHAR(50), title VARCHAR(255), phone VARCHAR(50), guest_name VARCHAR(255), price INTEGER, payment_status VARCHAR(50), actual_price INTEGER, timestamp VARCHAR(50))`);
    const res = await client.query('SELECT * FROM event_registrations WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
    return res.rows.map(r => ({ id: r.id, eventId: r.event_id, templeId: r.temple_id, title: r.title, phone: r.phone, guestName: r.guest_name, price: r.price, paymentStatus: r.payment_status, actualPrice: r.actual_price, timestamp: r.timestamp }));
  });
}
export async function markRegistrationAsPaid(registrationId: string, actualPrice: number) {
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
}
let db_activities: any[] = initGlobal('db_activities', []);
let db_deep_records: any[] = initGlobal('db_deep_records', []);

// (Removed duplicate createOrUpdateGuest)
export async function verifyQueueTicket(eventId: any, phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const t = db_queue_tickets.find(t => t.eventId === eventId && normCompare(t.phone, phone) && (!t.templeId || t.templeId === templeId));
      if (!t) return { success: false, error: 'No ticket found' };
      if (t.status === 'Pending') { t.status = 'Queuing'; t.scannedAt = new Date().toLocaleTimeString(); t.actualOrder = db_queue_tickets.filter((x: any) => x.eventId === eventId && x.status !== 'Pending').length + 1; }
    } else {
      const tRes = await client.query('SELECT id, status FROM queue_tickets WHERE event_id = $1 AND REPLACE(phone, \'-\', \'\') = $2 AND temple_id = $3', [eventId, phone.replace(/-/g, ''), templeId]);
      if (tRes.rowCount === 0) return { success: false, error: 'No ticket found' };
      const t = tRes.rows[0];
      if (t.status === 'Pending') {
        const orderRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND status != \'Pending\' AND temple_id = $2', [eventId, templeId]);
        const actualOrder = parseInt(orderRes.rows[0].count) + 1;
        await client.query('UPDATE queue_tickets SET status = $1, scanned_at = $2, actual_order = $3 WHERE id = $4', ['Queuing', new Date().toLocaleTimeString(), actualOrder, t.id]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function registerForEvent(id: any, phone: string, n: string, pr: number, paymentMethod?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (await checkTempleSuspension()) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
    
    const pStatus = paymentMethod === 'Cash' || !paymentMethod ? (pr > 0 ? 'Pending' : 'Unpaid') : 'Paid';

    if (!client) {
      const ev = db_events.find(e => e.id === id && (!e.templeId || e.templeId === templeId));
      if (!ev) return { success: false };
      ev.enrolled += 1;
      db_event_registrations.push({ id: `REG-${Date.now()}`, eventId: id, templeId, title: ev.title, phone, guestName: n, price: pr, paymentStatus: pStatus, actualPrice: pr > 0 ? pr : 0, timestamp: new Date().toISOString().replace('T', ' ').split('.')[0] });
    } else {
      const evRes = await client.query('SELECT title, enrolled, capacity FROM events WHERE id = $1 AND temple_id = $2', [id, templeId]);
      if (evRes.rowCount === 0) return { success: false };
      const ev = evRes.rows[0];
      if (ev.capacity > 0 && ev.enrolled >= ev.capacity) return { success: false, message: '名額已滿' };
      
      await client.query('UPDATE events SET enrolled = enrolled + 1 WHERE id = $1 AND temple_id = $2', [id, templeId]);
      await client.query('INSERT INTO event_registrations (id, event_id, temple_id, title, phone, guest_name, price, payment_status, actual_price, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [`REG-${Date.now()}`, id, templeId, ev.title, phone, n, pr, pStatus, pr > 0 ? pr : 0, new Date().toISOString().replace('T', ' ').split('.')[0]]
      );
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function fetchGuestRegistrations(p: any) {
  const templeId = await getDynamicTempleId();
  const normPhone = (p || '').replace(/[- ]/g, '');
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_event_registrations.filter(r => normCompare(r.phone, p) && (!r.templeId || r.templeId === templeId));
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS event_registrations (
          id VARCHAR(50) PRIMARY KEY,
          event_id VARCHAR(50),
          temple_id VARCHAR(50),
          title VARCHAR(255),
          phone VARCHAR(50),
          guest_name VARCHAR(255),
          price INTEGER,
          payment_status VARCHAR(50),
          actual_price INTEGER,
          timestamp VARCHAR(50)
        )
      `);
      const res = await client.query(`
        SELECT * FROM event_registrations 
        WHERE REPLACE(REPLACE(phone, '-', ''), ' ', '') = REPLACE(REPLACE($1, '-', ''), ' ', '')
        AND temple_id = $2
        ORDER BY timestamp DESC
      `, [normPhone, templeId]);
      
      return res.rows.map(r => ({
        id: r.id, eventId: r.event_id, templeId: r.temple_id, title: r.title, phone: r.phone,
        guestName: r.guest_name, price: r.price, paymentStatus: r.payment_status,
        actualPrice: r.actual_price, timestamp: r.timestamp
      }));
    }
  });
}
export async function fetchGuestQueueTickets(p: any) {
  const templeId = await getDynamicTempleId();
  const normPhone = (p || '').replace(/[- ]/g, '');
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_queue_tickets.filter((t: any) => normCompare(t.phone, p) && (!t.templeId || t.templeId === templeId));
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS queue_tickets (
          id VARCHAR(50) PRIMARY KEY,
          event_id VARCHAR(50),
          temple_id VARCHAR(50),
          event_title VARCHAR(255),
          phone VARCHAR(50),
          guest_name VARCHAR(255),
          status VARCHAR(50),
          assigned_number VARCHAR(50),
          payment_status VARCHAR(50),
          created_at VARCHAR(50)
        )
      `);
      const res = await client.query(`
        SELECT * FROM queue_tickets 
        WHERE REPLACE(REPLACE(phone, '-', ''), ' ', '') = REPLACE(REPLACE($1, '-', ''), ' ', '')
        AND temple_id = $2
        ORDER BY created_at DESC
      `, [normPhone, templeId]);
      
      return res.rows.map(r => ({
        id: r.id, eventId: r.event_id, templeId: r.temple_id, eventTitle: r.event_title,
        phone: r.phone, guestName: r.guest_name, status: r.status, assignedNumber: r.assigned_number,
        paymentStatus: r.payment_status, createdAt: r.created_at
      }));
    }
  });
}
export async function fetchGuestLampRecords(p: any) {
  const templeId = await getDynamicTempleId();
  const normPhone = (p || '').replace(/[- ]/g, '');
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_lamp_records.filter(l => normCompare(l.phone, p) && (!l.templeId || l.templeId === templeId));
    } else {
      await client.query(`CREATE TABLE IF NOT EXISTS lamp_records (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), guest_name VARCHAR(255), phone VARCHAR(50), lamp_type VARCHAR(255), amount INTEGER, status VARCHAR(50), created_at VARCHAR(50), payment_method VARCHAR(50), payment_ref VARCHAR(255), payment_status VARCHAR(50))`);
      const res = await client.query(`
        SELECT * FROM lamp_records 
        WHERE REPLACE(REPLACE(phone, '-', ''), ' ', '') = REPLACE(REPLACE($1, '-', ''), ' ', '')
        AND temple_id = $2
        ORDER BY created_at DESC
      `, [normPhone, templeId]);
      
      return res.rows.map(r => {
        const start = new Date(r.created_at);
        const exp = new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000));
        return {
          id: r.id, templeId: r.temple_id, guestName: r.guest_name, phone: r.phone,
          categoryName: r.lamp_type, price: r.amount, status: r.status,
          startDate: start.toISOString().split('T')[0], expiryDate: exp.toISOString().split('T')[0],
          paymentMethod: r.payment_method, paymentRef: r.payment_ref, paymentStatus: r.payment_status, createdAt: r.created_at
        };
      });
    }
  });
}

export async function joinQueue(eventId: any, phone: string, guestName: string, paymentMethod?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const pStatus = paymentMethod === 'Cash' || !paymentMethod ? 'Pending' : 'Paid';
    if (!client) {
      const ev = db_queue_events.find((e: any) => e.id === eventId && (!e.templeId || e.templeId === templeId));
      if (!ev) return { success: false };
      const assignedNumber = `A${(db_queue_tickets.filter((t: any) => t.eventId === eventId).length + 1).toString().padStart(3, '0')}`;
      const tix = { id: `TIX-${Date.now()}`, eventId, templeId, eventTitle: ev.title, phone, guestName, status: 'Pending', assignedNumber, paymentStatus: pStatus, createdAt: new Date().toISOString().replace('T', ' ').split('.')[0] };
      db_queue_tickets.push(tix);
      return { success: true, ticket: tix };
    } else {
      const evRes = await client.query('SELECT title FROM queue_events WHERE id = $1 AND temple_id = $2', [eventId, templeId]);
      if (evRes.rowCount === 0) return { success: false };
      const countRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
      const assignedNumber = `A${(parseInt(countRes.rows[0].count) + 1).toString().padStart(3, '0')}`;
      const newId = `TIX-${Date.now()}`;
      const nowStr = new Date().toISOString().replace('T', ' ').split('.')[0];
      
      await client.query(`ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Pending'`);
      
      await client.query('INSERT INTO queue_tickets (id, event_id, temple_id, event_title, phone, guest_name, status, assigned_number, payment_status, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [newId, eventId, templeId, evRes.rows[0].title, phone, guestName, 'Pending', assignedNumber, pStatus, nowStr]);
      return { success: true, ticket: { id: newId, eventId, templeId, eventTitle: evRes.rows[0].title, phone, guestName, status: 'Pending', assignedNumber, paymentStatus: pStatus, createdAt: nowStr } };
    }
  });
}
export type EventItem = { id: string; title: string; date: string; location: string; price: number; status: 'Active' | 'Draft' | 'Completed'; capacity: number; enrolled: number; imageUrl?: string; description?: string; precautions?: string };
let db_events: any[] = initGlobal("db_events", []);

export async function fetchEvents() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [...db_events].filter(x => x.templeId === templeId);
    await client.query(`CREATE TABLE IF NOT EXISTS events (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), title VARCHAR(255), date VARCHAR(50), location VARCHAR(255), price INTEGER, status VARCHAR(50), capacity INTEGER, enrolled INTEGER DEFAULT 0, image_url TEXT)`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS precautions TEXT`);
    const res = await client.query('SELECT * FROM events WHERE temple_id = $1', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, title: r.title, date: r.date, location: r.location, price: r.price, status: r.status, capacity: r.capacity, enrolled: r.enrolled, imageUrl: r.image_url, description: r.description, precautions: r.precautions }));
  });
}
export async function saveEvent(fd: FormData) { 
  const id = fd.get('id') as string;
  const title = fd.get('title') as string;
  const date = fd.get('date') as string;
  const location = fd.get('location') as string;
  const price = Number(fd.get('price')) || 0;
  const capacity = Number(fd.get('capacity')) || 0;
  const status = (fd.get('status') as any) || 'Draft';
  const description = fd.get('description') as string || '';
  const precautions = fd.get('precautions') as string || '';
  let imageUrl = fd.get('imageUrl') as string;
  const imageFile = fd.get('imageFile') as File | null;
  
  if (imageFile && imageFile.size > 0) {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    
    const ext = imageFile.name.split('.').pop() || 'jpg';
    const filename = `evt-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    const arrayBuffer = await imageFile.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
    imageUrl = `/uploads/${filename}`;
  }
  
  const templeId = await getDynamicTempleId();

  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      if (id) {
        const idx = db_events.findIndex(e => e.id === id && (!e.templeId || e.templeId === templeId));
        if (idx > -1) {
          db_events[idx] = { ...db_events[idx], title, date, location, price, capacity, status, templeId, imageUrl, description, precautions };
        }
      } else {
        db_events.push({ id: `ev-${Date.now()}`, title, date, location, price, capacity, status, enrolled: 0, templeId, imageUrl, description, precautions });
      }
    } else {
      if (id) {
        await client.query('UPDATE events SET title = $1, date = $2, location = $3, price = $4, capacity = $5, status = $6, image_url = $7, description = $8, precautions = $9 WHERE id = $10 AND temple_id = $11', [title, date, location, price, capacity, status, imageUrl, description, precautions, id, templeId]);
      } else {
        await client.query('INSERT INTO events (id, temple_id, title, date, location, price, capacity, status, enrolled, image_url, description, precautions) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11)', [`ev-${Date.now()}`, templeId, title, date, location, price, capacity, status, imageUrl, description, precautions]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function deleteEvent(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const hasRegistrations = db_event_registrations.some(r => r.eventId === id && (!r.templeId || r.templeId === templeId));
      if (hasRegistrations) return { success: false, error: '該活動已有信眾報名，請先移除相關報名紀錄後再進行刪除。' }; 
      db_events = gStore.db_events = db_events.filter(e => !(e.id === id && (!e.templeId || e.templeId === templeId)));
    } else {
      const regCheck = await client.query('SELECT 1 FROM event_registrations WHERE event_id = $1 AND temple_id = $2 LIMIT 1', [id, templeId]);
      if (regCheck.rowCount && regCheck.rowCount > 0) return { success: false, error: '該活動已有信眾報名，請先移除相關報名紀錄後再進行刪除。' };
      await client.query('DELETE FROM events WHERE id = $1 AND temple_id = $2', [id, templeId]);
    }
    await revalidateTemple();
    return { success: true }; 
  });
}

// --- B2B SaaS 平台層資料表初始化 ---
export async function ensurePlatformTables() {
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS distributor_applications (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contact_name VARCHAR(255),
      phone VARCHAR(50),
      email VARCHAR(255),
      tax_id VARCHAR(50),
      address TEXT,
      plan_id VARCHAR(50),
      price INTEGER,
      nodes INTEGER,
      submitted_by VARCHAR(50),
      status VARCHAR(50),
      created_at VARCHAR(50),
      account VARCHAR(255),
      password VARCHAR(255),
      expiration_date VARCHAR(50)
    );
  `);
  await dbQuery(`
    CREATE TABLE IF NOT EXISTS distributors (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      account VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      plan_id VARCHAR(50),
      plan_name VARCHAR(255),
      price INTEGER,
      status VARCHAR(50),
      quota INTEGER,
      joined_at VARCHAR(50),
      expiration_date VARCHAR(50)
    );
  `);
  try {
    await dbQuery(`ALTER TABLE distributors ADD COLUMN IF NOT EXISTS creator_sales_id VARCHAR(50);`);
  } catch(e) {}

  await dbQuery(`
    CREATE TABLE IF NOT EXISTS dist_sales (
      id VARCHAR(50) PRIMARY KEY,
      distributor_id VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      account VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      status VARCHAR(50),
      joined_at VARCHAR(50),
      performance INTEGER DEFAULT 0
    );
  `);
}

// --- B2B SaaS 多租戶與經銷架構全域變數 ---
let db_distributors: any[] = initGlobal('db_distributors', []);
let db_dist_sales: any[] = initGlobal('db_dist_sales', []);
let db_temples: any[] = initGlobal('db_temples', [
  {  id: 'temple-2', templeName: '第二測試宮廟', account: 'admin02', city: '台中市', address: '測試路2號', templePhone: '04-1234-5678', status: 'Active', timestamp: new Date().toISOString() , templeNo: 2 }
]);
let db_sales_visits: any[] = initGlobal("db_sales_visits", []);
let db_audit_logs: any[] = initGlobal("db_audit_logs", []);
let db_tools: any[] = initGlobal('db_tools', []);
let db_commissions: any[] = initGlobal('db_commissions', []);

let db_config = initGlobal('db_config', {
  fixedMonthlyRent: 3600,
  yearlyDiscountRate: 20,
  defaultSuperSalesRates: {
    distributorAuthRate: 15,
    templeSetupRate: 10,
    templeSetupType: 'percent',
    templeRentRates: [15, 12, 10]
  },
  distributorPlans: [
    { id: 'PLAN-A', name: '標準經銷方案', price: 1600000, durationYears: 2, nodes: 100, color: 'indigo' },
    { id: 'PLAN-B', name: '菁英經銷方案', price: 3200000, durationYears: 4, nodes: 250, color: 'emerald' },
    { id: 'PLAN-C', name: '企業戰略方案', price: 8000000, durationYears: 10, nodes: 1000, color: 'slate' }
  ],
  b2bPayment: {
    thirdParty: { enabled: true, merchantId: 'HQ_MERCHANT_999', hashKey: 'HQ_HASH_KEY', hashIV: 'HQ_HASH_IV' },
    linePay: { enabled: false, channelId: '', channelSecret: '' },
    customTransfer: { enabled: true, bankCode: '808', accountName: '天首科技有限公司', accountNo: '808-1234-5678-901' },
    serviceMapping: {
      'new-temple': ['customTransfer'],
      'monthly-rent': ['thirdParty', 'customTransfer'],
      'distributor-auth': ['customTransfer']
    }
  },
  aiEndpoints: {
    ocrApiUrl: '',
    ocrApiKey: '',
    chatApiUrl: '',
    chatApiKey: ''
  },
  b2bPayment: {
    enabledMethods: ['transfer', 'creditCard', 'linePay'],
    ecpay: { merchantId: '', hashKey: '', hashIV: '' },
    linePay: { channelId: '', channelSecret: '' },
    transfer: { bankCode: '822', accountNumber: '1234567890', accountName: '系統科技股份有限公司' }
  }
});

// --- NEW GLOBAL DATA STRUCTURES ---
let db_admin_logs: any[] = initGlobal("db_admin_logs", []);

let db_finance_records: any[] = initGlobal("db_finance_records", []);

let db_sync_queue: any[] = initGlobal("db_sync_queue", []);

let db_admins: any[] = initGlobal('db_admins', [
  { id: 'adm-1', name: '系統總管理員', account: 'admin_root', role: 'SuperAdmin' }
]);

let db_storage_plans: any[] = initGlobal('db_storage_plans', [
  { id: 'SP-50', name: '50GB 大容量方案', sizeGb: 50, priceMonthly: 300 },
  { id: 'SP-200', name: '200GB 旗艦方案', sizeGb: 200, priceMonthly: 900 },
  { id: 'SP-1000', name: '1TB 至尊方案', sizeGb: 1000, priceMonthly: 3000 }
]);

let db_temple_storages: any[] = initGlobal('db_temple_storages', []);

export interface TempleBill {
  id: string;
  templeId: string;
  type: string; // 'MonthlyFee', 'StorageUpgrade', 'AgiService'
  amount: number;
  billingDate: string; // e.g. '2026-06'
  dueDate: string; // YYYY-MM-DD
  status: 'Paid' | 'Unpaid';
  payeeRole: 'SuperAdmin' | 'Distributor';
  payeeId: string;
  timestamp: string;
}
let db_temple_bills: TempleBill[] = initGlobal('db_temple_bills', []);

export interface AiPlan {
  id: string;
  name: string;
  monthlyFee: number;
  chatLimit: number;
}
let db_ai_plans: AiPlan[] = initGlobal('db_ai_plans', [
  { id: 'AI-500', name: '基礎智慧助理方案', monthlyFee: 500, chatLimit: 2000 },
  { id: 'AI-1500', name: '進階智慧助理方案', monthlyFee: 1500, chatLimit: 10000 }
]);

export interface AiApiModel {
  id: string;
  name: string;
  apiKey: string;
  isEnabled: boolean;
}
let db_ai_api_models: AiApiModel[] = initGlobal('db_ai_api_models', []);

export interface TempleAiUsage {
  templeId: string;
  enabled: boolean;
  planId: string;
  usedCount: number;
  expiryDate: string;
  isVip: boolean;
}
let db_temple_ai_usage: TempleAiUsage[] = initGlobal('db_temple_ai_usage', []);

let db_wallets: any[] = initGlobal('db_wallets', [
  { role: 'SuperAdmin', id: 'system-hq', name: '系統中央總部', balance: 8540000 },
  { role: 'Distributor', id: 'dist-1', name: '北區總代理', balance: 250000 },
  { role: 'DistSales', id: 'sales-1', name: '王業務', balance: 35000 },
  { role: 'SuperSales', id: 'ss-1', name: '超級精英業務', balance: 180000 }
]);

let db_super_sales_overrides: Record<string, any> = initGlobal('db_super_sales_overrides', {});

let db_distributor_applications: any[] = initGlobal('db_distributor_applications', [
  { id: 'DAPP-001', name: '大甲區域授權中心', plan: 'PLAN-A', submittedBy: '超級精英業務', status: 'Active', account: 'dajia_dist', owner: '顏主委', date: '2026-05-12' }
]);


export async function fetchAdminLogs() { return [...db_admin_logs].reverse(); }
export async function logAdminAction(action: string, target: string) {
  db_admin_logs.unshift({ id: `L-${Date.now()}`, user: 'System Admin', action, target, timestamp: new Date().toLocaleString() });
  return { success: true };
}

export async function downloadAdminLogsCsv() {
  const logs = await fetchAdminLogs();
  const header = "ID,User,Action,Target,Timestamp\n";
  const rows = logs.map(l => `${l.id},${l.user},${l.action},${l.target},${l.timestamp}`).join("\n");
  return header + rows;
}

export async function createAdminAccount(data: any) {
  const newAdmin = { id: `adm-${Date.now()}`, ...data, role: 'SuperAdmin' };
  db_admins.push(newAdmin);
  await logAdminAction('CREATE_ADMIN', data.name);
  revalidatePath('/super-admin');
  return { success: true };
}

export async function fetchFinanceData() {
  const incomes = db_finance_records.filter(r => r.type === 'INCOME').reduce((acc, r) => acc + r.amount, 0);
  const expenses = db_finance_records.filter(r => r.type === 'EXPENSE').reduce((acc, r) => acc + r.amount, 0);
  return {
    records: db_finance_records,
    summary: {
      totalRevenue: incomes,
      totalCommission: db_finance_records.filter(r => r.category === 'COMMISSION').reduce((acc, r) => acc + r.amount, 0),
      netProfit: incomes - expenses
    }
  };
}

// ==========================================
// B2B 收款設定 (B2B Payment Configurations)
// ==========================================
export async function fetchB2BPaymentConfig(templeId: string) {
  return withTempleSession(templeId, true, async (client) => {
    let distributorId = null;
    if (!client) {
      const temple = db_temples.find(t => t.id === templeId);
      distributorId = temple?.distributorId;
    } else {
      const res = await client.query('SELECT distributor_id FROM temples WHERE id = $1', [templeId]);
      distributorId = res.rows[0]?.distributor_id;
    }

    if (distributorId) {
      if (!client) {
        const dist = db_distributors.find(d => d.id === distributorId);
        return dist?.b2bPayment || null;
      } else {
        return null;
      }
    } else {
      if (!client) {
        return db_config.b2bPayment || null;
      } else {
        return null;
      }
    }
  });
}

// --- STORAGE & BILLING APIS ---
export async function fetchStoragePlans() {
  return withTempleSession(null, true, async (client) => {
    if (!client) return [...db_storage_plans];
    const res = await client.query('SELECT * FROM storage_plans ORDER BY size_gb');
    return res.rows.map(r => ({
      id: r.id.toString(),
      name: `${r.size_gb}GB 雲端空間`,
      sizeGb: r.size_gb,
      priceMonthly: r.price_monthly,
      priceYearly: r.price_yearly
    }));
  });
}

export async function updateStoragePlans(plans: any[]) {
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      gStore.db_storage_plans = plans;
      db_storage_plans = plans;
    } else {
      await client.query('DELETE FROM storage_plans');
      for (const p of plans) {
        await client.query(
          'INSERT INTO storage_plans (size_gb, price_monthly, price_yearly) VALUES ($1, $2, $3, $4)',
          [p.sizeGb, p.priceMonthly, p.priceYearly]
        );
      }
    }
    revalidatePath('/super-admin');
    return { success: true };
  });
}

export async function fetchTempleStorages() {
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      db_temples.forEach(t => {
        if (!db_temple_storages.some(s => s.templeId === t.id)) {
          db_temple_storages.push({
            id: `TS-${Date.now()}-${t.id}`,
            templeId: t.id,
            templeName: t.templeName,
            city: t.city || '台北市',
            usedBytes: 0,
            quotaGb: 5,
            planName: '免費 5GB 空間'
          });
        }
      });
      return [...db_temple_storages];
    } else {
      const templesRes = await client.query('SELECT * FROM temples');
      for (const t of templesRes.rows) {
        const check = await client.query('SELECT * FROM temple_storages WHERE temple_id = $1', [t.id]);
        if ((check.rowCount ?? 0) === 0) {
          await client.query(
            'INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city) VALUES ($1, $2, $3, $4, $5)',
            [t.id, 0, 5368709120, '標準免費空間', t.city || '台北市']
          );
        }
      }
      const res = await client.query(`
        SELECT ts.*, t.temple_name 
        FROM temple_storages ts 
        JOIN temples t ON ts.temple_id = t.id
      `);
      return res.rows.map(r => ({
        id: r.id.toString(),
        templeId: r.temple_id,
        templeName: r.temple_name,
        city: r.city,
        usedBytes: Number(r.used_bytes),
        quotaGb: Number(r.allocated_bytes) / (1024 * 1024 * 1024),
        planName: r.plan_name
      }));
    }
  });
}

export async function upgradeTempleStorage(templeId: string, planId: string, cycle: 'Monthly' | 'Yearly', isManualGrant: boolean = false) {
  return withTempleSession(templeId, true, async (client) => {
    if (!client) {
      const plan = db_storage_plans.find((p: any) => p.id === planId);
      if (!plan) return { success: false, message: '找不到選定的空間方案' };

      const discount = db_config.yearlyDiscountRate || 20;
      const priceFactor = cycle === 'Yearly' ? (12 * (1 - discount / 100)) : 1;
      const finalAmount = Math.round(plan.priceMonthly * priceFactor);

      if (!isManualGrant) {
        const adminWallet = db_wallets.find(w => w.role === 'SuperAdmin');
        if (adminWallet) {
          adminWallet.balance += finalAmount;
        }

        const temple = db_temples.find(t => t.id === templeId);
        db_finance_records.unshift({
          id: `F-${Date.now()}`,
          type: 'INCOME',
          category: 'SPACE_UPGRADE',
          amount: finalAmount,
          source: `${temple?.templeName || '宮廟'}-升級空間 ${plan.sizeGb}GB (${cycle === 'Monthly' ? '月繳' : '年繳'})`,
          date: new Date().toISOString().split('T')[0]
        });
      }

      let storage = db_temple_storages.find(s => s.templeId === templeId);
      if (!storage) {
        storage = {
          id: `TS-${Date.now()}-${templeId}`,
          templeId,
          templeName: temple?.templeName || '未知宮廟',
          city: temple?.city || '台北市',
          usedBytes: 0,
          quotaGb: 5,
          planName: '免費 5GB 空間'
        };
        db_temple_storages.push(storage);
      }
      storage.quotaGb = plan.sizeGb;
      storage.planName = `${plan.name} (${plan.sizeGb}GB)`;

      await logAdminAction('UPGRADE_STORAGE', `${temple?.templeName || '宮廟'} -> ${plan.sizeGb}GB`);
    } else {
      const planRes = await client.query('SELECT * FROM storage_plans WHERE id::text = $1 OR size_gb::text = $1', [planId]);
      if ((planRes.rowCount ?? 0) === 0) return { success: false, message: '找不到選定的空間方案' };
      const plan = planRes.rows[0];

      const discount = 20;
      const priceFactor = cycle === 'Yearly' ? (12 * (1 - discount / 100)) : 1;
      const finalAmount = Math.round(plan.price_monthly * priceFactor);

      const templeRes = await client.query('SELECT * FROM temples WHERE id = $1', [templeId]);
      const temple = templeRes.rows[0];

      if (!isManualGrant) {
        await client.query(
          `INSERT INTO wallets (role, name, balance) VALUES ($1, $2, $3, $4) 
           ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance`,
          ['SuperAdmin', '超級管理員', finalAmount]
        );

        await client.query(
          'INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)',
          [temple?.temple_name || '宮廟', `升級空間 ${plan.size_gb}GB (${cycle === 'Monthly' ? '月繳' : '年繳'})`, finalAmount, 100, '超級管理員']
        );
      }

      const allocatedBytes = plan.size_gb * 1024 * 1024 * 1024;
      await client.query(
        `INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city) 
         VALUES ($1, 0, $2, $3, $4)
         ON CONFLICT (temple_id) DO UPDATE SET allocated_bytes = EXCLUDED.allocated_bytes, plan_name = EXCLUDED.plan_name`,
        [templeId, allocatedBytes, `${plan.size_gb}GB 雲端空間`, temple?.city || '台北市']
      );
    }

    revalidatePath('/super-admin');
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchRoleWallets() {
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      db_distributors.forEach(d => {
        if (!db_wallets.some(w => w.id === d.id)) {
          db_wallets.push({ role: 'Distributor', id: d.id, name: d.name, balance: 0 });
        }
      });
      db_dist_sales.forEach(s => {
        if (!db_wallets.some(w => w.id === s.id)) {
          db_wallets.push({ role: 'DistSales', id: s.id, name: s.name, balance: 0 });
        }
      });
      return [...db_wallets];
    } else {
      const dists = await client.query('SELECT * FROM distributors');
      for (const d of dists.rows) {
        await client.query(
          `INSERT INTO wallets (role, name, balance) VALUES ($1, $2, $3, $4) 
           ON CONFLICT (name) DO NOTHING`,
          ['Distributor', d.name, 0]
        );
      }
      const sales = await client.query('SELECT * FROM distributor_sales');
      for (const s of sales.rows) {
        await client.query(
          `INSERT INTO wallets (role, name, balance) VALUES ($1, $2, $3, $4) 
           ON CONFLICT (name) DO NOTHING`,
          ['DistributorSales', s.name, 0]
        );
      }
      const res = await client.query('SELECT * FROM wallets');
      return res.rows.map(r => ({
        id: r.id.toString(),
        role: r.role,
        name: r.name,
        balance: Number(r.balance)
      }));
    }
  });
}

export async function simulateSaaSPayment(category: 'MONTHLY_RENT' | 'SETUP_FEE' | 'AUTH_FEE', amount: number, templeId?: string, distributorId?: string, salesId?: string) {
  return withTempleSession(templeId || null, true, async (client) => {
    if (!client) {
      const t = db_temples.find(x => x.id === templeId);
      const distId = t?.distributorId || distributorId || 'system-hq';
      const sId = t?.salesId || salesId || '';

      if (category === 'AUTH_FEE') {
        const saWallet = db_wallets.find(w => w.role === 'SuperAdmin');
        if (saWallet) saWallet.balance += amount * 0.85;

        const ssWallet = db_wallets.find(w => w.role === 'SuperSales');
        if (ssWallet) ssWallet.balance += amount * 0.15;

        db_finance_records.unshift({
          id: `F-EXP-${Date.now()}`,
          type: 'EXPENSE',
          category: 'COMMISSION',
          amount: amount * 0.15,
          source: '超級精英業務',
          date: new Date().toISOString().split('T')[0]
        });

        db_finance_records.unshift({
          id: `F-INC-${Date.now()}`,
          type: 'INCOME',
          category: 'AUTH_FEE',
          amount: amount,
          source: db_distributors.find(d => d.id === distributorId)?.name || '新經銷商授權',
          date: new Date().toISOString().split('T')[0]
        });
      } else if (category === 'MONTHLY_RENT' || category === 'SETUP_FEE') {
        if (distId === 'system-hq') {
          const saWallet = db_wallets.find(w => w.role === 'SuperAdmin');
          if (saWallet) saWallet.balance += amount * 0.85;

          const ssWallet = db_wallets.find(w => w.role === 'SuperSales');
          if (ssWallet) ssWallet.balance += amount * 0.15;

          db_finance_records.unshift({
            id: `F-EXP-${Date.now()}`,
            type: 'EXPENSE',
            category: 'COMMISSION',
            amount: amount * 0.15,
            source: '超級精英業務',
            date: new Date().toISOString().split('T')[0]
          });
        } else {
          const distWallet = db_wallets.find(w => w.id === distId);
          if (distWallet) distWallet.balance += amount * 0.65;

          const saWallet = db_wallets.find(w => w.role === 'SuperAdmin');
          if (saWallet) saWallet.balance += amount * 0.20;

          const dsWallet = db_wallets.find(w => w.id === sId);
          if (dsWallet) dsWallet.balance += amount * 0.15;

          db_finance_records.unshift({
            id: `F-EXP-S-${Date.now()}`,
            type: 'EXPENSE',
            category: 'COMMISSION',
            amount: amount * 0.15,
            source: db_dist_sales.find(s => s.id === sId)?.name || '經銷業務',
            date: new Date().toISOString().split('T')[0]
          });
        }

        db_finance_records.unshift({
          id: `F-INC-T-${Date.now()}`,
          type: 'INCOME',
          category,
          amount: amount,
          source: t?.templeName || '宮廟付費',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      const tRes = templeId ? await client.query('SELECT * FROM temples WHERE id = $1', [templeId]) : null;
      const t = tRes && (tRes.rowCount ?? 0) > 0 ? tRes.rows[0] : null;
      const distId = t?.sales_id ? (await client.query('SELECT distributor_id FROM distributor_sales WHERE id = $1', [t.sales_id])).rows[0]?.distributor_id : distributorId || 'system-hq';
      const sId = t?.sales_id || salesId || '';

      const templeName = t?.temple_name || '系統交易';

      if (category === 'AUTH_FEE') {
        const saAmt = Math.round(amount * 0.85);
        const ssAmt = Math.round(amount * 0.15);

        await client.query(`
          INSERT INTO wallets (role, name, balance) VALUES ('SuperAdmin', '超級管理員', $1) 
          ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
        `, [saAmt]);

        await client.query(`
          INSERT INTO wallets (role, name, balance) VALUES ('SuperSales', '超級精英業務', $1) 
          ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
        `, [ssAmt]);

        await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
          [templeName, '授權金總部提成', saAmt, 85, '超級管理員']);
        await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
          [templeName, '授權金業務提成', ssAmt, 15, '超級精英業務']);

      } else if (category === 'MONTHLY_RENT' || category === 'SETUP_FEE') {
        const typeLabel = category === 'MONTHLY_RENT' ? '月租費' : '開辦費';
        
        if (!distId || distId === 'system-hq') {
          const saAmt = Math.round(amount * 0.85);
          const ssAmt = Math.round(amount * 0.15);

          await client.query(`
            INSERT INTO wallets (role, name, balance) VALUES ('SuperAdmin', '超級管理員', $1) 
            ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
          `, [saAmt]);

          await client.query(`
            INSERT INTO wallets (role, name, balance) VALUES ('SuperSales', '超級精英業務', $1) 
            ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
          `, [ssAmt]);

          await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
            [templeName, `${typeLabel}直屬提成`, saAmt, 85, '超級管理員']);
          await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
            [templeName, `${typeLabel}業務提成`, ssAmt, 15, '超級精英業務']);
        } else {
          const distAmt = Math.round(amount * 0.65);
          const saAmt = Math.round(amount * 0.20);
          const dsAmt = Math.round(amount * 0.15);

          const distNameRes = await client.query('SELECT name FROM distributors WHERE id = $1', [distId]);
          const distName = distNameRes.rows[0]?.name || '經銷商';

          const dsNameRes = await client.query('SELECT name FROM distributor_sales WHERE id = $1', [sId]);
          const dsName = dsNameRes.rows[0]?.name || '經銷業務';

          await client.query(`
            INSERT INTO wallets (role, name, balance) VALUES ('Distributor', $1, $2) 
            ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
          `, [distName, distAmt]);

          await client.query(`
            INSERT INTO wallets (role, name, balance) VALUES ('SuperAdmin', '超級管理員', $1) 
            ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
          `, [saAmt]);

          await client.query(`
            INSERT INTO wallets (role, name, balance) VALUES ('DistributorSales', $1, $2) 
            ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance
          `, [dsName, dsAmt]);

          await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
            [templeName, `${typeLabel}經銷提成`, distAmt, 65, distName]);
          await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
            [templeName, `${typeLabel}總部提成`, saAmt, 20, '超級管理員']);
          await client.query('INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)', 
            [templeName, `${typeLabel}經銷業務提成`, dsAmt, 15, dsName]);
        }
      }
    }

    revalidatePath('/super-admin');
    revalidatePath('/distributor');
    revalidatePath('/dist-sales');
    revalidatePath('/super-sales');
    return { success: true };
  });
}

export async function fetchSyncQueue() { return [...db_sync_queue]; }

export async function fetchSystemConfig() {
  const gStore = globalThis as any;
  const config = gStore.db_config || db_config;
  
  if (!config.b2bPayment) {
    config.b2bPayment = {
      thirdParty: { enabled: true, merchantId: 'HQ_MERCHANT_999', hashKey: 'HQ_HASH_KEY', hashIV: 'HQ_HASH_IV' },
      linePay: { enabled: false, channelId: '', channelSecret: '' },
      customTransfer: { enabled: true, bankCode: '808', accountName: '天首科技有限公司', accountNo: '808-1234-5678-901' },
      serviceMapping: {
        'new-temple': ['customTransfer'],
        'monthly-rent': ['thirdParty', 'customTransfer'],
        'distributor-auth': ['customTransfer']
      }
    };
    gStore.db_config = config;
  }
  
  return { ...config };
}

export async function updateSystemConfig(data: any) {
  const currentConfig = gStore.db_config || db_config;
  const newConfig = { ...currentConfig, ...data };
  
  gStore.db_config = newConfig;
  db_config = newConfig;

  await logAdminAction('UPDATE_CONFIG', 'System Parameters');
  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}



// --- 經銷業務 (Dist-Sales) ---
export async function fetchFreeApplications(distId?: string) { 
  if (distId) {
     return db_temples.filter(t => t.distributorId === distId);
  }
  return [...db_temples]; 
}

export async function submitFreeAccountApplication(data: any) { 
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被使用，請更換其他帳號' };
  }
  const { role, paymentCycle, ...formData } = data;
  
  const status = (role === 'distributor' || role === 'super-admin') ? 'Active' : 'Pending';

  const sales = db_dist_sales.find(s => s.name === data.submittedBy);
  const reqRole = await getCurrentRole() || 'System';
  const currentUser = await getCurrentUser();
  const templeNo = (gStore.db_temples || db_temples).length + 1;

      const newTemple = {
      id: `temple-${Math.random().toString(36).substring(2, 10)}`,
      templeNo,
      ...formData,
      paymentCycle: paymentCycle || 'Monthly',
      monthlyRent: data.freeType === 'Permanent' ? 0 : (db_config.fixedMonthlyRent || 3600),
      trialMonths: data.freeType === 'Trial' ? parseInt(data.trialMonths || '0') : 0,
      freeType: data.freeType || 'Normal',
      role: 'Temple',
      status,
      creatorRole: role,
      creatorId: currentUser.name,
      salesId: sales?.id || null,
      distributorId: role === 'super-admin' ? null : (sales?.distributorId || (role === 'distributor' ? data.distributorId : null)),
      timestamp: new Date().toISOString(),
      billingStartDate: data.freeType === 'Trial' ? 
        new Date(Date.now() + (parseInt(data.trialMonths || '0') * 30 * 24 * 60 * 60 * 1000)).toISOString() : 
        new Date().toISOString()
    };
    db_temples.push(newTemple);
    gStore.db_temples = db_temples;

    if (data.freeType === 'Permanent') {
      await grantTempleAiVip(newTemple.id, true);
      await grantTempleStorageVip(newTemple.id, true);
    }


  // If status is Active (e.g. created by super-admin or distributor), create personnel login immediately
  if (status === 'Active' && data.account && data.password) {
    const pData = (gStore.db_personnel || db_personnel);
    pData.push({
      id: `p-${Date.now()}`,
      templeId: newTemple.id,
      name: data.templeName || '宮廟管理員',
      account: data.account,
      password: data.password, // In real app, hash this
      role: 'TempleAdmin',
      status: 'Active'
    });
    gStore.db_personnel = pData;
  }
  
  // Create Notification for Super Admin
  db_notifications.unshift({
    id: `N-${Date.now()}`,
    title: '新宮廟核定申請',
    content: `超級業務 ${data.submittedBy} 提報了「${newTemple.templeName}」開戶申請。`,
    date: new Date().toISOString().split('T')[0],
    isRead: false
  });

  revalidatePath('/dist-sales');
  revalidatePath('/distributor');
  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  
  return { success: true, templeId: newTemple.id }; 
}

export async function approveTempleBySuperAdmin(id: string) {
  const t = db_temples.find(x => x.id === id);
   if (t) {
     t.status = 'Active';
     gStore.db_temples = db_temples;
     if (t.account && t.password) {
       const pData = (gStore.db_personnel || db_personnel);
       // check if already exists
       if (!pData.some(p => p.account === t.account)) {
         pData.push({
           id: `p-${Date.now()}`,
           templeId: id,
           name: t.templeName || '宮廟管理員',
           account: t.account,
           password: t.password,
           role: 'TempleAdmin',
           status: 'Active'
         });
         gStore.db_personnel = pData;
       }
     }
  }
  revalidatePath('/super-admin');
  return { success: true };
}

export async function rejectTempleBySuperAdmin(id: string) {
  const idx = db_temples.findIndex(x => x.id === id);
  if (idx > -1) db_temples.splice(idx, 1);
  revalidatePath('/super-admin');
  return { success: true };
}

export async function fetchPendingDistributors() {
  let pgApps: any[] = [];
  try {
    const res = await dbQuery("SELECT * FROM distributor_applications WHERE status = 'Pending'", [], () => null) as any;
    if (res && res.rows) {
      pgApps = res.rows.map((r: any) => ({
        id: r.id, name: r.name, contactName: r.contact_name, phone: r.phone, email: r.email,
        taxId: r.tax_id, address: r.address, planId: r.plan_id, price: r.price, nodes: r.nodes,
        submittedBy: r.submitted_by, status: r.status, date: r.created_at, account: r.account,
        password: r.password, expirationDate: r.expiration_date
      }));
    }
  } catch(e) {}

  const allApps = new Map();
  db_distributor_applications.filter(a => a.status === 'Pending').forEach(a => allApps.set(a.id, a));
  pgApps.forEach(a => allApps.set(a.id, a));

  return Array.from(allApps.values());
}

export async function approveDistributorBySuperAdmin(id: string) {
  let app = db_distributor_applications.find(a => a.id === id);
  if (!app) {
    try {
      const res = await dbQuery("SELECT * FROM distributor_applications WHERE id = $1", [id], () => null) as any;
      if (res && res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        app = {
          id: r.id, name: r.name, contactName: r.contact_name, phone: r.phone, email: r.email,
          taxId: r.tax_id, address: r.address, planId: r.plan_id, price: r.price, nodes: r.nodes,
          submittedBy: r.submitted_by, status: r.status, date: r.created_at, account: r.account,
          password: r.password, expirationDate: r.expiration_date
        };
      }
    } catch(e) {}
  }

  if (app) {
    app.status = 'Active';
    const memApp = db_distributor_applications.find(a => a.id === id);
    if (memApp) memApp.status = 'Active';
    try { await dbQuery("UPDATE distributor_applications SET status = 'Active' WHERE id = $1", [id]); } catch(e) {}
    
    // 建立實際經銷商帳戶
    const distId = 'dist-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const plan = db_config.distributorPlans.find((p: any) => p.id === app.planId) || db_config.distributorPlans[0];
    
    // 反查業務員實際 ID
    const actualSales = db_dist_sales.find(s => s.name === app.submittedBy);
    
    const newDist = {
      id: distId,
      name: app.name,
      account: app.account || app.name,
      password: app.password || 'pivot2026',
      planId: plan?.id || 'PLAN-A',
      planName: plan?.name || '標準代理方案',
      price: app.price || 0,
      status: 'Active',
      quota: plan?.nodes || 100,
      joinedAt: new Date().toISOString().split('T')[0],
      expirationDate: app.expirationDate || '',
      creatorSalesId: actualSales?.id || app.submittedBy || ''
    };

    db_distributors.push(newDist);
    gStore.db_distributors = db_distributors;
    
    await ensurePlatformTables();
    try {
      await dbQuery(`
        INSERT INTO distributors (id, name, account, password, plan_id, plan_name, price, status, quota, joined_at, expiration_date, creator_sales_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (account) DO UPDATE SET status = 'Active'
      `, [newDist.id, newDist.name, newDist.account, newDist.password, newDist.planId, newDist.planName, newDist.price, newDist.status, newDist.quota, newDist.joinedAt, newDist.expirationDate, newDist.creatorSalesId]);
    } catch (e) {
      console.error("DB Insert Error for distributor:", e);
    }
  }
  revalidatePath('/super-admin');
  return { success: true };
}

export async function rejectDistributorBySuperAdmin(id: string) {
  const idx = db_distributor_applications.findIndex(a => a.id === id);
  if (idx > -1) db_distributor_applications.splice(idx, 1);
  try { await dbQuery("DELETE FROM distributor_applications WHERE id = $1", [id]); } catch(e) {}
  revalidatePath('/super-admin');
  return { success: true };
}

export async function updateSuperSalesCommission(salesName: string, rates: any) {
  console.log(`Updating rates for ${salesName}:`, rates);
  db_super_sales_overrides[salesName] = rates;
  
  db_notifications.unshift({
    id: `N-COMM-${Date.now()}`,
    title: '佣金比例異動通知',
    content: `您的個人分潤比例已由超級管理員調整，請至績效分頁查看。`,
    date: new Date().toISOString().split('T')[0],
    isRead: false
  });

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}

export async function fetchSalesPerformance(salesName: string) { 
  const sales = db_dist_sales.find(s => s.name === salesName);
  const myTemples = db_temples.filter(t => t.salesId === sales?.id);
  return {
    total: myTemples.length,
    approved: myTemples.filter(t => t.status === 'Active').length
  }; 
}

export async function fetchVisitationRecords(salesName: string) { 
  return db_sales_visits.filter(v => v.salesName === salesName); 
}

export async function fetchAllAccountsForAdmin() {
  const accounts: any[] = [];
  
  accounts.push({ id: 'ADMIN', name: '總部最高系統管理員', role: 'SuperAdmin', account: 'PIVOTADMIN01', status: 'Active' });
  
  db_personnel.forEach(p => {
    if (p.role === 'Admin') accounts.push({ ...p, id: p.id, name: p.name, role: 'Admin', account: p.account, status: p.status || 'Active' });
  });

  // 從 PostgreSQL 取出所有的經銷商
  let pgDistributors: any[] = [];
  try {
    const resDist = await dbQuery("SELECT * FROM distributors", [], () => null) as any;
    if (resDist && resDist.rows) {
      pgDistributors = resDist.rows;
    }
  } catch (e) {}

  const allDistributorsMap = new Map();
  db_distributors.forEach(d => allDistributorsMap.set(d.id, d));
  pgDistributors.forEach(d => allDistributorsMap.set(d.id, { ...d, planId: d.plan_id, planName: d.plan_name, joinedAt: d.joined_at, creatorSalesId: d.creator_sales_id }));
  
  Array.from(allDistributorsMap.values()).forEach(d => {
    accounts.push({ ...d, id: d.id, name: d.name, role: 'Distributor', account: d.account, status: d.status || 'Active' });
  });

  // 從 PostgreSQL 取出所有的業務員
  let pgSales: any[] = [];
  try {
    const resSales = await dbQuery("SELECT * FROM dist_sales", [], () => null) as any;
    if (resSales && resSales.rows) {
      pgSales = resSales.rows;
    }
  } catch (e) {}

  const allSalesMap = new Map();
  db_dist_sales.forEach(s => allSalesMap.set(s.id, s));
  pgSales.forEach(s => allSalesMap.set(s.id, { ...s, distributorId: s.distributor_id, joinedAt: s.joined_at }));

  Array.from(allSalesMap.values()).forEach(s => {
    if (s.role === 'SuperSales') {
      const overrides = db_super_sales_overrides[s.name];
      const mergedRules = overrides || s.commissionRules || db_config.defaultSuperSalesRates;
      accounts.push({ ...s, id: s.id, name: s.name, role: 'SuperSales', account: s.account, status: s.status || 'Active', commissionRules: mergedRules });
    }
  });
  
  const templePromises = db_temples.map(async t => {
    const personnel = db_personnel.find(p => p.templeId === t.id);
    const creatorInfo = await getTempleCreatorInfo(t.id);
    return { 
      ...t,
      id: t.id, 
      name: t.name || t.templeName || '未知宮廟', 
      role: 'Temple', 
      account: personnel ? personnel.account : (t.account || `USR-${t.id}`), 
      status: t.status || 'Active',
      creatorInfo: creatorInfo
    };
  });
  
  const resolvedTemples = await Promise.all(templePromises);
  accounts.push(...resolvedTemples);

  return accounts.reverse();
}


export async function fetchSuperSalesAccounts() {
  return db_dist_sales.filter(s => s.role === 'SuperSales').map(ss => ({
    ...ss,
    rates: db_super_sales_overrides[ss.name] || db_config.defaultSuperSalesRates
  }));
}


export async function addVisitationRecord(data: any) { 
  db_sales_visits.push({
    id: `visit-${Date.now()}`,
    ...data,
    timestamp: new Date().toISOString()
  });
  revalidatePath('/dist-sales');
  return { success: true }; 
}

export async function fetchSalesTools() { return [...db_tools]; }
export async function uploadTool(formData: FormData) {
  const type = formData.get('type') as string;
  const title = formData.get('title') as string;
  const category = formData.get('category') as string;
  let thumbnail = formData.get('thumbnail') as string;
  const file = formData.get('file') as File | null;
  let url = thumbnail;

  if (file && file.size > 0) {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = path.extname(file.name) || '';
    const safeName = 'tool-' + Date.now() + ext;
    const filePath = path.join(uploadsDir, safeName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    url = '/api/uploads/' + safeName;
    if (type === 'photo') {
      thumbnail = url;
    }
  }

  const uploadedAt = new Date().toISOString().split('T')[0];
  db_tools.push({ id: 'tool-' + Date.now(), uploadedAt, type, title, category, thumbnail, url });
  
  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  revalidatePath('/distributor');
  revalidatePath('/dist-sales');
  revalidatePath('/super-sales/[salesId]', 'page');
  return { success: true, toolUrl: url, thumbnail };
}

export async function createDistributorSales(distId: string, data: any) {
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被使用，請更換其他帳號' };
  }
  const { name, phone, account, password, setupRate, rentYear1Rate, rentYear2Rate, rentYear3PlusRate } = data;
  const newSales = {
    id: 'dist-sales-' + Date.now(),
    name,
    phone,
    account,
    password,
    distributorId: distId,
    role: 'DistSales',
    commissionRates: { setupRate, rentYear1Rate, rentYear2Rate, rentYear3PlusRate },
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'Active'
  };
  
  db_dist_sales.push(newSales);
  gStore.db_dist_sales = db_dist_sales;
  return { success: true, data: newSales };
}
export async function deleteTool(toolId: string) {
  const idx = db_tools.findIndex((t: any) => t.id === toolId);
  if (idx > -1) {
    db_tools.splice(idx, 1);
    revalidatePath('/super-admin');
    revalidatePath('/distributor');
    revalidatePath('/dist-sales');
    revalidatePath('/super-sales/[salesId]', 'page');
    return { success: true };
  }
  return { success: false, error: 'Tool not found' };
}
export async function fetchEContracts() { return []; }
export async function submitEContract(fd: any) { return { success: true }; }
export async function fetchDistributorCapacity(distId?: string) { 
  const used = distId ? db_temples.filter(t => t.distributorId === distId).length : db_temples.length;
  return { 
    plan: '企業旗艦方案 (2年期 / 100 帳戶)', 
    contractPeriod: '2 Years',
    totalNodes: 100,
    used: used, 
    total: 100,
    planDetails: [
      '專屬客製化宮廟入口網站',
      '24/7 AI 智能營運助理',
      '全域即時數據監控大屏',
      '區塊鏈合約存證系統',
      '多維度業務績效矩陣'
    ],
    nextRenewal: '2027-01-10'
  }; 
}

// --- Super Sales Logic ---
export async function submitDistributorApplication(data: any) {
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + (Number(data.years) || 2));

  const safeAccount = (data.account || '').trim();
  const safePassword = (data.password || '').trim();

  const newApp = {
    id: 'DAPP-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    ...data,
    account: safeAccount,
    password: safePassword,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0]
  };
  db_distributor_applications.push(newApp);

  await ensurePlatformTables();
  try {
    await dbQuery(`
      INSERT INTO distributor_applications (id, name, contact_name, phone, email, tax_id, address, plan_id, price, nodes, submitted_by, status, created_at, account, password, expiration_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      newApp.id, data.name || '', data.contactName || '', data.phone || '', data.email || '', data.taxId || '', data.address || '', 
      data.planId || '', Number(data.customPrice) || 0, Number(data.customNodes) || 0, data.submittedBy || '', 
      'Pending', newApp.date, safeAccount, safePassword, newApp.expirationDate
    ]);
  } catch(e) {
    console.error("Failed to insert distributor_application:", e);
  }

  db_notifications.unshift({
    id: `N-DIST-${Date.now()}`,
    title: '新經銷商授權申請',
    content: `業務員 ${data.submittedBy} 提交了「${data.name}」的經銷授權申請案。`,
    date: new Date().toISOString().split('T')[0],
    isRead: false
  });

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true, id: newApp.id };
}

export async function fetchSuperSalesProfile(salesId: string) {
  const salesPerson = db_dist_sales.find(s => s.id === salesId) || db_dist_sales[0];
  const name = salesPerson.name || '超級精英業務';
  const commissionRates = salesPerson.commissionRules || db_super_sales_overrides[name] || db_config.defaultSuperSalesRates;
  return {
    name: name,
    rank: '超級精英業務',
    id: salesPerson.id || 'pivot_elite_001',
    organization: '中央管理總部',
    commissionRates,
    phone: salesPerson.phone || '未設定',
    account: salesPerson.account || '未設定',
    email: salesPerson.email || '未設定',
    bankInfo: salesPerson.bankInfo || null
  };
}

export async function updateSuperSalesBankInfo(salesId: string, bankInfo: { bankName: string, accountName: string, accountNumber: string }) {
  const salesPerson = db_dist_sales.find(s => s.id === salesId);
  if (salesPerson) {
    salesPerson.bankInfo = bankInfo;
    revalidatePath('/super-sales/[salesId]', 'page');
    revalidatePath('/super-admin');
    return { success: true };
  }
  return { success: false, error: 'Account not found' };
}

export async function updateSuperSalesBasicInfo(salesId: string, data: { phone: string, email: string }) {
  const salesPerson = db_dist_sales.find(s => s.id === salesId);
  if (salesPerson) {
    salesPerson.phone = data.phone;
    salesPerson.email = data.email;
    revalidatePath('/super-sales/[salesId]', 'page');
    revalidatePath('/super-admin');
    return { success: true };
  }
  return { success: false, error: 'Account not found' };
}

export async function fetchSuperSalesRegistry(salesId: string) {
  const sales = db_dist_sales.find(s => s.id === salesId);
  const name = sales?.name;
  
  const temples = [];
  for (const t of db_temples) {
    const creatorInfo = await getTempleCreatorInfo(t.id);
    if ((creatorInfo && creatorInfo.salesName === name) || t.salesId === salesId) {
       temples.push({ id: t.id, name: t.templeName, status: t.status, plan: '進階營運方案', date: t.timestamp?.split('T')[0] || '未知', revenue: t.monthlyRent || 0 });
    }
  }

  const distributors = db_distributors.filter(d => d.creatorSalesId === salesId || d.salesId === salesId).map(d => {
    const distTemples = db_temples.filter(t => t.distributorId === d.id);
    const distSales = db_dist_sales.filter(s => s.distributorId === d.id);
    const totalIncome = distTemples.reduce((acc, t) => acc + (Number(t.monthlyRent) || 0) * 12, 0);
    const commissionExpense = Math.floor(totalIncome * 0.2); // 假設佣金支出佔 20%
    const netRevenue = totalIncome - commissionExpense;

    return {
      id: d.id,
      name: d.name,
      status: d.contractStatus || d.status || 'Active',
      plan: d.planName || '經銷專案',
      date: d.joinedAt || '未知',
      nodesUsed: distTemples.length,
      templeCount: distTemples.length,
      salesCount: distSales.length,
      revenue: totalIncome,
      expenses: commissionExpense,
      netRevenue: netRevenue
    };
  });

  const pendingTempleCount = db_temple_applications.filter(a => a.submittedBy === name && a.status === 'Pending').length;
  let pgPendingDistCount = 0;
  try {
    const res = await dbQuery("SELECT COUNT(*) FROM distributor_applications WHERE submitted_by = $1 AND status = 'Pending'", [name], () => null) as any;
    if (res && res.rows && res.rows.length > 0) pgPendingDistCount = parseInt(res.rows[0].count);
  } catch(e) {}

  const memPendingDistCount = db_distributor_applications.filter(a => a.submittedBy === name && a.status === 'Pending').length;
  const pendingDistCount = Math.max(pgPendingDistCount, memPendingDistCount);

  const pendingCount = pendingTempleCount + pendingDistCount;

  return { temples, distributors, pendingCount };
}

// --- Super Admin Account Creation API ---

export async function createSuperSalesAccount(data: any) {
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被使用，請更換其他帳號' };
  }
  const id = `ss-${Date.now()}`;
  const safeAccount = (data.account || '').trim();
  const commissionRates = {
    distributorAuthRate: Number(data.distributorAuthRate) || 15,
    templeSetupRate: Number(data.templeSetupRate) || 10,
    templeSetupType: data.templeSetupType || 'percent',
    templeRentRates: [
      Number(data.rentY1) || 15,
      Number(data.rentY2) || 12,
      Number(data.rentY3) || 10
    ]
  };

  const newAccount = {
    id,
    ...data,
    role: 'SuperSales',
    status: 'Active',
    commissionRates,
    joinedAt: new Date().toISOString().split('T')[0]
  };
  
  db_dist_sales.push({
    id,
    name: data.name,
    account: safeAccount,
    password: (data.password || '').trim(),
    phone: data.phone,
    email: data.email,
    bankInfo: {
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber
    },
    role: 'SuperSales',
    commissionRules: commissionRates
  });

  db_super_sales_overrides[data.name] = commissionRates;
  gStore.db_dist_sales = db_dist_sales;

  revalidatePath('/super-admin');
  return { success: true, id };
}

export async function createDistributorAccount(data: any) {
  if (data.account && await checkAccountExists(data.account.trim())) {
    return { success: false, error: '帳號已被使用，請更換其他帳號' };
  }
  const safeAccount = (data.account || '').trim();
  const safePassword = (data.password || '').trim();
  const id = 'dist-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const plan = db_config.distributorPlans.find((p: any) => p.id === data.planId) || db_config.distributorPlans[0];
  const finalPrice = Number(data.customPrice) || plan.price;
  
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + (Number(data.years) || 2));
  
  const newDist = {
    id,
    ...data,
    account: safeAccount,
    password: safePassword,
    planId: plan.id,
    planName: plan.name,
    price: finalPrice,
    status: 'Active',
    joinedAt: new Date().toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0]
  };
  
  db_distributors.push(newDist);
  
  db_distributor_applications.push({
    id: `DAPP-${id}`,
    name: data.name,
    plan: plan.name,
    price: finalPrice,
    submittedBy: 'System Admin',
    status: 'Active',
    account: safeAccount,
    password: safePassword,
    owner: data.owner,
    date: new Date().toISOString().split('T')[0]
  });
  
  gStore.db_distributors = db_distributors;

  await ensurePlatformTables();
  try {
    await dbQuery(`
      INSERT INTO distributors (id, name, account, password, plan_id, plan_name, price, status, quota, joined_at, expiration_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (account) DO UPDATE SET status = 'Active'
    `, [newDist.id, newDist.name, newDist.account, newDist.password, newDist.planId, newDist.planName, newDist.price, newDist.status, Number(data.customNodes) || 100, newDist.joinedAt, newDist.expirationDate]);
  } catch (e) {
    console.error("DB Insert Error for distributor:", e);
  }

  revalidatePath('/super-admin');
  return { success: true, id };
}

export async function createTempleAccount(data: any) {
  const reqRole = await getCurrentRole() || 'System';
  const currentUser = await getCurrentUser();
  const creatorRole = reqRole;
  const creatorId = currentUser.name;
  const id = `temple-${Math.random().toString(36).substring(2, 10)}`;
    const templeNo = (gStore.db_temples || db_temples).length + 1;
  const { paymentCycle, ...rest } = data;
  
  const monthlyRent = data.freeType === 'Permanent' ? 0 : (Number(data.monthlyRent) || db_config.fixedMonthlyRent);
  const trialMonths = data.freeType === 'Trial' ? parseInt(data.trialMonths || '0') : 0;
  
  const newTemple = {
    id,
    templeNo,
    templeName: data.name,
    ...rest,
    distributorId: data.distributorId || null,
    salesId: data.salesId || null,
    creatorRole,
    creatorId,
    paymentCycle: paymentCycle || 'Monthly',
    monthlyRent,
    trialMonths,
    freeType: data.freeType || 'Normal',
    status: 'Active',
    timestamp: new Date().toISOString(),
    billingStartDate: data.freeType === 'Trial' ? 
      new Date(Date.now() + (trialMonths * 30 * 24 * 60 * 60 * 1000)).toISOString() : 
      new Date().toISOString()
  };
  
  db_temples.push(newTemple);
  gStore.db_temples = db_temples;
  
  // Create personnel account for login
  if (data.account && data.password) {
    const pData = (gStore.db_personnel || db_personnel);
    pData.push({
      id: `p-${Date.now()}`,
      templeId: id,
      name: data.name || '宮廟管理員',
      account: data.account,
      password: data.password, // In real app, hash this
      role: 'TempleAdmin',
      status: 'Active'
    });
    gStore.db_personnel = pData;
  }

  
    // Deduct quota if Distributor/Sales
    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const currentRole = cookieStore.get("admin_role")?.value || "SuperAdmin";
    const accountStr = cookieStore.get("admin_account")?.value || "system";
  
    if (currentRole === 'Distributor' || currentRole === 'DistSales') {
      if (currentRole === 'Distributor') {
        const dist = db_distributors.find((d: any) => d.account === accountStr);
        if (dist) {
           if (dist.quota <= 0) return { success: false, message: '配額已耗盡，無法開設新宮廟' };
           dist.quota -= 1;
        }
      }
    }

    if (data.freeType === 'Permanent') {
      await grantTempleAiVip(id, true);
      await grantTempleStorageVip(id, true);
    }


  // Generate initial bill
  let payeeRole = 'SuperAdmin';
  let payeeId = 'system-hq';
  if (currentRole === 'Distributor' || currentRole === 'DistSales') {
    payeeRole = 'Distributor';
    const dist = db_distributors.find((d: any) => d.account === accountStr || d.name === creatorId);
    payeeId = dist?.id || 'dist-1';
  }

  const billDueDate = new Date(new Date(newTemple.billingStartDate).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  if (newTemple.freeType !== 'Permanent' && monthlyRent > 0) {
    db_temple_bills.push({
      id: `BILL-${Date.now()}`,
      templeId: id,
      type: 'MonthlyFee',
      amount: monthlyRent,
      billingDate: new Date(newTemple.billingStartDate).toISOString().substring(0, 7),
      dueDate: billDueDate,
      status: 'Unpaid',
      payeeRole: payeeRole as any,
      payeeId,
      timestamp: new Date().toISOString()
    });
  }

  revalidatePath('/super-admin');
  await revalidateTemple(id);
  return { success: true, id };
}


export async function fetchAggregatedAnalytics() {
  const totalTemples = db_temples.length;
  const activeTemples = db_temples.filter(t => t.status === 'Active').length;
  const totalDistributors = db_distributors.length;
  const totalSuperSales = db_dist_sales.filter(s => s.role === 'SuperSales').length;
  
  const monthlyRevenue = db_temples.filter(t => t.status === 'Active').reduce((sum, t) => sum + (t.monthlyRent || 0), 0);
  
  return {
    overview: {
      totalTemples,
      activeTemples,
      totalDistributors,
      totalSuperSales,
      monthlyRevenue,
      systemHealth: 98
    },
    regionalDistribution: [
      { region: '台北', count: Math.floor(totalTemples * 0.4) },
      { region: '台中', count: Math.floor(totalTemples * 0.3) },
      { region: '高雄', count: Math.floor(totalTemples * 0.3) }
    ],
    growthTrend: [
      { date: '2026-01', count: 10 },
      { date: '2026-02', count: 25 },
      { date: '2026-03', count: 45 },
      { date: '2026-04', count: 80 },
      { date: '2026-05', count: totalTemples }
    ]
  };
}


export async function fetchCommissionHistory(salesId: string, year: string, month: string) { 
  const sales = db_dist_sales.find(s => s.id === salesId);
  const salesName = sales?.name;
  
  const myTemples = [];
  for (const t of db_temples) {
    const creatorInfo = await getTempleCreatorInfo(t.id);
    if ((creatorInfo && creatorInfo.salesName === salesName) || t.salesId === salesId) {
      if (t.status === 'Active') {
        myTemples.push(t);
      }
    }
  }
  
  let totalEarned = 0;
  const records: any[] = [];
  
  const overrides = salesName ? db_super_sales_overrides[salesName] : null;
  const rules = sales?.commissionRules || overrides || db_config.defaultSuperSalesRates;
  const setupRate = rules.templeSetupRate ?? rules.setupFeePercent ?? 20;
  const rentY1 = rules.templeRentRates?.[0] ?? rules.rentYear1Percent ?? 15;
  const rentY2 = rules.templeRentRates?.[1] ?? rules.rentYear2Percent ?? 12;
  const rentY3 = rules.templeRentRates?.[2] ?? rules.rentYear3PlusPercent ?? 10;

  const now = new Date();
  
  myTemples.forEach(t => {
    const activeDate = new Date(t.timestamp);
    const monthsDiff = (now.getFullYear() - activeDate.getFullYear()) * 12 + (now.getMonth() - activeDate.getMonth());
    
    // 1. 開辦費分潤 (只有第一個月才算)
    if (monthsDiff === 0) {
      const setupFeeCom = (t.setupFee || 12000) * (setupRate / 100);
      totalEarned += setupFeeCom;
      records.push({
        id: `${t.id}-setup`, 
        templeName: t.templeName, 
        date: t.timestamp.split('T')[0], 
        type: '開辦費分潤', 
        amount: setupFeeCom, 
        phase: 'Setup',
        calculation: `開辦費 $${(t.setupFee || 12000).toLocaleString()} * ${setupRate}%`
      });
    }

    // 2. 月租費分潤 (判斷年份/階梯)
    let rentPercent = rentY1;
    let yearLabel = '第一年';
    
    if (monthsDiff >= 12 && monthsDiff < 24) {
      rentPercent = rentY2;
      yearLabel = '第二年';
    } else if (monthsDiff >= 24) {
      rentPercent = rentY3;
      yearLabel = '第三年及以上';
    }
    
    const rentCom = (t.monthlyRent || 3600) * (rentPercent / 100);
    totalEarned += rentCom;
    
    records.push({
      id: `${t.id}-rent-${monthsDiff}`, 
      templeName: t.templeName, 
      date: new Date().toISOString().split('T')[0], 
      type: `月租提成 (${yearLabel})`, 
      amount: rentCom,
      percent: rentPercent,
      monthsDiff,
      calculation: `月租 $${(t.monthlyRent || 3600).toLocaleString()} * ${rentPercent}%`
    });
  });
  
  // 3. 手動獎金覆寫 (Bonus Overrides)
  const myBonuses = db_bonuses.filter(b => b.salesName === salesName);
  myBonuses.forEach(b => {
    totalEarned += b.amount;
    records.push({
      id: b.id,
      templeName: '管理員手動發放',
      date: b.date,
      type: '手動獎金覆寫',
      amount: b.amount,
      phase: 'Bonus',
      calculation: `理由: ${b.reason}`
    });
  });
  
  const wallet = db_wallets.find(w => w.name === salesName);
  
  return {
    totalEarned,
    balance: wallet ? wallet.balance : totalEarned, 
    totalWithdrawn: 0,
    records,
    rules
  }; 
}

export async function fetchSalesProfile(salesName: string) { 
  const sales = db_dist_sales.find(s => s.name === salesName);
  const dist = db_distributors.find(d => d.id === sales?.distributorId);
  return { name: salesName, parentDistributor: dist?.name || '無所屬', account: sales?.account }; 
}

export async function fetchRentPlans() { 
  return [
    { id: 'plan-1', name: '基礎數位方案', fee: 3600 },
    { id: 'plan-2', name: '進階營運方案', fee: 6800 },
    { id: 'plan-3', name: '企業旗艦方案', fee: 12000 }
  ]; 
}

// --- 經銷商 (Distributor) 相關功能 ---
export async function addSalesMember(data: any) { 
  const id = 'sales-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const newSales = { 
    id: id, 
    distributorId: data.distributorId || 'dist-1', 
    account: data.account || `sales_${id}`, 
    password: data.password || '12345678',
    role: 'DistributorSales',
    status: 'Active',
    joinedAt: new Date().toISOString().split('T')[0],
    commissionRules: {
      setupFeePercent: data.setupFeePercent || 20,
      rentYear1Percent: data.rentYear1Percent || 15,
      rentYear2Percent: data.rentYear2Percent || 10,
      rentYear3PlusPercent: data.rentYear3PlusPercent || 5
    },
    ...data 
  };
  db_dist_sales.push(newSales);

  await ensurePlatformTables();
  try {
    await dbQuery(`
      INSERT INTO dist_sales (id, distributor_id, name, account, password, role, status, joined_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT DO NOTHING
    `, [newSales.id, newSales.distributorId, newSales.name || '未命名業務員', newSales.account, newSales.password, newSales.role, newSales.status, newSales.joinedAt]);
  } catch (e) {
    console.error("DB Insert Error for sales:", e);
  }
  revalidatePath('/distributor');
  return { success: true, id }; 
}
export async function fetchDistributorTeam(distributorId: string) {
  let pgSales: any[] = [];
  try {
    const res = await dbQuery("SELECT * FROM dist_sales WHERE distributor_id = $1", [distributorId], () => null) as any;
    if (res && res.rows) {
      pgSales = res.rows;
    }
  } catch (e) {}

  const memSales = db_dist_sales.filter(s => s.distributorId === distributorId);
  const salesMap = new Map();
  memSales.forEach(s => salesMap.set(s.id, s));
  pgSales.forEach(s => salesMap.set(s.id, { ...s, distributorId: s.distributor_id, joinedAt: s.joined_at }));

  return Array.from(salesMap.values());
}
export async function fetchDistributorTemples(distributorId: string) {
  return db_temples.filter(t => t.distributorId === distributorId);
}
export async function fetchDistributorVisits(distributorId: string) {
  const teamIds = db_dist_sales.filter(s => s.distributorId === distributorId).map(s => s.name);
  return db_sales_visits.filter(v => teamIds.includes(v.salesName));
}
export async function fetchDistributorFinanceSummary(distributorId: string) {
  const team = db_dist_sales.filter(s => s.distributorId === distributorId);
  const myTemples = db_temples.filter(t => t.distributorId === distributorId && t.status === 'Active');
  
  let totalRevenue = 0;
  let totalCommissionPayout = 0;
  
  const now = new Date();

  myTemples.forEach(t => {
    const sales = team.find(s => s.id === t.salesId);
    const rules = sales?.commissionRules || { setupFeePercent: 20, rentYear1Percent: 15, rentYear2Percent: 10, rentYear3PlusPercent: 5 };
    const activeDate = new Date(t.timestamp);
    const monthsDiff = (now.getFullYear() - activeDate.getFullYear()) * 12 + (now.getMonth() - activeDate.getMonth());

    const setupFee = t.setupFee || 12000;
    const monthlyRent = t.monthlyRent || 3600;

    if (monthsDiff === 0) {
      totalRevenue += setupFee;
      totalCommissionPayout += setupFee * (rules.setupFeePercent / 100);
    }
    
    totalRevenue += monthlyRent;
    
    let rentPercent = rules.rentYear1Percent;
    if (monthsDiff >= 12 && monthsDiff < 24) rentPercent = rules.rentYear2Percent;
    else if (monthsDiff >= 24) rentPercent = rules.rentYear3PlusPercent;
    
    totalCommissionPayout += monthlyRent * (rentPercent / 100);
  });

  return {
    totalRevenue,
    totalCommissionPayout,
    netProfit: totalRevenue - totalCommissionPayout,
    activeTemplesCount: myTemples.length
  };
}
export async function approveTempleByDistributor(templeId: string) { 
  const idx = db_temples.findIndex(t => t.id === templeId);
  if (idx > -1) {
    db_temples[idx].status = 'Active';
    revalidatePath('/distributor');
    revalidatePath('/dist-sales');
  }
  return { success: true }; 
}
export async function rejectTempleByDistributor(templeId: string) { 
  db_temples = db_temples.filter(t => t.id !== templeId);
  revalidatePath('/distributor');
  revalidatePath('/dist-sales');
  return { success: true }; 
}
export type Organization = any;
export async function fetchOrganizations() { return []; }
export type AnalyticsSettings = any;
export async function updateAnalyticsSettings() { return { success: true }; }
export async function fetchAnalyticsSettings() { return {}; }
export async function fetchComplexAnalyticsData() { 
  const templeId = await getDynamicTempleId();

  // 1. Revenue Trends (Group by month for the past 6 months)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getMonth() + 1}月`,
      amount: 0
    });
  }

  const addRevenue = (dateStr: string | undefined, amount: number, tId?: string) => {
    if (!dateStr || amount <= 0) return;
    if (templeId && tId && templeId !== tId) return;
    
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return;
    
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    
    const monthObj = months.find(x => x.year === y && x.month === m);
    if (monthObj) {
      monthObj.amount += amount;
    }
  };

  db_appointments.forEach((a: any) => {
    if (a.paymentStatus !== 'Pending' && a.status !== 'Cancelled') {
      addRevenue(a.date || a.createdAt || a.timestamp, Number(a.amount) || 0, a.templeId);
    }
  });

  db_lamp_records.forEach((r: any) => {
    if (r.paymentStatus !== 'Pending') {
      let price = r.actualPrice || r.price || 0;
      if (!price && r.categoryId) {
         const cat = db_lamp_categories.find((c: any) => c.id === r.categoryId);
         if (cat) price = cat.price;
      }
      addRevenue(r.createdAt || r.date || r.timestamp, Number(price) || 0, r.templeId);
    }
  });

  db_event_registrations.forEach((r: any) => {
    if (r.paymentStatus !== 'Pending') {
      addRevenue(r.createdAt || r.timestamp || r.date, Number(r.actualPrice) || 0, r.templeId);
    }
  });

  // 2. Age Demographics
  let ageGroups = {
    '20歲以下': 0,
    '20-30歲': 0,
    '31-40歲': 0,
    '41-50歲': 0,
    '51-60歲': 0,
    '60歲以上': 0,
    '未提供': 0
  };
  
  let totalGuests = 0;

  db_guests.forEach((g: any) => {
    if (templeId && g.templeId && g.templeId !== templeId) return;
    
    totalGuests++;
    if (!g.birthday) {
      ageGroups['未提供']++;
      return;
    }
    
    const birthDate = new Date(g.birthday);
    if (isNaN(birthDate.getTime())) {
      ageGroups['未提供']++;
      return;
    }
    
    let age = now.getFullYear() - birthDate.getFullYear();
    const mm = now.getMonth() - birthDate.getMonth();
    if (mm < 0 || (mm === 0 && now.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 20) ageGroups['20歲以下']++;
    else if (age <= 30) ageGroups['20-30歲']++;
    else if (age <= 40) ageGroups['31-40歲']++;
    else if (age <= 50) ageGroups['41-50歲']++;
    else if (age <= 60) ageGroups['51-60歲']++;
    else ageGroups['60歲以上']++;
  });

  const ageDemographics = Object.entries(ageGroups)
    .filter(([k, v]) => v > 0 || k !== '未提供')
    .map(([range, count]) => ({
      range,
      percentage: totalGuests === 0 ? 0 : Math.round((count / totalGuests) * 100)
    }));

  // 3. Queue Stats
  let validEventIds: string[] | null = null;
  if (templeId) {
    validEventIds = db_queue_events.filter((e: any) => !e.templeId || e.templeId === templeId).map((e: any) => e.id);
  }

  let totalTickets = 0;
  let completedTickets = 0;
  
  db_queue_tickets.forEach((t: any) => {
    if (validEventIds && !validEventIds.includes(t.eventId)) return;
    totalTickets++;
    if (t.status === 'Completed') completedTickets++;
  });

  const completionRate = totalTickets === 0 ? 0 : Math.round((completedTickets / totalTickets) * 100);


  // --- New Analytics Sections ---
  // A. Overview
  let totalRevenue = 0;
  if (months.length > 0) {
    totalRevenue = months[months.length - 1].amount; // Only use the current month's accumulated revenue
  }
  
  // Calculate Conversion Rate
  let totalOrders = 0;
  let paidOrders = 0;
  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    totalOrders++;
    if (a.paymentStatus === 'Paid') paidOrders++;
  });
  const conversionRate = totalOrders === 0 ? 0 : Math.round((paidOrders / totalOrders) * 100);

  // B. Guest Demographics (New vs Returning)
  let newGuestCount = 0;
  let returningGuestCount = 0;
  
  const guestApptCounts: Record<string, number> = {};
  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    if (a.phone) {
      guestApptCounts[a.phone] = (guestApptCounts[a.phone] || 0) + 1;
    }
  });
  
  Object.values(guestApptCounts).forEach((count) => {
    if (count > 1) returningGuestCount++;
    else newGuestCount++;
  });
  
  const totalGuestTypes = newGuestCount + returningGuestCount;
  const newPercentage = totalGuestTypes === 0 ? 40 : Math.round((newGuestCount / totalGuestTypes) * 100);
  const returningPercentage = totalGuestTypes === 0 ? 60 : 100 - newPercentage;

  // C. Service Heat
  const serviceCounts: Record<string, number> = {};
  let totalServices = 0;
  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    if (a.service) {
      serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
      totalServices++;
    }
  });
  
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, count], index) => {
       const colors = ['bg-slate-900', 'bg-amber-500', 'bg-slate-300', 'bg-slate-200'];
       return {
         label,
         val: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100),
         color: colors[index % colors.length]
       };
    });

  if (sortedServices.length === 0) {
     sortedServices.push({ label: '暫無資料', val: 0, color: 'bg-slate-200' });
  }

  return {
    revenueTrends: months.map(m => ({ month: m.label, amount: m.amount })),
    ageDemographics: ageDemographics.length > 0 ? ageDemographics : [{ range: '無資料', percentage: 100 }],
    queueStats: {
      avgWaitTime: totalTickets > 0 ? '12' : '0',
      totalTickets: totalTickets.toString(),
      completionRate: completionRate.toString()
    },
    overview: {
      totalRevenue: totalRevenue,
      totalGuests: totalGuests,
      conversionRate: conversionRate,
      avgProcessingTime: totalTickets > 0 ? 12 : 0
    },
    genderDemographics: {
      newGuest: newPercentage,
      returning: returningPercentage,
      hasData: totalGuestTypes > 0
    },
    serviceHeat: sortedServices
  }; 
}
export async function fetchFinancialOverview() {
  const templeId = await getDynamicTempleId();
  
  const revenue: RevenueEntry[] = [];
  let totalRevenue = 0;

  db_lamp_records.filter(r => r.templeId === templeId && r.price > 0 && r.paymentStatus !== 'Pending').forEach(r => {
    revenue.push({
      id: r.id,
      title: r.categoryName,
      source: 'Lamp',
      amount: r.price,
      timestamp: r.createdAt || r.date,
      guestName: r.guestName || r.phone,
      paymentMethod: '現金/臨櫃',
      status: 'Paid'
    });
    totalRevenue += r.price;
  });

  const myEvents = db_events.filter(e => e.templeId === templeId).map(e => e.id);
  db_event_registrations.filter(r => myEvents.includes(r.eventId) && r.paymentStatus === 'Paid').forEach(r => {
    revenue.push({
      id: r.id,
      title: r.title,
      source: 'Event',
      amount: r.actualPrice || r.price,
      timestamp: r.timestamp || new Date().toISOString(),
      guestName: r.guestName || r.phone,
      paymentMethod: '現金/臨櫃',
      status: 'Paid'
    });
    totalRevenue += (r.actualPrice || r.price);
  });

  const myServices = db_services.filter(s => s.templeId === templeId).map(s => s.id);
  db_appointments.filter(a => myServices.includes(a.serviceId) && a.paymentStatus === 'Paid').forEach(a => {
    revenue.push({
      id: a.id,
      title: a.service,
      source: 'Appointment',
      amount: a.amount || 0,
      timestamp: a.date,
      guestName: a.guestName || a.phone,
      paymentMethod: a.paymentMethod || '現金/臨櫃',
      status: 'Paid'
    });
    totalRevenue += (a.amount || 0);
  });

  db_deep_records.filter(r => (!r.templeId || r.templeId === templeId) && (r.id.startsWith('MERIT-') || r.serviceType.includes('功德'))).forEach(r => {
    let amt = 0;
    if (r.values && r.values['金額']) {
      amt = Number(String(r.values['金額']).replace(/[^0-9]/g, ''));
    }
    revenue.push({
      id: r.id,
      title: r.serviceType,
      source: 'Merit',
      amount: amt,
      timestamp: r.date,
      guestName: r.guestName || (r.values && r.values['付款人']) || r.phone || '信眾',
      paymentMethod: (r.values && r.values['支付方式']) || '現金/臨櫃',
      status: 'Paid'
    });
    totalRevenue += amt;
  });

  db_queue_tickets.filter(t => t.paymentStatus === 'Paid' && (!t.templeId || t.templeId === templeId)).forEach(t => {
    revenue.push({
      id: t.id,
      title: '現場排隊服務',
      source: 'Queue',
      amount: t.price || 0,
      timestamp: t.scannedAt || t.date || new Date().toISOString().split('T')[0],
      guestName: t.phone || '現場信眾',
      paymentMethod: '現金/臨櫃',
      status: 'Paid'
    });
    totalRevenue += (t.price || 0);
  });

  revenue.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const expenses: ExpenseEntry[] = db_temple_bills
    .filter(b => b.templeId === templeId)
    .map(b => ({
      id: b.id,
      type: b.type,
      amount: b.amount,
      dueDate: b.dueDate,
      status: b.status,
      billingDate: b.billingDate,
      payeeRole: b.payeeRole,
      payeeId: b.payeeId
    }));
  
  const pendingExpense = expenses.filter(e => e.status === 'Unpaid').reduce((acc, e) => acc + e.amount, 0);

  return {
    revenue,
    expenses,
    totalRevenue,
    pendingExpense,
    lastMonthGrowth: '+12%'
  };
}
export async function markAppointmentCompleted() { return { success: true }; }

let db_bonuses: any[] = initGlobal('db_bonuses', []);
let db_withdrawals: any[] = initGlobal('db_withdrawals', []);
let db_notifications: any[] = initGlobal("db_notifications", []);

export async function applyBonusOverride(salesName: string, amount: number, reason: string) {
  const newBonus = {
    id: `BONUS-${Date.now()}`,
    salesName,
    amount,
    reason,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  db_bonuses.push(newBonus);

  db_notifications.unshift({
    id: `N-BONUS-${Date.now()}`,
    title: '手動獎金撥發通知',
    content: `管理員已為您撥發手動獎金 $${amount.toLocaleString()}，原因：${reason}`,
    date: new Date().toISOString().split('T')[0],
    isRead: false
  });

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}

export async function fetchSuperSalesBonuses(salesName: string) {
  return db_bonuses.filter(b => b.salesName === salesName);
}

export async function fetchAllWithdrawals() {
  return withTempleSession(null, true, async (client) => {
    if (!client) return [...db_withdrawals];
    const res = await client.query('SELECT * FROM withdrawals ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      salesName: r.sales_name,
      amount: r.amount,
      status: r.status,
      date: r.date instanceof Date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}` : r.date
    }));
  });
}

export async function approveWithdrawal(id: string) { 
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      const w = db_withdrawals.find(x => x.id === id);
      if (w) w.status = 'Approved';
    } else {
      await client.query("UPDATE withdrawals SET status = 'Approved' WHERE id = $1", [id]);
    }
    revalidatePath('/super-admin');
    return { success: true }; 
  });
}

export async function rejectWithdrawal(id: string) { 
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      const w = db_withdrawals.find(x => x.id === id);
      if (w) w.status = 'Rejected';
    } else {
      const wRes = await client.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
      if ((wRes.rowCount ?? 0) > 0) {
        const w = wRes.rows[0];
        await client.query("UPDATE withdrawals SET status = 'Rejected' WHERE id = $1", [id]);
        await client.query("UPDATE wallets SET balance = balance + $1 WHERE name = $2", [w.amount, w.sales_name]);
      }
    }
    revalidatePath('/super-admin');
    return { success: true }; 
  });
}

export async function updateServiceSettings(settings: any) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = db_service_settings_mock.findIndex(x => x.templeId === templeId);
      if (idx !== -1) db_service_settings_mock[idx] = { templeId, ...settings };
      else db_service_settings_mock.push({ templeId, ...settings });
      return { success: true };
    }
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS temple_settings (
        temple_id VARCHAR(50) PRIMARY KEY REFERENCES temples(id) ON DELETE CASCADE,
        settings JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    
    const res = await client.query('SELECT 1 FROM temple_settings WHERE temple_id = $1', [templeId]);
    if (res.rowCount > 0) {
      await client.query('UPDATE temple_settings SET settings = $1 WHERE temple_id = $2', [JSON.stringify(settings), templeId]);
    } else {
      await client.query('INSERT INTO temple_settings (temple_id, settings) VALUES ($1, $2)', [templeId, JSON.stringify(settings)]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchEarningsStats(salesId: string = '超級精英業務') { 
  const sales = db_dist_sales.find(s => s.id === salesId);
  const salesName = sales?.name || salesId;
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      const history = await fetchCommissionHistory(salesId, "2026", "05");
      const wallet = db_wallets.find(w => w.name === salesName);
      return { 
        balance: wallet ? wallet.balance : history.totalEarned, 
        pending: 0, 
        totalWithdrawn: 0 
      };
    } else {
      const wRes = await client.query('SELECT balance FROM wallets WHERE name = $1', [salesName]);
      const balance = (wRes.rowCount ?? 0) > 0 ? Number(wRes.rows[0].balance) : 0;
      
      const wdRes = await client.query("SELECT SUM(amount) as total FROM withdrawals WHERE sales_name = $1 AND status = 'Approved'", [salesName]);
      const totalWithdrawn = Number(wdRes.rows[0]?.total || 0);

      const pendingRes = await client.query("SELECT SUM(amount) as total FROM withdrawals WHERE sales_name = $1 AND status = 'Pending'", [salesName]);
      const pending = Number(pendingRes.rows[0]?.total || 0);

      return {
        balance,
        pending,
        totalWithdrawn
      };
    }
  });
}

export async function requestWithdrawal(salesName: string, amount: number) { 
  return withTempleSession(null, true, async (client) => {
    if (!client) {
      const wallet = db_wallets.find(w => w.name === salesName);
      const maxBalance = wallet ? wallet.balance : 124500;
      if (amount > maxBalance) return { success: false, error: '餘額不足' };
      
      if (wallet) {
        wallet.balance -= amount;
      }
      
      const newW = {
        id: `WD-${Date.now()}`,
        salesName,
        amount,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      };
      db_withdrawals.push(newW);
    } else {
      const wRes = await client.query('SELECT balance FROM wallets WHERE name = $1', [salesName]);
      if ((wRes.rowCount ?? 0) === 0) return { success: false, error: '找不到該錢包帳戶' };
      const balance = Number(wRes.rows[0].balance);
      if (amount > balance) return { success: false, error: '餘額不足' };

      await client.query('UPDATE wallets SET balance = balance - $1 WHERE name = $2', [amount, salesName]);

      const wdId = `WD-${Date.now()}`;
      await client.query(
        'INSERT INTO withdrawals (id, sales_name, amount, status, date) VALUES ($1, $2, $3, $4, $5)',
        [wdId, salesName, amount, 'Pending', new Date()]
      );
    }
    revalidatePath('/super-admin');
    return { success: true }; 
  });
}

let db_password_resets: any[] = initGlobal('db_password_resets', []);

export async function requestPasswordReset(salesName: string) {
  const newReq = {
    id: `PR-${Date.now()}`,
    salesName,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  };
  db_password_resets.unshift(newReq);

  db_notifications.unshift({
    id: `N-PR-${Date.now()}`,
    title: '密碼重設申請',
    content: `超級業務「${salesName}」發起了密碼重設請求，請至核定中心處理。`,
    date: new Date().toISOString().split('T')[0],
    isRead: false
  });
  revalidatePath('/super-admin');
  return { success: true };
}

export async function fetchPasswordResets() {
  return [...db_password_resets];
}

export async function handlePasswordReset(id: string, action: 'Approve' | 'Reject') {
  const req = db_password_resets.find(r => r.id === id);
  if (!req) return { success: false, error: 'Request not found' };

  req.status = action === 'Approve' ? 'Approved' : 'Rejected';
  
  db_notifications.unshift({
    id: `N-PR-RES-${Date.now()}`,
    title: action === 'Approve' ? '密碼重設核准' : '密碼重設拒絕',
    content: action === 'Approve' 
      ? `您的密碼重設申請已核准。臨時密碼為：Pivot${Math.floor(1000 + Math.random() * 9000)}，請登入後立即修改。` 
      : `您的密碼重設申請已被管理員退回。`,
    date: new Date().toISOString().split('T')[0],
    isRead: false
  });

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}

export async function fetchNotifications(userRole: string) {
  return [...db_notifications];
}
export type StorageInfo = any;
export async function upgradeStorage() { return { success: true }; }
export async function uploadCustomerMedia(phone: string, url: string, type: 'photo' | 'video' | 'file', uploadedBy: string = 'Temple', customName?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (client) {
       const sRes = await client.query("SELECT * FROM temple_storages WHERE temple_id = $1", [templeId]);
       if ((sRes.rowCount ?? 0) > 0) {
         const storage = sRes.rows[0];
         if (Number(storage.used_bytes) >= Number(storage.allocated_bytes)) {
           return { success: false, error: '宮廟雲端空間已滿，無法上傳檔案。' };
         }
         await client.query("UPDATE temple_storages SET used_bytes = used_bytes + $1 WHERE temple_id = $2", [5 * 1024 * 1024, templeId]);
       }
    }
    const newId = `f-${Date.now()}`;
    const newFile = {
      id: newId,
      phone,
      url,
      type,
      name: customName || (type === 'photo' ? '現場祭祀/服務相片歸檔' : type === 'video' ? '消災祈福法會影像歸檔' : '信眾點燈與祈福案卡檔案'),
      folder: new Date().toISOString().split('T')[0],
      uploadedBy: uploadedBy
    };

    // Always push to in-memory first for reliability
    db_guest_files.push(newFile);
    gStore.db_guest_files = db_guest_files;

    if (client) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guest_files (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL ,
          url TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          folder VARCHAR(50) NOT NULL,
          uploaded_by VARCHAR(50) NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id, temple_id)
        )
      `);
      
      const normPhone = normalizePhone(phone);
      const guestRes = await client.query("SELECT phone FROM guests WHERE REPLACE(phone, '-', '') = $1", [normPhone]);
      const dbPhone = guestRes.rows[0]?.phone || phone;
      
      await client.query(`
        INSERT INTO guest_files (id, temple_id, phone, url, type, name, folder, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newId, templeId, dbPhone, url, type, newFile.name, newFile.folder, newFile.uploadedBy]);
    }

    await revalidateTemple();
    return { success: true };
  });
}
export async function createPersonnel(formData: FormData) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const name = formData.get('name') as string;
    const account = formData.get('account') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const newId = `p-${Date.now()}`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;

    if (!client) {
      const current = gStore.db_personnel || db_personnel;
      const newPersonnel = {
        id: newId,
        templeId,
        name,
        account,
        phone,
        password,
        role,
        status: 'Active',
        avatar,
        serviceCount: 0,
        permissions: role === 'TempleAdmin' ? ['all'] : ['calendar', 'customers']
      };
      gStore.db_personnel = [...current, newPersonnel];
      db_personnel = gStore.db_personnel;
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS personnel (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(255) NOT NULL,
          account VARCHAR(255) NOT NULL,
          phone VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'Active',
          avatar VARCHAR(255),
          permissions TEXT[],
          PRIMARY KEY (id, temple_id)
        )
      `);
      const defaultPerms = role === 'TempleAdmin' ? ['all'] : ['calendar', 'customers'];
      await client.query(`
        INSERT INTO personnel (id, temple_id, name, role, account, phone, password, status, avatar, permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [newId, templeId, name, role, account, phone, password, 'Active', avatar, defaultPerms]);
    }
    await revalidateTemple();
    await logSystemEvent('SUCCESS', '新增人員', `人員名稱：${name}`, '管理員', templeId);
    return { success: true };
  });
}

export async function deletePersonnel(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const personnel = db_personnel.find((p: any) => p.id.toString() === id.toString() && p.templeId === templeId);
    if (personnel) {
      const hasAppointments = db_appointments.some((a: any) => a.staff === personnel.name && a.status !== 'Completed' && a.templeId === templeId);
      const hasSlots = db_slots.some((s: any) => s.staff === personnel.name && s.status !== 'Completed' && s.templeId === templeId);
      if (hasAppointments || hasSlots) {
        return { success: false, message: '此人員目前尚有預約服務或已排班時段，請先清空後再進行刪除！' };
      }
    }

    if (!client) {
      db_personnel = gStore.db_personnel = db_personnel.filter((p: any) => p.id.toString() !== id.toString());
    } else {
      await client.query('DELETE FROM personnel WHERE id = $1 AND temple_id = $2', [id, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function updateAccountPermissions(id: string, permissions: string[]) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = db_personnel.findIndex((p: any) => p.id.toString() === id.toString());
      if (idx > -1) {
        db_personnel[idx].permissions = permissions;
        gStore.db_personnel = db_personnel;
      }
    } else {
      await client.query('UPDATE personnel SET permissions = $1 WHERE id = $2 AND temple_id = $3', [permissions, id, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function updateAccountPassword(id: string, newPass: string, role?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      if (role === 'Temple' || id.startsWith('temple-')) {
         const idx = db_personnel.findIndex((p: any) => p.templeId === id);
         if (idx > -1) { db_personnel[idx].password = newPass; gStore.db_personnel = db_personnel; }
      } else if (role === 'Distributor') {
         const idx = db_distributors.findIndex((p: any) => p.id === id);
         if (idx > -1) { db_distributors[idx].password = newPass; gStore.db_distributors = db_distributors; }
      } else if (role === 'SuperSales' || role === 'DistSales') {
         const idx = db_dist_sales.findIndex((p: any) => p.id === id);
         if (idx > -1) { db_dist_sales[idx].password = newPass; gStore.db_dist_sales = db_dist_sales; }
      } else {
         const idx = db_personnel.findIndex((p: any) => p.id.toString() === id.toString());
         if (idx > -1) { db_personnel[idx].password = newPass; gStore.db_personnel = db_personnel; }
      }
    } else {
      await client.query('UPDATE personnel SET password = $1 WHERE id = $2 OR temple_id = $2', [newPass, id]);
    }
    return { success: true };
  });
}

// --- 經銷總部分階資料獲取 ---
export async function fetchDistributorProfile(distId?: string) { 
  const id = distId || 'dist-1';
  return { ...(db_distributors.find(d => d.id === id) || db_distributors[0]) }; 
}
export async function fetchDistributorCommissionSummary(distId: string, year: string, month: string) { 
  const id = distId || 'dist-1';
  const summary = await fetchDistributorFinanceSummary(id);
  return {
    totalRevenue: summary.totalRevenue,
    netProfit: summary.netProfit,
    balance: summary.netProfit * 0.8, // 模擬部分已結算
    totalWithdrawn: summary.netProfit * 0.2,
    rules: {
      baseRate: '20%',
      bonusThreshold: '50 Nodes',
      lastAudit: '2026-05-01'
    }
  };
}

// --- 中央數據樞紐 ---
export async function fetchGlobalTempleData() {
  const templeId = await getDynamicTempleId();
  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      // In-Memory Fallback
      let todayAppointments = 0; let completedAppointments = 0; let totalServices = 0;
      const serviceCounts: Record<string, number> = {};
      const apps = db_appointments.filter((a: any) => !a.templeId || a.templeId === templeId);
      apps.forEach((a: any) => {
        if (a.service) { serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1; totalServices++; }
        if (a.date === todayStr) {
          todayAppointments++;
          if (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid') completedAppointments++;
        }
      });
      const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, count], index) => {
        const colors = ['bg-indigo-500', 'bg-blue-400', 'bg-sky-300'];
        return { label, val: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100), color: colors[index % colors.length] };
      });
      if (sortedServices.length === 0) sortedServices.push({ label: '目前無預約', val: 0, color: 'bg-slate-200' });
      const validEventIds = db_queue_events.filter((e: any) => e.status === 'Active' && (!e.templeId || e.templeId === templeId));
      const qActive = validEventIds.map((evt: any) => {
        const tix = db_queue_tickets.filter((t: any) => t.eventId === evt.id);
        const waiting = tix.filter((t: any) => t.status === 'Queuing').length;
        const completed = tix.filter((t: any) => t.status === 'Completed').length;
        return { title: evt.title, waiting, completed };
      });
      const guests = db_guests.filter((g: any) => !g.templeId || g.templeId === templeId);
      const totalGuests = guests.length;
      let totalLamps = 0; let activeLamps = 0;
      db_lamp_records.forEach((l: any) => {
        if (templeId && l.templeId && l.templeId !== templeId) return;
        totalLamps++;
        if (l.status === 'Active' || l.paymentStatus === 'Paid') activeLamps++;
      });
      return { analyticsSettings: {}, analyticsData: { todayAppointments, completedAppointments, totalGuests, lampStats: { totalLamps, activeLamps }, serviceHeat: sortedServices }, raw: { apps, agiStats: {}, guests, storageInfo: { used: 12.5, total: 100 }, qActive } };
    } else {
      // PostgreSQL Realization
      const guestsRes = await client.query('SELECT phone, name FROM guests WHERE temple_id = $1', [templeId]);
      const totalGuests = guestsRes.rowCount || 0;
      
      const appsRes = await client.query('SELECT id, guest_id as "guestId", service, date, time, status, payment_status as "paymentStatus" FROM appointments WHERE temple_id = $1', [templeId]);
      const apps = appsRes.rows;
      let todayAppointments = 0; let completedAppointments = 0; let totalServices = 0;
      const serviceCounts: Record<string, number> = {};
      apps.forEach((a: any) => {
        if (a.service) { serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1; totalServices++; }
        if (a.date === todayStr) {
          todayAppointments++;
          if (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid') completedAppointments++;
        }
      });
      const sortedServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, count], index) => {
        const colors = ['bg-indigo-500', 'bg-blue-400', 'bg-sky-300'];
        return { label, val: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100), color: colors[index % colors.length] };
      });
      if (sortedServices.length === 0) sortedServices.push({ label: '目前無預約', val: 0, color: 'bg-slate-200' });

      const lampsRes = await client.query('SELECT status, payment_status FROM lamp_records WHERE temple_id = $1', [templeId]);
      let totalLamps = lampsRes.rowCount || 0;
      let activeLamps = lampsRes.rows.filter(l => l.status === 'Active' || l.payment_status === 'Paid').length;

      const qEventsRes = await client.query('SELECT id, title FROM queue_events WHERE status = \'Active\' AND temple_id = $1', [templeId]);
      const qActive = await Promise.all(qEventsRes.rows.map(async (evt) => {
        const tRes = await client.query('SELECT status FROM queue_tickets WHERE event_id = $1 AND temple_id = $2', [evt.id, templeId]);
        const waiting = tRes.rows.filter(t => t.status === 'Queuing').length;
        const completed = tRes.rows.filter(t => t.status === 'Completed').length;
        return { title: evt.title, waiting, completed };
      }));

      return { 
        analyticsSettings: {}, 
        analyticsData: { todayAppointments, completedAppointments, totalGuests, lampStats: { totalLamps, activeLamps }, serviceHeat: sortedServices }, 
        raw: { apps, agiStats: {}, guests: guestsRes.rows, storageInfo: { used: 12.5, total: 100 }, qActive } 
      };
    }
  });
}

// --- 信眾檔案 (Customers) 相關 mock 函式與型別 ---
export type ServiceForm = any;
export type DeepRecord = any;
export type GuestFile = any;
export type ServiceDefinition = any;
export type GuestRecord = any;
export type LampCategory = any;

let db_guests: any[] = initGlobal("db_guests", []);

export async function fetchGuests() {
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
}
export async function searchGuestsByNameOrPhone(query: string) {
  if (!query) return [];
  const normalizedQuery = query.trim().toLowerCase();
  
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const seen = new Set();
      db_guests = db_guests.filter((g: any) => {
        const p = normalizePhone(g.phone);
        if (seen.has(p)) return false;
        seen.add(p);
        return true;
      });
      gStore.db_guests = db_guests;
      
      return db_guests.filter((g: any) => 
        g.name.toLowerCase().includes(normalizedQuery) || 
        normalizePhone(g.phone).includes(normalizePhone(normalizedQuery))
      );
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL,
          PRIMARY KEY (temple_id, phone),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255),
          address TEXT,
          birthday VARCHAR(50),
          lunar_birthday VARCHAR(255),
          birth_hour VARCHAR(50),
          line_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const res = await client.query(`
        SELECT * FROM guests 
        WHERE LOWER(name) LIKE $1 
        OR REPLACE(phone, '-', '') LIKE $2
        ORDER BY created_at DESC
      `, [`%${normalizedQuery}%`, `%${normalizePhone()}%`]);
      
      return res.rows.map(r => ({
        phone: r.phone,
        name: r.name,
        email: r.email || '',
        password: r.password || '',
        address: r.address || '',
        birthday: r.birthday || '',
        lunarBirthday: r.lunar_birthday || '',
        birthHour: r.birth_hour || '',
        lineId: r.line_id || '',
        status: r.status || 'Active',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=B91C1C&color=fff`
      }));
    }
  });
}

export async function checkGuestProfile(phone: string) {
  const normPhone = normalizePhone(phone);
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_guests.find((g: any) => normalizePhone(g.phone) === normPhone) || null;
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL,
          PRIMARY KEY (temple_id, phone),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255),
          address TEXT,
          birthday VARCHAR(50),
          lunar_birthday VARCHAR(255),
          birth_hour VARCHAR(50),
          line_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const res = await client.query('SELECT * FROM guests WHERE REPLACE(phone, \'-\', \'\') = $1', [normPhone]);
      if ((res.rowCount ?? 0) === 0) return null;
      const r = res.rows[0];
      return {
        phone: r.phone,
        name: r.name,
        email: r.email || '',
        password: r.password || '',
        address: r.address || '',
        birthday: r.birthday || '',
        lunarBirthday: r.lunar_birthday || '',
        birthHour: r.birth_hour || '',
        lineId: r.line_id || '',
        status: r.status || 'Active',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=B91C1C&color=fff`
      };
    }
  });
}

export async function createOrUpdateGuest(d: any, originalPhone?: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const lookupPhone = originalPhone || d.phone;
    
    if (!client) {
      // 避免將手機號碼修改成其他已存在的號碼
      if (originalPhone && originalPhone !== d.phone) {
        const conflict = db_guests.find((g: any) => g.phone === d.phone && g.templeId === templeId);
        if (conflict) {
          return { success: false, error: "此手機號碼已被其他信眾檔案使用！" };
        }
      }

      const idx = db_guests.findIndex((g: any) => g.phone === lookupPhone && g.templeId === templeId);
      if (idx > -1) {
        db_guests[idx] = { ...db_guests[idx], ...d };
      } else {
        // 建立新信眾時，防範重複手機號碼
        const exists = db_guests.find((g: any) => g.phone === d.phone && g.templeId === templeId);
        if (exists) {
          return { success: false, error: "此手機號碼的信眾檔案已存在！" };
        }
        // 若未填帳號，預設使用手機
        if (!d.account) d.account = d.phone;
        d.templeId = templeId;
        db_guests.push(d);
      }
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL,
          PRIMARY KEY (temple_id, phone),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255),
          address TEXT,
          birthday VARCHAR(50),
          lunar_birthday VARCHAR(255),
          birth_hour VARCHAR(50),
          line_id VARCHAR(255),
          status VARCHAR(50) DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      if (originalPhone && originalPhone !== d.phone) {
        const conflictRes = await client.query('SELECT 1 FROM guests WHERE temple_id = $1 AND phone = $2', [templeId, d.phone]);
        if ((conflictRes.rowCount ?? 0) > 0) {
          return { success: false, error: "此手機號碼已被其他信眾檔案使用！" };
        }
      }
      
      const checkRes = await client.query('SELECT 1 FROM guests WHERE temple_id = $1 AND phone = $2', [templeId, lookupPhone]);
      if ((checkRes.rowCount ?? 0) > 0) {
        // Update! COALESCE($9, line_id) ensures that if the frontend doesn't provide a lineId, the existing one in the DB is not overwritten by null.
        await client.query(`
          UPDATE guests 
          SET phone = $1, name = $2, email = $3, password = $4, address = $5, birthday = $6, lunar_birthday = $7, birth_hour = $8, line_id = COALESCE($9, line_id), status = $10
          WHERE temple_id = $11 AND phone = $12
        `, [
          d.phone, d.name, d.email || null, d.password || null, d.address || null,
          d.birthday || null, d.lunarBirthday || null, d.birthHour || null, d.lineId || null, d.status || 'Active',
          templeId, lookupPhone
        ]);
        
        if (lookupPhone !== d.phone) {
           await client.query('UPDATE appointments SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
           await client.query('UPDATE lamp_records SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
           await client.query('UPDATE event_registrations SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
           await client.query('UPDATE queue_tickets SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
           await client.query('UPDATE deep_records SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
           await client.query('UPDATE activities SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
           await client.query('UPDATE guest_files SET phone = $1 WHERE temple_id = $2 AND phone = $3', [d.phone, templeId, lookupPhone]);
        }
      } else {
        // Insert!
        await client.query(`
          INSERT INTO guests (temple_id, phone, name, email, password, address, birthday, lunar_birthday, birth_hour, line_id, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          templeId, d.phone, d.name, d.email || null, d.password || null, d.address || null,
          d.birthday || null, d.lunarBirthday || null, d.birthHour || null, d.lineId || null, d.status || 'Active'
        ]);
      }
    }
    await revalidateTemple();
    return { success: true }; 
  });
}
export async function fetchGuestHistory(p: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    let files = db_guest_files.filter((f: any) => normCompare(f.phone, p));
    if (client) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guest_files (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          phone VARCHAR(50) NOT NULL ,
          url TEXT NOT NULL,
          type VARCHAR(50) NOT NULL,
          name VARCHAR(255) NOT NULL,
          folder VARCHAR(50) NOT NULL,
          uploaded_by VARCHAR(50) NOT NULL,
          uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id, temple_id)
        )
      `);
      
      const normPhone = normalizePhone(p);
      const guestRes = await client.query("SELECT phone FROM guests WHERE REPLACE(phone, '-', '') = $1", [normPhone]);
      const dbPhone = guestRes.rows[0]?.phone || p;
      
      const res = await client.query('SELECT * FROM guest_files WHERE temple_id = $1 AND phone = $2 AND temple_id = $2 ORDER BY uploaded_at DESC', [dbPhone, templeId]);
      if ((res.rowCount ?? 0) > 0) {
        files = res.rows.map(r => ({
          id: r.id,
          phone: r.phone,
          url: r.url,
          type: r.type,
          name: r.name,
          folder: r.folder,
          uploadedBy: r.uploaded_by,
          uploadedAt: r.uploaded_at instanceof Date ? r.uploaded_at.toISOString().replace('T', ' ').slice(0, 19) : r.uploaded_at
        }));
      }
      const appsRes = await client.query('SELECT id, temple_id as "templeId", date, time, staff, guest_name as "guestName", service, service_id as "serviceId", status, phone, payment_method as "paymentMethod", payment_ref as "paymentRef", payment_status as "paymentStatus", amount FROM appointments WHERE REPLACE(phone, \'-\', \'\') = $1 AND temple_id = $2', [normPhone, templeId]);
      const lampsRes = await client.query('SELECT id, temple_id as "templeId", guest_name as "guestName", phone, lamp_type as "lampType", amount, status, created_at as "createdAt", payment_method as "paymentMethod", payment_ref as "paymentRef", payment_status as "paymentStatus" FROM lamp_records WHERE REPLACE(phone, \'-\', \'\') = $1 AND temple_id = $2', [normPhone, templeId]);
      const queueRes = await client.query('SELECT id, event_id as "eventId", temple_id as "templeId", event_title as "eventTitle", phone, guest_name as "guestName", status, assigned_number as "assignedNumber", actual_order as "actualOrder", payment_status as "paymentStatus", created_at as "createdAt" FROM queue_tickets WHERE REPLACE(phone, \'-\', \'\') = $1 AND temple_id = $2', [normPhone, templeId]);
      const eventsRes = await client.query('SELECT id, event_id as "eventId", temple_id as "templeId", title, phone, guest_name as "guestName", price, payment_status as "paymentStatus", actual_price as "actualPrice", timestamp as "createdAt" FROM event_registrations WHERE REPLACE(phone, \'-\', \'\') = $1 AND temple_id = $2', [normPhone, templeId]);

      return {
        appointments: appsRes.rows,
        records: db_deep_records.filter((r: any) => normCompare(r.phone, p)),
        files: files,
        lampRecords: lampsRes.rows,
        activities: db_activities.filter((a: any) => normCompare(a.phone, p)),
        queueTickets: queueRes.rows,
        eventRegistrations: eventsRes.rows
      };
    }

    const apps = db_appointments.filter((a: any) => normCompare(a.phone, p));
    apps.forEach((app: any) => {
      if (!app.serviceId) {
        const slot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff && s.description === app.service);
        if (slot && (slot.bound_service_id || slot.serviceId)) {
          app.serviceId = slot.bound_service_id || slot.serviceId;
        }
      }
    });

    return { 
      appointments: apps, 
      records: db_deep_records.filter((r: any) => normCompare(r.phone, p)), 
      files: files, 
      lampRecords: db_lamp_records.filter((l: any) => normCompare(l.phone, p)), 
      activities: db_activities.filter((a: any) => normCompare(a.phone, p)),
      queueTickets: db_queue_tickets.filter((t: any) => normCompare(t.phone, p)),
      eventRegistrations: db_event_registrations.filter((e: any) => normCompare(e.phone, p))
    }; 
  });
}

export async function fetchGuestRecords(phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, [], async (client) => {
    // Memory fallback currently used for records
    const normPhone = phone.replace(/-/g, '');
    return db_deep_records.filter((r: any) => r.phone && r.phone.replace(/-/g, '') === normPhone);
  });
}

export async function updateDeepRecord(recordId: string, phone: string, staffName: string, values: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, { success: false, message: "失敗" }, async (client) => {
    // Memory fallback
    const idx = db_deep_records.findIndex((r: any) => r.id === recordId);
    if (idx !== -1) {
      db_deep_records[idx] = {
        ...db_deep_records[idx],
        values,
        staffName,
        timestamp: new Date().toISOString()
      };
      gStore.db_deep_records = db_deep_records;

      const serviceType = db_deep_records[idx].serviceType;
      
      db_activities.unshift({
        id: `act-${Date.now()}`,
        phone,
        type: 'RECORD_MODIFIED',
        content: `修改【${serviceType}】紀錄歸檔`,
        timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
      });
      gStore.db_activities = db_activities;

      await revalidateTemple();
      return { success: true, message: "紀錄已更新" };
    }
    return { success: false, message: "找不到指定的案卷紀錄" };
  });
}
export async function saveDeepRecord(phone: string, eventId: string, serviceType: string, staffName: string, values: any) {
  const templeId = await getDynamicTempleId();
  const newRecord = {
    id: `rec-${Date.now()}`,
    templeId,
    phone,
    eventId,
    serviceType,
    staffName,
    values,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  
  db_deep_records.push(newRecord);
  gStore.db_deep_records = db_deep_records;

  let activityContent = `完成【${serviceType}】紀錄歸檔`;
  if (serviceType.includes('功德')) {
    const amount = values['金額'] || '';
    const payer = values['付款人'] || '';
    const method = values['支付方式'] || '';
    activityContent = `完成【${serviceType}】錄入: ${amount} (由${payer}以${method}支付)`;
  }

  // Also add to activities for unified log display
  db_activities.unshift({
    id: `act-${Date.now()}`,
    phone,
    type: 'RECORD_ADDED',
    content: activityContent,
    timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
  });
  gStore.db_activities = db_activities;

  await revalidateTemple();
    return { success: true, record: newRecord };
}
export async function fetchAllFilesByDate() { return []; }
export async function setFilePrivacy() { return { success: true }; }
export async function updateGuestPassword() { return { success: true }; }

// --- 點燈管理 (Lamps) 相關 mock 函式與型別 ---
export type LampRecord = any;

export async function fetchGuestByPhone(p: string) { 
  return db_guests.find((g: any) => g.phone === p) || null; 
}
export async function confirmPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      if (recordType === 'Lamp') {
        const idx = db_lamp_records.findIndex(r => r.id === recordId);
        if (idx > -1) {
          db_lamp_records[idx].paymentStatus = 'Paid';
        }
      }
      if (recordType === 'Appointment') {
        const idx = db_appointments.findIndex(r => r.id.toString() === recordId.toString());
        if (idx > -1) {
          db_appointments[idx].status = 'Confirmed';
          db_appointments[idx].paymentStatus = 'Paid';
        }
      }
      if (recordType === 'Event') {
        const idx = db_event_registrations.findIndex(r => r.id === recordId);
        if (idx > -1) {
          db_event_registrations[idx].paymentStatus = 'Paid';
        }
      }
      if (recordType === 'Queue') {
        if (typeof db_queue_tickets !== 'undefined') {
          const idx = db_queue_tickets.findIndex(r => r.id === recordId);
          if (idx > -1) {
            db_queue_tickets[idx].paymentStatus = 'Paid';
          }
        }
      }
    } else {
      if (recordType === 'Appointment') {
        await client.query('UPDATE appointments SET status = \'Confirmed\', payment_status = \'Paid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
      if (recordType === 'Lamp') {
        await client.query('UPDATE lamp_records SET payment_status = \'Paid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
      if (recordType === 'Event') {
        await client.query('UPDATE event_registrations SET payment_status = \'Paid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
      if (recordType === 'Queue') {
        await client.query('UPDATE queue_tickets SET payment_status = \'Paid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function createLampRecord(data: any) { 
  let phone = ''; let categoryId = ''; let guestName = ''; let notice = ''; let paymentMethod = ''; let paymentRef = '';
  if (data instanceof FormData) {
    phone = data.get('phone') as string; categoryId = data.get('categoryId') as string; guestName = data.get('guestName') as string; notice = data.get('notice') as string; paymentMethod = data.get('paymentMethod') as string || 'Cash'; paymentRef = data.get('paymentRef') as string || '';
  } else {
    phone = data.phone; categoryId = data.categoryId; guestName = data.guestName; notice = data.notice; paymentMethod = data.paymentMethod || 'Cash'; paymentRef = data.paymentRef || '';
  }

  const templeId = await getDynamicTempleId();

  return withTempleSession(templeId, false, async (client) => {
    let cat: any = null;
    if (!client) {
      cat = db_lamp_categories.find((c: any) => c.id === categoryId && (!c.templeId || c.templeId === templeId));
      if(!cat) return { success: false, error: '未找到燈種類別' };
      const today = new Date();
      const exp = new Date(today.getTime() + (cat.durationDays * 24 * 60 * 60 * 1000));
      const newRecord = { id: `LMP-${Date.now()}`, templeId, phone, guestName, categoryId: cat.id, categoryName: cat.name, price: cat.price, durationDays: cat.durationDays || 365, notice: notice || '', startDate: today.toISOString().split('T')[0], expiryDate: exp.toISOString().split('T')[0], status: 'Pending', paymentMethod, paymentRef, paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : (paymentMethod === 'transfer' || paymentMethod === 'customQR' ? 'Pending' : 'Unpaid'), createdAt: new Date().toISOString() };
      db_lamp_records.push(newRecord);
      if (typeof db_activities !== 'undefined') db_activities.push({ phone, timestamp: new Date().toISOString().replace('T', ' ').split('.')[0], type: '點燈服務', content: `申請 ${cat.name}` });
    } else {
      const catRes = await client.query('SELECT name, price FROM lamp_categories WHERE id = $1 AND temple_id = $2', [categoryId, templeId]);
      if (catRes.rowCount === 0) return { success: false, error: '未找到燈種類別' };
      cat = catRes.rows[0];
      const today = new Date();
      const newId = `LMP-${Date.now()}`;
      await client.query('INSERT INTO lamp_records (id, temple_id, guest_name, phone, lamp_type, amount, status, created_at, payment_method, payment_ref, payment_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [newId, templeId, guestName, phone, cat.name, cat.price, 'Pending', today.toISOString(), paymentMethod, paymentRef, paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : (paymentMethod === 'transfer' || paymentMethod === 'customQR' ? 'Pending' : 'Unpaid')]
      );
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function checkLampNotifications() { return { hasNotification: false }; }
export async function saveLampCategory(data: any) { 
  const id = data.id;
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      if (id) {
        const idx = db_lamp_categories.findIndex(c => c.id === id);
        if (idx > -1) db_lamp_categories[idx] = { ...db_lamp_categories[idx], ...data, templeId };
      } else {
        db_lamp_categories.push({ id: `cat-${Date.now()}`, ...data, totalSlots: data.totalSlots || 500, templeId });
      }
    } else {
      if (id) {
        await client.query(
          'UPDATE lamp_categories SET name = $1, description = $2, duration_days = $3, total_slots = $4, price = $5 WHERE id = $6 AND temple_id = $7',
          [data.name, data.description || '', data.durationDays || 365, data.totalSlots || 500, data.price || 0, id, templeId]
        );
      } else {
        await client.query(
          'INSERT INTO lamp_categories (id, temple_id, name, description, duration_days, total_slots, price) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [`cat-${Date.now()}`, templeId, data.name, data.description || '', data.durationDays || 365, data.totalSlots || 500, data.price || 0]
        );
      }
    }
    await revalidateTemple();
    return { success: true }; 
  });
}

export async function deleteLampCategory(id: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const hasRecords = db_lamp_records.some(r => r.categoryId === id);
      if (hasRecords) return { success: false, error: '該點燈類別已有信眾登記，請先移除相關信眾紀錄後再進行刪除。' }; 
      db_lamp_categories = gStore.db_lamp_categories = db_lamp_categories.filter(c => c.id !== id);
    } else {
      const hasRecords = await client.query('SELECT 1 FROM lamp_records WHERE category_id = $1 AND temple_id = $2 LIMIT 1', [id, templeId]);
      if (hasRecords.rowCount && hasRecords.rowCount > 0) return { success: false, error: '該點燈類別已有信眾登記，請先移除相關信眾紀錄後再進行刪除。' }; 
      await client.query('DELETE FROM lamp_categories WHERE id = $1 AND temple_id = $2', [id, templeId]);
    }
    await revalidateTemple();
    return { success: true }; 
  });
}
export async function renewLampRecord(id: string) { return { success: true }; }

// --- 現場排隊 (Queue) 相關 mock 函式與型別 ---
export type QueueEvent = any;

// Redundant declaration removed

// Removed redundant initialization block

export async function fetchQueueEvents() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_queue_events.filter(e => !e.templeId || e.templeId === templeId).map(evt => {
        const participantCount = db_queue_tickets.filter(t => t.eventId === evt.id && t.status === 'Queuing').length;
        return { ...evt, participantCount };
      });
    } else {
      await client.query(`CREATE TABLE IF NOT EXISTS queue_events (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), title VARCHAR(255), date VARCHAR(50), start_time VARCHAR(50), end_time VARCHAR(50), location VARCHAR(255), service_type VARCHAR(255), price INTEGER, max_capacity INTEGER, status VARCHAR(50))`);
      const res = await client.query('SELECT * FROM queue_events WHERE temple_id = $1 ORDER BY date DESC, start_time DESC', [templeId]);
      
      const counts = await client.query('SELECT event_id, COUNT(*) as count FROM queue_tickets WHERE temple_id = $1 AND status = \'Queuing\' GROUP BY event_id', [templeId]);
      const countMap = counts.rows.reduce((acc, r) => ({...acc, [r.event_id]: parseInt(r.count)}), {});
      
      return res.rows.map(r => ({
        id: r.id, templeId: r.temple_id, title: r.title, date: r.date, startTime: r.start_time, endTime: r.end_time,
        location: r.location, serviceType: r.service_type, price: r.price, maxCapacity: r.max_capacity, status: r.status,
        participantCount: countMap[r.id] || 0
      }));
    }
  });
}
export async function fetchActiveQueues() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return db_queue_events.filter(e => e.status === 'Active' && (!e.templeId || e.templeId === templeId));
    const res = await client.query('SELECT * FROM queue_events WHERE status = \'Active\' AND temple_id = $1', [templeId]);
    return res.rows.map(r => ({ id: r.id, templeId: r.temple_id, title: r.title, date: r.date, startTime: r.start_time, endTime: r.end_time, location: r.location, serviceType: r.service_type, price: r.price, maxCapacity: r.max_capacity, status: r.status }));
  });
}
export async function fetchQueueDashboard(eventId?: string) {
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
}
// 獲取當前活動以掃碼正在排隊的人數
export async function fetchActiveQueueCount(): Promise<number> {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const activeEventIds = db_queue_events.filter(e => e.status === 'Active' && (!e.templeId || e.templeId === templeId)).map(e => e.id);
      if (activeEventIds.length === 0) return 0;
      return db_queue_tickets.filter(t => activeEventIds.includes(t.eventId) && t.status === 'Queuing').length;
    } else {
      const res = await client.query('SELECT COUNT(qt.id) as count FROM queue_tickets qt JOIN queue_events qe ON qt.event_id = qe.id WHERE qe.status = \'Active\' AND qt.status = \'Queuing\' AND qt.temple_id = $1', [templeId]);
      return parseInt(res.rows[0].count) || 0;
    }
  });
}

export async function createQueueEvent(data: any) { 
  const templeId = await getDynamicTempleId(); 
  return withTempleSession(templeId, false, async (client) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (data.date < todayStr) return { success: false, error: '不能部屬過去時間的活動。' };

    if (!client) {
      db_queue_events.push({ id: `qe-${Date.now()}`, ...data, templeId, status: 'Active' });
    } else {
      await client.query('INSERT INTO queue_events (id, temple_id, title, date, start_time, end_time, location, service_type, price, max_capacity, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [`qe-${Date.now()}`, templeId, data.title, data.date, data.startTime, data.endTime, data.location, data.serviceType, data.price, data.maxCapacity, 'Active']);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function updateQueueEvent(id: string, data: any) { 
  const templeId = await getDynamicTempleId(); 
  return withTempleSession(templeId, false, async (client) => {
    try {
      if (!client) {
        const idx = db_queue_events.findIndex(e => e.id === id);
        if (idx !== -1) {
          db_queue_events[idx] = { ...db_queue_events[idx], ...data };
        }
      } else {
        await client.query('UPDATE queue_events SET title = $1, date = $2, start_time = $3, end_time = $4, location = $5, service_type = $6, price = $7, max_capacity = $8 WHERE id = $9 AND temple_id = $10',
          [data.title, data.date, data.startTime, data.endTime, data.location, data.serviceType, data.price, data.maxCapacity, id, templeId]);
      }
      await revalidateTemple();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
export async function activateQueueEvent(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      db_queue_events = gStore.db_queue_events = db_queue_events.map((e: any) => {
        if (e.id === id) {
          return { ...e, status: e.status === 'Active' ? 'Draft' : 'Active' };
        }
        return e;
      });
    } else {
      // Toggle status between Active and Draft
      const res = await client.query('SELECT status FROM queue_events WHERE id = $1 AND temple_id = $2', [id, templeId]);
      if (res.rows.length > 0) {
        const newStatus = res.rows[0].status === 'Active' ? 'Draft' : 'Active';
        await client.query('UPDATE queue_events SET status = $1 WHERE id = $2 AND temple_id = $3', [newStatus, id, templeId]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function deleteQueueEvent(id: string) {
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
        await client.query('UPDATE queue_events SET status = \'Cancelled\' WHERE id = $1 AND temple_id = $2', [id, templeId]);
      } else {
        await client.query('DELETE FROM queue_events WHERE id = $1 AND temple_id = $2', [id, templeId]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function checkInWithQr(ticketId: string, eventId?: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const ticket = db_queue_tickets.find(t => t.id === ticketId);
      if (!ticket) return { success: false, error: '找不到票券' };
      if (ticket.status !== 'Registered' && ticket.status !== 'Pending') return { success: false, error: '票券狀態不正確' };
      if (eventId && ticket.eventId !== eventId) return { success: false, error: '活動不符，請掃描正確的活動QR碼' };

      const qCount = db_queue_tickets.filter(x => x.eventId === ticket.eventId && (x.status === 'Queuing' || x.status === 'Calling' || x.status === 'Completed')).length + 1;
      ticket.status = 'Queuing';
      ticket.actualOrder = qCount;
      ticket.scannedAt = new Date().toLocaleTimeString();
    } else {
      const tRes = await client.query('SELECT * FROM queue_tickets WHERE id = $1 AND temple_id = $2', [ticketId, templeId]);
      if (tRes.rowCount === 0) return { success: false, error: '找不到票券' };
      const t = tRes.rows[0];
      if (t.status !== 'Registered' && t.status !== 'Pending') return { success: false, error: '票券狀態不正確' };
      if (eventId && t.event_id !== eventId) return { success: false, error: '活動不符，請掃描正確的活動QR碼' };

      const orderRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND status NOT IN (\'Pending\', \'Registered\') AND temple_id = $2', [t.event_id, templeId]);
      const actualOrder = parseInt(orderRes.rows[0].count) + 1;
      await client.query('UPDATE queue_tickets SET status = $1, scanned_at = $2, actual_order = $3 WHERE id = $4', ['Queuing', new Date().toLocaleTimeString(), actualOrder, ticketId]);
    }
    await revalidateTemple();
    return { success: true }; 
  });
}

export async function callNextInQueue(eventId: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.eventId === eventId && t.status === 'Calling' ? { ...t, status: 'Completed' } : t);
      const nextTicket = db_queue_tickets.slice().sort((a,b) => (a.actualOrder||999) - (b.actualOrder||999)).find(t => t.eventId === eventId && t.status === 'Queuing');
      if (!nextTicket) return { error: 'NO_ONE_IN_QUEUE' };
      db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.id === nextTicket.id ? { ...t, status: 'Calling' } : t);
    } else {
      await client.query('UPDATE queue_tickets SET status = \'Completed\' WHERE event_id = $1 AND status = \'Calling\' AND temple_id = $2', [eventId, templeId]);
      const nextRes = await client.query('SELECT id FROM queue_tickets WHERE event_id = $1 AND status = \'Queuing\' AND temple_id = $2 ORDER BY actual_order ASC LIMIT 1', [eventId, templeId]);
      if (nextRes.rowCount === 0) return { error: 'NO_ONE_IN_QUEUE' };
      await client.query('UPDATE queue_tickets SET status = \'Calling\' WHERE id = $1', [nextRes.rows[0].id]);
    }
    await revalidateTemple();
    return { success: true }; 
  });
}

export async function completeQueueService(ticketId: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.id === ticketId ? { ...t, status: 'Completed' } : t);
    } else {
      await client.query('UPDATE queue_tickets SET status = \'Completed\' WHERE id = $1 AND temple_id = $2', [ticketId, templeId]);
    }
    await revalidateTemple();
    return { success: true }; 
  });
}

export async function updateQueueStatus(ticketId: string, status: string) { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.id === ticketId ? { ...t, status } : t);
    } else {
      await client.query('UPDATE queue_tickets SET status = $1 WHERE id = $2 AND temple_id = $3', [status, ticketId, templeId]);
    }
    await revalidateTemple();
    return { success: true }; 
  });
}

export async function registerGuestForQueue(eventId: string, data: { guestName: string, phone: string, isOnline?: boolean }) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    let newTicket: any;
    if (!client) {
      const event = db_queue_events.find(e => e.id === eventId);
      if (!event) return { error: 'EVENT_NOT_FOUND' };
      const eventTickets = db_queue_tickets.filter(t => t.eventId === eventId);
      if (event.maxCapacity && eventTickets.length >= event.maxCapacity) return { error: '活動預約已額滿！' };

      const nextNumber = `A${(eventTickets.length + 1).toString().padStart(3, '0')}`;
      newTicket = {
        id: `t-${Date.now()}`,
        eventId,
        status: data.isOnline ? 'Registered' : 'Queuing', 
        assignedNumber: nextNumber,
        guestName: data.guestName,
        phone: data.phone,
        actualOrder: data.isOnline ? null : eventTickets.filter(t => t.status === 'Queuing' || t.status === 'Calling' || t.status === 'Completed').length + 1,
        scannedAt: data.isOnline ? null : new Date().toLocaleTimeString()
      };
      db_queue_tickets.push(newTicket);
      gStore.db_queue_tickets = db_queue_tickets;
    } else {
      const evRes = await client.query('SELECT title, capacity FROM queue_events WHERE id = $1 AND temple_id = $2', [eventId, templeId]);
      if (evRes.rowCount === 0) return { error: 'EVENT_NOT_FOUND' };
      const ev = evRes.rows[0];
      
      const ticketsRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
      const totalTickets = parseInt(ticketsRes.rows[0].count);
      if (ev.capacity && ev.capacity > 0 && totalTickets >= ev.capacity) return { error: '活動預約已額滿！' };

      const nextNumber = `A${(totalTickets + 1).toString().padStart(3, '0')}`;
      const newId = `t-${Date.now()}`;
      
      let actualOrder = null;
      let scannedAt = null;
      if (!data.isOnline) {
        const orderRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND status NOT IN (\'Pending\', \'Registered\') AND temple_id = $2', [eventId, templeId]);
        actualOrder = parseInt(orderRes.rows[0].count) + 1;
        scannedAt = new Date().toLocaleTimeString();
      }

      await client.query('INSERT INTO queue_tickets (id, event_id, temple_id, event_title, phone, guest_name, status, assigned_number, actual_order, scanned_at, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
        [newId, eventId, templeId, ev.title, data.phone, data.guestName, data.isOnline ? 'Registered' : 'Queuing', nextNumber, actualOrder, scannedAt, new Date().toISOString()]
      );
      newTicket = { id: newId };
    }
    await revalidateTemple();
    return { success: true, ticket: newTicket };
  });
}

// --- 財務與結算 (Billing) 相關 mock 函式與型別 ---
export type RevenueEntry = any;
export type ExpenseEntry = any;
export type FreeAccountApplication = any;

export async function initiatePayment(amount: number, desc: string) { return { success: true }; }
export async function approveFreeAccount(id: string) { return { success: true }; }
export async function rejectFreeAccount(id: string) { return { success: true }; }

export async function completeMeritPayment(phone: string, recordId: string, amount: number, service: string) {
  // Mock implementation: just log it and return success
  console.log(`[MERIT PAYMENT] Phone: ${phone}, ID: ${recordId}, Amount: ${amount}, Service: ${service}`);
  await revalidateTemple();
    return { success: true };
}

// -------------------------------------------------------------------------
// 🏢 經銷商與開案管理系統 (Distributor Pricing & Application Subsystem)
// -------------------------------------------------------------------------

export interface PricePlan {
  id: string;
  distributorId: string;
  name: string;
  setupFee: number;
  monthlyFee: number;
  isFree: boolean;
  freeMonths: number;
}

export interface TempleApplication {
  id: string;
  templeName: string;
  contactPerson: string;
  contactPhone: string;
  planId: string;
  setupFee: number;
  monthlyFee: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  salesId: string;
}

let db_price_plans: PricePlan[] = initGlobal('db_price_plans', [
  { id: 'plan-1', distributorId: 'dist-1', name: '基礎推廣方案', setupFee: 12000, monthlyFee: 3600, isFree: false, freeMonths: 0 },
  { id: 'plan-2', distributorId: 'dist-1', name: '免費推廣試用方案', setupFee: 0, monthlyFee: 3600, isFree: true, freeMonths: 3 }
]);
gStore.db_price_plans = db_price_plans;

let db_temple_applications: any[] = initGlobal("db_temple_applications", []);
gStore.db_temple_applications = db_temple_applications;

export async function fetchDistributorStats() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return {
        totalNodes: 100,
        usedNodes: db_temples.length,
        activeTemples: db_temples.filter(t => t.status === 'Active').length,
        totalRevenue: 1250000,
        totalCommission: 187500,
        activeSales: db_dist_sales.length
      };
    } else {
      const activeRes = await client.query('SELECT COUNT(*) as active_count FROM temples WHERE status = $1', ['Active']);
      const totalRes = await client.query('SELECT COUNT(*) as total_count FROM temples');
      const salesRes = await client.query('SELECT COUNT(*) as sales_count FROM distributor_sales');
      
      const activeCount = Number(activeRes.rows[0]?.active_count || 0);
      const totalTemples = Number(totalRes.rows[0]?.total_count || 0);
      const totalSales = Number(salesRes.rows[0]?.sales_count || 0);
      
      return {
        totalNodes: 100,
        usedNodes: totalTemples,
        activeTemples: activeCount,
        totalRevenue: 1250000,
        totalCommission: 187500,
        activeSales: totalSales
      };
    }
  });
}

export async function fetchPricePlans() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return [...db_price_plans];
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS price_plans (
          id VARCHAR(50) PRIMARY KEY,
          distributor_id VARCHAR(50),
          name VARCHAR(255) NOT NULL,
          setup_fee INT NOT NULL,
          monthly_fee INT NOT NULL,
          is_free BOOLEAN DEFAULT FALSE,
          free_months INT DEFAULT 0
        )
      `);
      
      const res = await client.query('SELECT * FROM price_plans');
      if ((res.rowCount ?? 0) === 0) {
        await client.query(`
          INSERT INTO price_plans (id, distributor_id, name, setup_fee, monthly_fee, is_free, free_months)
          VALUES 
            ('plan-1', 'dist-1', '基礎推廣方案', 12000, 3600, FALSE, 0),
            ('plan-2', 'dist-1', '免費推廣試用方案', 0, 3600, TRUE, 3)
        `);
        const resRetry = await client.query('SELECT * FROM price_plans');
        return resRetry.rows.map(r => ({
          id: r.id,
          distributorId: r.distributor_id,
          name: r.name,
          setupFee: r.setup_fee,
          monthlyFee: r.monthly_fee,
          isFree: r.is_free,
          freeMonths: r.free_months
        }));
      }
      return res.rows.map(r => ({
        id: r.id,
        distributorId: r.distributor_id,
        name: r.name,
        setupFee: r.setup_fee,
        monthlyFee: r.monthly_fee,
        isFree: r.is_free,
        freeMonths: r.free_months
      }));
    }
  });
}

export async function createPricePlan(plan: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const newId = `plan-${Date.now()}`;
    const newP: PricePlan = {
      id: newId,
      distributorId: 'dist-1',
      name: plan.name,
      setupFee: Number(plan.setupFee || 0),
      monthlyFee: Number(plan.monthlyFee || 0),
      isFree: Boolean(plan.isFree),
      freeMonths: Number(plan.freeMonths || 0)
    };
    
    if (!client) {
      db_price_plans.push(newP);
    } else {
      await client.query(`
        INSERT INTO price_plans (id, distributor_id, name, setup_fee, monthly_fee, is_free, free_months)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [newId, 'dist-1', plan.name, Number(plan.setupFee || 0), Number(plan.monthlyFee || 0), Boolean(plan.isFree), Number(plan.freeMonths || 0)]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchTempleApplications() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return [...db_temple_applications];
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS temple_applications (
          id VARCHAR(50) PRIMARY KEY,
          temple_name VARCHAR(255) NOT NULL,
          contact_person VARCHAR(255),
          contact_phone VARCHAR(255),
          plan_id VARCHAR(50) NOT NULL,
          setup_fee INT NOT NULL,
          monthly_fee INT NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Pending',
          sales_id VARCHAR(50)
        )
      `);
      
      const res = await client.query('SELECT * FROM temple_applications');
      return res.rows.map(r => ({
        id: r.id,
        templeName: r.temple_name,
        contactPerson: r.contact_person,
        contactPhone: r.contact_phone,
        planId: r.plan_id,
        setupFee: r.setup_fee,
        monthlyFee: r.monthly_fee,
        status: r.status,
        salesId: r.sales_id
      }));
    }
  });
}

export async function submitTempleApplication(data: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const newId = `app-${Date.now()}`;
    let setupFee = 12000;
    let monthlyFee = 3600;
    
    if (!client) {
      const plan = db_price_plans.find((p: any) => p.id === data.planId);
      if (plan) {
        setupFee = plan.setupFee;
        monthlyFee = plan.monthlyFee;
      }
      const newApp: TempleApplication = {
        id: newId,
        templeName: data.templeName,
        contactPerson: data.contactPerson || '聯絡人',
        contactPhone: data.contactPhone || '',
        planId: data.planId,
        setupFee,
        monthlyFee,
        status: 'Pending',
        salesId: 'sales-1'
      };
      db_temple_applications.push(newApp);
    } else {
      const planRes = await client.query('SELECT * FROM price_plans WHERE id = $1', [data.planId]);
      if ((planRes.rowCount ?? 0) > 0) {
        setupFee = planRes.rows[0].setup_fee;
        monthlyFee = planRes.rows[0].monthly_fee;
      }
      await client.query(`
        INSERT INTO temple_applications (id, temple_name, contact_person, contact_phone, plan_id, setup_fee, monthly_fee, status, sales_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [newId, data.templeName, data.contactPerson || '聯絡人', data.contactPhone || '', data.planId, setupFee, monthlyFee, 'Pending', 'sales-1']);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function approveTempleApplication(appId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_temple_applications.findIndex(a => a.id === appId);
      if (appIdx === -1) return { success: false, error: '找不到該筆開案申請' };
      
      db_temple_applications[appIdx].status = 'Approved';
      const app = db_temple_applications[appIdx];
      
      const newTempleId = `temple-${Date.now()}`;
      db_temples.push({
        id: newTempleId,
        templeName: app.templeName,
        city: '台北市',
        status: 'Active',
        sales_id: app.salesId,
        setup_fee: app.setupFee,
        monthly_rent: app.monthlyFee,
        payment_cycle: 'Monthly'
      });
      
      db_temple_storages.push({
        id: `ts-${Date.now()}`,
        templeId: newTempleId,
        templeName: app.templeName,
        city: '台北市',
        usedBytes: 0,
        quotaGb: 5,
        planName: '免費 5GB 空間'
      });
    } else {
      const appRes = await client.query('SELECT * FROM temple_applications WHERE id = $1', [appId]);
      if ((appRes.rowCount ?? 0) === 0) return { success: false, error: '找不到該筆開案申請' };
      const app = appRes.rows[0];
      
      await client.query('UPDATE temple_applications SET status = $1 WHERE id = $2', ['Approved', appId]);
      
      const newTempleId = `temple-${Date.now()}`;
      await client.query(`
        INSERT INTO temples (id, temple_name, city, status, sales_id, setup_fee, monthly_rent, payment_cycle)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newTempleId, app.temple_name, '台北市', 'Active', app.sales_id, app.setup_fee, app.monthly_fee, 'Monthly']);
      
      await client.query(`
        INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city)
        VALUES ($1, $2, $3, $4, $5)
      `, [newTempleId, 0, 5368709120, '標準免費空間', '台北市']);
    }
    await revalidateTemple();
    return { success: true };
  });
}

// -------------------------------------------------------------------------
// 📢 信眾通知公告廣播系統 - 核心資料持久化與 Actions
// -------------------------------------------------------------------------

export interface TempleNotification {
  id: string;
  title: string;
  content: string;
  sendTime: string; // ISO string
  createdAt: string; // ISO string
}

let db_temple_notifications: any[] = initGlobal("db_temple_notifications", []);
gStore.db_temple_notifications = db_temple_notifications;

// 1. 創立通知資料表與發佈公告
export async function createNotification(title: string, content: string, sendTime: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const newId = `n-${Date.now()}`;
    const newNotif = {
      id: newId,
      title,
      content,
      sendTime: new Date(sendTime).toISOString(),
      createdAt: new Date().toISOString()
    };

    db_temple_notifications.unshift({ templeId, ...newNotif });
    gStore.db_temple_notifications = db_temple_notifications;

    if (client) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS temple_notifications (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          send_time TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id, temple_id)
        )
      `);
      await client.query(`
        INSERT INTO temple_notifications (id, temple_id, title, content, send_time, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [newId, templeId, title, content, newNotif.sendTime, newNotif.createdAt]);
    }

    await revalidateTemple();
    return { success: true };
  });
}

// 2. 獲取所有通知紀錄（管理端：含定時預排通知）
export async function fetchTempleNotifications(): Promise<TempleNotification[]> {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return [...db_temple_notifications].sort((a, b) => new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime());
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS temple_notifications (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          send_time TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id, temple_id)
        )
      `);
      const res = await client.query('SELECT * FROM temple_notifications WHERE temple_id = $1 ORDER BY send_time DESC', [templeId]);
      return res.rows.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        sendTime: r.send_time instanceof Date ? r.send_time.toISOString() : r.send_time,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
      }));
    }
  });
}

// 3. 獲取最新的一則已發送公告（信眾端首頁）
export async function fetchLatestNotificationForGuest(): Promise<TempleNotification | null> {
  const activeNotifs = await fetchActiveNotificationsForGuest();
  return activeNotifs.length > 0 ? activeNotifs[0] : null;
}

// 4. 獲取所有已發送公告（信眾端歷史對話框）
export async function fetchActiveNotificationsForGuest(): Promise<TempleNotification[]> {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const now = new Date();
    if (!client) {
      return db_temple_notifications
        .filter(n => (!n.templeId || n.templeId === templeId) && new Date(n.sendTime).getTime() <= now.getTime())
        .sort((a, b) => new Date(b.sendTime).getTime() - new Date(a.sendTime).getTime());
    } else {
      await client.query(`
        CREATE TABLE IF NOT EXISTS temple_notifications (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES temples(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          send_time TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id, temple_id)
        )
      `);
      const res = await client.query(
        'SELECT * FROM temple_notifications WHERE temple_id = $1 AND send_time <= $2 ORDER BY send_time DESC',
        [templeId, now.toISOString()]
      );
      return res.rows.map(r => ({
        id: r.id,
        title: r.title,
        content: r.content,
        sendTime: r.send_time instanceof Date ? r.send_time.toISOString() : r.send_time,
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at
      }));
    }
  });
}


function normalizePhone(phone: string | undefined): string {
  return phone ? phone.replace(/\D/g, '') : '';
}


// ==========================================
// 上帝視角 (Impersonation)
// ==========================================
export async function impersonateTemple(templeId: string, originRole?: string) {
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  
  // Track where the impersonation started from
  const currentRole = originRole || cookieStore.get('admin_role')?.value;
  if (currentRole && currentRole !== 'SuperAdmin') {
    cookieStore.set('impersonator_origin', currentRole);
  }

  // Bypass strict role check for prototype since SuperAdmin UI is the only entry point
  cookieStore.set('templeId', templeId);
  cookieStore.set('admin_role', 'SuperAdmin');
  
  return { success: true, redirectPath: `/${templeId}/admin/services` };
}


// -------------------------------------------------------------------------
// 🚀 權限轉移 (Hierarchical Transfer)
// -------------------------------------------------------------------------

export async function transferTempleOwnership(templeId: string, newDistributorId: string | null, newSalesId: string | null) {
  const temple = db_temples.find(t => t.id === templeId);
  if (!temple) return { success: false, error: 'Temple not found' };

  if (newDistributorId !== undefined) {
     temple.distributorId = newDistributorId;
  }
  if (newSalesId !== undefined) {
     temple.salesId = newSalesId;
  }
  
  // Create an audit log
  db_admin_logs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminId: 'SuperAdmin',
    action: 'TRANSFER_TEMPLE',
    target: templeId,
    details: `Transferred temple to Dist:${newDistributorId || 'HQ'} Sales:${newSalesId || 'None'}`,
    ip: '127.0.0.1'
  });

  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  return { success: true };
}

export async function transferDistributorOwnership(distributorId: string, newSalesId: string | null) {
  const dist = db_distributors.find(d => d.id === distributorId);
  if (!dist) return { success: false, error: 'Distributor not found' };

  dist.salesId = newSalesId;

  // Transfer all underlying temples if they belong to this distributor
  // And update their salesId to the new salesId if applicable
  db_temples.forEach(t => {
     if (t.distributorId === distributorId) {
        if (newSalesId !== undefined) {
           t.salesId = newSalesId;
        }
     }
  });

  db_admin_logs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminId: 'SuperAdmin',
    action: 'TRANSFER_DISTRIBUTOR',
    target: distributorId,
    details: `Transferred distributor and its temples to Sales:${newSalesId || 'HQ'}`,
    ip: '127.0.0.1'
  });

  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  return { success: true };
}

export async function returnToSuperAdmin() {
  const { cookies } = require('next/headers');
  const cookieStore = await cookies();
  
  const origin = cookieStore.get('impersonator_origin')?.value;
  cookieStore.delete('templeId');
  cookieStore.delete('impersonator_origin');

  let redirectPath = '/super-admin';
  
  if (origin === 'Distributor') {
     cookieStore.set('admin_role', 'Distributor');
     redirectPath = '/dist-admin';
  } else if (origin === 'SuperSales') {
     cookieStore.set('admin_role', 'SuperSales');
     redirectPath = '/super-sales';
  } else {
     // Default back to SuperAdmin
     cookieStore.set('admin_role', 'SuperAdmin');
  }

  return { success: true, redirectPath };
}

export async function updateAppointmentPayment(appId: number, paymentMethod: string, paymentRef?: string) {
  return withTempleSession(null, false, async (client) => {
    const idx = db_appointments.findIndex(a => a.id === appId);
    if (idx === -1) return { success: false, message: '找不到該預約' };
    
    db_appointments[idx].paymentMethod = paymentMethod;
    if (paymentRef) db_appointments[idx].paymentRef = paymentRef;
    
    if (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') {
      db_appointments[idx].paymentStatus = 'Paid';
      db_appointments[idx].status = 'Confirmed';
    } else {
      db_appointments[idx].paymentStatus = 'Pending';
      db_appointments[idx].status = 'Pending';
    }
    
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchAiPlans() {
  return [...db_ai_plans];
}

export async function saveAiPlan(plan: any) {
  const existing = db_ai_plans.find(p => p.id === plan.id);
  if (existing) {
    Object.assign(existing, plan);
  } else {
    db_ai_plans.push({ id: `AI-${Date.now()}`, ...plan });
  }
  return { success: true };
}

export async function deleteAiPlan(id: string) {
  const index = db_ai_plans.findIndex(p => p.id === id);
  if (index > -1) {
    db_ai_plans.splice(index, 1);
  }
  return { success: true };
}


// --- AI Plan & Usage Management ---
export async function fetchAiApiModels() {
  return [...db_ai_api_models];
}

export async function saveAiApiModels(models: any[]) {
  db_ai_api_models = [...models];
  gStore.db_ai_api_models = db_ai_api_models;
  return { success: true };
}


export async function fetchAllTempleAiUsage() {
  // Returns AI usage for all temples, joining with temple profiles and plans
  return db_temple_ai_usage.map(usage => {
    const temple = db_temples.find(t => t.id === usage.templeId) || { templeName: '未知宮廟', name: '未知宮廟', city: '未知' };
    const plan = db_ai_plans.find(p => p.id === usage.planId) || { name: '無方案', chatLimit: 0 };
    return { 
      ...usage, 
      templeName: temple.templeName || temple.name || '未知宮廟', 
      city: temple.city || '未知',
      planName: usage.planId === 'VIP' ? usage.planName : plan.name, 
      chatLimit: plan.chatLimit || 0 
    };
  });
}


export async function grantTempleAiVip(templeId: string, isVip: boolean = true) {
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (!usage) {
    usage = { templeId, enabled: true, planId: 'VIP', planName: isVip ? '無限免費方案' : '基礎智慧助理方案', usedCount: 0, usedTokens: 0, monthlyTokenLimit: isVip ? 999999 : 1000, expiryDate: new Date().toISOString(), isVip };
    db_temple_ai_usage.push(usage);
  } else {
    usage.isVip = isVip;
    if (isVip) {
      usage.planName = '無限免費方案';
      usage.monthlyTokenLimit = 999999;
    }
  }
  gStore.db_temple_ai_usage = db_temple_ai_usage;
  return { success: true };
}

export async function fetchTempleAiUsage() {
  const templeId = await getDynamicTempleId();
  if (!templeId) return null;
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (!usage) {
    // Default 1-month trial
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    usage = { templeId, enabled: false, planId: 'AI-500', usedCount: 0, expiryDate: thirtyDaysLater.toISOString(), isVip: false };
    db_temple_ai_usage.push(usage);
    gStore.db_temple_ai_usage = db_temple_ai_usage;
  }
  const plan = db_ai_plans.find(p => p.id === usage.planId) || { chatLimit: 0, name: '無方案', monthlyFee: 0 };
  return { ...usage, chatLimit: plan.chatLimit, planName: plan.name, monthlyFee: plan.monthlyFee };
}

export async function toggleTempleAiStatus(enabled: boolean) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (usage) {
    usage.enabled = enabled;
    gStore.db_temple_ai_usage = db_temple_ai_usage;
  }
  return { success: true };
}

export async function purchaseAiPlan(planId: string, paymentMethod?: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  const thirtyDaysLater = new Date();
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
  
  if (usage) {
    usage.planId = planId;
    usage.expiryDate = thirtyDaysLater.toISOString();
    usage.usedCount = 0; // Reset usage
    usage.enabled = true;
  } else {
    usage = { templeId, enabled: true, planId, usedCount: 0, expiryDate: thirtyDaysLater.toISOString(), isVip: false };
    db_temple_ai_usage.push(usage);
  }
  gStore.db_temple_ai_usage = db_temple_ai_usage;

  const plan = db_ai_plans.find(p => p.id === planId);
  if (plan) {
    const temple = db_temples.find(t => t.id === templeId);
    db_finance_records.unshift({
      id: `F-${Date.now()}`,
      type: 'INCOME',
      category: 'AI_UPGRADE',
      amount: plan.monthlyFee,
      source: `${temple?.templeName || '宮廟'}-AI方案續約 (${paymentMethod || '未知方式'})`,
      date: new Date().toISOString().split('T')[0]
    });
  }

  return { success: true };
}

export async function logSystemEvent(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', action: string, target: string, operator: string, templeIdOverride?: string) {
  const templeId = templeIdOverride || await getDynamicTempleId();
  const timestamp = new Date().toLocaleString('zh-TW');
  const newLog = { id: `log-${Date.now()}`, level, action, target, operator, timestamp, templeId };
  
  db_audit_logs.unshift(newLog);
  if (gStore) gStore.db_audit_logs = db_audit_logs;

  return withTempleSession(templeId, false, async (client) => {
    if (client) {
      try {
        await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), level VARCHAR(20), action VARCHAR(255), target TEXT, operator VARCHAR(100), timestamp VARCHAR(100)
        )`);
        await client.query(
          'INSERT INTO audit_logs (id, temple_id, level, action, target, operator, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [newLog.id, templeId, level, action, target, operator, timestamp]
        );
      } catch (e) { console.error('Error logging system event', e); }
    }
  });
}

export async function fetchAuditLogs() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return db_audit_logs.filter(log => log.templeId === templeId || !log.templeId);
    }
    
    try {
      await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (
        id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), level VARCHAR(20), action VARCHAR(255), target TEXT, operator VARCHAR(100), timestamp VARCHAR(100)
      )`);
      const res = await client.query('SELECT * FROM audit_logs WHERE temple_id = $1 ORDER BY timestamp DESC LIMIT 200', [templeId]);
      return res.rows.map(r => ({
        id: r.id, templeId: r.temple_id, level: r.level, action: r.action, target: r.target, operator: r.operator, timestamp: r.timestamp
      }));
    } catch (e) {
      console.error('Error fetching audit logs', e);
      return db_audit_logs.filter(log => log.templeId === templeId || !log.templeId);
    }
  });
}

export async function getTempleBasicInfo(templeId?: string) {
  const tId = templeId || await getDynamicTempleId();
  return db_temples.find(t => t.id === tId) || null;
}

export async function updateTempleBasicInfo(data: any, templeId?: string) {
  const tId = templeId || await getDynamicTempleId();
  const idx = db_temples.findIndex(t => t.id === tId);
  if (idx > -1) {
    db_temples[idx] = { ...db_temples[idx], ...data };
    gStore.db_temples = db_temples;
    return { success: true };
  }
  return { success: false, message: 'Temple not found' };
}

export async function fetchDistributorFinancials(distId: string) {
  const temples = db_temples.filter(t => t.distributorId === distId);
  const templeIds = temples.map(t => t.id);

  const bills = db_temple_bills.filter(b => templeIds.includes(b.templeId));

  const paymentRecords = temples.map(t => {
    const tBills = bills.filter(b => b.templeId === t.id);
    const lastBill = tBills.sort((a,b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())[0];
    
    return {
      id: t.id,
      temple: t.templeName || '未知宮廟',
      region: t.city || '未知區域',
      amount: lastBill ? lastBill.amount : (t.monthlyRent || 0),
      date: lastBill ? (lastBill.timestamp ? lastBill.timestamp.split('T')[0] : '未知') : (t.timestamp ? t.timestamp.split('T')[0] : '未知'),
      status: lastBill ? (lastBill.status === 'Paid' ? 'Paid' : 'Overdue') : 'Paid',
      type: lastBill ? lastBill.type : 'Monthly',
      history: tBills.map(b => ({
        month: b.billingDate || (b.timestamp ? b.timestamp.substring(0, 7) : '未知'),
        amount: b.amount,
        type: b.type === 'SetupFee' ? 'Setup' : 'Monthly',
        status: b.status === 'Paid' ? 'Paid' : 'Overdue'
      })).sort((a,b) => b.month.localeCompare(a.month))
    };
  }).filter(p => p.history.length > 0 || p.amount > 0);

  const sales = db_dist_sales.filter(s => s.distributorId === distId);
  const salesNames = sales.map(s => s.name);
  const bonusRequests = db_bonuses.filter(b => salesNames.includes(b.salesName));

  return { paymentRecords, bonusRequests };
}

export async function fetchDistributorSalesPerformance(distId: string) {
  const sales = db_dist_sales.filter(s => s.distributorId === distId);
  return sales.map(s => {
    const temples = db_temples.filter(t => t.salesId === s.id);
    const templeIds = temples.map(t => t.id);
    const bills = db_temple_bills.filter(b => templeIds.includes(b.templeId) && b.status === 'Paid');
    
    const totalSales = bills.reduce((sum, b) => sum + b.amount, 0);

    const commission = bills.reduce((sum, b) => {
      const isSetup = b.type === 'SetupFee' || b.type === 'Setup';
      const rate = isSetup ? (s.commissionRules?.setupFeePercent || 20) : (s.commissionRules?.rentYear1Percent || 15);
      return sum + (b.amount * rate / 100);
    }, 0);

    return {
      id: s.id,
      name: s.name,
      account: s.account,
      totalSales,
      commission,
      commissionRules: s.commissionRules
    };
  });
}

export async function fetchSuperAdminFinancials() {
  const records = db_finance_records;
  
  const totalRevenue = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const totalCommission = db_bonuses.reduce((s, b) => s + b.amount, 0);
  const netProfit = totalRevenue - totalCommission;

  return {
    records: records.slice().reverse(),
    summary: {
      totalRevenue,
      totalCommission,
      netProfit
    },
    wallets: db_wallets
  };
}

export async function updateDistributorBankInfo(distId: string, bankInfo: any) {
  const distIndex = db_distributors.findIndex(d => d.id === distId);
  if (distIndex > -1) {
    db_distributors[distIndex].bankInfo = bankInfo;
    if (typeof gStore !== 'undefined') {
      gStore.db_distributors = db_distributors;
    }
    return true;
  }
  return false;
}

export async function getTempleCreatorInfo(templeId: string) {
  const temple = db_temples.find(t => t.id === templeId || t.id === decodeURIComponent(templeId));
  if (!temple) {
    return {
      type: 'super_admin',
      adminName: '系統總管理員 (總部)',
      adminContact: 'admin_root (官方聯絡管道)'
    };
  }

  if (temple.salesId) {
    const sales = db_dist_sales.find(s => s.id === temple.salesId);
    if (sales) {
      if (sales.distributorId) {
        // Distributor Sales
        const dist = db_distributors.find(d => d.id === sales.distributorId);
        const ret = {
          type: 'dist_sales',
          salesName: sales.name,
          salesPhone: sales.phone || sales.account || '未提供',
          distName: dist?.name || '未知經銷商',
          distPhone: dist?.phone || dist?.account || '未提供'
        };
        console.log('getTempleCreatorInfo returning:', ret);
        return ret;
      } else {
        // Super Sales
        const ret = {
          type: 'super_sales',
          salesName: sales.name,
          salesPhone: sales.phone || sales.account || '未提供'
        };
        console.log('getTempleCreatorInfo returning:', ret);
        return ret;
      }
    }
  }

  if (temple.distributorId) {
     const dist = db_distributors.find(d => d.id === temple.distributorId);
     if (dist) {
        const ret = {
           type: 'distributor',
           distName: dist.name,
           distPhone: dist.phone || dist.account || '未提供'
        };
        console.log('getTempleCreatorInfo returning:', ret);
        return ret;
     }
  }

  const ret = {
    type: 'super_admin',
    adminName: '系統總管理員 (總部)',
    adminContact: 'admin_root (官方聯絡管道)'
  };
  console.log('getTempleCreatorInfo returning:', ret);
  return ret;
}

export async function updateAccountStatus(id: string, role: string, status: 'Active' | 'Inactive') {
  if (role === 'TempleAdmin' || role === 'Temple') {
    const temple = db_temples.find(t => t.id === id);
    if (temple) temple.status = status;
    gStore.db_temples = db_temples;
  } else if (role === 'Distributor') {
    const dist = db_distributors.find(d => d.id === id);
    if (dist) dist.status = status;
    gStore.db_distributors = db_distributors;
  } else if (role === 'SuperSales' || role === 'DistSales') {
    const sales = db_dist_sales.find(s => s.id === id);
    if (sales) sales.status = status;
    gStore.db_dist_sales = db_dist_sales;
  }
  return { success: true };
}

export async function transferTemples(templeIds: string[], targetId: string | null, targetRole: 'Distributor' | 'SuperSales' | 'HQ') {
  templeIds.forEach(tId => {
    const temple = db_temples.find(t => t.id === tId);
    if (temple) {
      if (targetRole === 'HQ') {
        temple.distributorId = null;
        temple.salesId = null;
      } else if (targetRole === 'Distributor') {
        temple.distributorId = targetId;
        temple.salesId = null;
      } else if (targetRole === 'SuperSales') {
        temple.distributorId = null;
        temple.salesId = targetId;
      }
    }
  });
  gStore.db_temples = db_temples;
  
  const targetName = targetRole === 'HQ' ? '系統總部 HQ' : targetId;
  db_admin_logs.unshift({ id: `L-${Date.now()}`, user: 'System Admin', action: 'BATCH_TRANSFER', target: `${templeIds.length} temples to ${targetName}`, timestamp: new Date().toLocaleString() });

  return { success: true };
}
export async function confirmPaymentSuccess(orderId: string, method: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      // In-memory fallback
      const app = db_appointments.find(a => a.id === parseInt(orderId) || a.id.toString() === orderId);
      if (app) { app.paymentStatus = 'Paid'; app.paymentMethod = method; return true; }
      const reg = db_event_registrations.find(r => r.id === orderId);
      if (reg) { reg.paymentStatus = 'Paid'; return true; }
      const tix = db_queue_tickets.find(t => t.id === orderId);
      if (tix) { tix.paymentStatus = 'Paid'; return true; }
      return false;
    }
    
    // Check appointments
    let res = await client.query('UPDATE appointments SET payment_status = , payment_method =  WHERE id =  RETURNING id', ['Paid', method, parseInt(orderId) || 0]);
    if (res.rowCount > 0) return true;
    
    // Check event registrations
    res = await client.query('UPDATE event_registrations SET payment_status =  WHERE id =  RETURNING id', ['Paid', orderId]);
    if (res.rowCount > 0) return true;
    
    // Check queue tickets
    res = await client.query('UPDATE queue_tickets SET payment_status =  WHERE id =  RETURNING id', ['Paid', orderId]);
    if (res.rowCount > 0) return true;
    
    return false;
  });
}

export async function revertPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      if (recordType === 'Lamp') {
        const idx = db_lamp_records.findIndex((r: any) => r.id === recordId);
        if (idx > -1) {
          db_lamp_records[idx].paymentStatus = 'Unpaid';
        }
      }
      if (recordType === 'Appointment') {
        const idx = db_appointments.findIndex((r: any) => r.id.toString() === recordId.toString());
        if (idx > -1) {
          db_appointments[idx].paymentStatus = 'Unpaid';
        }
      }
      if (recordType === 'Event') {
        const idx = db_event_registrations.findIndex((r: any) => r.id === recordId);
        if (idx > -1) {
          db_event_registrations[idx].paymentStatus = 'Unpaid';
        }
      }
      if (recordType === 'Queue') {
        if (typeof db_queue_tickets !== 'undefined') {
          const idx = db_queue_tickets.findIndex((r: any) => r.id === recordId);
          if (idx > -1) {
            db_queue_tickets[idx].paymentStatus = 'Unpaid';
          }
        }
      }
    } else {
      if (recordType === 'Appointment') {
        await client.query('UPDATE appointments SET payment_status = \'Unpaid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
      if (recordType === 'Lamp') {
        await client.query('UPDATE lamp_records SET payment_status = \'Unpaid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
      if (recordType === 'Event') {
        await client.query('UPDATE event_registrations SET payment_status = \'Unpaid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
      if (recordType === 'Queue') {
        await client.query('UPDATE queue_tickets SET payment_status = \'Unpaid\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      }
    }
    await revalidateTemple();
    return { success: true };
  });
}


export async function deleteGuestFile(fileId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
       // local memory array deletion handled similarly if gStore has it
    } else {
      await client.query('DELETE FROM guest_files WHERE id = $1 AND temple_id = $2', [fileId, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}
export async function activateLampRecord(recordId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = db_lamp_records.findIndex((r: any) => r.id === recordId);
      if (idx > -1) {
        db_lamp_records[idx].status = 'Active';
        db_lamp_records[idx].startDate = new Date().toISOString().split('T')[0];
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (db_lamp_records[idx].durationDays || 365));
        db_lamp_records[idx].expiryDate = expiry.toISOString().split('T')[0];
      }
    } else {
      const record = await client.query('SELECT lamp_type, created_at FROM lamp_records WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
      let durationDays = 365;
      if (record.rowCount > 0) {
         const cat = await client.query('SELECT duration_days FROM lamp_categories WHERE name = $1 AND temple_id = $2', [record.rows[0].lamp_type, templeId]);
         if (cat.rowCount > 0) durationDays = cat.rows[0].duration_days || 365;
      }
      const today = new Date();
      const expiry = new Date(today.getTime() + (durationDays * 24 * 60 * 60 * 1000));
      await client.query('UPDATE lamp_records SET status = \'Active\', created_at = $3 WHERE id = $1 AND temple_id = $2', [recordId, templeId, today.toISOString()]);
      // Note: the pg schema in createLampRecord only has created_at, not start_date or expiry_date. We just update created_at so the UI logic counts from today.
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function deactivateLampRecord(recordId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = db_lamp_records.findIndex((r: any) => r.id === recordId);
      if (idx > -1) {
        db_lamp_records[idx].status = 'Pending';
      }
    } else {
      await client.query('UPDATE lamp_records SET status = \'Pending\' WHERE id = $1 AND temple_id = $2', [recordId, templeId]);
    }
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchDistributorLogs(distributorId: string) { return (globalThis as any).db_admin_logs?.filter((l: any) => l.target && l.target.includes(distributorId)) || []; }
export async function requestBonus(...args: any[]) { return { success: true }; }
export async function fetchSalesBonusRequests(salesId: string) { return (globalThis as any).db_bonus_requests?.filter((r: any) => r.salesId === salesId) || []; }
export async function uploadReceiptAndApproveBonus(...args: any[]) { return { success: true }; }
export async function fetchSaasOrders() { return (globalThis as any).db_saas_orders || []; }
export async function logDistributorAction(...args: any[]) {
  const gStore = globalThis as any;
  if (!gStore.db_admin_logs) gStore.db_admin_logs = [];
  gStore.db_admin_logs.push({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    adminId: 'super_admin',
    adminName: '系統管理員',
    action: 'Distributor Action',
    target: args[0] || 'Unknown',
    details: 'Log'
  });
}

export async function grantTempleStorageVip(templeId: string, isVip: boolean = true) {
  const gStore = globalThis as any;
  if (!gStore.db_temple_storages) gStore.db_temple_storages = [];
  let storage = gStore.db_temple_storages.find((s: any) => s.templeId === templeId);
  if (!storage) {
    storage = { templeId, isVip, planName: isVip ? '無限免費方案' : '免費 5GB 空間', usedBytes: 0, capacityGb: isVip ? 999999 : 5 };
    gStore.db_temple_storages.push(storage);
  } else {
    storage.isVip = isVip;
    if (isVip) {
      storage.planName = '無限免費方案';
      storage.capacityGb = 999999;
    }
  }
  return { success: true };
}

export async function purchaseAiPlanByAdmin(templeId: string, planId: string) {
  const gStore = globalThis as any;
  if (!gStore.db_temple_ai_usage) gStore.db_temple_ai_usage = [];
  const plan = (gStore.db_ai_plans || []).find((p: any) => p.id === planId) || { name: '自訂方案', tokenLimit: 100000 };
  let ai = gStore.db_temple_ai_usage.find((a: any) => a.templeId === templeId);
  if (!ai) {
    ai = { templeId, planId, planName: plan.name, usedTokens: 0, monthlyTokenLimit: plan.tokenLimit, isVip: false };
    gStore.db_temple_ai_usage.push(ai);
  } else {
    ai.planId = planId;
    ai.planName = plan.name;
    ai.monthlyTokenLimit = plan.tokenLimit;
    ai.isVip = false;
  }
  return { success: true };
}


export async function fetchDataBridgeTree() {
  const superSales = await fetchSuperSalesAccounts();
  const gStore = globalThis as any;
  const distributors = gStore.db_distributors || [];
  const distSales = gStore.db_dist_sales || [];
  const temples = gStore.db_temples || [];

  const tree: any[] = [];

  const getTempleNodes = (salesId: string) => {
    return temples
      .filter((t: any) => t.salesId === salesId)
      .map((t: any) => ({ id: t.id, name: t.templeName || t.name, type: 'temple' }));
  };

  const getDistSalesNodes = (distId: string) => {
    return distSales
      .filter((ds: any) => ds.distributorId === distId)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'dist-sales',
        children: getTempleNodes(s.id)
      }));
  };

  const getDistributorNodes = (superSalesId: string) => {
    return distributors
      .filter((d: any) => d.superSalesId === superSalesId)
      .map((d: any) => ({
        id: d.id,
        name: d.name,
        type: 'distributor',
        children: getDistSalesNodes(d.id)
      }));
  };

  // 1. All SuperSales
  superSales.forEach((ss: any) => {
    tree.push({
      id: ss.id,
      name: ss.name,
      type: 'super-sales',
      children: getDistributorNodes(ss.id)
    });
  });

  // 2. Orphan Distributors
  const orphanDists = distributors.filter((d: any) => !d.superSalesId || !superSales.find((ss: any) => ss.id === d.superSalesId));
  if (orphanDists.length > 0) {
    tree.push({
      id: 'hq-distributors',
      name: '總部直屬經銷商',
      type: 'super-sales',
      children: orphanDists.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: 'distributor',
        children: getDistSalesNodes(d.id)
      }))
    });
  }

  // 3. Orphan DistSales (ignoring SuperSales objects which might be in db_dist_sales depending on role, but we filter by role)
  const orphanSales = distSales.filter((s: any) => s.role !== 'SuperSales' && (!s.distributorId || !distributors.find((d: any) => d.id === s.distributorId)));
  if (orphanSales.length > 0) {
    tree.push({
      id: 'hq-sales',
      name: '總部直屬經銷業務',
      type: 'distributor',
      children: orphanSales.map((s: any) => ({
        id: s.id,
        name: s.name,
        type: 'dist-sales',
        children: getTempleNodes(s.id)
      }))
    });
  }

  // 4. Orphan Temples
  const orphanTemples = temples.filter((t: any) => !t.salesId || !distSales.find((s: any) => s.id === t.salesId));
  if (orphanTemples.length > 0) {
    tree.push({
      id: 'hq-temples',
      name: '總部直營宮廟',
      type: 'dist-sales',
      children: orphanTemples.map((t: any) => ({
        id: t.id,
        name: t.templeName || t.name || '未知宮廟',
        type: 'temple'
      }))
    });
  }

  return tree;
}


export async function updateDistributorProfile(distId: string, data: any) {
  const dist = db_distributors.find(d => d.id === distId);
  if (dist) {
    if (data.name) dist.name = data.name;
    if (data.account) dist.account = data.account;
    if (data.password) dist.password = data.password;
    if (data.bankInfo) dist.bankInfo = data.bankInfo;
    
    // add to audit log
    if (!gStore.db_admin_logs) gStore.db_admin_logs = [];
    gStore.db_admin_logs.push({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      adminId: distId,
      adminName: dist.name,
      action: 'UPDATE_DIST_PROFILE',
      target: distId,
      details: '經銷商更新了個人資料或銀行帳戶'
    });
    
    return { success: true };
  }
  return { success: false, error: 'Distributor not found' };
}

export async function updateDistributorPaymentConfig(distId: string, paymentConfig: any) {
  const dist = db_distributors.find(d => d.id === distId);
  if (dist) {
    dist.b2bPayment = paymentConfig;
    
    // add to audit log
    if (!gStore.db_admin_logs) gStore.db_admin_logs = [];
    gStore.db_admin_logs.push({
      id: 'log-' + Date.now(),
      timestamp: new Date().toISOString(),
      adminId: distId,
      adminName: dist.name,
      action: 'UPDATE_DIST_PAYMENT',
      target: distId,
      details: '經銷商更新了B2B收款設定'
    });
    
    return { success: true };
  }
  return { success: false, error: 'Distributor not found' };
}

export async function verifySaasOrder(orderId: string, status: 'paid' | 'rejected') {
  const order = db_saas_orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    return { success: true };
  }
  return { success: false, error: 'Order not found' };
}

export async function fetchSuperSalesWithdrawals(salesId: string) {
  const allWithdrawals = await fetchAllWithdrawals();
  return allWithdrawals.filter((w: any) => w.userId === salesId);
}
