// @ts-nocheck
"use server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { withTempleSession, dbQuery } from "../db/db";

// Helper to dynamically get templeId from cookies or fallback
export async function setGuestTempleContext(templeId: string) {
  try {
    const store = await cookies();
    store.set('templeId', templeId, { secure: true, httpOnly: true, path: '/' });
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
  const account = formData.get("account") as string;
  const password = formData.get("password") as string;

  if (!account || !password) return { success: false, error: "請輸入帳號密碼" };

  let redirectPath = "/admin";
  let success = false;
  let loggedInName = account;
  let assignedRole = "TempleAdmin";
  let loginStatus = "Active";

  const searchAccount = account.toLowerCase();
  const pData = (gStore.db_personnel || db_personnel);

  if (account === "PIVOTADMIN01" && password === "PIVOTADMIN01") {
    success = true;
    redirectPath = "/super-admin";
    loggedInName = "超級總裁";
    assignedRole = "SuperAdmin";
  } else if (db_admins.some(a => (a.account || "").toLowerCase() === searchAccount && (a.password === password || !a.password))) {
    success = true;
    redirectPath = "/super-admin";
    assignedRole = "SuperAdmin";
  } else {
    const distributor = db_distributors.find(d => (d.account || "").toLowerCase() === searchAccount && (d.password === password || !d.password));
    if (distributor) {
      if (distributor.status === "Inactive") { loginStatus = "Inactive"; }
      else {
        success = true;
        redirectPath = `/${distributor.id}`;
        assignedRole = "Distributor";
      }
    } else {
      const salesPerson = db_dist_sales.find(s => (s.account || "").toLowerCase() === searchAccount && (s.password === password || !s.password));
      if (salesPerson) {
        if (salesPerson.status === "Inactive") { loginStatus = "Inactive"; }
        else {
          success = true;
          redirectPath = salesPerson.role === "SuperSales" ? `/super-sales/${salesPerson.id}` : `/${salesPerson.distributorId || 'dist-hq'}/${salesPerson.id}`;
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

    return { success: true, redirectPath, role: assignedRole };
  }

  return { success: false, error: "帳號或密碼錯誤" };
}

// 1. 抓取排班
export async function fetchAvailableSlots() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) return [...(gStore.db_slots || db_slots)].filter(x => x.templeId === templeId);
    const res = await client.query('SELECT * FROM slots ORDER BY date, time');
    return res.rows.map(r => ({
      id: r.id,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      time: r.time,
      staff: r.staff,
      description: r.description,
      status: r.status,
      guestName: r.guest_name
    }));
  });
}

// 2. 批量建立排班
export async function createSlot(data: any) {
  let datesStr = '';
  let time = '';
  let staff = '';
  let description = '';
  let location = '';
  let bound_service_id = '';
  let price = 0;

  if (data instanceof FormData) {
    datesStr = data.get("dates") as string || data.get("date") as string;
    time = data.get("time") as string;
    staff = data.get("staff") as string;
    description = data.get("description") as string;
    location = data.get("location") as string;
    bound_service_id = data.get("bound_service_id") as string || data.get("serviceId") as string;
    price = Number(data.get("price")) || 0;
  } else {
    datesStr = data.dates || data.date;
    time = data.time;
    staff = data.staff;
    description = data.description || '';
    location = data.location || '';
    bound_service_id = data.bound_service_id || data.serviceId;
    price = Number(data.price) || 0;
  }

  if (!datesStr) return { success: false, message: "無效的日期" };

  const dateList = datesStr.includes(',') ? datesStr.split(",") : [datesStr];

  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const currentSlots = gStore.db_slots || db_slots;
      const now = Date.now();
      dateList.forEach((date, idx) => {
        currentSlots.push({
          id: now + idx + Math.floor(Math.random() * 1000),
          date,
          time,
          staff,
          description,
          location,
          bound_service_id,
          price,
          status: "Available"
        , templeId});
      });
      gStore.db_slots = [...currentSlots];
      db_slots = gStore.db_slots;
    } else {
      for (const date of dateList) {
        await client.query(
          'INSERT INTO slots (temple_id, date, time, staff, description, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [templeId, date, time, staff, description, location, 'Available']
        );
      }
    }

    revalidatePath("/temple/slots");
    revalidatePath("/temple/calendar");
    revalidatePath("/");
    return { success: true, count: dateList.length };
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
        'INSERT INTO appointments (temple_id, date, time, staff, guest_name, service, status, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [templeId, slot.date, slot.time, slot.staff, guestName, slot.description || '日常預約', 'Confirmed', phone]
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
          ON CONFLICT (phone) DO NOTHING
        `, [phone, guestName, 'Active']);
      }
    }

    revalidatePath("/");
    revalidatePath("/temple/calendar");
    revalidatePath("/temple/customers");
    return { success: true, id: newId };
  });
}

// 3.5 標記預約為已到場
export async function markAppointmentAsArrived(appointmentId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_appointments.findIndex((a: any) => a.id.toString() === appointmentId.toString());
      if (appIdx === -1) return { success: false, message: "找不到該筆預約" };
      db_appointments[appIdx].status = "Arrived";
    } else {
      await client.query('UPDATE appointments SET status = $1 WHERE id = $2', ['Arrived', appointmentId]);
    }
    revalidatePath("/");
    revalidatePath("/temple/calendar");
    revalidatePath("/temple/customers");
    return { success: true };
  });
}

// 3.6 標記預約為已付款
export async function markAppointmentAsPaid(appointmentId: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const appIdx = db_appointments.findIndex((a: any) => a.id.toString() === appointmentId.toString());
      if (appIdx === -1) return { success: false, message: "找不到該筆預約" };
      db_appointments[appIdx].status = "Paid";
    } else {
      await client.query("UPDATE appointments SET status = 'Paid' WHERE id = $1", [appointmentId]);
    }
    revalidatePath("/");
    revalidatePath("/temple/calendar");
    revalidatePath("/temple/customers");
    return { success: true };
  });
}


// 4. 抓取預約紀錄
export async function fetchAppointments() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      db_appointments.forEach((app: any) => {
        if (!app.serviceId) {
          const slot = db_slots.find((s: any) => s.date === app.date && s.time === app.time && s.staff === app.staff);
          if (slot && (slot.bound_service_id || slot.serviceId)) {
            app.serviceId = slot.bound_service_id || slot.serviceId;
          }
        }
        if (app.serviceId) {
          const svc = db_services.find((s: any) => s.id === app.serviceId);
          if (svc) {
            app.service = svc.name;
            if (app.amount === undefined) app.amount = svc.price;
          }
        }
      });
      return [...db_appointments];
    } else {
      const res = await client.query('SELECT * FROM appointments ORDER BY date, time');
      return res.rows.map(r => ({
        id: r.id,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        time: r.time,
        staff: r.staff,
        guestName: r.guest_name,
        service: r.service,
        status: r.status,
        phone: r.phone
      }));
    }
  });
}

// 5. 抓取與儲存服務項目
export async function fetchServiceDefinitions() {
  const templeId = await getDynamicTempleId();
  const currentServices = gStore.db_services || db_services;
  const myServices = currentServices.filter((x: any) => x.templeId === templeId);
  return myServices;
}

export async function saveServiceDefinition(data: any) {
  const templeId = await getDynamicTempleId();
  const id = data.id;
  let currentServices = gStore.db_services || db_services;
  
  const idx = currentServices.findIndex((s: any) => s.id === id);
  if (idx > -1) {
    currentServices[idx] = { ...currentServices[idx], ...data };
  } else {
    // Assign a default vibrant indigo if no color is specified
    const newColor = data.color || '#6366f1'; 
    currentServices.push({ id: id || `s-${Date.now()}`, status: 'Active', color: newColor, ...data , templeId});
  }
  
  gStore.db_services = [...currentServices];
  db_services = gStore.db_services;
  
  revalidatePath("/temple/services");
  revalidatePath("/temple/slots");
  revalidatePath("/temple/calendar");
  return { success: true };
}

export async function deleteServiceDefinition(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      let currentServices = gStore.db_services || db_services;
      gStore.db_services = currentServices.filter((s: any) => !(s.id === id && s.templeId === templeId));
      db_services = gStore.db_services;
      revalidatePath("/temple/services");
      revalidatePath("/temple/slots");
      return { success: true };
    }
    // DB implementation omitted
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
  revalidatePath("/temple/services");
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
  let currentSlots = gStore.db_slots || db_slots;
  const filtered = currentSlots.filter((s: any) => String(s.id) !== String(id));
  
  gStore.db_slots = [...filtered];
  db_slots = gStore.db_slots;
  
  revalidatePath("/temple/slots");
  revalidatePath("/temple/calendar");
  return { success: true };
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
  revalidatePath('/temple/payment-setup');
  return { success: true };
}

export async function executeEmergencyReschedule(formData: FormData) {
  revalidatePath("/temple/slots");
  return { success: true };
}

// --- 其餘輔助函式 ---
export async function fetchLampRecords() { 
  const templeId = await getDynamicTempleId();
  return [...db_lamp_records].filter(r => !r.templeId || r.templeId === templeId).reverse(); 
}
let db_lamp_categories: any[] = initGlobal('db_lamp_categories', []);
export async function fetchLampCategories() {
  const templeId = await getDynamicTempleId();
  const currentCats = gStore.db_lamp_categories || db_lamp_categories;
  const myCats = currentCats.filter((x: any) => x.templeId === templeId);
  return myCats;
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
    store.set(`guestPhone_${templeId}`, phone, { secure: true, httpOnly: true, path: '/' });
    
    revalidatePath('/temple/customers');
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
export async function askAgiAssistant(q: string, h: number) { return { reply: "好的", suggestedAction: "none" }; }

const normCompare = (p1: string, p2: string) => {
  if (!p1 || !p2) return false;
  return normalizePhone(p1) === normalizePhone(p2);
};

export async function fetchGuestAppointments(p: any) { 
  return db_appointments.filter((a: any) => normCompare(a.phone, p)); 
}
export async function fetchServiceSettings() { return { cancelHoursBefore: 24, modifyHoursBefore: 24 }; }

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
      
      const res = await client.query('SELECT * FROM guest_files WHERE temple_id = $1 AND phone = $2 AND temple_id = $2 ORDER BY uploaded_at DESC', [dbPhone, templeId]);
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
  return db_event_registrations.filter(r => r.eventId === eventId);
}

export async function markRegistrationAsPaid(registrationId: string, actualPrice: number) {
  const reg = db_event_registrations.find(r => r.id === registrationId);
  if (!reg) return { success: false, message: '找不到報名紀錄' };
  reg.paymentStatus = 'Paid';
  reg.actualPrice = actualPrice;
  revalidatePath('/temple/events');
  return { success: true };
}
let db_activities: any[] = initGlobal('db_activities', []);
let db_deep_records: any[] = initGlobal('db_deep_records', []);

// (Removed duplicate createOrUpdateGuest)
export async function verifyQueueTicket(eventId: any, phone: string) { 
  const t = db_queue_tickets.find(t => t.eventId === eventId && normCompare(t.phone, phone));
  if (!t) return { success: false, error: 'No ticket found' };
  if (t.status === 'Pending') {
    t.status = 'Queuing';
    t.scannedAt = new Date().toLocaleTimeString();
    t.actualOrder = db_queue_tickets.filter((x: any) => x.eventId === eventId && x.status !== 'Pending').length + 1;
  }
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function registerForEvent(id: any, phone: string, n: string, pr: number) { 
  if (await checkTempleSuspension()) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
  const ev = db_events.find(e => e.id === id);
  if (!ev) return { success: false };
  ev.enrolled += 1;
  db_event_registrations.push({
    id: `REG-${Date.now()}`,
    eventId: id,
    title: ev.title,
    phone,
    guestName: n,
    price: pr,
    paymentStatus: pr > 0 ? 'Pending' : 'Unpaid',
    actualPrice: pr > 0 ? pr : 0,
    timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
  });
  db_activities.push({ phone, timestamp: new Date().toISOString().replace('T', ' ').split('.')[0], type: '活動報名', content: `報名 ${ev.title}` });
  revalidatePath('/temple/events');
  return { success: true }; 
}

export async function fetchGuestRegistrations(p: any) { 
  return db_event_registrations.filter(r => normCompare(r.phone, p)); 
}
export async function fetchGuestQueueTickets(p: any) { 
  return db_queue_tickets.filter((t: any) => normCompare(t.phone, p)); 
}
export async function fetchGuestLampRecords(p: any) { 
  return db_lamp_records.filter(l => normCompare(l.phone, p)); 
}

export async function joinQueue(eventId: any, phone: string, guestName: string) { 
  const ev = db_queue_events.find((e: any) => e.id === eventId);
  if (!ev) return { success: false };
  const assignedNumber = `A${(db_queue_tickets.filter((t: any) => t.eventId === eventId).length + 1).toString().padStart(3, '0')}`;
  const tix = {
    id: `TIX-${Date.now()}`,
    eventId,
    eventTitle: ev.title,
    phone,
    guestName,
    status: 'Pending',
    assignedNumber,
    createdAt: new Date().toISOString().replace('T', ' ').split('.')[0]
  };
  db_queue_tickets.push(tix);
  db_activities.push({ phone, timestamp: new Date().toISOString().replace('T', ' ').split('.')[0], type: '現場取號', content: `抽取 ${ev.title} 號碼牌: ${assignedNumber}` });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true, ticket: tix }; 
}
export type EventItem = { id: string; title: string; date: string; location: string; price: number; status: 'Active' | 'Draft' | 'Completed'; capacity: number; enrolled: number; imageUrl?: string };
let db_events: any[] = initGlobal("db_events", []);

export async function fetchEvents() { const templeId = await getDynamicTempleId(); return [...db_events].filter(x => x.templeId === templeId); }
export async function saveEvent(fd: FormData) { 
  const id = fd.get('id') as string;
  const title = fd.get('title') as string;
  const date = fd.get('date') as string;
  const location = fd.get('location') as string;
  const price = Number(fd.get('price')) || 0;
  const capacity = Number(fd.get('capacity')) || 0;
  const status = (fd.get('status') as any) || 'Draft';
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

  if (id) {
    const idx = db_events.findIndex(e => e.id === id);
    if (idx > -1) {
      db_events[idx] = { ...db_events[idx], title, date, location, price, capacity, status, templeId, imageUrl };
    }
  } else {
    db_events.push({ id: `ev-${Date.now()}`, title, date, location, price, capacity, status, enrolled: 0, templeId, imageUrl });
  }
  revalidatePath('/temple/events');
  revalidatePath('/');
  return { success: true }; 
}
export async function deleteEvent(id: string) { 
  const hasRegistrations = db_event_registrations.some(r => r.eventId === id);
  if (hasRegistrations) return { success: false, error: '該活動已有信眾報名，請先移除相關報名紀錄後再進行刪除。' }; 
  db_events = gStore.db_events = db_events.filter(e => e.id !== id);
  revalidatePath('/temple/events');
  revalidatePath('/');
  return { success: true }; 
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
    { id: 'PLAN-A', name: '標準代理方案', price: 1600000, durationYears: 2, nodes: 100, color: 'indigo' },
    { id: 'PLAN-B', name: '區域旗艦方案', price: 3200000, durationYears: 4, nodes: 250, color: 'emerald' },
    { id: 'PLAN-C', name: '全球戰略方案', price: 8000000, durationYears: 10, nodes: 1000, color: 'slate' }
  ],
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
  { id: 'DAPP-001', name: '大甲區域授權中心', plan: 'PLAN-A', submittedBy: '超級精英業務', status: 'Pending', account: 'dajia_dist', owner: '顏主委', date: '2026-05-12' }
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

export async function upgradeTempleStorage(templeId: string, planId: string, cycle: 'Monthly' | 'Yearly') {
  return withTempleSession(templeId, true, async (client) => {
    if (!client) {
      const plan = db_storage_plans.find((p: any) => p.id === planId);
      if (!plan) return { success: false, message: '找不到選定的空間方案' };

      const discount = db_config.yearlyDiscountRate || 20;
      const priceFactor = cycle === 'Yearly' ? (12 * (1 - discount / 100)) : 1;
      const finalAmount = Math.round(plan.priceMonthly * priceFactor);

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

      await client.query(
        `INSERT INTO wallets (role, name, balance) VALUES ($1, $2, $3, $4) 
         ON CONFLICT (name) DO UPDATE SET balance = wallets.balance + EXCLUDED.balance`,
        ['SuperAdmin', '超級管理員', finalAmount]
      );

      const templeRes = await client.query('SELECT * FROM temples WHERE id = $1', [templeId]);
      const temple = templeRes.rows[0];
      await client.query(
        'INSERT INTO payout_records (temple_name, type, amount, percentage, role_name) VALUES ($1, $2, $3, $4, $5)',
        [temple?.temple_name || '宮廟', `升級空間 ${plan.size_gb}GB (${cycle === 'Monthly' ? '月繳' : '年繳'})`, finalAmount, 100, '超級管理員']
      );

      const allocatedBytes = plan.size_gb * 1024 * 1024 * 1024;
      await client.query(
        `INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city) 
         VALUES ($1, 0, $2, $3, $4)
         ON CONFLICT (temple_id) DO UPDATE SET allocated_bytes = EXCLUDED.allocated_bytes, plan_name = EXCLUDED.plan_name`,
        [templeId, allocatedBytes, `${plan.size_gb}GB 雲端空間`, temple?.city || '台北市']
      );
    }

    revalidatePath('/super-admin');
    revalidatePath('/temple/settings');
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
  return { ...db_config };
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
    role,
    status,
    creatorRole: reqRole,
    creatorId: currentUser.name,
    salesId: sales?.id,
    distributorId: sales?.distributorId || (role === 'distributor' ? data.distributorId : 'system-hq'),
    timestamp: new Date().toISOString(),
    billingStartDate: data.freeType === 'Trial' ? 
      new Date(Date.now() + (parseInt(data.trialMonths || '0') * 30 * 24 * 60 * 60 * 1000)).toISOString() : 
      new Date().toISOString()
  };
  db_temples.push(newTemple);

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
  return [...db_distributor_applications.filter(a => a.status === 'Pending')];
}

export async function approveDistributorBySuperAdmin(id: string) {
  const app = db_distributor_applications.find(a => a.id === id);
  if (app) {
    app.status = 'Active';
    // Create actual distributor account logic would go here
  }
  revalidatePath('/super-admin');
  return { success: true };
}

export async function rejectDistributorBySuperAdmin(id: string) {
  const idx = db_distributor_applications.findIndex(a => a.id === id);
  if (idx > -1) db_distributor_applications.splice(idx, 1);
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

  db_distributors.forEach(d => {
    accounts.push({ ...d, id: d.id, name: d.name, role: 'Distributor', account: d.account, status: d.status || 'Active' });
  });

  db_dist_sales.forEach(s => {
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
  return [
    { id: 'ss-1', name: '超級精英業務', role: 'SuperSales', rates: db_super_sales_overrides['超級精英業務'] || db_config.defaultSuperSalesRates },
    { id: 'ss-2', name: '王牌開路先鋒', role: 'SuperSales', rates: db_super_sales_overrides['王牌開路先鋒'] || db_config.defaultSuperSalesRates }
  ];
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
  const { name, phone, account, password, setupRate, rentYear1Rate, rentYear2Rate, rentYear3PlusRate } = data;
  const newSales = {
    id: 'dist-sales-' + Date.now(),
    name,
    phone,
    account,
    password,
    distributorId: distId,
    commissionRates: { setupRate, rentYear1Rate, rentYear2Rate, rentYear3PlusRate },
    joinedAt: new Date().toISOString().split('T')[0],
    status: 'Active'
  };
  
  db_dist_sales.push(newSales);
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

  const newApp = {
    id: 'DAPP-' + Math.random().toString(36).substr(2, 9),
    ...data,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0]
  };
  db_distributor_applications.push(newApp);

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

  const distributors = db_distributors.filter(d => d.creatorSalesId === salesId || d.salesId === salesId).map(d => ({
    id: d.id,
    name: d.name,
    status: d.contractStatus || 'Active',
    plan: '經銷專案',
    date: d.joinedAt || '未知',
    nodesUsed: db_temples.filter(t => t.distributorId === d.id).length
  }));

  return { temples, distributors };
}

// --- Super Admin Account Creation API ---

export async function createSuperSalesAccount(data: any) {
  const id = `ss-${Date.now()}`;
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
    account: data.account,
    password: data.password,
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

  revalidatePath('/super-admin');
  return { success: true, id };
}

export async function createDistributorAccount(data: any) {
  const id = 'dist-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  const plan = db_config.distributorPlans.find((p: any) => p.id === data.planId) || db_config.distributorPlans[0];
  const finalPrice = Number(data.customPrice) || plan.price;
  
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + (Number(data.years) || 2));
  
  const newDist = {
    id,
    ...data,
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
    account: data.account,
    owner: data.owner,
    date: new Date().toISOString().split('T')[0]
  });

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
         if (dist.quota <= 0) return { success: false, message: '您的授權配額已耗盡，無法開設新宮廟' };
         dist.quota -= 1;
      }
    }
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
  revalidatePath('/temple');
  return { success: true, id };
}


export async function fetchAggregatedAnalytics() {
  const totalTemples = db_temples.length;
  const activeTemples = db_temples.filter(t => t.status === 'Active').length;
  const totalDistributors = db_distributors.length;
  const totalSuperSales = db_dist_sales.filter(s => s.role === 'SuperSales').length;
  
  const monthlyRevenue = activeTemples * db_config.fixedMonthlyRent;
  
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
  db_dist_sales.push({ 
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
  });
  revalidatePath('/distributor');
  return { success: true, id }; 
}
export async function fetchDistributorTeam(distributorId: string) {
  return db_dist_sales.filter(s => s.distributorId === distributorId);
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
    if (a.paymentStatus === 'Paid' && a.status !== 'Cancelled') {
      addRevenue(a.date, Number(a.amount) || 0, a.templeId);
    }
  });

  db_lamp_records.forEach((r: any) => {
    if (r.paymentStatus === 'Paid') {
      let price = r.actualPrice || r.price || 0;
      if (!price && r.categoryId) {
         const cat = db_lamp_categories.find((c: any) => c.id === r.categoryId);
         if (cat) price = cat.price;
      }
      addRevenue(r.date || r.timestamp, Number(price) || 0, r.templeId);
    }
  });

  db_event_registrations.forEach((r: any) => {
    if (r.paymentStatus === 'Paid') {
      addRevenue(r.timestamp, Number(r.actualPrice) || 0, r.templeId);
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
  months.forEach(m => totalRevenue += m.amount); // From the revenue loop above
  
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

  db_lamp_records.filter(r => r.templeId === templeId && r.price > 0).forEach(r => {
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
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date
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

export async function updateServiceSettings() { return { success: true }; }

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

    revalidatePath('/temple/customers');
    revalidatePath('/temple/calendar');
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
    revalidatePath('/temple/personnel');
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
    revalidatePath('/temple/personnel');
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
    revalidatePath('/temple/personnel');
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
  
  // Format today's date YYYY-MM-DD in local timezone roughly
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  // 1. Today's Appointments
  let todayAppointments = 0;
  let completedAppointments = 0;
  let totalServices = 0;
  const serviceCounts: Record<string, number> = {};

  db_appointments.forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    
    // Service Heat Calculation
    if (a.service) {
      serviceCounts[a.service] = (serviceCounts[a.service] || 0) + 1;
      totalServices++;
    }

    // Today's appointments Calculation
    if (a.date === todayStr) {
      todayAppointments++;
      if (a.status === 'Completed' || a.status === 'Confirmed' || a.paymentStatus === 'Paid') {
        // Just as an example, count completed/paid as completed for today
        completedAppointments++;
      }
    }
  });

  // Top 3 Services
  const sortedServices = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count], index) => {
       const colors = ['bg-indigo-500', 'bg-blue-400', 'bg-sky-300'];
       return {
         label,
         val: totalServices === 0 ? 0 : Math.round((count / totalServices) * 100),
         color: colors[index % colors.length]
       };
    });

  if (sortedServices.length === 0) {
     sortedServices.push({ label: '目前無預約', val: 0, color: 'bg-slate-200' });
  }

  // 2. Queue Summary (Live Queue)
  const validEventIds = db_queue_events.filter((e: any) => e.status === 'Active' && (!e.templeId || e.templeId === templeId));
  const qActive = validEventIds.map((evt: any) => {
    const tix = db_queue_tickets.filter((t: any) => t.eventId === evt.id);
    const waiting = tix.filter((t: any) => t.status === 'Queuing').length;
    const completed = tix.filter((t: any) => t.status === 'Completed').length;
    return { title: evt.title, waiting, completed };
  });

  // 3. Total Guests
  let totalGuests = 0;
  db_guests.forEach((g: any) => {
    if (templeId && g.templeId && g.templeId !== templeId) return;
    totalGuests++;
  });

  // 4. Lamp Stats
  let totalLamps = 0;
  let activeLamps = 0;
  db_lamp_records.forEach((l: any) => {
    if (templeId && l.templeId && l.templeId !== templeId) return;
    totalLamps++;
    if (l.status === 'Active' || l.paymentStatus === 'Paid') activeLamps++;
  });

  // Storage info (mocked/static for now)
  const storageInfo = { used: 12.5, total: 100 };

  return {
    analyticsSettings: {},
    analyticsData: { 
      todayAppointments,
      completedAppointments,
      totalGuests,
      lampStats: { totalLamps, activeLamps },
      serviceHeat: sortedServices
    },
    raw: {
      apps: [],
      agiStats: {},
      guests: [],
      storageInfo,
      qActive
    }
  };
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
      const seen = new Set();
      db_guests = db_guests.filter((g: any) => {
        const p = normalizePhone(g.phone);
        if (seen.has(p)) return false;
        seen.add(p);
        return true;
      });
      gStore.db_guests = db_guests; // 同步至全域快取
      return [...db_guests].reverse(); 
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
      const res = await client.query('SELECT * FROM guests ORDER BY created_at DESC');
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
        const conflictRes = await client.query('SELECT 1 FROM guests WHERE temple_id = $1 AND phone = $2', [d.phone]);
        if (conflic(tRes.rowCount ?? 0) > 0) {
          return { success: false, error: "此手機號碼已被其他信眾檔案使用！" };
        }
      }
      
      const checkRes = await client.query('SELECT 1 FROM guests WHERE temple_id = $1 AND phone = $2', [lookupPhone]);
      if ((checkRes.rowCount ?? 0) > 0) {
        // Update!
        await client.query(`
          UPDATE guests 
          SET phone = $1, name = $2, email = $3, password = $4, address = $5, birthday = $6, lunar_birthday = $7, birth_hour = $8, line_id = $9, status = $10
          WHERE temple_id = $1 AND phone = $21
        `, [
          d.phone, d.name, d.email || null, d.password || null, d.address || null,
          d.birthday || null, d.lunarBirthday || null, d.birthHour || null, d.lineId || null, d.status || 'Active',
          lookupPhone
        ]);
      } else {
        // Insert!
        await client.query(`
          INSERT INTO guests (temple_id, phone, name, email, password, address, birthday, lunar_birthday, birth_hour, line_id, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          d.phone, d.name, d.email || null, d.password || null, d.address || null,
          d.birthday || null, d.lunarBirthday || null, d.birthHour || null, d.lineId || null, d.status || 'Active'
        ]);
      }
    }
    revalidatePath('/temple/customers');
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
      
      const normPhone = normalizePhone(phone);
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
      activities: db_activities.filter((a: any) => normCompare(a.phone, p)) 
    }; 
  });
}
export async function saveDeepRecord(phone: string, eventId: string, serviceType: string, staffName: string, values: any) {
  const newRecord = {
    id: `rec-${Date.now()}`,
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

  revalidatePath('/temple/customers');
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
export async function createLampRecord(data: any) { 
  // Handle both FormData (from direct forms) and plain objects
  let phone = '';
  let categoryId = '';
  let guestName = '';
  let notice = '';
  let paymentMethod = '';
  let paymentRef = '';

  if (data instanceof FormData) {
    phone = data.get('phone') as string;
    categoryId = data.get('categoryId') as string;
    guestName = data.get('guestName') as string;
    notice = data.get('notice') as string;
    paymentMethod = data.get('paymentMethod') as string || 'Cash';
    paymentRef = data.get('paymentRef') as string || '';
  } else {
    phone = data.phone;
    categoryId = data.categoryId;
    guestName = data.guestName;
    notice = data.notice;
    paymentMethod = data.paymentMethod || 'Cash';
    paymentRef = data.paymentRef || '';
  }

  const cat = db_lamp_categories.find(c => c.id === categoryId);
  if(!cat) return { success: false, error: '未找到燈種類別' };
  
  const today = new Date();
  const exp = new Date(today.getTime() + (cat.durationDays * 24 * 60 * 60 * 1000));
  
  const templeId = await getDynamicTempleId();

  const newRecord = {
    id: `LMP-${Date.now()}`,
    templeId,
    phone,
    guestName,
    categoryId: cat.id,
    categoryName: cat.name,
    price: cat.price,
    durationDays: cat.durationDays || 365,
    notice: notice || '',
    startDate: today.toISOString().split('T')[0],
    expiryDate: exp.toISOString().split('T')[0],
    status: 'Active',
    paymentMethod,
    paymentRef,
    paymentStatus: paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi' ? 'Paid' : 'Pending',
    createdAt: new Date().toISOString()
  };

  db_lamp_records.push(newRecord);
  
  // Also log to activities if possible
  if (typeof db_activities !== 'undefined') {
    db_activities.push({ 
      phone, 
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0], 
      type: '點燈', 
      content: `成功安奉 ${cat.name}` 
    });
  }
  
  revalidatePath('/temple/lamps');
  revalidatePath('/temple/customers');
  revalidatePath('/');
  return { success: true, record: newRecord }; 
}
export async function checkLampNotifications() { return { hasNotification: false }; }
export async function saveLampCategory(data: any) { 
  const id = data.id;
  const templeId = await getDynamicTempleId();
  if (id) {
    const idx = db_lamp_categories.findIndex(c => c.id === id);
    if (idx > -1) db_lamp_categories[idx] = { ...db_lamp_categories[idx], ...data, templeId };
  } else {
    db_lamp_categories.push({ id: `cat-${Date.now()}`, ...data, totalSlots: data.totalSlots || 500, templeId });
  }
  revalidatePath('/temple/lamps');
  return { success: true }; 
}

export async function confirmPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {
  if (recordType === 'Lamp') {
    const idx = db_lamp_records.findIndex(r => r.id === recordId);
    if (idx > -1) {
      db_lamp_records[idx].status = 'Active';
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
  revalidatePath('/');
  revalidatePath('/[templeId]/admin/customers');
  return { success: true };
}

export async function deleteLampCategory(id: string) { 
  const hasRecords = db_lamp_records.some(r => r.categoryId === id);
  if (hasRecords) return { success: false, error: '該點燈類別已有信眾登記，請先移除相關信眾紀錄後再進行刪除。' }; 
  db_lamp_categories = gStore.db_lamp_categories = db_lamp_categories.filter(c => c.id !== id);
  revalidatePath('/temple/lamps');
  return { success: true }; 
}
export async function renewLampRecord(id: string) { return { success: true }; }

// --- 現場排隊 (Queue) 相關 mock 函式與型別 ---
export type QueueEvent = any;

// Redundant declaration removed

// Removed redundant initialization block

export async function fetchQueueEvents() { const templeId = await getDynamicTempleId(); 
  return db_queue_events.filter(e => !e.templeId || e.templeId === templeId).map(evt => {
    const participantCount = db_queue_tickets.filter(t => t.eventId === evt.id && t.status === 'Queuing').length;
    return { ...evt, participantCount };
  });
}
export async function fetchActiveQueues() { const templeId = await getDynamicTempleId(); return db_queue_events.filter(e => e.status === 'Active' && (!e.templeId || e.templeId === templeId)); }
export async function fetchQueueDashboard(eventId?: string) { 
  if (!eventId) return { tickets: [] };
  return { tickets: db_queue_tickets.filter(t => t.eventId === eventId) }; 
}

// 獲取當前活動以掃碼正在排隊的人數
export async function fetchActiveQueueCount(): Promise<number> { const templeId = await getDynamicTempleId();
  const activeEventIds = db_queue_events.filter(e => e.status === 'Active' && (!e.templeId || e.templeId === templeId)).map(e => e.id);
  if (activeEventIds.length === 0) return 0;
  return db_queue_tickets.filter(t => activeEventIds.includes(t.eventId) && t.status === 'Queuing').length;
}

export async function createQueueEvent(data: any) { 
  const templeId = await getDynamicTempleId(); 
  
  // Validation 1: Date must be > today
  const todayStr = new Date().toISOString().split('T')[0];
  if (data.date <= todayStr) {
    return { success: false, error: '只能部屬明日之後的活動。' };
  }

  // Validation 2: Time overlap
  const overlapping = db_queue_events.find(e => 
    e.templeId === templeId && 
    e.date === data.date && 
    e.status !== 'Cancelled' && 
    (data.startTime < e.endTime && data.endTime > e.startTime)
  );

  if (overlapping) {
    return { success: false, error: `同一日時段有重複（與 "${overlapping.title}" 衝突），無法部屬。` };
  }

  db_queue_events.push({ id: `qe-${Date.now()}`, ...data, templeId, status: 'Draft' });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function activateQueueEvent(id: string) { 
  db_queue_events = gStore.db_queue_events = db_queue_events.map(e => e.id === id ? { ...e, status: 'Active' } : { ...e, status: e.status === 'Active' ? 'Completed' : e.status });
  
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function deleteQueueEvent(id: string) { 
  const hasTickets = db_queue_tickets.some(t => t.eventId === id);
  if (hasTickets) {
    const idx = db_queue_events.findIndex(e => e.id === id);
    if (idx > -1) {
      db_queue_events[idx] = { ...db_queue_events[idx], status: 'Cancelled' };
      gStore.db_queue_events = db_queue_events;
    }
  } else {
    db_queue_events = gStore.db_queue_events = db_queue_events.filter(e => e.id !== id);
    db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.filter(t => t.eventId !== id);
  }
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function checkInWithQr(ticketId: string, eventId?: string) { 
  const ticket = db_queue_tickets.find(t => t.id === ticketId);
  if (!ticket) return { success: false, error: '找不到票券' };
  if (ticket.status !== 'Registered') return { success: false, error: '票券狀態不正確' };
  if (eventId && ticket.eventId !== eventId) return { success: false, error: '活動不符，請掃描正確的活動QR碼' };

  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => {
    if (t.id === ticketId) {
      const qCount = db_queue_tickets.filter(x => x.eventId === t.eventId && (x.status === 'Queuing' || x.status === 'Calling' || x.status === 'Completed')).length + 1;
      return { ...t, status: 'Queuing', actualOrder: qCount, scannedAt: new Date().toLocaleTimeString() };
    }
    return t;
  });
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function callNextInQueue(eventId: string) { 
  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.eventId === eventId && t.status === 'Calling' ? { ...t, status: 'Completed' } : t);
  const nextTicket = db_queue_tickets.slice().sort((a,b) => a.actualOrder - b.actualOrder).find(t => t.eventId === eventId && t.status === 'Queuing');
  if (!nextTicket) return { error: 'NO_ONE_IN_QUEUE' };
  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.id === nextTicket.id ? { ...t, status: 'Calling' } : t);
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function completeQueueService(ticketId: string) { 
  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.id === ticketId ? { ...t, status: 'Completed' } : t);
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function updateQueueStatus(ticketId: string, status: string) { 
  db_queue_tickets = gStore.db_queue_tickets = db_queue_tickets.map(t => t.id === ticketId ? { ...t, status } : t);
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true }; 
}

export async function registerGuestForQueue(eventId: string, data: { guestName: string, phone: string, isOnline?: boolean }) {
  const event = db_queue_events.find(e => e.id === eventId);
  if (!event) return { error: 'EVENT_NOT_FOUND' };
  
  const eventTickets = db_queue_tickets.filter(t => t.eventId === eventId);
  
  // Capacity check
  if (event.maxCapacity && eventTickets.length >= event.maxCapacity) {
    return { error: '活動預約已額滿！' };
  }

  const nextNumber = `A${(eventTickets.length + 1).toString().padStart(3, '0')}`;
  
  const newTicket = {
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
  revalidatePath('/temple/queue');
  revalidatePath('/live-queue');
  return { success: true, ticket: newTicket };
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
  revalidatePath('/temple/customers');
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
    revalidatePath('/temple/my-network');
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
    revalidatePath('/temple/my-network');
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
    revalidatePath('/temple/my-network');
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

    revalidatePath('/');
    revalidatePath('/temple/notifications');
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
    
    revalidatePath('/');
    revalidatePath('/[templeId]/admin/calendar');
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
    const temple = db_temples.find(t => t.id === usage.templeId) || { name: '未知宮廟' };
    const plan = db_ai_plans.find(p => p.id === usage.planId) || { name: '無方案', chatLimit: 0 };
    return { ...usage, templeName: temple.name, planName: plan.name, chatLimit: plan.chatLimit || 0 };
  });
}

export async function grantTempleAiVip(templeId: string, isVip: boolean) {
  let usage = db_temple_ai_usage.find(u => u.templeId === templeId);
  if (!usage) {
    usage = { templeId, enabled: true, planId: 'AI-500', usedCount: 0, expiryDate: new Date().toISOString(), isVip };
    db_temple_ai_usage.push(usage);
  } else {
    usage.isVip = isVip;
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

export async function fetchAuditLogs() {
  const templeId = await getDynamicTempleId();
  return db_audit_logs.filter(log => log.templeId === templeId || !log.templeId);
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
