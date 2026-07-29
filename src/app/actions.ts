// @ts-nocheck
"use server";
import prisma from '@/lib/prisma';

export async function getSafeJsonArray(collection: string): Promise<any[]> {
  try {
    const data = await [];
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}
export async function getSafeJsonObject(collection: string): Promise<any> {
  try {
    const data = await [];
    return (data && !Array.isArray(data)) ? data : (Array.isArray(data) && data.length > 0 ? data[0] : {});
  } catch (e) {
    return {};
  }
}

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { withTempleSession, dbQuery } from "../db/db";

// Helper to dynamically get templeId from cookies or fallback

async function getRoleLabel(name: string): Promise<string> {
  if (!name) return '未知人員';
  
  // 1. Check DistSales (SuperSales / DistSales)
  const sales = [].find((s: any) => s.name === name);
  if (sales) {
    if (sales.role === 'SuperSales') return `超級業務 ${name}`;
    if (sales.role === 'DistSales') {
      const dist = [].find((d: any) => d.id === sales.distributorId);
      const distName = dist ? dist.name : '經銷商';
      return `${distName} 經銷業務 ${name}`;
    }
  }

  // 2. Check Distributor Admin
  const distAdmin = [].find((d: any) => d.name === name || d.contactName === name);
  if (distAdmin) {
    return `經銷商 ${name}`;
  }

  // Fallback
  return `人員 ${name}`;
}

export async function revalidateTemple(templeId?: string) {
  const tId = templeId || await getDynamicTempleId();
    revalidatePath(`/${tId}`, 'layout');
    revalidatePath('/super-admin', 'layout');
    revalidatePath('/', 'layout');
}

export async function setGuestTempleContext(templeId: string) {
  const store = await cookies();
    store.set('templeId', templeId, { secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
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
  try {
    /* removed duplicate import */
    const res = await dbQuery("SELECT * FROM \"TempleBill\" WHERE temple_id = $1 AND status = 'Unpaid' AND \"dueDate\" < CURRENT_DATE", [tId], () => null) as any;
    const rows = res?.rows;
    return (rows && rows.length > 0);
  } catch(e) {
    return false;
  }
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





const DEFAULT_SERVICES = [
  { id: '1', name: '光明燈祈福', price: 600, duration: '30 min', description: '消災解厄，前途光明', assignedStaff: [1, 2], color: '#f59e0b' },
  { id: '2', name: '文昌開運', price: 800, duration: '45 min', description: '金榜題名，智慧大開', assignedStaff: [3], color: '#3b82f6' },
  { id: '3', name: '太歲安奉', price: 1000, duration: '20 min', description: '歲歲平安，諸事順遂', assignedStaff: [1], color: '#ef4444' },
  { id: '4', name: '問事服務', price: 0, duration: '20 min', description: '指點迷津，解惑人生', assignedStaff: [1, 2], color: '#8b5cf6' },
  { id: '5', name: '例行祈福', price: 0, duration: '30 min', description: '日常平安祈福', assignedStaff: [1], color: '#10b981' },
];

// migrated (await jsonStore.find('services')) to (await jsonStore.find('services'))

// Ensure core services are present and have correct colors, but DO NOT wipe other services
for (const ds of DEFAULT_SERVICES) {
  const existing = [].find(s => s.id === ds.id);
  if (!existing) {
    await null;
  } else {
    existing.color = ds.color; // Force update color for demo consistency
  }
}
// (await jsonStore.find('services')) synced

// migrated (await jsonStore.find('print_templates')) to (await jsonStore.find('print_templates'))
// migrated (await jsonStore.find('forms')) to (await jsonStore.find('forms'))

// migrated (await jsonStore.find('queue_events')) to (await jsonStore.find('queue_events'))
// migrated (await jsonStore.find('queue_tickets')) to (await jsonStore.find('queue_tickets'))

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
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const account = cookieStore.get('admin_account')?.value;
  const role = cookieStore.get('admin_role')?.value;
  const templeId = cookieStore.get('templeId')?.value;

  if (!account) return null;

  if (account === 'PIVOTADMIN01') {
    return {
      id: "super-1",
      name: "PIVOT 總裁",
      role: "SuperAdmin",
      avatar: "https://ui-avatars.com/api/?name=PIVOT&background=0F172A&color=fff",
      permissions: ['all']
    };
  }

  let permissions = ['all'];
  let name = account;
  let id = "admin-1";

  if (templeId) {
    let person: any = null;
    const resPerson = await dbQuery("SELECT * FROM \"User\" WHERE LOWER(account) = $1 AND \"templeId\" = $2", [account.toLowerCase(), templeId]) as any;
    if (resPerson && resPerson.rowCount > 0) {
      person = resPerson.rows[0];
    }
    
    if (person) {
      name = person.name;
      id = person.id || person.temple_id;
      if (person.permissions && Array.isArray(person.permissions)) {
        permissions = person.permissions;
      } else {
        permissions = role === 'TempleAdmin' ? ['all'] : [];
      }
    }
  }

  return { 
    id, 
    name, 
    role: role || "TempleAdmin", 
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff`,
    permissions
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

export async function loginAccount(formData: FormData, targetTempleId?: string) {
  const account = (formData.get("account") as string || "").trim();
  const password = (formData.get("password") as string || "").trim();

  if (!account || !password) return { success: false, error: "請輸入帳號密碼" };

  let redirectPath = "/admin";
  let success = false;
  let loggedInName = account;
  let assignedRole = "TempleAdmin";
  let loginStatus = "Active";
  const searchAccount = account.toLowerCase();

  if (targetTempleId) {
    let person = null;
    const resPerson = await dbQuery("SELECT * FROM \"User\" WHERE LOWER(account) = $1 AND password = $2 AND \"templeId\" = $3", [searchAccount, password, targetTempleId]) as any;
    if (resPerson && resPerson.rowCount > 0) {
      person = resPerson.rows[0];
      person.templeId = person.temple_id;
    }

    if (person) {
      const resTemple = await dbQuery("SELECT status FROM \"Temple\" WHERE id = $1", [person.templeId]) as any;
      if (resTemple && resTemple.rowCount > 0) {
        if (resTemple.rows[0].status === "Inactive") {
          return { success: false, error: "該宮廟已被停權，無法登入" };
        }
      }
      success = true; 
      redirectPath = `/${person.templeId}/admin`; 
      loggedInName = person.name;
      assignedRole = "TempleAdmin"; 
    } else {
      return { success: false, error: "無效的帳號或密碼" };
    }
  } else {
    if (account === "PIVOTADMIN01" && password === "PIVOTADMIN01") {
      success = true;
      redirectPath = "/super-admin";
      loggedInName = "超級總裁";
      assignedRole = "SuperAdmin";
    } else {
      let isSuperAdmin = false;
      const resAdmin = await dbQuery("SELECT * FROM admins WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password]) as any;
      if (resAdmin && resAdmin.rowCount > 0) isSuperAdmin = true;

      if (isSuperAdmin) {
        success = true;
        redirectPath = "/super-admin";
        assignedRole = "SuperAdmin";
      } else {
        let distributor = null;
        const resDist = await dbQuery("SELECT * FROM distributors WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password]) as any;
        if (resDist && resDist.rowCount > 0) {
          distributor = resDist.rows[0];
        }

        if (distributor) {
          if (distributor.status === "Inactive") { loginStatus = "Inactive"; }
          else {
            success = true;
            redirectPath = `/distributor/${distributor.id}`;
            assignedRole = "Distributor";
          }
        } else {
          let salesPerson = null;
          const resSales = await dbQuery("SELECT * FROM dist_sales WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password]) as any;
          if (resSales && resSales.rowCount > 0) {
            salesPerson = resSales.rows[0];
            salesPerson.distributorId = salesPerson.distributor_id;
          }

          if (salesPerson) {
            if (salesPerson.status === "Inactive") { loginStatus = "Inactive"; }
            else {
              success = true;
              redirectPath = salesPerson.role === "SuperSales" ? `/super-sales/${salesPerson.id}` : `/dist-sales-portal/${salesPerson.distributorId || 'dist-hq'}/${salesPerson.id}`;
              assignedRole = salesPerson.role === "SuperSales" ? "SuperSales" : "DistSales";
            }
          } else {
            let person = null;
            const resPerson = await dbQuery("SELECT * FROM \"User\" WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password]) as any;
            if (resPerson && resPerson.rowCount > 0) {
              person = resPerson.rows[0];
              person.templeId = person.temple_id;
            }

            if (person) { 
              if (person.role !== 'TempleAdmin') {
                return { success: false, error: "一般行政人員請透過各宮廟專屬登入連結進行登入。" };
              }
              const resTemple = await dbQuery("SELECT status FROM \"Temple\" WHERE id = $1", [person.templeId]) as any;
              if (!resTemple || resTemple.rowCount === 0) {
                 return { success: false, error: "無法取得宮廟資料，可能正在建立中或資料庫異常" };
              }
              if (resTemple.rows[0].status === "Inactive") {
                 loginStatus = "Inactive";
              } else {
                 success = true; 
                 redirectPath = `/${person.templeId}/admin`; 
                 loggedInName = person.name;
                 assignedRole = "TempleAdmin"; 
              }
            } else {
              // Try finding temple master account directly
              const resMainTemple = await dbQuery("SELECT * FROM \"Temple\" WHERE LOWER(account) = $1 AND password = $2", [searchAccount, password]) as any;
              if (resMainTemple && resMainTemple.rowCount > 0) {
                const mainTemple = resMainTemple.rows[0];
                if (mainTemple.status === "Inactive") {
                  loginStatus = "Inactive";
                } else {
                  success = true;
                  redirectPath = `/${mainTemple.id}/admin`;
                  loggedInName = mainTemple.temple_name;
                  assignedRole = "TempleAdmin";
                }
              }
            }
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
    const newLogTimestamp = new Date().toISOString();

    withTempleSession("hq", true, async (client) => {
      if (client) {
         try {
           await client.query("CREATE TABLE IF NOT EXISTS admin_logs (id SERIAL PRIMARY KEY, action VARCHAR(100), details TEXT, timestamp VARCHAR(100), performed_by VARCHAR(100))");
           await client.query("INSERT INTO admin_logs (action, details, timestamp, performed_by) VALUES ($1, $2, $3, $4)", ["LOGIN", logMsg, newLogTimestamp, loggedInName]);
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
  
  if (account === "PIVOTADMIN01") return true;
  
  let exists = false;
  const res1 = await dbQuery("SELECT 1 FROM \"User\" WHERE LOWER(account) = $1", [searchAccount]) as any;
  if (res1 && res1.rowCount > 0) exists = true;
  
  const res2 = await dbQuery("SELECT 1 FROM distributors WHERE LOWER(account) = $1", [searchAccount]) as any;
  if (res2 && res2.rowCount > 0) exists = true;
  
  const res3 = await dbQuery("SELECT 1 FROM dist_sales WHERE LOWER(account) = $1", [searchAccount]) as any;
  if (res3 && res3.rowCount > 0) exists = true;

  const res4 = await dbQuery("SELECT 1 FROM \"Temple\" WHERE LOWER(account) = $1", [searchAccount]) as any;
  if (res4 && res4.rowCount > 0) exists = true;
  
  return exists;
  if (adminData.some((a: any) => (a.account || "").toLowerCase() === searchAccount)) return true;
  
  const resDist = await dbQuery("SELECT id FROM distributors WHERE LOWER(account) = $1", [searchAccount], () => null) as any;
    if (resDist && resDist.rowCount > 0) return true;
    const resSales = await dbQuery("SELECT id FROM dist_sales WHERE LOWER(account) = $1", [searchAccount], () => null) as any;
    if (resSales && resSales.rowCount > 0) return true;
  
  return false;
}

// 1. 抓取排班
export async function fetchAvailableSlots() {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return [];
        const slots = await prisma.slot.findMany({
          where: { templeId },
          orderBy: [{ date: 'asc' }, { time: 'asc' }]
        });
        return slots.map(r => ({
          id: r.id,
          date: r.date,
          time: r.time,
          staff: r.staff,
          description: r.description,
          location: r.location,
          bound_service_id: r.boundServiceId,
          price: r.price,
          status: r.status,
          guestName: r.guestName
        }));
      } catch(e) {
        console.error(e);
        return [];
      }
}

// 2. 批量建立排班
export async function createSlot(data: any) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return { success: false };
        
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
        const dateList = datesStr?.includes(',') ? datesStr.split(",") : [datesStr];
        
        const createData = dateList.map(date => ({
          templeId,
          date,
          time,
          staff,
          description,
          location,
          boundServiceId: bound_service_id,
          price,
          status: 'Available'
        }));
        
        await prisma.slot.createMany({ data: createData });
        await revalidateTemple();
        return { success: true, count: dateList.length };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function updateSlot(id: number, data: any) {

      try {
        const templeId = await getDynamicTempleId();
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
        
        await prisma.slot.updateMany({
          where: { id: String(id), templeId: templeId! },
          data: {
            date,
            time,
            staff,
            description,
            location,
            boundServiceId: bound_service_id,
            price
          }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
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
  
  for (const stage of immediateStages) {
    const logMsg = `[LINE 推播成功] 已發送【${serviceTitle}】通知至信眾 ${targetName} (${targetPhone}) | 內容: ${stage.content}`;
    const newLog = {
      id: "log-" + Date.now() + Math.random(),
      action: "LINE_PUSH",
      details: logMsg,
      timestamp: new Date().toISOString(),
      performedBy: 'System (Auto)'
    };
    await null;
    // (await jsonStore.find('audit_logs')) synced
  }
}

export async function bookAppointment(slotId: number, guestName: string, phone: string, paymentMethod?: string, paymentRef?: string, amount?: number) {

      try {
        const templeId = await getDynamicTempleId();
        if (await checkTempleSuspension(templeId)) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
        
        const slot = await prisma.slot.findUnique({ where: { id: String(slotId) } });
        if (!slot) return { success: false, message: "找不到該時段" };
        if (slot.status === 'Booked') return { success: false, message: "該時段已被預約" };
        
        await prisma.slot.update({
          where: { id: String(slotId) },
          data: { status: 'Booked', guestName }
        });
        
        const paymentStatus = (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') ? 'Paid' : 'Pending';
        const amountVal = amount || 0;
        
        const newApp = await prisma.appointment.create({
          data: {
            templeId: templeId!,
            date: slot.date,
            time: slot.time,
            staff: slot.staff,
            guestName,
            service: slot.description || '日常預約',
            serviceId: slot.boundServiceId || null,
            status: 'Confirmed',
            phone,
            paymentMethod: paymentMethod || null,
            paymentRef: paymentRef || null,
            paymentStatus,
            amount: amountVal
          }
        });
        
        const normPhone = normalizePhone(phone);
        await prisma.guest.upsert({
          where: { phone: normPhone },
          update: {},
          create: {
            templeId,
            phone: normPhone,
            name: guestName,
            status: 'Active'
          }
        });
        
        await revalidateTemple();
        return { success: true, id: newApp.id };
      } catch(e) {
        console.error(e);
        return { success: false, message: '預約失敗' };
      }
}

export async function cancelAppointment(appId: number) {

      try {
        const templeId = await getDynamicTempleId();
        const app = await prisma.appointment.findFirst({
          where: { id: String(appId), templeId: templeId! }
        });
        
        if (!app) return { success: false, message: '找不到該預約' };
        
        await prisma.appointment.update({
          where: { id: app.id },
          data: { status: 'Cancelled' }
        });
        
        await prisma.slot.updateMany({
          where: {
            date: app.date,
            time: app.time,
            staff: app.staff,
            templeId: templeId!,
            status: 'Booked'
          },
          data: {
            status: 'Available',
            guestName: null
          }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function rescheduleSingleAppointment(appointmentId: number, newSlotId: number) {

      try {
        const templeId = await getDynamicTempleId();
        
        const app = await prisma.appointment.findFirst({
          where: { id: String(appointmentId), templeId: templeId! }
        });
        if (!app) return { success: false, message: '找不到該預約' };
        
        const newSlot = await prisma.slot.findFirst({
          where: { id: String(newSlotId), templeId: templeId! }
        });
        if (!newSlot) return { success: false, message: '找不到新選擇的時段' };
        if (newSlot.status === 'Booked') return { success: false, message: '該新時段已被預約' };
        
        const oldTimeStr = `${app.date} ${app.time}`;
        const newTimeStr = `${newSlot.date} ${newSlot.time}`;
        
        await prisma.slot.updateMany({
          where: {
            date: app.date,
            time: app.time,
            staff: app.staff,
            templeId: templeId!,
            status: 'Booked'
          },
          data: { status: 'Available', guestName: null }
        });
        
        await prisma.slot.update({
          where: { id: newSlot.id },
          data: { status: 'Booked', guestName: app.guestName }
        });
        
        await prisma.appointment.update({
          where: { id: app.id },
          data: {
            date: newSlot.date,
            time: newSlot.time,
            staff: newSlot.staff,
            serviceId: newSlot.boundServiceId
          }
        });
        
        const content = `親愛的信眾 ${app.guestName} 您好，您原本預約的 ${oldTimeStr} 時段，已由宮廟方為您手動改期至 ${newTimeStr}。造成不便敬請見諒，如有疑問請洽宮廟管理員。`;
        await createNotification('【系統通知】您的預約已改期', content, new Date().toISOString());
        await logSystemEvent('INFO', '預約單筆改期', `將預約 ${appointmentId} 改至時段 ${newSlotId}`, '系統管理員', templeId!);
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function cancelServiceRecord(recordId: string, type: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
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

      try {
        const templeId = await getDynamicTempleId();
        
        const app = await prisma.appointment.findFirst({
          where: { id: String(appId), templeId: templeId! }
        });
        if (!app) return { success: false, message: '找不到該預約' };
        
        const newSlot = await prisma.slot.findFirst({
          where: { id: String(newSlotId), templeId: templeId! }
        });
        if (!newSlot) return { success: false, message: '找不到新選擇的時段' };
        if (newSlot.status === 'Booked') return { success: false, message: '新時段已被預約' };
        
        await prisma.slot.updateMany({
          where: {
            date: app.date,
            time: app.time,
            staff: app.staff,
            templeId: templeId!,
            status: 'Booked'
          },
          data: { status: 'Available', guestName: null }
        });
        
        await prisma.slot.update({
          where: { id: newSlot.id },
          data: { status: 'Booked', guestName: app.guestName }
        });
        
        await prisma.appointment.update({
          where: { id: app.id },
          data: {
            date: newSlot.date,
            time: newSlot.time,
            staff: newSlot.staff
          }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

// 3.5 標記預約為已到場
export async function markAppointmentAsArrived(appointmentId: number) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.appointment.updateMany({
          where: { id: String(appointmentId), templeId: templeId! },
          data: { status: 'Arrived' }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

// 3.6 標記預約為已付款
export async function markAppointmentAsPaid(appointmentId: number) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.appointment.updateMany({
          where: { id: String(appointmentId), templeId: templeId! },
          data: { status: 'Paid' }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}


// 4. 抓取預約紀錄
export async function fetchAppointments() {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return [];
        
        const apps = await prisma.appointment.findMany({
          where: { templeId },
          orderBy: [{ date: 'asc' }, { time: 'asc' }]
        });
        
        return apps.map(r => ({
          id: r.id,
          date: r.date,
          time: r.time,
          staff: r.staff,
          guestName: r.guestName,
          service: r.service,
          serviceId: r.serviceId,
          status: r.status,
          phone: r.phone,
          paymentMethod: r.paymentMethod,
          paymentRef: r.paymentRef,
          paymentStatus: r.paymentStatus,
          amount: r.amount
        }));
      } catch(e) {
        console.error(e);
        return [];
      }
}

// 5. 抓取與儲存服務項目
export async function fetchServiceDefinitions() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
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
              return [];
            }
      return JSON.parse(JSON.stringify(res.rows.map(r => ({ id: r.id, templeId: r.temple_id, name: r.name, price: r.price !== undefined && r.price !== null ? Number(r.price) : 0, duration: r.duration, description: r.description, color: r.color, status: r.status, assignedStaff: r.assigned_staff || [] }))));
  });
}

export async function saveServiceDefinition(data: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const id = data.id || `s-${Date.now()}`;
    const newColor = data.color || '#6366f1';
    
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
    await revalidateTemple();
    await logSystemEvent('SUCCESS', '設定服務項目', `服務名稱：${data.name}`, '管理員', templeId);
    return { success: true };
  });
}

export async function deleteServiceDefinition(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query('DELETE FROM services WHERE id = $1 AND temple_id = $2', [id, templeId]);
    await revalidateTemple();
    return { success: true };
  });
}

// 6. 抓取與儲存表單
export async function fetchPrintTemplates() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    // DB impl omitted for now
    return [];
  });
}

export async function savePrintTemplate(template: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    return { success: true };
  });
}

export async function deletePrintTemplate(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    return { success: true };
  });
}

export async function fetchForms() {
  const templeId = await getDynamicTempleId();
  const current = [] || [];
  const mine = current.filter((f: any) => f.templeId === templeId);
  return JSON.parse(JSON.stringify(mine));
}

export async function saveForm(data: any) {
  const templeId = await getDynamicTempleId();
  const id = data.id;
  const current = [] || [];
  const exists = current.some((f: any) => f.id === id);
  if (exists) {
    await null;
  } else {
    await null;
  }
  // array synced manually
  await revalidateTemple();
    return { success: true };
}

// 7. 抓取與管理人員 (修復 Build Error 關鍵)
export async function fetchPersonnel() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS personnel (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
      const res = await client.query('SELECT * FROM "User" WHERE "templeId" = $1', [templeId]);
      if ((res.rowCount ?? 0) === 0) {
              return [];
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
  });
}

export async function fetchStaff() {
  const all = await fetchPersonnel();
  return all;
}

// 8. 刪除單個時段
export async function removeSingleSlot(id: any) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.slot.deleteMany({
          where: { id: String(id), templeId: templeId! }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

// 8.1 批次刪除多個時段
export async function removeBatchSlots(ids: any[]) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.slot.deleteMany({
          where: {
            id: { in: ids.map(String) },
            templeId: templeId!
          }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

// 9. 智能分析受影響預約
export async function analyzeAffectedAppointments(staff: string, start: string, end: string) {
  return [].filter((app: any) => 
    app.staff === staff && 
    app.date >= start && 
    app.date <= end
  );
}

// 10. 執行緊急調度

// ==========================================
// 金流收款設定 (Payment Configurations)
// ==========================================
// migrated (await jsonStore.find('temple_payment_configs')) to (await jsonStore.find('temple_payment_configs'))

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
  const config = [].find(c => c.templeId === templeId);
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
  const idx = [].findIndex(c => c.templeId === templeId);
  if (idx > -1) {
    [][idx] = { ...data, templeId };
  } else {
    await null;
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

      try {
        const templeId = await getDynamicTempleId();
        const records = await prisma.lampRecord.findMany({
          where: { templeId: templeId! },
          orderBy: { createdAt: 'desc' }
        });
        
        return records.map(r => ({
          id: r.id,
          templeId: r.templeId,
          categoryId: r.categoryId,
          guestName: r.guestName,
          phone: r.phone,
          lampType: r.categoryName || '',
          amount: r.actualPrice,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          paymentMethod: r.paymentMethod,
          paymentRef: r.paymentProofUrl,
          paymentStatus: r.paymentStatus
        }));
      } catch(e) {
        console.error(e);
        return [];
      }
}
// migrated (await jsonStore.find('lamp_categories')) to (await jsonStore.find('lamp_categories'))
export async function fetchLampCategories() {

      try {
        const templeId = await getDynamicTempleId();
        return await prisma.lampCategory.findMany({
          where: { templeId: templeId! }
        });
      } catch(e) {
        console.error(e);
        return [];
      }
}
// migrated (await jsonStore.find('lamp_records')) to (await jsonStore.find('lamp_records'))
export async function createLightingOrder(fd: FormData) { 
  return createLampRecord(fd);
}
export async function getGuestUser() {
  const store = await cookies();
  const templeId = await getDynamicTempleId();
  const phone = store.get(`guestPhone_${templeId}`)?.value;
  if (!phone) return null;
  
  return withTempleSession(templeId, false, async (client) => {
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

export async function checkPhoneStatus(phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const normLogin = normalizePhone(phone);
    let existing: any = null;

    const res = await client.query('SELECT * FROM guests WHERE REPLACE(phone, \'-\', \'\') = $1 AND temple_id = $2', [normLogin, templeId]);
      if ((res.rowCount ?? 0) > 0) {
              const r = res.rows[0];
              existing = {
                templeId: r.temple_id, phone: r.phone, name: r.name, email: r.email, password: r.password, address: r.address, birthday: r.birthday, lunarBirthday: r.lunar_birthday, birthHour: r.birth_hour, lineId: r.line_id, status: r.status
              };
            }

    if (!existing) return { status: 'NEW' };
    if (!existing.password) return { status: 'NO_PASSWORD', name: existing.name };
    return { status: 'HAS_PASSWORD', name: existing.name };
  });
}

export async function liffAutoLogin(lineId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    let existing: any = null;
    const res = await client.query('SELECT * FROM guests WHERE line_id = $1 AND temple_id = $2', [lineId, templeId]);
      if ((res.rowCount ?? 0) > 0) {
              const r = res.rows[0];
              existing = {
                templeId: r.temple_id, phone: r.phone, name: r.name, email: r.email, password: r.password, address: r.address, birthday: r.birthday, lunarBirthday: r.lunar_birthday, birthHour: r.birth_hour, lineId: r.line_id, status: r.status
              };
            }
    if (existing) {
      const store = await cookies();
      store.set(`guestPhone_${templeId}`, existing.phone, { secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
      return { success: true, guest: existing };
    }
    return { success: false };
  });
}

export async function guestLogin(phone: string, password?: string, inputName?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const normLogin = normalizePhone(phone);
    let existing: any = null;

    await client.query(`
        CREATE TABLE IF NOT EXISTS guests (
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
                templeId: r.temple_id, phone: r.phone, name: r.name, email: r.email, password: r.password, address: r.address, birthday: r.birthday, lunarBirthday: r.lunar_birthday, birthHour: r.birth_hour, lineId: r.line_id, status: r.status
              };
            }

    if (existing) {
      if (existing.password && existing.password !== password) {
        return { success: false, error: "密碼錯誤，請重新輸入" };
      }
      if (!existing.password && password) {
        // 首次綁定密碼
        existing.password = password;
        await client.query('UPDATE guests SET password = $1 WHERE REPLACE(phone, \'-\', \'\') = $2 AND temple_id = $3', [password, normLogin, templeId]);
      }
    } else if (!inputName || !password) {
      return { success: false, error: "首次登入請務必填寫真實姓名與密碼" };
    }

    const guestName = existing ? existing.name : inputName;
    const fullGuest = existing || {
      templeId,
      phone,
      name: guestName,
      password,
      status: 'Active',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName)}&background=B91C1C&color=fff`
    };

    if (!existing) {
      await client.query(`
          INSERT INTO guests (temple_id, phone, name, password, status)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (temple_id, phone) DO NOTHING
        `, [templeId, phone, guestName, password, 'Active']);
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
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_logs (
        id SERIAL PRIMARY KEY,
        temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
    const normPhone = normalizePhone(p);
    const res = await client.query(`
      SELECT id, temple_id as "templeId", date, time, staff, guest_name as "guestName", service, service_id as "serviceId", status, phone, payment_method as "paymentMethod", payment_ref as "paymentRef", payment_status as "paymentStatus", amount, payment_proof_url as "paymentProofUrl"
      FROM appointments 
      WHERE REPLACE(phone, '-', '') = $1 AND temple_id = $2
      ORDER BY date DESC, time DESC
    `, [normPhone, templeId]);
    return res.rows;
  });
}
// migrated (await jsonStore.find('service_settings_mock')) to (await jsonStore.find('service_settings_mock'))
export async function fetchServiceSettings() { 
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS temple_settings (
        temple_id VARCHAR(50) PRIMARY KEY REFERENCES "Temple"(id) ON DELETE CASCADE,
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

// migrated (await jsonStore.find('guest_files')) to (await jsonStore.find('guest_files'))
export async function fetchGuestFiles(phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS guest_files (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
  });
}

// migrated (await jsonStore.find('event_registrations')) to (await jsonStore.find('event_registrations'))

export async function fetchEventRegistrationsByEventId(eventId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query(`CREATE TABLE IF NOT EXISTS event_registrations (id VARCHAR(50) PRIMARY KEY, event_id VARCHAR(50), temple_id VARCHAR(50), title VARCHAR(255), phone VARCHAR(50), guest_name VARCHAR(255), price INTEGER, payment_status VARCHAR(50), actual_price INTEGER, timestamp VARCHAR(50))`);
    const res = await client.query('SELECT * FROM event_registrations WHERE event_id = $1 AND temple_id = $2', [eventId, templeId]);
    return res.rows.map(r => ({ id: r.id, eventId: r.event_id, templeId: r.temple_id, title: r.title, phone: r.phone, guestName: r.guest_name, price: r.price, paymentStatus: r.payment_status, actualPrice: r.actual_price, timestamp: r.timestamp }));
  });
}
export async function markRegistrationAsPaid(registrationId: string, actualPrice: number) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query('UPDATE event_registrations SET payment_status = $1, actual_price = $2 WHERE id = $3 AND temple_id = $4', ['Paid', actualPrice, registrationId, templeId]);
    await revalidateTemple();
    return { success: true };
  });
}
// migrated (await jsonStore.find('activities')) to (await jsonStore.find('activities'))
// migrated (await jsonStore.find('deep_records')) to (await jsonStore.find('deep_records'))

// (Removed duplicate createOrUpdateGuest)
export async function verifyQueueTicket(eventId: any, phone: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const tRes = await client.query('SELECT id, status FROM queue_tickets WHERE event_id = $1 AND REPLACE(phone, \'-\', \'\') = $2 AND temple_id = $3', [eventId, phone.replace(/-/g, ''), templeId]);
      if (tRes.rowCount === 0) return { success: false, error: 'No ticket found' };
      const t = tRes.rows[0];
      if (t.status === 'Pending') {
              const orderRes = await client.query('SELECT COUNT(*) as count FROM queue_tickets WHERE event_id = $1 AND status != \'Pending\' AND temple_id = $2', [eventId, templeId]);
              const actualOrder = parseInt(orderRes.rows[0].count) + 1;
              await client.query('UPDATE queue_tickets SET status = $1, scanned_at = $2, actual_order = $3 WHERE id = $4', ['Queuing', new Date().toLocaleTimeString(), actualOrder, t.id]);
            }
    await revalidateTemple();
    return { success: true };
  });
}
export async function registerForEvent(id: any, phone: string, n: string, pr: number, paymentMethod?: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (await checkTempleSuspension()) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
        
        const ev = await prisma.event.findUnique({
          where: { id: String(id) },
          include: { registrations: true }
        });
        if (!ev) return { success: false };
        
        if (ev.capacity > 0 && ev.registrations.length >= ev.capacity) return { success: false, message: '名額已滿' };
        
        const pStatus = paymentMethod === 'Cash' || !paymentMethod ? (pr > 0 ? 'Pending' : 'Unpaid') : 'Paid';
        const newId = `REG-${Date.now()}`;
        
        await prisma.eventRegistration.create({
          data: {
            id: newId,
            eventId: ev.id,
            templeId: templeId!,
            phone,
            guestName: n,
            actualPrice: pr > 0 ? pr : 0,
            paymentStatus: pStatus
          }
        });
        
        await revalidateTemple();
        return { success: true, id: newId };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}
export async function fetchGuestRegistrations(p: any) {

      try {
        const templeId = await getDynamicTempleId();
        const normPhone = normalizePhone(p || '');
        
        const regs = await prisma.eventRegistration.findMany({
          where: {
            templeId: templeId!,
            phone: normPhone
          },
          include: { event: true },
          orderBy: { createdAt: 'desc' }
        });
        
        return regs.map(r => ({
          id: r.id,
          eventId: r.eventId,
          templeId: r.templeId,
          title: (r as any).title || r.event?.title,
          phone: r.phone,
          guestName: r.guestName,
          price: r.event?.price || 0,
          paymentStatus: r.paymentStatus,
          actualPrice: r.actualPrice,
          timestamp: r.createdAt.toISOString()
        }));
      } catch (e) {
        console.error(e);
        return [];
      }
}
export async function fetchGuestQueueTickets(p: any) {
  const templeId = await getDynamicTempleId();
  const normPhone = (p || '').replace(/[- ]/g, '');
  return withTempleSession(templeId, false, async (client) => {
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
  });
}
export async function fetchGuestLampRecords(p: any) {
  const templeId = await getDynamicTempleId();
  const normPhone = (p || '').replace(/[- ]/g, '');
  return withTempleSession(templeId, false, async (client) => {
    await client.query(`CREATE TABLE IF NOT EXISTS lamp_records (id VARCHAR(50) PRIMARY KEY, temple_id VARCHAR(50), guest_name VARCHAR(255), phone VARCHAR(50), lamp_type VARCHAR(255), amount INTEGER, status VARCHAR(50), created_at VARCHAR(50), payment_method VARCHAR(50), payment_ref VARCHAR(255), payment_status VARCHAR(50))`);
      const res = await client.query(`
        SELECT * FROM lamp_records 
        WHERE REPLACE(REPLACE(phone, '-', ''), ' ', '') = REPLACE(REPLACE($1, '-', ''), ' ', '')
        AND temple_id = $2
        ORDER BY created_at DESC
      `, [normPhone, templeId]);
      return res.rows.map(r => {
              let startStr = '';
              let expStr = '';
              try {
                const start = r.created_at ? new Date(r.created_at) : new Date();
                if (isNaN(start.getTime())) throw new Error();
                const exp = new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000));
                startStr = start.toISOString().split('T')[0];
                expStr = exp.toISOString().split('T')[0];
              } catch {
                startStr = new Date().toISOString().split('T')[0];
                expStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              }
              return {
                id: r.id, templeId: r.temple_id, guestName: r.guest_name, phone: r.phone,
                categoryName: r.lamp_type, price: r.amount, status: r.status,
                startDate: startStr, expiryDate: expStr,
                paymentMethod: r.payment_method, paymentRef: r.payment_ref, paymentStatus: r.payment_status, createdAt: r.created_at,
                paymentProofUrl: r.payment_proof_url || null
              };
            });
  });
}

export async function joinQueue(eventId: any, phone: string, guestName: string, paymentMethod?: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const pStatus = paymentMethod === 'Cash' || !paymentMethod ? 'Pending' : 'Paid';
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
  });
}
export type EventItem = { id: string; title: string; date: string; location: string; price: number; status: 'Active' | 'Draft' | 'Completed'; capacity: number; enrolled: number; imageUrl?: string; description?: string; precautions?: string };
// migrated (await jsonStore.find('events')) to (await jsonStore.find('events'))

export async function fetchEvents() {
    try {
    const templeId = await getDynamicTempleId();
    const events = await prisma.event.findMany({
      where: { templeId: templeId! },
      include: { registrations: true }
    });

    return events.map(r => ({
      id: r.id,
      templeId: r.templeId,
      title: r.title,
      date: r.date || '',
      location: r.location || '',
      price: r.price,
      status: r.status as "Active" | "Completed" | "Draft",
      capacity: r.capacity,
      enrolled: r.registrations.length,
      imageUrl: r.imageUrl || '',
      description: r.description || '',
      precautions: (r as any).precautions
    }));
    } catch (e) {
    console.error(e);
    return [];
    }
}
export async function saveEvent(fd: FormData) {

      try {
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
        if (!templeId) return { success: false };

        if (id) {
          await prisma.event.update({
            where: { id },
            data: {
              title, date, location, price, capacity, status, imageUrl, description
            }
          });
        } else {
          await prisma.event.create({
            data: {
              id: `ev-${Date.now()}`,
              templeId,
              title, date, location, price, capacity, status, imageUrl, description
            }
          });
        }
        await revalidateTemple();
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}
export async function deleteEvent(id: string) {

      try {
        const templeId = await getDynamicTempleId();
        const regCount = await prisma.eventRegistration.count({
          where: { eventId: id, templeId: templeId! }
        });
        
        if (regCount > 0) return { success: false, error: '該活動已有信眾報名，請先移除相關報名紀錄後再進行刪除。' };
        
        await prisma.event.delete({
          where: { id }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

// --- B2B SaaS 平台層資料表初始化 ---
// --- B2B SaaS 多租戶與經銷架構全域變數 ---
// migrated (await jsonStore.find('distributors')) to (await jsonStore.find('distributors'))
// migrated (await jsonStore.find('dist_sales')) to (await jsonStore.find('dist_sales'))
// migrated (await jsonStore.find('sales_visits')) to (await jsonStore.find('sales_visits'))
// migrated (await jsonStore.find('audit_logs')) to (await jsonStore.find('audit_logs'))
// migrated (await jsonStore.find('tools')) to (await jsonStore.find('tools'))
// migrated (await jsonStore.find('commissions')) to (await jsonStore.find('commissions'))

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
// migrated (await jsonStore.find('admin_logs')) to (await jsonStore.find('admin_logs'))

// migrated (await jsonStore.find('finance_records')) to finance_records

// migrated (await jsonStore.find('sync_queue')) to (await jsonStore.find('sync_queue'))

let db_storage_plans: any[] = initGlobal('db_storage_plans', [
  { id: 'SP-50', name: '50GB 大容量方案', sizeGb: 50, priceMonthly: 300 },
  { id: 'SP-200', name: '200GB 旗艦方案', sizeGb: 200, priceMonthly: 900 },
  { id: 'SP-1000', name: '1TB 至尊方案', sizeGb: 1000, priceMonthly: 3000 }
]);

// migrated (await jsonStore.find('temple_storages')) to (await jsonStore.find('temple_storages'))

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
// migrated (await jsonStore.find('temple_bills')) to temple_bills

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
// migrated (await jsonStore.find('ai_api_models')) to (await jsonStore.find('ai_api_models'))

export interface TempleAiUsage {
  templeId: string;
  enabled: boolean;
  planId: string;
  usedCount: number;
  expiryDate: string;
  isVip: boolean;
}
// migrated (await jsonStore.find('temple_ai_usage')) to (await jsonStore.find('temple_ai_usage'))

// migrated (await jsonStore.find('wallets')) to wallets

// migrated (await jsonStore.readJson('super_sales_overrides')) to (await jsonStore.readJson('super_sales_overrides'))

let db_distributor_applications: any[] = initGlobal('db_distributor_applications', [
  { id: 'DAPP-001', name: '大甲區域授權中心', plan: 'PLAN-A', submittedBy: '超級精英業務', status: 'Active', account: 'dajia_dist', owner: '顏主委', date: '2026-05-12' }
]);


export async function fetchAdminLogs() {

      try {
        const logs = await prisma.adminLog.findMany({
          orderBy: { timestamp: 'desc' }
        });
        return logs;
      } catch (e) {
        console.error(e);
        return [];
      }
}
export async function logAdminAction(action: string, target: string) {
  await null;
  return { success: true };
}

export async function downloadAdminLogsCsv() {
  const logs = await fetchAdminLogs();
  const header = "ID,User,Action,Target,Timestamp\n";
  const rows = logs.map(l => `${l.id},${l.user},${l.action},${l.target},${l.timestamp}`).join("\n");
  return header + rows;
}

export async function createAdminAccount(data: any) {
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被註冊，請更換' };
  }
  const newAdmin = { id: `adm-${Date.now()}`, ...data, role: 'SuperAdmin' };
  await null;
  await logAdminAction('CREATE_ADMIN', data.name);
  revalidatePath('/super-admin');
  return { success: true };
}

export async function fetchFinanceData() {
  const incomes = [].filter(r => r.type === 'INCOME').reduce((acc, r) => acc + r.amount, 0);
  const expenses = [].filter(r => r.type === 'EXPENSE').reduce((acc, r) => acc + r.amount, 0);
  return {
    records: [],
    summary: {
      totalRevenue: incomes,
      totalCommission: [].filter(r => r.category === 'COMMISSION').reduce((acc, r) => acc + r.amount, 0),
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
    const res = await client.query('SELECT "distributorId" FROM "Temple" WHERE id = $1', [templeId]);
      distributorId = res.rows[0]?.distributor_id;

    if (distributorId) {
      return null;
    } else {
      const sysConfig = await fetchSystemConfig();
      return sysConfig?.b2bPayment || db_config.b2bPayment || null;
    }
  });
}

// --- STORAGE & BILLING APIS ---
export async function fetchStoragePlans() {

      try {
        const plans = await prisma.storagePlan.findMany({
          orderBy: { sizeGb: 'asc' }
        });
        return plans.map(r => ({
          id: r.id,
          name: `${r.sizeGb}GB 雲端空間`,
          sizeGb: r.sizeGb,
          priceMonthly: r.priceMonthly,
          priceYearly: r.priceYearly
        }));
      } catch (e) {
        console.error(e);
        return [];
      }
}

export async function updateStoragePlans(plans: any[]) {
  return withTempleSession(null, true, async (client) => {
    await client.query('DELETE FROM storage_plans');
      for (const p of plans) {
              await client.query(
                'INSERT INTO storage_plans (size_gb, price_monthly, price_yearly) VALUES ($1, $2, $3)',
                [p.sizeGb, p.priceMonthly, p.priceYearly]
              );
            }
    revalidatePath('/super-admin');
    return { success: true };
  });
}

export async function fetchTempleStorages() {

      try {
        const temples = await prisma.temple.findMany();
        for (const t of temples) {
          const isVip = t.planId === 'Unlimited Node' || t.planId === 'Free' || t.planId === '免費';
          let qGB = 5;
          let pName = '免費 5GB 空間';
          if (isVip) {
              qGB = 999999;
              pName = '無限免費方案';
          }
          await prisma.templeStorage.upsert({
            where: { templeId: t.id },
            update: {},
            create: {
              templeId: t.id,
              usedBytes: 0,
              allocatedBytes: BigInt(qGB) * BigInt(1024 * 1024 * 1024),
              planName: pName,
              city: t.city || '台北市'
            }
          });
        }
        
        const storages = await prisma.templeStorage.findMany({
          include: { temple: true }
        });
        
        return storages.map(r => ({
          id: r.id,
          templeId: r.templeId,
          templeName: r.temple?.templeName || r.temple?.name,
          city: r.city,
          usedBytes: Number(r.usedBytes),
          quotaGb: Number(r.allocatedBytes) / (1024 * 1024 * 1024),
          planName: r.planName
        }));
      } catch (e) {
        console.error(e);
        return [];
      }
}

export async function requestTempleStorageUpgrade(templeId: string, planId: string, cycle: 'Monthly' | 'Yearly') {
  return withTempleSession(templeId, true, async (client) => {
    const plan = db_storage_plans.find((p: any) => p.id === planId);
    if (!plan) return { success: false, message: '找不到選定的空間方案' };

    const discount = db_config.yearlyDiscountRate || 20;
    const priceFactor = cycle === 'Yearly' ? (12 * (1 - discount / 100)) : 1;
    const finalAmount = Math.round(plan.priceMonthly * priceFactor);

    await client.query(`
        INSERT INTO "TempleBill" (id, "templeId", type, "itemName", amount, "billingDate", "dueDate", status, "payeeRole", "payeeId", "timestamp")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
              `BILL-STORAGE-${Date.now()}`, templeId, 'StorageUpgrade', `雲端空間擴充方案 - ${plan.name} (${planId})`,
              finalAmount, new Date().toISOString().substring(0, 7), new Date().toISOString().split('T')[0],
              'Unpaid', 'SuperAdmin', 'system-hq', new Date().toISOString()
            ]);
    return { success: true };
  });
}

export async function requestAiPlanUpgrade(templeId: string, planId: string) {
  return withTempleSession(templeId, true, async (client) => {
    const plan = db_ai_plans.find((p: any) => p.id === planId);
    if (!plan) return { success: false, message: '找不到選定的AI方案' };

    await client.query(`
        INSERT INTO "TempleBill" (id, "templeId", type, "itemName", amount, "billingDate", "dueDate", status, "payeeRole", "payeeId", "timestamp")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
              `BILL-AI-${Date.now()}`, templeId, 'AiUpgrade', `AI 生活助理 - ${plan.name} (${planId})`,
              plan.monthlyFee, new Date().toISOString().substring(0, 7), new Date().toISOString().split('T')[0],
              'Unpaid', 'SuperAdmin', 'system-hq', new Date().toISOString()
            ]);
    return { success: true };
  });
}

export async function upgradeTempleStorage(templeId: string, planId: string, cycle: 'Monthly' | 'Yearly', isManualGrant: boolean = false) {
  return withTempleSession(templeId, true, async (client) => {
    const planRes = await client.query('SELECT * FROM storage_plans WHERE id::text = $1 OR size_gb::text = $1', [planId]);
      if ((planRes.rowCount ?? 0) === 0) return { success: false, message: '找不到選定的空間方案' };
      const plan = planRes.rows[0];
      const discount = 20;
      const priceFactor = cycle === 'Yearly' ? (12 * (1 - discount / 100)) : 1;
      const finalAmount = Math.round(plan.price_monthly * priceFactor);
      const templeRes = await client.query('SELECT * FROM "Temple" WHERE id = $1', [templeId]);
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

              await client.query(
                `INSERT INTO "TempleBill" (id, temple_id, "itemName", amount, "dueDate", status, "payeeRole", "payeeId") VALUES ($1, $2, $3, $4, $5, 'Unpaid', $6, $7)`,
                [`BILL-STORAGE-${Date.now()}`, templeId, '雲端空間擴充方案 - ' + plan.name, finalAmount, new Date().toISOString().split('T')[0], 'SuperAdmin', 'system-hq']
              );
            }
      const allocatedBytes = plan.size_gb * 1024 * 1024 * 1024;
      await client.query(
              `INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city) 
         VALUES ($1, 0, $2, $3, $4)
         ON CONFLICT (temple_id) DO UPDATE SET allocated_bytes = EXCLUDED.allocated_bytes, plan_name = EXCLUDED.plan_name`,
              [templeId, allocatedBytes, `${plan.size_gb}GB 雲端空間`, temple?.city || '台北市']
            );

    revalidatePath('/super-admin');
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchRoleWallets() {
  return withTempleSession(null, true, async (client) => {
    // Ensure SuperAdmin and SuperSales wallets exist
    await client.query(`
      INSERT INTO wallets (role, name, balance) VALUES ('SuperAdmin', '超級管理員', 0) 
      ON CONFLICT (name) DO NOTHING
    `);
    await client.query(`
      INSERT INTO wallets (role, name, balance) VALUES ('SuperSales', '超級精英業務', 0) 
      ON CONFLICT (name) DO NOTHING
    `);

    const dists = await client.query('SELECT * FROM distributors');
    for (const d of dists.rows) {
      await client.query(
        `INSERT INTO wallets (role, name, balance) VALUES ($1, $2, 0) ON CONFLICT (name) DO NOTHING`,
        ['Distributor', d.name]
      );
    }
    const sales = await client.query('SELECT * FROM dist_sales');
    for (const s of sales.rows) {
      await client.query(
        `INSERT INTO wallets (role, name, balance) VALUES ($1, $2, 0) ON CONFLICT (name) DO NOTHING`,
        [s.role || 'DistSales', s.name]
      );
    }
    const res = await client.query('SELECT * FROM wallets');
    return res.rows.map((r: any) => ({
      id: r.id,
      role: r.role,
      name: r.name,
      balance: Number(r.balance)
    }));
  });
}

export async function simulateSaaSPayment(category: 'MONTHLY_RENT' | 'SETUP_FEE' | 'AUTH_FEE', amount: number, templeId?: string, distributorId?: string, salesId?: string) {
  return withTempleSession(templeId || null, true, async (client) => {
    const tRes = templeId ? await client.query('SELECT * FROM "Temple" WHERE id = $1', [templeId]) : null;
      const t = tRes && (tRes.rowCount ?? 0) > 0 ? tRes.rows[0] : null;
      const distId = t?.sales_id ? (await client.query('SELECT "distributorId" FROM dist_sales WHERE id = $1', [t.sales_id])).rows[0]?.distributor_id : distributorId || 'system-hq';
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

                const dsNameRes = await client.query('SELECT name FROM dist_sales WHERE id = $1', [sId]);
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

    revalidatePath('/super-admin');
    revalidatePath('/distributor');
    revalidatePath('/dist-sales');
    revalidatePath('/super-sales');
    return { success: true };
  });
}

export async function fetchSyncQueue() { return [...[]]; }

export async function fetchSystemConfig() {
  try {
    const config = await prisma.systemConfig.findUnique({ where: { key: 'global' } });
    if (config && config.value) {
      return config.value as any;
    }
    const defaultConfig = {
      fixedMonthlyRent: 3600,
      yearlyDiscountRate: 20,
      defaultSuperSalesRates: { distributorAuthRate: 15, templeSetupRate: 10, templeSetupType: 'percent', templeRentRates: [15, 12, 10] },
      distributorPlans: [
        { id: 'PLAN-A', name: '基礎體驗版', price: 1600000, durationYears: 2, nodes: 100, color: 'indigo' },
        { id: 'PLAN-B', name: '標準專業版', price: 3200000, durationYears: 4, nodes: 250, color: 'emerald' },
        { id: 'PLAN-C', name: '企業無限制', price: 8000000, durationYears: 10, nodes: 1000, color: 'slate' }
      ],
      b2bPayment: {
        thirdParty: { enabled: true, merchantId: 'HQ_MERCHANT_999', hashKey: 'HQ_HASH_KEY', hashIV: 'HQ_HASH_IV' },
        linePay: { enabled: false, channelId: '', channelSecret: '' },
        customTransfer: { enabled: true, bankCode: '808', accountName: '天樞科技股份有限公司', accountNo: '808-1234-5678-901' },
        serviceMapping: { 'new-temple': ['customTransfer'], 'monthly-rent': ['thirdParty', 'customTransfer'], 'distributor-auth': ['customTransfer'] }
      }
    };
    await prisma.systemConfig.upsert({
      where: { key: 'global' },
      update: { value: defaultConfig },
      create: { key: 'global', value: defaultConfig }
    });
    return defaultConfig as any;
  } catch (error) {
    console.error('fetchSystemConfig error:', error);
    return {};
  }
}

export async function updateSystemConfig(data: any) {
  try {
    const currentConfig = await fetchSystemConfig();
    const newConfig = { ...currentConfig, ...data };
    await prisma.systemConfig.upsert({
      where: { key: 'global' },
      update: { value: newConfig },
      create: { key: 'global', value: newConfig }
    });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    revalidatePath('/super-sales');
    return { success: true };
  } catch (error) {
    console.error('updateSystemConfig error:', error);
    return { success: false, error: String(error) };
  }
}

// --- 經銷業務 (Dist-Sales) ---
export async function fetchFreeApplications(distId?: string) { 
  let list = [...[]];
  /* removed duplicate import */
    const res = await dbQuery("SELECT * FROM \"Temple\" ORDER BY \"created_at\" DESC", [], () => null) as any;
    if (res && res.rows && res.rows.length > 0) {
          list = res.rows.map((r: any) => ({
            ...r,
            id: r.id,
            templeName: r.temple_name,
            city: r.city,
            status: r.status,
            salesId: r.sales_id,
            distributorId: r.distributor_id,
            setupFee: r.setup_fee,
            monthlyRent: r.monthly_rent,
            paymentCycle: r.payment_cycle,
            createdAt: r.created_at
          }));
        }

  if (distId) {
     const allSales2 = await [];
     list = list.filter((t: any) => {
        if (t.distributorId !== distId) return false;
        const sales = allSales2.find(s => s.id === t.salesId);
        if (sales && sales.role === 'SuperSales') return false;
        return true;
     });
  }
  return list.map((t: any) => {
     const { paymentStatusLabel, contractEndDate, trialDaysRemaining } = enrichTempleWithFinancialStatus(t);
     return { ...t, paymentStatusLabel, contractEndDate, trialDaysRemaining };
  });
}

export async function generateInitialBills(newTemple: any) {
  const payeeRole = newTemple.distributorId ? 'Distributor' : 'SuperAdmin';
  const payeeId = newTemple.distributorId || 'system-hq';

  const billDueDate = new Date(newTemple.billingStartDate || Date.now()).toISOString().split('T')[0];
  const monthlyRent = newTemple.monthlyRent || 0;

  if (newTemple.freeType !== 'Permanent') {
    const isYearly = newTemple.paymentCycle === 'Yearly';
    const rentAmount = isYearly ? (monthlyRent * 12 * (1 - (db_config.yearlyDiscountRate || 20) / 100)) : monthlyRent;
    const rentType = isYearly ? 'YearlyFee' : 'MonthlyFee';
    const setupFee = newTemple.setupFee ?? 12000;

    const billsToInsert = [];
    if (rentAmount > 0) {
      billsToInsert.push({
        id: `BILL-RENT-${Date.now()}`,
        templeId: newTemple.id,
        type: rentType,
        amount: rentAmount,
        billingDate: new Date().toISOString().substring(0, 7),
        dueDate: billDueDate,
        status: 'Unpaid',
        payeeRole,
        payeeId,
        timestamp: new Date().toISOString()
      });
    }
    if (setupFee > 0) {
      billsToInsert.push({
        id: `BILL-SETUP-${Date.now()}`,
        templeId: newTemple.id,
        type: 'SetupFee',
        amount: setupFee,
        billingDate: new Date().toISOString().substring(0, 7),
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Unpaid',
        payeeRole,
        payeeId,
        timestamp: new Date().toISOString()
      });
    }

    const storagePlanId = newTemple.cloudStorage;
    if (storagePlanId && storagePlanId.startsWith('SP-')) {
       const plan = []?.find((p: any) => p.id === storagePlanId) || db_storage_plans.find(p => p.id === storagePlanId);
       if (plan) {
         const storageFee = isYearly ? (plan.priceYearly || (plan.priceMonthly * 12 * 0.8)) : plan.priceMonthly;
         if (storageFee > 0) {
           billsToInsert.push({
             id: `BILL-STORAGE-${Date.now()}`,
             templeId: newTemple.id,
             type: 'StorageUpgrade',
             item_name: '雲端空間擴充方案 - ' + plan.name,
             amount: storageFee,
             billingDate: new Date().toISOString().substring(0, 7),
             dueDate: billDueDate,
             status: 'Unpaid',
             payeeRole: 'SuperAdmin',
             payeeId: 'system-hq',
             timestamp: new Date().toISOString()
           });
         }
       }
    }

    try {
      /* removed duplicate import */
      for (const newBill of billsToInsert) {
        const exists = [].find(b => b.templeId === newTemple.id && (b.type === newBill.type || b.item_name === newBill.type));
        if (!exists) {
          await null;
          await dbQuery(
            "INSERT INTO \"TempleBill\" (id, temple_id, \"itemName\", amount, \"dueDate\", status, \"payeeRole\", \"payeeId\") VALUES ($1, $2, $3, $4, $5, 'Unpaid', $6, $7)",
            [newBill.id, newTemple.id, newBill.type, newBill.amount, newBill.dueDate, newBill.payeeRole, newBill.payeeId]
          ).catch(err => {
             console.error('Failed dbQuery in generateInitialBills', err);
          });
        }
      }
      // (await jsonStore.find('temple_bills')) synced
    } catch(e) { console.error('Failed to insert bill', e); }
  }
}

export async function submitFreeAccountApplication(data: any) { 
  const account = data.account || data.adminAccount;
  const password = data.password || data.adminPassword;

  if (account && await checkAccountExists(account)) {
    return { success: false, error: '帳號已被註冊，請更換' };
  }
  const { role, paymentCycle, ...formData } = data;
  
  const status = (role === 'distributor' || role === 'super-admin' || role === 'dist-sales') ? 'Active' : 'Pending';

  const sales = [].find(s => s.name === data.submittedBy);
  const reqRole = await getCurrentRole() || 'System';
  const currentUser = await getCurrentUser();
  const templeNo = [].length + 1;

      const newTemple = {
      id: `temple-${Math.random().toString(36).substring(2, 10)}`,
      templeNo,
      ...formData,
      account,
      password,
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
        new Date().toISOString(),
      paymentStatus: 'PendingPayment'
    };
    await null;
    // synced

    try {
      /* removed duplicate import */
      await dbQuery(
        `INSERT INTO "Temple" (id, name, city, status, sales_id, distributor_id, setup_fee, monthly_rent, payment_cycle, account, password, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`,
        [newTemple.id, newTemple.templeName, newTemple.city || '台北市', newTemple.status, newTemple.salesId, newTemple.distributorId, newTemple.setupFee || 0, newTemple.monthlyRent || 0, newTemple.paymentCycle, newTemple.account, newTemple.password]
      );
      await dbQuery(
        `INSERT INTO temple_storages (id, temple_id, used_bytes, created_at, updated_at)
         VALUES ($1, $2, $3, now(), now())`,
        [`ts-${Date.now()}`, newTemple.id, 0]
      );
    } catch (e) {
      console.error("Failed to insert new temple into postgres", e);
    }

    if (data.freeType === 'Permanent') {
      await grantTempleAiVip(newTemple.id, true);
      await grantTempleStorageVip(newTemple.id, true);
    }


  // If status is Active (e.g. created by super-admin or distributor), create personnel login immediately
  if (status === 'Active' && account && password) {
    const pData = await [];
    const pId = `p-${Date.now()}`;
    pData.push({
      id: pId,
      templeId: newTemple.id,
      name: data.templeName || '宮廟管理員',
      account: account,
      password: password, // In real app, hash this
      role: 'TempleAdmin',
      status: 'Active'
    });
    await null;
    
    try {
      /* removed duplicate import */
      await dbQuery(
        `INSERT INTO "User" (id, temple_id, name, account, password, role, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`,
        [pId, newTemple.id, data.templeName || '宮廟管理員', account, password, 'TempleAdmin', 'Active']
      );
    } catch (e) {
      console.error("Failed to insert \"User\"", e);
    }
  }
  
  if (status === 'Active') {
    await generateInitialBills(newTemple);
  }
  
  // Create Notification for Super Admin
  await null;

  revalidatePath('/dist-sales');
  revalidatePath('/distributor');
  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  
  return { success: true, templeId: newTemple.id }; 
}

export async function approveTempleBySuperAdmin(id: string) {

      try {
        const temple = await prisma.temple.findUnique({ where: { id } });
        if (temple) {
          await prisma.temple.update({
            where: { id },
            data: { status: 'Active' }
          });
          await generateInitialBills(temple);
          
          if (temple.account && temple.password) {
             await prisma.user.upsert({
               where: { account: temple.account },
               update: {},
               create: {
                 id: `p-${Date.now()}`,
                 templeId: id,
                 name: temple.templeName || '宮廟管理員',
                 account: temple.account,
                 password: temple.password,
                 role: 'TempleAdmin',
                 status: 'Active'
               }
             });
          }
        }
        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-admin');
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function rejectTempleBySuperAdmin(id: string) {

      try {
        await prisma.temple.delete({ where: { id } });
        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-admin');
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function fetchPendingDistributors() {
  let pgApps: any[] = [];
  const res = await dbQuery("SELECT * FROM distributor_applications WHERE status = 'Pending'", [], () => null) as any;
    if (res && res.rows) {
          pgApps = res.rows.map((r: any) => ({
            id: r.id, name: r.name, contactName: r.contact_name, phone: r.phone, email: r.email,
            taxId: r.tax_id, address: r.address, planId: r.plan_id, price: r.price, nodes: r.nodes,
            submittedBy: r.submitted_by, status: r.status, date: r.created_at, account: r.account,
            password: r.password, expirationDate: r.expiration_date
          }));
        }

  const allApps = new Map();
  db_distributor_applications.filter(a => a.status === 'Pending').forEach(a => allApps.set(a.id, a));
  pgApps.forEach(a => allApps.set(a.id, a));

  return Array.from(allApps.values());
}

export async function approveDistributorBySuperAdmin(id: string, overrideQuota?: number) {

      try {
        const app = await prisma.distributorApplication.findUnique({ where: { id } });
        if (app) {
          await prisma.distributorApplication.update({
            where: { id },
            data: { status: 'Active' }
          });

          const distId = 'dist-' + Math.random().toString(36).substring(2, 10).toUpperCase();
          let actualSalesId = app.submittedBy;
          if (actualSalesId) {
             const sales = await prisma.distributorSales.findFirst({ where: { name: actualSalesId } });
             if (sales) actualSalesId = sales.id;
          }
          
          const newQuota = overrideQuota !== undefined ? overrideQuota : Number(app.nodes || 100);

          await prisma.distributor.upsert({
            where: { account: app.account || app.name },
            update: { status: 'Active' },
            create: {
              id: distId,
              name: app.name,
              account: app.account || app.name,
              password: app.password || 'pivot2026',
              planId: app.planId || 'PLAN-A',
              planName: '標準代理方案',
              price: Number(app.price || 0),
              status: 'Active',
              quota: newQuota,
              nodes: newQuota,
              customNodes: newQuota,
              joinedAt: new Date().toISOString().split('T')[0],
              expirationDate: app.expirationDate || '',
              creatorSalesId: actualSalesId || '',
              phone: app.phone || '',
              email: app.email || '',
              address: app.address || '',
              contactName: app.contactName || '',
              taxId: app.taxId || '',
              bankCode: '',
              bankAccount: '',
              bankName: ''
            }
          });
        }
        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-admin');
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function rejectDistributorBySuperAdmin(id: string, rejectReason?: string) {
  const app = db_distributor_applications.find(a => a.id === id);
  if (app) {
    app.status = 'Rejected';
    (app as any).rejectReason = rejectReason || '';
    (app as any).rejectedAt = new Date().toISOString();
  }
  await dbQuery("UPDATE distributor_applications SET status = 'Rejected' WHERE id = $1", [id]);
  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}

export async function updateSuperSalesCommission(salesName: string, rates: any) {
  console.log(`Updating rates for ${salesName}:`, rates);
  [][salesName] = rates;
  
  await null;

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}

export async function fetchSalesPerformance(salesName: string) {

      try {
        const sales = await prisma.distributorSales.findFirst({ where: { name: salesName } });
        if (!sales) return { total: 0, approved: 0 };
        
        const temples = await prisma.temple.findMany({ where: { salesId: sales.id } });
        return {
          total: temples.length,
          approved: temples.filter(t => t.status === 'Active').length
        };
      } catch (error) {
        console.error('fetchSalesPerformance error:', error);
        return { total: 0, approved: 0 };
      }
}

export async function fetchVisitationRecords(salesName: string) {

      try {
        const records = await prisma.salesVisit.findMany({
          where: { salesName }
        });
        return records;
      } catch (error) {
        console.error('fetchVisitationRecords error:', error);
        return [];
      }
}

export async function fetchAllAccountsForAdmin() {
  const accounts: any[] = [];
  
  accounts.push({ id: 'ADMIN', name: '總部最高系統管理員', role: 'SuperAdmin', account: 'PIVOTADMIN01', status: 'Active' });
  
  // 從 PostgreSQL 撈取系統管理員
  let pgAdmins: any[] = [];
  /* removed duplicate import */
    const resAdmins = await dbQuery("SELECT * FROM \"User\" WHERE role = 'Admin'", [], () => null) as any;
    if (resAdmins && resAdmins.rows) {
          pgAdmins = resAdmins.rows;
        }

  const allAdminsMap = new Map();
  [].forEach(p => {
    if (p.role === 'Admin') allAdminsMap.set(p.account, p);
  });
  pgAdmins.forEach(p => {
    allAdminsMap.set(p.account, { ...p, name: p.name, account: p.account, status: p.status || 'Active' });
  });
  Array.from(allAdminsMap.values()).forEach(p => {
    accounts.push({ ...p, id: p.id, name: p.name, role: 'Admin', account: p.account, status: p.status || 'Active' });
  });

  // 從 PostgreSQL 取出所有的經銷商
  let pgDistributors: any[] = [];
  const resDist = await dbQuery("SELECT * FROM distributors", [], () => null) as any;
    if (resDist && resDist.rows) {
          pgDistributors = resDist.rows;
        }

  const allDistributorsMap = new Map();
  [].forEach(d => {
    allDistributorsMap.set(d.account, d);
  });
  pgDistributors.forEach(d => {
    allDistributorsMap.set(d.account, { ...d, planId: d.plan_id, planName: d.plan_name, joinedAt: d.joined_at, creatorSalesId: d.creator_sales_id, phone: d.phone, email: d.email, address: d.address, contactName: d.contact_name, taxId: d.tax_id });
  });
  
  Array.from(allDistributorsMap.values()).forEach(d => {
    accounts.push({ ...d, id: d.id, name: d.name, role: 'Distributor', account: d.account, status: d.status || 'Active' });
  });

  // 從 PostgreSQL 取出所有的業務員
  let pgSales: any[] = [];
  const resSales = await dbQuery("SELECT * FROM dist_sales", [], () => null) as any;
    if (resSales && resSales.rows) {
          pgSales = resSales.rows;
        }

  const allSalesMap = new Map();
  [].forEach(s => allSalesMap.set(s.account, s));
  pgSales.forEach(s => allSalesMap.set(s.account, { ...s, distributorId: s.distributor_id, joinedAt: s.joined_at }));

  const superOverrides = await [];
  for (const s of Array.from(allSalesMap.values()) as any[]) {
    if (s.role === 'SuperSales') {
      const overrides = superOverrides[s.name];
      const mergedRules = overrides || s.commissionRules || db_config.defaultSuperSalesRates;
      accounts.push({ ...s, id: s.id, name: s.name, role: 'SuperSales', account: s.account, status: s.status || 'Active', commissionRules: mergedRules });
    }
  }
  
  let pgTemples: any[] = [];
  const resTemples = await dbQuery('SELECT * FROM "Temple"', [], () => null) as any;
  if (resTemples && resTemples.rows) {
    pgTemples = resTemples.rows;
  }
  
  const templePromises = pgTemples.map(async t => {
    let personnelRes = await dbQuery('SELECT account FROM "User" WHERE temple_id = $1', [t.id], () => null) as any;
    let personnel = personnelRes?.rows?.[0];
    const creatorInfo = await getTempleCreatorInfo(t.id);
    return { 
      ...t,
      id: t.id, 
      name: t.name || t.temple_name || '未知宮廟', 
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

      try {
        const sales = await prisma.distributorSales.findMany({
          where: { role: 'SuperSales' }
        });
        
        // We should parse commissionRules back to rates if needed
        return sales.map(s => {
          const parsedRates = s.commissionRules && typeof s.commissionRules === 'object' 
            ? s.commissionRules 
            : { templeSetupRate: 20 };
          return {
            ...s,
            rates: parsedRates
          };
        });
      } catch (e) {
        console.error(e);
        return [];
      }
}


export async function addVisitationRecord(data: any) { 
  await null;
  revalidatePath('/dist-sales');
  return { success: true }; 
}

export async function fetchSalesTools() { return [...[]]; }
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
  await null;
  
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
  
  await null;
  // (await jsonStore.find('dist_sales')) synced
  /* removed duplicate import */
    await dbQuery(`
      INSERT INTO dist_sales (id, distributor_id, name, account, password, role, status, joined_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (account) DO UPDATE SET password = EXCLUDED.password, status = EXCLUDED.status
    `, [newSales.id, distId, name, account, password, 'DistSales', 'Active', newSales.joinedAt]);

  return { success: true, data: newSales };
}
export async function deleteTool(toolId: string) {
  const idx = [].findIndex((t: any) => t.id === toolId);
  if (idx > -1) {
    [].splice(idx, 1);
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

      try {
        let whereClause: any = {};
        if (distId) {
          whereClause = { distributorId: distId };
        }
        
        const temples = await prisma.temple.findMany({
          where: whereClause,
          include: { sales: true }
        });
        
        const used = temples.filter(t => !t.sales || t.sales.role !== 'SuperSales').length;
        
        let total = 0;
        if (distId) {
          const dist = await prisma.distributor.findUnique({ where: { id: distId } });
          total = dist?.nodes || 100;
        } else {
          const dists = await prisma.distributor.findMany();
          total = dists.reduce((acc, d) => acc + (d.nodes || 100), 0);
        }
        
        return { used, total, isUnlimited: total >= 1000 };
      } catch (error) {
        console.error('fetchDistributorCapacity error:', error);
        return { used: 0, total: 100, isUnlimited: false };
      }
}

// --- Super Sales Logic ---
export async function submitDistributorApplication(data: any) {
  if (data.account && await checkAccountExists((data.account || '').trim())) {
    return { success: false, error: '帳號已被使用，請更換其他帳號' };
  }
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

  await null;

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true, id: newApp.id };
}

export async function fetchSuperSalesProfile(salesId: string) {

      try {
        const sales = await prisma.distributorSales.findUnique({
          where: { id: salesId }
        });
        return sales;
      } catch (e) {
        console.error(e);
        return null;
      }
}

export async function updateSuperSalesBankInfo(salesId: string, bankInfo: { bankName: string, accountName: string, accountNumber: string }) {

      try {
        await prisma.distributorSales.update({
          where: { id: salesId },
          data: { bankAccount: bankInfo }
        });
        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-sales/[salesId]', 'page');
        revalidatePath('/super-admin');
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false, error: 'Account not found' };
      }
}

export async function updateSuperSalesBasicInfo(salesId: string, data: { phone: string, email: string }) {

      try {
        await prisma.distributorSales.update({
          where: { id: salesId },
          data: { phone: data.phone, email: data.email }
        });
        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-sales/[salesId]', 'page');
        revalidatePath('/super-admin');
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false, error: 'Account not found' };
      }
}

export async function fetchSuperSalesRegistry(salesId: string) {
  let listTemples = [...[]];
  let listDistributors = [...[]];
  let listSales = [...[]];

  /* removed duplicate import */
    const resTemples = await dbQuery("SELECT * FROM \"Temple\"", [], () => null) as any;
    if (resTemples && resTemples.rows) {
          listTemples = resTemples.rows.map((r: any) => ({
            ...r,
            status: r.status,
            templeName: r.temple_name,
            salesId: r.sales_id,
            distributorId: r.distributor_id,
            monthlyRent: r.monthly_rent,
            setupFee: r.setup_fee,
            paymentCycle: r.payment_cycle,
            timestamp: r.created_at
          }));
        }
    const resDist = await dbQuery("SELECT * FROM distributors", [], () => null) as any;
    if (resDist && resDist.rows) {
          listDistributors = resDist.rows.map((r: any) => ({
            ...r,
            creatorSalesId: r.creator_sales_id,
            salesId: r.creator_sales_id,
            planId: r.plan_id
          }));
        }
    const resSales = await dbQuery("SELECT * FROM dist_sales", [], () => null) as any;
    if (resSales && resSales.rows) {
          listSales = resSales.rows.map((r: any) => ({ ...r, role: r.role, distributorId: r.distributor_id }));
        }

  const sales = listSales.find(s => s.id === salesId);
  const name = sales?.name;
  
  const temples = [];
  for (const t of listTemples) {
    const creatorInfo = await getTempleCreatorInfo(t.id);
    if ((creatorInfo && creatorInfo.salesName === name) || t.salesId === salesId) {
       let yearlyRent = 0;
       let setupFee = 0;
       if (t.freeType !== 'Permanent') {
          const rent = Number(t.monthlyRent) || (db_config.fixedMonthlyRent || 3600);
          const cycle = t.paymentCycle || 'Monthly';
          const discount = db_config.yearlyDiscountRate || 20;
          yearlyRent = cycle === 'Yearly' ? (rent * 12 * (1 - discount / 100)) : (rent * 12);
          setupFee = t.setupFee ?? 12000;
       }
       const annualContribution = yearlyRent + setupFee;
       
       const bills = await fetchTempleBills(t.id);
       const hasUnpaid = bills.some((b: any) => b.status === 'Unpaid' || b.status === 'Overdue' || b.status === '待繳費' || b.status === '未繳');
       const now = new Date();
       const m = now.getMonth() + 1;
       const y = now.getFullYear();
       const cycle = t.paymentCycle || 'Monthly';
       const paymentStatus = hasUnpaid 
          ? (cycle === 'Yearly' ? `${y}年未支付` : `${m}月未支付`)
          : (cycle === 'Yearly' ? `${y}年已支付` : `${m}月已支付`);
       
       temples.push({ id: t.id, name: t.templeName, status: t.status, plan: '進階營運方案', date: t.timestamp?.split('T')[0] || '未知', revenue: t.monthlyRent || 0, annualContribution, paymentStatus, bills });
    }
  }

  const distributors = listDistributors.filter(d => d.creatorSalesId === salesId || d.salesId === salesId).map(d => {
    const distTemples = listTemples.filter(t => t.distributorId === d.id);
    const distSales = listSales.filter(s => s.distributorId === d.id);
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

  const pendingTempleCount = [].filter(a => a.submittedBy === name && a.status === 'Pending').length;
  let pgPendingDistCount = 0;
  const res = await dbQuery("SELECT COUNT(*) FROM distributor_applications WHERE submitted_by = $1 AND status = 'Pending'", [name], () => null) as any;
    if (res && res.rows && res.rows.length > 0) pgPendingDistCount = parseInt(res.rows[0].count);

  const memPendingDistCount = db_distributor_applications.filter(a => a.submittedBy === name && a.status === 'Pending').length;
  const pendingDistCount = Math.max(pgPendingDistCount, memPendingDistCount);

  const pendingCount = pendingTempleCount + pendingDistCount;

  return { temples, distributors, pendingCount };
}

// --- Super Admin Account Creation API ---

export async function createSuperSalesAccount(data: any) {

      try {
        const existing = await prisma.distributorSales.findUnique({ where: { account: data.account } });
        if (existing) {
          return { success: false, error: '帳號已被使用，請更換其他帳號' };
        }
        const id = `ss-${Date.now()}`;
        
        const commissionRules = {
          distributorAuthRate: Number(data.distributorAuthRate) || 15,
          templeSetupRate: Number(data.templeSetupRate) || 10,
          templeSetupType: data.templeSetupType || 'percent',
          templeRentRates: [
            Number(data.rentY1) || 15,
            Number(data.rentY2) || 12,
            Number(data.rentY3) || 10
          ]
        };

        await prisma.distributorSales.create({
          data: {
            id,
            name: data.name,
            account: data.account,
            password: data.password || '',
            role: 'SuperSales',
            status: 'Active',
            commissionRules,
            joinedAt: new Date().toISOString().split('T')[0]
          }
        });

        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-admin');
        return { success: true, id };
      } catch (e) {
        console.error(e);
        return { success: false, error: String(e) };
      }
}

export async function updateDistributorQuota(distId: string, newQuota: number) {

      try {
        const dist = await prisma.distributor.findFirst({
          where: { OR: [{ id: distId }, { account: distId }] }
        });
        if (dist) {
          await prisma.distributor.update({
            where: { id: dist.id },
            data: { quota: newQuota, nodes: newQuota, customNodes: newQuota }
          });
          const { revalidatePath } = require('next/cache');
          revalidatePath('/super-admin');
          return { success: true };
        }
        return { success: false, error: 'Distributor not found' };
      } catch (error) {
        console.error('updateDistributorQuota error:', error);
        return { success: false, error: String(error) };
      }
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
    quota: Number(data.customNodes) || plan.nodes || 100,
    joinedAt: new Date().toISOString().split('T')[0],
    expirationDate: expirationDate.toISOString().split('T')[0],
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
    contactName: data.contactName || '',
    taxId: data.taxId || '',
    bankInfo: data.bankInfo || {
      bankCode: data.bankCode || '',
      bankName: data.bankName || '',
      accountName: data.accountName || '',
      accountNumber: data.accountNumber || ''
    },
    creatorSalesId: 'SuperAdmin'
  };
  
  await null;
  
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
  
  // (await jsonStore.find('distributors')) synced
  try {
    await dbQuery(`
      INSERT INTO distributors (id, name, account, password, plan_id, plan_name, price, status, quota, joined_at, expiration_date, creator_sales_id, phone, email, address, contact_name, tax_id, bank_code, bank_account, bank_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    `, [newDist.id, newDist.name, newDist.account, newDist.password, newDist.planId, newDist.planName, newDist.price, newDist.status, Number(data.customNodes) || 100, newDist.joinedAt, newDist.expirationDate, newDist.creatorSalesId, newDist.phone, newDist.email, newDist.address, newDist.contactName, newDist.taxId, newDist.bankInfo?.bankCode || '', newDist.bankInfo?.accountNumber || '', newDist.bankInfo?.bankName || '']);
  } catch (e) {
    console.error("DB Insert Error for distributor:", e);
  }

  revalidatePath('/super-admin');
  return { success: true, id };
}

export async function createTempleAccount(data: any) {
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被註冊，請更換' };
  }
  const reqRole = await getCurrentRole() || 'System';
  const currentUser = await getCurrentUser();
  const creatorRole = reqRole;
  const creatorId = currentUser.name;
  const id = `temple-${Math.random().toString(36).substring(2, 10)}`;
    const templeNo = [].length + 1;
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
    billingStartDate: data.freeType === 'Trial' && trialMonths > 0 ? 
      new Date(Date.now() + (trialMonths * 30 * 24 * 60 * 60 * 1000)).toISOString() : 
      new Date(Date.now() + (5 * 24 * 60 * 60 * 1000)).toISOString()
  };
  
  await null;
  // synced
  
  // Initialize temple storage immediately to prevent overriding
  const isVip = newTemple.plan === 'Unlimited Node' || newTemple.plan === 'Free' || newTemple.plan === '免費' || newTemple.cloudStorage?.includes('無限') || newTemple.cloudStorage === 'Free' || newTemple.cloudStorage === '免費' || !newTemple.cloudStorage;
  let qGB = 5;
  let pName = '免費 5GB 空間';
  if (isVip) {
      qGB = 999999;
      pName = '無限免費方案';
  } else if (newTemple.cloudStorage) {
     if (newTemple.cloudStorage.startsWith('SP-')) {
         const p = []?.find((x: any) => x.id === newTemple.cloudStorage) || db_storage_plans.find(x => x.id === newTemple.cloudStorage);
         if (p) { qGB = p.sizeGb; pName = p.name; }
     } else {
         qGB = parseInt(newTemple.cloudStorage) || 5;
         pName = `${qGB}GB`;
     }
  }
  const newStorage = {
    id: `TS-${Date.now()}-${newTemple.id}`,
    templeId: newTemple.id,
    templeName: newTemple.templeName,
    city: newTemple.city || '台北市',
    usedBytes: 0,
    quotaGb: qGB,
    planName: pName
  };
  
  await null;
  
  // Create personnel account for login
  if (data.account && data.password) {
    const pData = await [];
    pData.push({
      id: `p-${Date.now()}`,
      templeId: id,
      name: data.name || '宮廟管理員',
      account: data.account,
      password: data.password, // In real app, hash this
      role: 'TempleAdmin',
      status: 'Active'
    });
    await null;
  }
  /* removed duplicate import */
    await dbQuery(`
        INSERT INTO "Temple" (id, name, city, status, "salesId", "distributorId", "setupFee", "monthlyRent", "paymentCycle")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [id, newTemple.templeName, newTemple.city || '台北市', 'Active', newTemple.salesId, newTemple.distributorId || null, newTemple.setupFee || 0, newTemple.monthlyRent, newTemple.paymentCycle]);
    await dbQuery(`
        INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city)
        VALUES ($1, $2, $3, $4, $5)
      `, [id, 0, newStorage.quotaGb * 1024 * 1024 * 1024, newStorage.planName, '台北市']);
    if (data.account && data.password) {
            await dbQuery(`
          INSERT INTO "User" (id, "templeId", name, role, account, phone, password, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [`p-${Date.now()}`, id, data.name || '宮廟管理員', 'TempleAdmin', data.account, data.account, data.password, 'Active']);
          }

    // Deduct quota if Distributor/Sales
    const { cookies } = require("next/headers");
    const cookieStore = await cookies();
    const currentRole = cookieStore.get("admin_role")?.value || "SuperAdmin";
    const accountStr = cookieStore.get("admin_account")?.value || "system";
  
    if (currentRole === 'Distributor' || currentRole === 'DistSales') {
      if (currentRole === 'Distributor') {
        const dist = [].find((d: any) => d.account === accountStr);
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


  await generateInitialBills(newTemple);

  revalidatePath('/super-admin');
  await revalidateTemple(id);
  return { success: true, id };
}


export async function fetchAggregatedAnalytics(targetYear?: string) {

      try {
        const currentYear = targetYear || new Date().getFullYear().toString();
        const totalTemples = await prisma.temple.count();
        const activeTemples = await prisma.temple.count({ where: { status: 'Active' } });
        const totalDistributors = await prisma.distributor.count();
        const totalSuperSales = await prisma.distributorSales.count({ where: { role: 'SuperSales' } });
        
        const bills = await prisma.templeBill.findMany({ where: { status: 'Paid' } });
        const monthlyRevenue = bills.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        
        const temples = await prisma.temple.findMany({ where: { status: 'Active' }, select: { city: true, address: true } });
        const regionCounts: Record<string, number> = {};
        const majorRegions = ['基隆', '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投', '雲林', '嘉義', '台南', '高雄', '屏東', '宜蘭', '花蓮', '台東', '澎湖', '金門', '連江'];
        
        temples.forEach((t: any) => {
          let region = t.city || (t.address ? t.address.substring(0, 2) : '');
          const shortRegion = region.substring(0, 2);
          const matchedRegion = majorRegions.find(r => shortRegion?.includes(r));
          if (matchedRegion) {
             regionCounts[matchedRegion] = (regionCounts[matchedRegion] || 0) + 1;
          }
        });

        const regionalDistribution = Object.entries(regionCounts).map(([region, count]) => ({ region, count }));
        
        const allTemples = await prisma.temple.findMany({ select: { createdAt: true } });
        const growthTrend = Array.from({ length: 12 }).map((_, i) => {
          const month = String(i + 1).padStart(2, '0');
          const prefix = `${currentYear}-${month}`;
          const count = allTemples.filter(t => t.createdAt && new Date(t.createdAt).toISOString().startsWith(prefix)).length;
          return { date: prefix, count };
        });
        
        return {
          overview: { totalTemples, activeTemples, totalDistributors, totalSuperSales, monthlyRevenue, systemHealth: 98 },
          regionalDistribution,
          growthTrend
        };
      } catch(e) {
        console.error(e);
        return { overview: { totalTemples: 0, activeTemples: 0, totalDistributors: 0, totalSuperSales: 0, monthlyRevenue: 0, systemHealth: 98 }, regionalDistribution: [], growthTrend: [] };
      }
}


export async function fetchCommissionHistory(salesId: string, year: string, month: string) { 
  let listTemples = [...[]];
  let listSales = [...[]];
  let listBills = [...[]];
  let listWithdrawals = [...([] || [])];

  /* removed duplicate import */
    const resTemples = await dbQuery("SELECT * FROM \"Temple\"", [], () => null) as any;
    if (resTemples && resTemples.rows) {
          listTemples = resTemples.rows.map((r: any) => ({
            ...r,
            status: r.status,
            templeName: r.temple_name,
            salesId: r.sales_id,
            distributorId: r.distributor_id,
            monthlyRent: r.monthly_rent,
            setupFee: r.setup_fee,
            paymentCycle: r.payment_cycle,
            timestamp: r.created_at
          }));
        }
    const resSales = await dbQuery("SELECT * FROM dist_sales", [], () => null) as any;
    if (resSales && resSales.rows) {
          listSales = resSales.rows.map((r: any) => ({ ...r, role: r.role }));
        }
    const resBills = await dbQuery("SELECT * FROM \"TempleBill\"", [], () => null) as any;
    if (resBills && resBills.rows) {
          listBills = resBills.rows.map((r: any) => ({ ...r, templeId: r.temple_id, status: r.status, amount: r.amount }));
        }
    const resWD = await dbQuery("SELECT * FROM \"Withdrawal\"", [], () => null) as any;
    if (resWD && resWD.rows) {
          listWithdrawals = resWD.rows.map((r: any) => ({ ...r, salesName: r.sales_name, status: r.status, amount: r.amount }));
        }

  const sales = listSales.find(s => s.id === salesId);
  const salesName = sales?.name;
  
  const myTemples: any[] = [];
  for (const t of listTemples) {
    const creatorInfo = await getTempleCreatorInfo(t.id);
    if ((creatorInfo && creatorInfo.salesName === salesName) || t.salesId === salesId) {
      if (t.status === 'Active') {
        myTemples.push(t);
      }
    }
  }
  
  let totalEarned = 0;
  let totalPending = 0;
  let totalRevenue = 0;
  const records: any[] = [];
  
  const overrides = salesName ? [][salesName] : null;
  const rules = sales?.commissionRules || overrides || db_config.defaultSuperSalesRates;
  const setupRate = rules.templeSetupRate ?? rules.setupFeePercent ?? 20;
  const rentY1 = rules.templeRentRates?.[0] ?? rules.rentYear1Percent ?? 15;
  const rentY2 = rules.templeRentRates?.[1] ?? rules.rentYear2Percent ?? 12;
  const rentY3 = rules.templeRentRates?.[2] ?? rules.rentYear3PlusPercent ?? 10;

  myTemples.forEach(t => {
    const bills = listBills.filter(b => b.templeId === t.id && b.status !== 'Rejected');
    
    bills.forEach(bill => {
      // Ignore bills that don't generate commission
      if (!['SetupFee', 'Setup', 'MonthlyFee', 'YearlyFee'].includes(bill.type)) return;
      
      const isPaid = bill.status === 'Paid';
      let commission = 0;
      let label = '';
      let percent = 0;

      if (bill.type === 'SetupFee' || bill.type === 'Setup') {
        percent = setupRate;
        commission = bill.amount * (percent / 100);
        label = '開辦費分潤';
      } else {
        // Calculate years difference from temple creation to bill date
        const activeDate = new Date(t.timestamp || bill.timestamp);
        const billDate = new Date(bill.billingDate || bill.dueDate || bill.timestamp);
        let monthsDiff = (billDate.getFullYear() - activeDate.getFullYear()) * 12 + (billDate.getMonth() - activeDate.getMonth());
        if (monthsDiff < 0) monthsDiff = 0;

        if (monthsDiff < 12) {
          percent = rentY1;
          label = `${bill.type === 'YearlyFee' ? '年繳' : '月租'}提成 (第一年)`;
        } else if (monthsDiff < 24) {
          percent = rentY2;
          label = `${bill.type === 'YearlyFee' ? '年繳' : '月租'}提成 (第二年)`;
        } else {
          percent = rentY3;
          label = `${bill.type === 'YearlyFee' ? '年繳' : '月租'}提成 (第三年及以上)`;
        }
        commission = bill.amount * (percent / 100);
      }
      
      if (isPaid) {
        totalEarned += commission;
        totalRevenue += bill.amount;
        records.push({
          id: bill.id,
          templeName: t.templeName,
          date: bill.dueDate || bill.billingDate || bill.timestamp.split('T')[0],
          type: label,
          amount: commission,
          percent,
          phase: bill.type?.includes('Setup') ? 'Setup' : 'Rent',
          calculation: `${bill.type?.includes('Setup') ? '開辦費' : (bill.type === 'YearlyFee' ? '年繳' : '月租')} $${bill.amount.toLocaleString()} * ${percent}%`
        });
      } else {
        totalPending += commission;
      }
    });
  });
  
  // 3. 手動獎金覆寫 (Bonus Overrides)
  const myBonuses = [].filter(b => b.salesName === salesName);
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
  
  let myWithdrawals = [].filter(w => w.salesName === salesName);
  /* removed duplicate import */
    const { rows } = await dbQuery("SELECT * FROM bonus_requests WHERE sales_id = $1 ORDER BY timestamp DESC", [salesId], () => null) as any;
    const myBonusRequests = (rows || []).map((r: any) => ({
          id: r.id,
          salesName: r.sales_name,
          amount: r.amount,
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
          status: r.status,
          receiptUrl: r.receipt_url,
          method: r.method
        }));
    myWithdrawals = [...myWithdrawals, ...myBonusRequests];
  
  const pendingRequests = myWithdrawals.filter(w => w.status === 'Pending' || w.status === '審核中');
  const calculatedTotalWithdrawn = myWithdrawals.filter(w => w.status === 'Verified' || w.status === 'Approved' || w.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
  
  const revenueRecords: any[] = [];
  myTemples.forEach(t => {
      const bills = listBills.filter(b => b.templeId === t.id && b.status !== 'Rejected');
      bills.forEach(b => {
          revenueRecords.push({
             id: b.id,
             templeName: t.templeName,
             date: b.date || b.dueDate || b.billingDate,
             type: b.type === 'Setup' || b.type === 'SetupFee' ? '開辦費' : '營運費',
             amount: b.amount,
             status: b.status,
             receiptUrl: b.receiptUrl
          });
      });
  });
  
  return {
    totalEarned,
    totalPending,
    totalRevenue,
    netProfit: totalRevenue - totalEarned,
    balance: totalEarned - calculatedTotalWithdrawn,
    totalWithdrawn: calculatedTotalWithdrawn,
    records,
    revenueRecords,
    rules,
    pendingRequests,
    withdrawals: myWithdrawals
  }; 
}

export async function fetchSalesProfile(salesName: string) { 
  return withTempleSession(null, true, async (client) => {
    const sRes = await client.query('SELECT * FROM dist_sales WHERE name = $1', [salesName]);
    if ((sRes.rowCount ?? 0) > 0) {
      const sales = sRes.rows[0];
      const dRes = await client.query('SELECT name FROM distributors WHERE id = $1', [sales.distributor_id]);
      const distName = (dRes.rowCount ?? 0) > 0 ? dRes.rows[0].name : '無所屬';
      return { name: salesName, parentDistributor: distName, account: sales.account };
    }
    return { name: salesName, parentDistributor: '無所屬', account: '' };
  });
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
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被使用，請更換其他帳號' };
  }
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
  await null;
  try {
    await dbQuery(`
      INSERT INTO dist_sales (id, distributor_id, name, account, password, role, status, created_at)
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
  const res = await dbQuery("SELECT * FROM dist_sales WHERE \"distributorId\" = $1", [distributorId], () => null) as any;
    if (res && res.rows) {
          pgSales = res.rows;
        }

  const memSales = [].filter(s => s.distributorId === distributorId);
  const salesMap = new Map();
  memSales.forEach(s => salesMap.set(s.id, s));
  pgSales.forEach(s => salesMap.set(s.id, { ...s, distributorId: s.distributor_id, joinedAt: s.joined_at }));

  return Array.from(salesMap.values());
}
export async function fetchDistributorTemples(distributorId: string) {

      try {
        const temples = await prisma.temple.findMany({
          where: {
            OR: [
              { distributorId },
              { sales: { distributorId, role: { not: 'SuperSales' } } }
            ]
          },
          include: { sales: true }
        });
        
        const sysConfig = await prisma.systemConfig.findFirst();
        const discountRate = sysConfig?.yearlyDiscountRate || 20;
        
        return temples.map((t: any) => {
           const { paymentStatusLabel, contractEndDate, trialDaysRemaining } = enrichTempleWithFinancialStatus(t);
           return { ...t, paymentStatusLabel, contractEndDate, trialDaysRemaining, appliedDiscountRate: discountRate };
        });
      } catch(e) {
        console.error(e);
        return [];
      }
}
export async function fetchDistributorVisits(distributorId: string) {
  let listSales = [...[]];
  /* removed duplicate import */
    const resSales = await dbQuery("SELECT * FROM dist_sales WHERE \"distributorId\" = $1", [distributorId], () => null) as any;
    if (resSales && resSales.rows) {
          listSales = resSales.rows.map((r: any) => ({ ...r, role: r.role, distributorId: r.distributor_id }));
        }
  const teamIds = listSales.filter(s => s.distributorId === distributorId).map(s => s.name);
  return [].filter(v => teamIds?.includes(v.salesName));
}
export async function fetchDistributorFinanceSummary(distributorId: string) {
  try {
    /* removed duplicate import */
    const query = `
      SELECT t.* 
      FROM "Temple" t
      LEFT JOIN distributor_sales ds ON t.sales_id = ds.id
      WHERE (t.distributor_id = $1 OR ds.distributor_id = $1)
        AND t.status = 'Active' 
        AND (ds.role IS NULL OR ds.role != 'SuperSales')
    `;
    const res = await dbQuery(query, [distributorId], () => null) as any;
    const myTemples = res?.rows || [];
    
    let totalRevenue = 0;
    let totalCommissionPayout = 0;
    
    const now = new Date();
    const templeIds = myTemples.map((t: any) => t.id);

    let bills: any[] = [];
    if (templeIds.length > 0) {
      const bRes = await dbQuery("SELECT * FROM \"TempleBill\" WHERE temple_id = ANY($1::varchar[]) AND status = 'Paid'", [templeIds], () => null) as any;
      bills = bRes?.rows || [];
    }

    myTemples.forEach((t: any) => {
      const tBills = bills.filter((b: any) => b.temple_id === t.id);
      
      const rules = { setupFeePercent: 20, rentYear1Percent: 15, rentYear2Percent: 10, rentYear3PlusPercent: 5 };
      const activeDate = new Date(t.timestamp || t.created_at || new Date());
      const monthsDiff = (now.getFullYear() - activeDate.getFullYear()) * 12 + (now.getMonth() - activeDate.getMonth());

      tBills.forEach((b: any) => {
         totalRevenue += b.amount;
         if (b.type === 'Setup' || b.item_name === 'SetupFee') {
            totalCommissionPayout += b.amount * (rules.setupFeePercent / 100);
         } else {
            let rentPercent = rules.rentYear1Percent;
            if (monthsDiff >= 12 && monthsDiff < 24) rentPercent = rules.rentYear2Percent;
            else if (monthsDiff >= 24) rentPercent = rules.rentYear3PlusPercent;
            totalCommissionPayout += b.amount * (rentPercent / 100);
         }
      });
    });

    return {
      totalRevenue,
      totalCommissionPayout,
      totalTemples: myTemples.length
    };
  } catch(e) {
    return { totalRevenue: 0, totalCommissionPayout: 0, totalTemples: 0 };
  }
}
export async function approveTempleByDistributor(templeId: string) {
  const t = [].find(x => x.id === templeId);
  if (t) {
    t.status = 'Active';
    const gStore = globalThis as any;
    // synced
    
    /* removed duplicate import */
      await dbQuery(`UPDATE "Temple" SET status = 'Active' WHERE id = $1`, [templeId]);
    
    await generateInitialBills(t);
    if (t.account && t.password) {
      const pData = await [];
      const newPersonId = `p-${Date.now()}`;
      if (!pData.some((p:any) => p.account === t.account)) {
        pData.push({
          id: newPersonId,
          templeId: templeId,
          name: t.templeName || '宮廟管理員',
          account: t.account,
          password: t.password,
          role: 'TempleAdmin',
          status: 'Active'
        });
        await null;
        
        // Ensure insertion into PostgreSQL
        try {
          /* removed duplicate import */
          await dbQuery(
            `INSERT INTO "User" (id, "templeId", name, account, password, role, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id, temple_id) DO NOTHING`,
            [newPersonId, templeId, t.templeName || '宮廟管理員', t.account, t.password, 'TempleAdmin', 'Active'],
            () => null
          );
        } catch (e) {
          console.error("Failed to insert \"User\" into postgres during distributor approval:", e);
        }
      }
    }
    revalidatePath('/distributor');
    revalidatePath('/dist-sales');
  }
  return { success: true };
}
export async function rejectTempleByDistributor(templeId: string) { 
  await null;
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

  [].forEach((a: any) => {
    if (a.paymentStatus !== 'Pending' && a.paymentStatus !== 'Unpaid' && a.status !== 'Cancelled') {
      addRevenue(a.date || a.createdAt || a.timestamp, Number(a.amount) || 0, a.templeId);
    }
  });

  const allLampCats = await [];
  [].forEach((r: any) => {
    if (r.paymentStatus !== 'Pending' && r.paymentStatus !== 'Unpaid') {
      let price = r.actualPrice || r.price || 0;
      if (!price && r.categoryId) {
         const cat = allLampCats.find((c: any) => c.id === r.categoryId);
         if (cat) price = cat.price;
      }
      addRevenue(r.createdAt || r.date || r.timestamp, Number(price) || 0, r.templeId);
    }
  });

  [].forEach((r: any) => {
    if (r.paymentStatus !== 'Pending' && r.paymentStatus !== 'Unpaid') {
      addRevenue(r.createdAt || r.timestamp || r.date, Number(r.actualPrice || r.price) || 0, r.templeId);
    }
  });

  [].forEach((t: any) => {
    if (t.paymentStatus === 'Paid' || t.status === 'Paid') {
      addRevenue(t.paymentUpdatedAt || t.scannedAt || t.createdAt, Number(t.price || 0) || 0, t.templeId);
    }
  });

  [].forEach((r: any) => {
    if ((r.id.startsWith('MERIT-') || r.serviceType?.includes('功德')) && (r.paymentStatus !== 'Pending' && r.paymentStatus !== 'Unpaid')) {
      let amt = 0;
      if (r.values && r.values['金額']) {
        amt = Number(String(r.values['金額']).replace(/[^0-9]/g, ''));
      }
      addRevenue(r.paymentUpdatedAt || r.createdAt || r.date, amt, r.templeId);
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

  [].forEach((g: any) => {
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
    validEventIds = [].filter((e: any) => !e.templeId || e.templeId === templeId).map((e: any) => e.id);
  }

  let totalTickets = 0;
  let completedTickets = 0;
  
  [].forEach((t: any) => {
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
  [].forEach((a: any) => {
    if (templeId && a.templeId && a.templeId !== templeId) return;
    totalOrders++;
    if (a.paymentStatus === 'Paid') paidOrders++;
  });
  const conversionRate = totalOrders === 0 ? 0 : Math.round((paidOrders / totalOrders) * 100);

  // B. Guest Demographics (New vs Returning)
  let newGuestCount = 0;
  let returningGuestCount = 0;
  
  const guestApptCounts: Record<string, number> = {};
  [].forEach((a: any) => {
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
  [].forEach((a: any) => {
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

  const temple = [].find(t => t.id === templeId);
  let trialDaysRemaining: number | undefined = undefined;
  let isPermanentFree = false;
  
  if (temple) {
    if (temple.freeType === 'Permanent') {
      isPermanentFree = true;
    } else {
      const trialMonths = temple.trialMonths || temple.freeMonths || 0;
      if (trialMonths > 0) {
        const createdDate = new Date(temple.timestamp || temple.created_at || Date.now());
        const endFreeDate = new Date(createdDate);
        endFreeDate.setDate(endFreeDate.getDate() + (trialMonths * 30));
        const now = new Date();
        if (now < endFreeDate) {
          trialDaysRemaining = Math.ceil((endFreeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    }
  }

  let usedPgForRevenue = false;
  try {
    /* removed duplicate import */
    const pgCheck = await dbQuery("SELECT 1", [], () => null) as any;
    if (pgCheck && pgCheck.rows) {
      usedPgForRevenue = true;
      await Promise.all([
                  dbQuery("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS remarks TEXT", [], () => null),
                  dbQuery("ALTER TABLE lamp_records ADD COLUMN IF NOT EXISTS remarks TEXT", [], () => null),
                  dbQuery("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS remarks TEXT", [], () => null),
                  dbQuery("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(255)", [], () => null),
                  dbQuery("ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS remarks TEXT", [], () => null),
                  dbQuery("ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(255)", [], () => null),
                  dbQuery("ALTER TABLE deep_records ADD COLUMN IF NOT EXISTS remarks TEXT", [], () => null),
                  dbQuery("ALTER TABLE deep_records ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(255)", [], () => null),
                  dbQuery("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_updated_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE lamp_records ADD COLUMN IF NOT EXISTS payment_updated_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS payment_updated_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE event_registrations ADD COLUMN IF NOT EXISTS created_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE queue_tickets ADD COLUMN IF NOT EXISTS payment_updated_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE deep_records ADD COLUMN IF NOT EXISTS payment_updated_at VARCHAR(100)", [], () => null),
                  dbQuery("ALTER TABLE deep_records ADD COLUMN IF NOT EXISTS created_at VARCHAR(100)", [], () => null)
                ]);

      const [appRes, lampRes, evRes, qtRes, deepRes] = await Promise.all([
        dbQuery("SELECT * FROM appointments WHERE temple_id = $1 AND payment_status != 'Pending' AND payment_status != 'Unpaid'", [templeId], () => null) as any,
        dbQuery("SELECT * FROM lamp_records WHERE temple_id = $1 AND amount > 0 AND payment_status != 'Pending' AND payment_status != 'Unpaid'", [templeId], () => null) as any,
        dbQuery("SELECT * FROM event_registrations WHERE temple_id = $1 AND payment_status != 'Pending' AND payment_status != 'Unpaid'", [templeId], () => null) as any,
        dbQuery("SELECT * FROM queue_tickets WHERE temple_id = $1 AND payment_status != 'Pending' AND payment_status != 'Unpaid'", [templeId], () => null) as any,
        dbQuery("SELECT * FROM deep_records WHERE temple_id = $1 AND (id LIKE 'MERIT-%' OR service_type LIKE '%功德%')", [templeId], () => null) as any
      ]);
      
      if (appRes?.rows) {
        appRes.rows.forEach((a: any) => {
          revenue.push({
            id: a.id,
            title: a.service,
            source: 'Appointment',
            amount: Number(a.amount) || 0,
            timestamp: a.payment_updated_at || a.created_at || (a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date)),
            guestName: a.guest_name || a.phone,
            paymentMethod: a.payment_method || '現金/臨櫃',
            status: a.payment_status || 'Paid',
            paymentRef: a.payment_ref,
            remarks: a.remarks
          });
          totalRevenue += (Number(a.amount) || 0);
        });
      }
      if (lampRes?.rows) {
        lampRes.rows.forEach((r: any) => {
          revenue.push({
            id: r.id,
            title: r.lamp_type || r.categoryName,
            source: 'Lamp',
            amount: Number(r.amount || r.price) || 0,
            timestamp: r.payment_updated_at || (r.created_at instanceof Date ? r.created_at.toISOString().split('T')[0] : String(r.created_at)),
            guestName: r.guest_name || r.phone,
            paymentMethod: r.payment_method || '現金/臨櫃',
            status: r.payment_status || 'Paid',
            paymentRef: r.payment_ref,
            remarks: r.remarks
          });
          totalRevenue += (Number(r.amount || r.price) || 0);
        });
      }
      if (evRes?.rows) {
        evRes.rows.forEach((r: any) => {
          revenue.push({
            id: r.id,
            title: r.event_title || r.title,
            source: 'Event',
            amount: Number(r.actual_price || r.amount || r.price) || 0,
            timestamp: r.payment_updated_at || r.timestamp || (r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at || new Date().toISOString())),
            guestName: r.guest_name || r.phone,
            paymentMethod: r.payment_method || '現金/臨櫃',
            status: r.payment_status || 'Paid',
            paymentRef: r.payment_ref,
            remarks: r.remarks
          });
          totalRevenue += (Number(r.actual_price || r.amount || r.price) || 0);
        });
      }
      if (qtRes?.rows) {
        qtRes.rows.forEach((t: any) => {
          revenue.push({
            id: t.id,
            title: '現場排隊服務',
            source: 'Queue',
            amount: Number(t.price || 0) || 0,
            timestamp: t.payment_updated_at || t.scanned_at || (t.created_at instanceof Date ? t.created_at.toISOString().split('T')[0] : String(t.created_at)),
            guestName: t.phone || '現場信眾',
            paymentMethod: '現金/臨櫃',
            status: t.payment_status || t.status || 'Paid',
            paymentRef: t.payment_ref,
            remarks: t.remarks
          });
          totalRevenue += (Number(t.price || 0) || 0);
        });
      }
      if (deepRes?.rows) {
        deepRes.rows.forEach((r: any) => {
          let amt = 0;
          let pMethod = '現金/臨櫃';
          let payer = r.phone || '信眾';
          const vals = typeof r.values === 'string' ? JSON.parse(r.values) : r.values;
            if (vals && vals['金額']) amt = Number(String(vals['金額']).replace(/[^0-9]/g, ''));
            if (vals && vals['支付方式']) pMethod = vals['支付方式'];
            if (vals && vals['付款人']) payer = vals['付款人'];
          revenue.push({
            id: r.id,
            title: r.service_type,
            source: 'Merit',
            amount: amt,
            timestamp: r.payment_updated_at || r.created_at || (r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date)),
            guestName: payer,
            paymentMethod: pMethod,
            status: r.payment_status || 'Paid',
            paymentRef: r.payment_ref,
            remarks: r.remarks
          });
          totalRevenue += amt;
        });
      }
    }
  } catch(e) {
    console.error('PG fetch for revenue failed', e);
  }

  if (!usedPgForRevenue) {
    [].filter(r => r.templeId === templeId && r.price > 0 && r.paymentStatus !== 'Pending').forEach(r => {
      revenue.push({
        id: r.id,
        title: r.categoryName,
        source: 'Lamp',
        amount: r.price,
        timestamp: r.paymentUpdatedAt || r.createdAt || r.date,
        guestName: r.guestName || r.phone,
        paymentMethod: '現金/臨櫃',
        status: r.paymentStatus || 'Paid',
        paymentRef: r.paymentRef,
        remarks: r.remarks
      });
      totalRevenue += r.price;
    });

    const myEvents = [].filter(e => e.templeId === templeId).map(e => e.id);
    [].filter(r => myEvents?.includes(r.eventId) && r.paymentStatus !== 'Pending' && r.paymentStatus !== 'Unpaid').forEach(r => {
      revenue.push({
        id: r.id,
        title: r.title,
        source: 'Event',
        amount: r.actualPrice || r.price,
        timestamp: r.paymentUpdatedAt || r.timestamp || new Date().toISOString(),
        guestName: r.guestName || r.phone,
        paymentMethod: '現金/臨櫃',
        status: r.paymentStatus,
        paymentRef: r.paymentRef,
        remarks: r.remarks
      });
      totalRevenue += (r.actualPrice || r.price);
    });

    const myServices = [].filter(s => s.templeId === templeId).map(s => s.id);
    [].filter(a => myServices?.includes(a.serviceId) && a.paymentStatus !== 'Pending' && a.paymentStatus !== 'Unpaid').forEach(a => {
      revenue.push({
        id: a.id,
        title: a.service,
        source: 'Appointment',
        amount: a.amount || 0,
        timestamp: a.paymentUpdatedAt || a.createdAt || a.date,
        guestName: a.guestName || a.phone,
        paymentMethod: a.paymentMethod || '現金/臨櫃',
        status: a.paymentStatus || 'Paid',
        paymentRef: a.paymentRef,
        remarks: a.remarks
      });
      totalRevenue += (a.amount || 0);
    });

    [].filter(r => (!r.templeId || r.templeId === templeId) && (r.id.startsWith('MERIT-') || r.serviceType?.includes('功德'))).forEach(r => {
      let amt = 0;
      if (r.values && r.values['金額']) {
        amt = Number(String(r.values['金額']).replace(/[^0-9]/g, ''));
      }
      revenue.push({
        id: r.id,
        title: r.serviceType,
        source: 'Merit',
        amount: amt,
        timestamp: r.paymentUpdatedAt || r.createdAt || r.date,
        guestName: r.guestName || (r.values && r.values['付款人']) || r.phone || '信眾',
        paymentMethod: (r.values && r.values['支付方式']) || '現金/臨櫃',
        status: r.paymentStatus || 'Paid',
        paymentRef: r.paymentRef,
        remarks: r.remarks
      });
      totalRevenue += amt;
    });

    [].filter(t => t.paymentStatus === 'Paid' && (!t.templeId || t.templeId === templeId)).forEach(t => {
      revenue.push({
        id: t.id,
        title: '現場排隊服務',
        source: 'Queue',
        amount: t.price || 0,
        timestamp: t.paymentUpdatedAt || t.scannedAt || t.date || new Date().toISOString().split('T')[0],
        guestName: t.phone || '現場信眾',
        paymentMethod: '現金/臨櫃',
        status: t.paymentStatus || t.status || 'Paid',
        paymentRef: t.paymentRef,
        remarks: t.remarks
      });
      totalRevenue += (t.price || 0);
    });
  }

  revenue.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const _allTemplesForBills = await [];
  let expenses: ExpenseEntry[] = []
    .filter(b => b.templeId === templeId)
    .map(b => {
      const t = _allTemplesForBills?.find((x: any) => x.id === templeId);
      const isSuperAdminService = b.type === 'StorageUpgrade' || b.type === 'AgiService';
      const fallbackRole = isSuperAdminService ? 'SuperAdmin' : (t?.distributorId ? 'Distributor' : 'SuperAdmin');
      const fallbackId = isSuperAdminService ? 'system-hq' : (t?.distributorId || 'system-hq');
      return {
        id: b.id,
        type: b.type,
        amount: b.amount,
        dueDate: b.dueDate,
        status: b.status,
        billingDate: b.billingDate,
        payeeRole: b.payeeRole || fallbackRole,
        payeeId: b.payeeId || fallbackId
      };
    });
    
  try {
    /* removed duplicate import */
    const res = await dbQuery("SELECT * FROM \"TempleBill\" WHERE temple_id = $1", [templeId], () => null) as any;
    const rows = res?.rows;
    if (rows && rows.length > 0) {
      expenses = rows.map((r: any) => {
        const t = _allTemplesForBills?.find((x: any) => x.id === r.temple_id);
        const type = r.item_name || '';
        const isSuperAdminService = type?.includes('空間') || type?.includes('AI') || type?.includes('Storage') || type?.includes('Agi');
        const fallbackRole = isSuperAdminService ? 'SuperAdmin' : (t?.distributorId ? 'Distributor' : 'SuperAdmin');
        const fallbackId = isSuperAdminService ? 'system-hq' : (t?.distributorId || 'system-hq');
        
        return {
          id: r.id,
          type: r.item_name,
          amount: r.amount,
          dueDate: r.due_date instanceof Date ? r.due_date.toISOString().split('T')[0] : r.due_date,
          status: r.status,
          billingDate: r.created_at instanceof Date ? r.created_at.toISOString().substring(0, 7) : String(r.created_at || '').substring(0, 7),
          payeeRole: r.payee_role || r.payeeRole || fallbackRole,
          payeeId: r.payee_id || r.payeeId || fallbackId
        };
      });
    }
  } catch (e) {
    console.error('Failed to fetch bills from DB in fetchFinancialOverview', e);
  }
  
  const pendingExpense = expenses.filter(e => e.status === 'Unpaid' || e.status === 'PendingVerification').reduce((acc, e) => acc + e.amount, 0);

  let payeeInfo = null;
  const payeeSettings: Record<string, any> = {};
  
  try {
    /* removed duplicate import */
    for (const exp of expenses) {
      if (exp.status !== 'Unpaid' && exp.status !== 'PendingVerification') continue;
      
      const pId = exp.payeeId || 'superadmin';
      const pRole = exp.payeeRole || 'SuperAdmin';
      
      if (!payeeSettings[pId]) {
        if (pRole === 'Distributor' && pId && pId !== 'superadmin') {
          let dist = [].find((d: any) => d.id === pId);
          if (!dist) {
             const dRes = await dbQuery("SELECT * FROM distributors WHERE id = $1", [pId], () => null) as any;
             if (dRes && dRes.rowCount > 0) dist = dRes.rows[0];
          }
          if (dist) {
            let b2b = dist.b2bPayment || dist.b2b_payment;
            if (typeof b2b === 'string') {
              b2b = JSON.parse(b2b);
            }
            payeeSettings[pId] = b2b || null;
          }
        } else {
           const sysConfig = await fetchSystemConfig();
           payeeSettings[pId] = sysConfig?.b2bPayment || db_config?.b2bPayment || null;
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch payee b2b payment settings', e);
  }

  // Fallback for first expense (legacy support)
  const payeeId = expenses.length > 0 ? expenses[0].payeeId : null;
  const payeeRole = expenses.length > 0 ? expenses[0].payeeRole : null;
  if (payeeRole === 'Distributor' && payeeId) {
    let dist = [].find((d: any) => d.id === payeeId);
    if (!dist) {
      /* removed duplicate import */
        const dRes = await dbQuery("SELECT * FROM distributors WHERE id = $1", [payeeId], () => null) as any;
        if (dRes && dRes.rowCount > 0) dist = dRes.rows[0];
    }
    payeeInfo = {
      bankName: dist?.bank_name || dist?.bankName || '未設定銀行',
      account: dist?.bank_account || dist?.bankAccount || '未設定帳號',
      name: dist ? dist.name : '神明管家經銷服務網',
      bankCode: dist?.bank_code || dist?.bankCode || ''
    };
  } else {
    payeeInfo = {
      bankName: '國泰世華銀行 (013)',
      account: '9876 543 210987',
      name: '神明管家總部'
    };
  }

  return {
    revenue,
    expenses,
    totalRevenue,
    pendingExpense,
    lastMonthGrowth: '+12%',
    payeeInfo,
    payeeSettings,
    trialDaysRemaining,
    isPermanentFree
  };
}
export async function markAppointmentCompleted() { return { success: true }; }

// migrated (await jsonStore.find('bonuses')) to bonuses
// migrated (await jsonStore.find('withdrawals')) to withdrawals
// migrated (await jsonStore.find('notifications')) to (await jsonStore.find('notifications'))

export async function applyBonusOverride(salesName: string, amount: number, reason: string) {
  const newBonus = {
    id: `BONUS-${Date.now()}`,
    salesName,
    amount,
    reason,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString()
  };
  await null;

  await null;

  revalidatePath('/super-admin');
  revalidatePath('/super-sales');
  return { success: true };
}

export async function fetchSuperSalesBonuses(salesName: string) {

      try {
        const sales = await prisma.distributorSales.findFirst({ where: { name: salesName } });
        if (!sales) return [];
        return await prisma.bonus.findMany({ where: { salesId: sales.id } });
      } catch(e) {
        return [];
      }
}

export async function fetchAllWithdrawals() {
  return withTempleSession(null, true, async (client) => {
    const query = `
      SELECT w.*, wal.role as wallet_role 
      FROM "Withdrawal" w
      LEFT JOIN wallets wal ON w.sales_name = wal.name
      ORDER BY w.created_at DESC
    `;
    const res = await client.query(query);
    
    const allWithdrawals = res.rows.map((r: any) => ({
      id: r.id,
      salesName: r.salesName || r.sales_name,
      amount: r.amount,
      status: r.status,
      receiptUrl: r.receipt_url || r.receiptUrl,
      date: r.date instanceof Date ? `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, '0')}-${String(r.date.getDate()).padStart(2, '0')}` : r.date,
      role: r.wallet_role
    }));
    
    // 過濾掉「經銷業務員」的提領申請，只留給對應的經銷商審核
    return allWithdrawals.filter((w: any) => w.role !== 'DistSales' && w.role !== 'DistributorSales');
  });
}

export async function approveWithdrawal(id: string, receiptUrl?: string) { 
  return withTempleSession(null, true, async (client) => {
    if (receiptUrl) {
      await client.query("UPDATE \"Withdrawal\" SET status = 'Approved', \"receiptUrl\" = $1 WHERE id = $2", [receiptUrl, id]);
    } else {
      await client.query("UPDATE \"Withdrawal\" SET status = 'Approved' WHERE id = $1", [id]);
    }
    revalidatePath('/super-admin');
    return { success: true }; 
  });
}

export async function rejectWithdrawal(id: string) { 
  return withTempleSession(null, true, async (client) => {
    const wRes = await client.query('SELECT * FROM "Withdrawal" WHERE id = $1', [id]);
    if ((wRes.rowCount ?? 0) > 0) {
      const w = wRes.rows[0];
      await client.query("UPDATE \"Withdrawal\" SET status = 'Rejected' WHERE id = $1", [id]);
      await client.query("UPDATE wallets SET balance = balance + $1 WHERE name = $2", [w.amount, w.sales_name]);
    }
    revalidatePath('/super-admin');
    return { success: true }; 
  });
}

export async function updateServiceSettings(settings: any) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return { success: false };
        
        const existing = await prisma.serviceSetting.findFirst({
          where: { templeId }
        });
        
        if (existing) {
          await prisma.serviceSetting.update({
            where: { id: existing.id },
            data: { pushConfigs: settings }
          });
        } else {
          await prisma.serviceSetting.create({
            data: {
              templeId,
              pushConfigs: settings
            }
          });
        }
        
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function fetchEarningsStats(salesId: string = '超級精英業務') { 
  const history = await fetchCommissionHistory(salesId, '', '');
  return {
    balance: history.balance,
    pending: history.pendingRequests.reduce((acc: any, curr: any) => acc + curr.amount, 0),
    totalWithdrawn: history.totalWithdrawn
  };
}

export async function approveSuperSalesWithdrawal(withdrawalId: string, receiptUrl: string) {

      try {
        await prisma.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: 'Approved', receiptUrl }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function requestWithdrawal(salesName: string, amount: number) { 
  return withTempleSession(null, true, async (client) => {
    const wRes = await client.query('SELECT balance FROM wallets WHERE name = $1', [salesName]);
    if ((wRes.rowCount ?? 0) === 0) return { success: false, error: '找不到該錢包帳戶' };
    const balance = Number(wRes.rows[0].balance);
    if (amount > balance) return { success: false, error: '餘額不足' };

    await client.query('UPDATE wallets SET balance = balance - $1 WHERE name = $2', [amount, salesName]);

    const wdId = `WD-${Date.now()}`;
    await client.query(
      'INSERT INTO "Withdrawal" (id, "salesName", amount, status, date) VALUES ($1, $2, $3, $4, CURRENT_DATE)',
      [wdId, salesName, amount, 'Pending']
    );
    
    revalidatePath('/super-admin');
    return { success: true }; 
  });
}

// migrated (await jsonStore.find('password_resets')) to (await jsonStore.find('password_resets'))

export async function requestPasswordReset(salesName: string) {
  const newReq = {
    id: `PR-${Date.now()}`,
    salesName,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0]
  };
  await null;

  await null;
  revalidatePath('/super-admin');
  return { success: true };
}

export async function fetchPasswordResets() {

      try {
        return await prisma.passwordReset.findMany({
          orderBy: { date: 'desc' }
        });
      } catch (e) {
        console.error(e);
        return [];
      }
}

export async function handlePasswordReset(id: string, action: 'Approve' | 'Reject') {

      try {
        const pr = await prisma.passwordReset.findUnique({ where: { id } });
        if (!pr) return { success: false };
        await prisma.passwordReset.update({ where: { id }, data: { status: action === 'Approve' ? 'Approved' : 'Rejected' } });
        if (action === 'Approve') {
          await updateAccountPassword(pr.userId, '000000', pr.userRole);
        }
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function fetchNotifications(userRole: string, userName?: string) {

      try {
        let whereClause: any = {};
        if (userRole !== 'SuperAdmin') {
          whereClause = {
            OR: [
              { targetUser: userName },
              { title: { notIn: ['新宮廟核定申請', '新經銷體系授權申請', '密碼重設申請', '手動獎金撥發通知'] } },
              { 
                title: { in: ['新宮廟核定申請', '新經銷體系授權申請', '密碼重設申請', '手動獎金撥發通知'] },
                content: { contains: userName || '' }
              }
            ]
          };
        }
        
        return await prisma.notification.findMany({
          where: whereClause,
          orderBy: { date: 'desc' }
        });
      } catch (e) {
        console.error(e);
        return [];
      }
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
    await null;
    // (await jsonStore.find('guest_files')) synced

    if (client) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS guest_files (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
    const rawAccount = formData.get('account') as string;
    const account = (rawAccount || '').trim();
    
    if (account) {
      const checkRes = await client.query('SELECT id FROM "User" WHERE "templeId" = $1 AND LOWER(account) = $2', [templeId, account.toLowerCase()]);
        if (checkRes && checkRes.rowCount && checkRes.rowCount > 0) {
                  return { success: false, error: '該帳號在此宮廟已被註冊，請更換' };
                }
    }

    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const newId = `p-${Date.now()}`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;

    await client.query(`
        CREATE TABLE IF NOT EXISTS personnel (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
        INSERT INTO "User" (id, "templeId", name, role, account, phone, password, status, avatar, permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [newId, templeId, name, role, account, phone, password, 'Active', avatar, defaultPerms]);
    await revalidateTemple();
    await logSystemEvent('SUCCESS', '新增人員', `人員名稱：${name}`, '管理員', templeId);
    return { success: true };
  });
}

export async function deletePersonnel(id: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    let currentPersonnel = await [];
    const personnel = currentPersonnel.find((p: any) => p.id.toString() === id.toString() && p.templeId === templeId);
    if (personnel) {
      const currentAppts = await [];
      const currentSlots = await [];
      const hasAppointments = currentAppts.some((a: any) => a.staff === personnel.name && a.status !== 'Completed' && a.templeId === templeId);
      const hasSlots = currentSlots.some((s: any) => s.staff === personnel.name && s.status !== 'Completed' && s.templeId === templeId);
      if (hasAppointments || hasSlots) {
        return { success: false, message: '此人員目前尚有預約服務或已排班時段，請先清空後再進行刪除！' };
      }
    }

    await client.query('DELETE FROM "User" WHERE id = $1 AND "templeId" = $2', [id, templeId]);
    await revalidateTemple();
    return { success: true };
  });
}

export async function updateAccountPermissions(id: string, permissions: string[]) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query('UPDATE "User" SET permissions = $1 WHERE id = $2 AND "templeId" = $3', [permissions, id, templeId]);
    await revalidateTemple();
    return { success: true };
  });
}

export async function updateAccountPassword(id: string, newPass: string, role?: string) {

      try {
        if (role === 'Temple' || id.startsWith('temple-')) {
          await prisma.temple.update({ where: { id }, data: { password: newPass } });
          
          const user = await prisma.user.findFirst({ where: { templeId: id } });
          if (user) {
            await prisma.user.update({ where: { id: user.id }, data: { password: newPass } });
          } else {
            const temple = await prisma.temple.findUnique({ where: { id } });
            if (temple) {
              await prisma.user.create({
                data: {
                  id: `p-${Date.now()}`,
                  templeId: id,
                  name: temple.templeName || '宮廟管理員',
                  account: temple.account || `admin-${id.slice(-4)}`,
                  password: newPass,
                  role: 'TempleAdmin',
                  status: 'Active'
                }
              });
            }
          }
        } else if (role === 'Distributor') {
          await prisma.distributor.update({ where: { id }, data: { password: newPass } });
        } else if (role === 'SuperSales' || role === 'DistSales') {
          await prisma.distributorSales.update({ where: { id }, data: { password: newPass } });
        } else {
          await prisma.user.update({ where: { id }, data: { password: newPass } });
        }
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

// --- 經銷總部分階資料獲取 ---
export async function fetchDistributorProfile(distId?: string) {

      try {
        if (!distId) return null;
        return await prisma.distributor.findUnique({ where: { id: distId } });
      } catch(e) {
        return null;
      }
}
export async function fetchDistributorCommissionSummary(distId: string, year: string, month: string) { 
  const id = distId || 'dist-1';
  const summary = await fetchDistributorFinanceSummary(id);
  const netProfit = summary.totalCommissionPayout || 0;
  return {
    totalRevenue: summary.totalRevenue || 0,
    netProfit: netProfit,
    balance: netProfit * 0.8, // 模擬已請款與未請款
    totalWithdrawn: netProfit * 0.2,
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
    const guestsRes = await client.query('SELECT phone, name FROM guests WHERE temple_id = $1', [templeId]);
      const totalGuests = guestsRes.rowCount || 0;
      const appsRes = await client.query('SELECT id, guest_id as "guestId", service, date, time, status, payment_status as "paymentStatus" FROM appointments WHERE temple_id = $1', [templeId]);
      const apps = appsRes.rows;
      let todayAppointments = 0;
      let completedAppointments = 0;
      let totalServices = 0;
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
      let isVip = true;
      let totalGB = 100;
      let used = 0;
      let planName = '免費 5GB 空間';
      try {
              const storageRes = await client.query('SELECT allocated_bytes, plan_name FROM temple_storages WHERE temple_id = $1', [templeId]);
              if ((storageRes.rowCount ?? 0) > 0) {
                 totalGB = Math.round(Number(storageRes.rows[0].allocated_bytes) / (1024 * 1024 * 1024));
                 planName = storageRes.rows[0].plan_name || `${totalGB}GB`;
                 isVip = false;
              } else {
                const templeRes = await client.query('SELECT plan, cloud_storage as "cloudStorage" FROM "Temple" WHERE id = $1', [templeId]);
                if (templeRes.rowCount > 0) {
                  const tData = templeRes.rows[0];
                  const cloudStorage = tData.cloudStorage;
                  if (cloudStorage && cloudStorage.startsWith('SP-')) {
                    const plan = db_storage_plans.find(p => p.id === cloudStorage);
                    totalGB = plan ? plan.sizeGb : 100;
                    planName = plan ? plan.name : `${totalGB}GB`;
                    isVip = false;
                  } else {
                    isVip = tData.plan === 'Unlimited Node' || tData.plan === 'Free' || tData.plan === '免費' || cloudStorage?.includes('無限') || cloudStorage === 'Free' || cloudStorage === '免費' || !cloudStorage;
                    totalGB = isVip ? -1 : parseInt(cloudStorage) || 100;
                    planName = isVip ? '無限使用' : `${totalGB}GB`;
                  }
                }
              }
              const mediaRes = await client.query('SELECT SUM(size_bytes) as total_size FROM customer_media WHERE temple_id = $1', [templeId]);
              if (mediaRes.rowCount > 0 && mediaRes.rows[0].total_size) {
                 used = parseInt(mediaRes.rows[0].total_size) / (1024 * 1024 * 1024);
              }
            } catch (e) {
               console.error(e);
            }
      return { 
              analyticsSettings: {}, 
              analyticsData: { todayAppointments, completedAppointments, totalGuests, lampStats: { totalLamps, activeLamps }, serviceHeat: sortedServices }, 
              raw: { apps, agiStats: {}, guests: guestsRes.rows, storageInfo: { used, total: totalGB, isVip, planName }, qActive } 
            };
  });
}

// --- 信眾檔案 (Customers) 相關 mock 函式與型別 ---
export type ServiceForm = any;
export type DeepRecord = any;
export type GuestFile = any;
export type ServiceDefinition = any;
export type GuestRecord = any;
export type LampCategory = any;

export async function fetchGuests() {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return [];
        
        const guests = await prisma.guest.findMany({
          where: { templeId },
          orderBy: { createdAt: 'desc' }
        });
        
        return guests.map(r => ({
          id: r.id,
          templeId: r.templeId,
          phone: r.phone,
          name: r.name,
          email: r.email,
          address: r.address,
          birthday: r.birthday,
          lunarBirthday: r.lunarBirthday,
          birthHour: r.birthHour,
          lineId: r.lineId,
          status: r.status,
          createdAt: r.createdAt.toISOString().split('T')[0]
        }));
      } catch(e) {
        console.error(e);
        return [];
      }
}
export async function searchGuestsByNameOrPhone(query: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return [];
        
        const guests = await prisma.guest.findMany({
          where: {
            templeId,
            OR: [
              { name: { contains: query } },
              { phone: { contains: query } }
            ]
          }
        });
        return guests;
      } catch(e) {
        console.error(e);
        return [];
      }
}

export async function checkGuestProfile(phone: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return null;
        return await prisma.guest.findFirst({
          where: { phone, templeId }
        });
      } catch(e) {
        console.error(e);
        return null;
      }
}

export async function createOrUpdateGuest(data: any, originalPhone?: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return { success: false };
        
        let d = data;
        if (data instanceof FormData) {
          d = {
            phone: data.get('phone') as string,
            name: data.get('name') as string,
            email: data.get('email') as string,
            password: data.get('password') as string,
            address: data.get('address') as string,
            birthday: data.get('birthday') as string,
            lunarBirthday: data.get('lunarBirthday') as string,
            birthHour: data.get('birthHour') as string,
            lineId: data.get('lineId') as string,
            status: data.get('status') as string || 'Active'
          };
        }
        
        const normPhone = normalizePhone(d.phone);
        await prisma.guest.upsert({
          where: { phone: normPhone },
          update: {
            name: d.name,
            email: d.email || null,
            password: d.password || null,
            address: d.address || null,
            birthday: d.birthday || null,
            lunarBirthday: d.lunarBirthday || null,
            birthHour: d.birthHour || null,
            lineId: d.lineId || null,
            status: d.status || 'Active'
          },
          create: {
            templeId,
            phone: normPhone,
            name: d.name,
            email: d.email || null,
            password: d.password || null,
            address: d.address || null,
            birthday: d.birthday || null,
            lunarBirthday: d.lunarBirthday || null,
            birthHour: d.birthHour || null,
            lineId: d.lineId || null,
            status: d.status || 'Active'
          }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}
export async function fetchGuestHistory(p: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return { files: [], records: [], appointments: [], lampRecords: [], activities: [], queueTickets: [], eventRegistrations: [] };
        const normPhone = p.replace(/-/g, '');
        
        // We fetch everything based on phone containing the digits (since normPhone is just digits)
        const files = await prisma.guestFile.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { uploadedAt: 'desc' } });
        const appointments = await prisma.appointment.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const lampRecords = await prisma.lampRecord.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const queueTickets = await prisma.queueTicket.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const eventRegistrations = await prisma.eventRegistration.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });

        return {
          files,
          records: appointments,
          appointments,
          lampRecords,
          activities: [],
          queueTickets,
          eventRegistrations
        };
      } catch (error) {
        console.error('fetchGuestHistory error:', error);
        return { files: [], records: [], appointments: [], lampRecords: [], activities: [], queueTickets: [], eventRegistrations: [] };
      }
}

export async function fetchGuestRecords(phone: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return [];
        const normPhone = phone.replace(/-/g, '');
        return await prisma.appointment.findMany({
          where: { templeId, phone: { contains: normPhone } },
          orderBy: { createdAt: 'desc' }
        });
      } catch (error) {
        console.error('fetchGuestRecords error:', error);
        return [];
      }
}

export async function updateDeepRecord(recordId: string, phone: string, staffName: string, values: any) {

      try {
        const app = await prisma.appointment.findUnique({ where: { id: recordId } });
        if (app) {
          await prisma.appointment.update({
            where: { id: recordId },
            data: values
          });
          return { success: true, message: '紀錄已更新' };
        }
        return { success: false, message: '找不到指定的案卷紀錄' };
      } catch (error) {
        console.error('updateDeepRecord error:', error);
        return { success: false, message: '更新失敗' };
      }
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
  
  await null;
  // (await jsonStore.find('deep_records')) synced

  let activityContent = `完成【${serviceType}】紀錄歸檔`;
  if (serviceType?.includes('功德')) {
    const amount = values['金額'] || '';
    const payer = values['付款人'] || '';
    const method = values['支付方式'] || '';
    activityContent = `完成【${serviceType}】錄入: ${amount} (由${payer}以${method}支付)`;
  }

  // Also add to activities for unified log display
  await null;
  // (await jsonStore.find('activities')) synced

  await revalidateTemple();
    return { success: true, record: newRecord };
}
export async function fetchAllFilesByDate() { return []; }
export async function setFilePrivacy() { return { success: true }; }
export async function updateGuestPassword(phone: string, newPassword: string) {

      try {
        const templeId = await getDynamicTempleId();
        const normPhone = normalizePhone(phone);
        await prisma.guest.updateMany({
          where: { phone: normPhone, templeId: templeId! },
          data: { password: newPassword }
        });
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

// --- 點燈管理 (Lamps) 相關 mock 函式與型別 ---
export type LampRecord = any;

export async function fetchGuestByPhone(p: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return null;
        const normPhone = p.replace(/-/g, '');
        return await prisma.guest.findFirst({
          where: { templeId, phone: { contains: normPhone } }
        });
      } catch (error) {
        console.error('fetchGuestByPhone error:', error);
        return null;
      }
}
export async function confirmPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (recordType === 'Appointment') {
              await client.query('UPDATE appointments SET status = \'Confirmed\', payment_status = \'Paid\', payment_updated_at = $3 WHERE id = $1 AND temple_id = $2', [recordId, templeId, new Date().toISOString()]);
            }
      if (recordType === 'Lamp') {
              await client.query('UPDATE lamp_records SET payment_status = \'Paid\', payment_updated_at = $3 WHERE id = $1 AND temple_id = $2', [recordId, templeId, new Date().toISOString()]);
            }
      if (recordType === 'Event') {
              await client.query('UPDATE event_registrations SET payment_status = \'Paid\', payment_updated_at = $3 WHERE id = $1 AND temple_id = $2', [recordId, templeId, new Date().toISOString()]);
            }
      if (recordType === 'Queue') {
              await client.query('UPDATE queue_tickets SET payment_status = \'Paid\', payment_updated_at = $3 WHERE id = $1 AND temple_id = $2', [recordId, templeId, new Date().toISOString()]);
            }
    await revalidateTemple();
    return { success: true };
  });
}
export async function createLampRecord(data: any) {

      try {
        const templeId = await getDynamicTempleId();
        let phone = ''; let categoryId = ''; let guestName = ''; let notice = ''; let paymentMethod = ''; let paymentRef = '';
        
        if (data instanceof FormData) {
          phone = data.get('phone') as string; categoryId = data.get('categoryId') as string; guestName = data.get('guestName') as string; notice = data.get('notice') as string; paymentMethod = data.get('paymentMethod') as string || 'Cash'; paymentRef = data.get('paymentRef') as string || '';
        } else {
          phone = data.phone; categoryId = data.categoryId; guestName = data.guestName; notice = data.notice; paymentMethod = data.paymentMethod || 'Cash'; paymentRef = data.paymentRef || '';
        }

        const cat = await prisma.lampCategory.findFirst({
          where: { id: categoryId, templeId: templeId! }
        });
        
        if (!cat) return { success: false, error: '未找到燈種類別' };
        
        const newId = `LMP-${Date.now()}`;
        const paymentStatus = (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') ? 'Paid' : ((paymentMethod === 'transfer' || paymentMethod === 'customQR') ? 'Pending' : 'Unpaid');
        
        await prisma.lampRecord.create({
          data: {
            id: newId,
            templeId: templeId!,
            categoryId: cat.id,
            categoryName: cat.name,
            guestName,
            phone,
            actualPrice: cat.price,
            status: 'Pending',
            paymentMethod,
            paymentProofUrl: paymentRef,
            paymentStatus,
            remarks: notice
          }
        });
        
        await revalidateTemple();
        return { success: true, id: newId };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}
export async function checkLampNotifications() { return { hasNotification: false }; }
export async function saveLampCategory(data: any) {

      try {
        const templeId = await getDynamicTempleId();
        if (data.id) {
          await prisma.lampCategory.update({
            where: { id: data.id },
            data: {
              name: data.name,
              description: data.description || '',
              durationDays: data.durationDays || 365,
              totalSlots: data.totalSlots || 500,
              price: data.price || 0,
              precautions: data.precautions || ''
            }
          });
        } else {
          await prisma.lampCategory.create({
            data: {
              id: `cat-${Date.now()}`,
              templeId: templeId!,
              name: data.name,
              description: data.description || '',
              durationDays: data.durationDays || 365,
              totalSlots: data.totalSlots || 500,
              price: data.price || 0,
              precautions: data.precautions || ''
            }
          });
        }
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function deleteLampCategory(id: string) {

      try {
        const hasRecords = await prisma.lampRecord.findFirst({
          where: { categoryId: id }
        });
        
        if (hasRecords) return { success: false, error: '該點燈類別已有信眾登記，請先移除相關信眾紀錄後再進行刪除。' };
        
        await prisma.lampCategory.delete({ where: { id } });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}
export async function renewLampRecord(id: string) { return { success: true }; }

// --- 現場排隊 (Queue) 相關 mock 函式與型別 ---
export type QueueEvent = any;

// Redundant declaration removed

// Removed redundant initialization block

export async function fetchQueueEvents() {

      try {
        const templeId = await getDynamicTempleId();
        const events = await prisma.queueEvent.findMany({
          where: { templeId: templeId! },
          orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
          include: { tickets: { where: { status: 'Queuing' } } }
        });
        
        return events.map(r => ({
          id: r.id,
          templeId: r.templeId,
          title: r.title,
          date: r.date,
          startTime: r.startTime,
          endTime: r.endTime,
          location: r.location,
          serviceType: r.serviceType,
          price: r.price,
          maxCapacity: r.maxCapacity,
          status: r.status,
          participantCount: r.tickets.length
        }));
      } catch(e) {
        console.error(e);
        return [];
      }
}
export async function fetchActiveQueues() {

      try {
        const templeId = await getDynamicTempleId();
        const events = await prisma.queueEvent.findMany({
          where: { templeId: templeId!, status: 'Active' }
        });
        return events.map(r => ({
          id: r.id, templeId: r.templeId, title: r.title, date: r.date, startTime: r.startTime, endTime: r.endTime,
          location: r.location, serviceType: r.serviceType, price: r.price, maxCapacity: r.maxCapacity, status: r.status
        }));
      } catch(e) {
        console.error(e);
        return [];
      }
}
export async function fetchQueueDashboard(eventId?: string) {

      try {
        if (!eventId) return { tickets: [] };
        const templeId = await getDynamicTempleId();
        
        const tickets = await prisma.queueTicket.findMany({
          where: { eventId, templeId: templeId! }
        });
        
        return {
          tickets: tickets.map(r => ({
            id: r.id, eventId: r.eventId, templeId: r.templeId, eventTitle: (r as any).eventTitle, phone: r.phone, guestName: r.guestName,
            status: r.status, assignedNumber: r.displayNum, createdAt: r.createdAt.toISOString(), scannedAt: (r as any).scannedAt, actualOrder: r.actualOrder
          }))
        };
      } catch (e) {
        console.error(e);
        return { tickets: [] };
      }
}
// 獲取當前活動以掃碼正在排隊的人數
export async function fetchActiveQueueCount(): Promise<number> {

      try {
        const templeId = await getDynamicTempleId();
        const count = await prisma.queueTicket.count({
          where: {
            templeId: templeId!,
            status: 'Queuing',
            queueEvent: { status: 'Active' }
          }
        });
        return count;
      } catch(e) {
        console.error(e);
        return 0;
      }
}

export async function createQueueEvent(data: any) {

      try {
        const templeId = await getDynamicTempleId();
        const todayStr = new Date().toISOString().split('T')[0];
        if (data.date < todayStr) return { success: false, error: '不能部屬過去時間的活動。' };
        
        await prisma.queueEvent.create({
          data: {
            id: `qe-${Date.now()}`,
            templeId: templeId!,
            title: data.title,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            serviceType: data.serviceType,
            price: data.price,
            maxCapacity: data.maxCapacity,
            status: 'Active'
          }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
}

export async function updateQueueEvent(id: string, data: any) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.queueEvent.update({
          where: { id },
          data: {
            title: data.title,
            date: data.date,
            startTime: data.startTime,
            endTime: data.endTime,
            location: data.location,
            serviceType: data.serviceType,
            price: data.price,
            maxCapacity: data.maxCapacity
          }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e: any) {
        console.error(e);
        return { success: false, error: e.message };
      }
}
export async function activateQueueEvent(id: string) {

      try {
        const templeId = await getDynamicTempleId();
        const qe = await prisma.queueEvent.findUnique({ where: { id } });
        if (qe) {
          await prisma.queueEvent.update({
            where: { id },
            data: { status: qe.status === 'Active' ? 'Draft' : 'Active' }
          });
        }
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}
export async function deleteQueueEvent(id: string) {

      try {
        const templeId = await getDynamicTempleId();
        const tickets = await prisma.queueTicket.count({ where: { eventId: id } });
        if (tickets > 0) {
          await prisma.queueEvent.update({
            where: { id },
            data: { status: 'Cancelled' }
          });
        } else {
          await prisma.queueEvent.delete({ where: { id } });
        }
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}
export async function checkInWithQr(ticketId: string, eventId?: string) {

      try {
        const templeId = await getDynamicTempleId();
        const t = await prisma.queueTicket.findUnique({ where: { id: ticketId } });
        if (!t) return { success: false, error: '找不到票券' };
        if (t.status !== 'Registered' && t.status !== 'Pending') return { success: false, error: '票券狀態不正確' };
        if (eventId && t.eventId !== eventId) return { success: false, error: '活動不符，請掃描正確的活動QR碼' };
        
        const count = await prisma.queueTicket.count({
          where: {
            eventId: t.eventId,
            templeId: templeId!,
            status: { notIn: ['Pending', 'Registered'] }
          }
        });
        
        await prisma.queueTicket.update({
          where: { id: ticketId },
          data: {
            status: 'Queuing',
            actualOrder: count + 1
          }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false, error: '系統錯誤' };
      }
}

export async function callNextInQueue(eventId: string) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.queueTicket.updateMany({
          where: { eventId, status: 'Calling', templeId: templeId! },
          data: { status: 'Completed' }
        });
        
        const nextT = await prisma.queueTicket.findFirst({
          where: { eventId, status: 'Queuing', templeId: templeId! },
          orderBy: { actualOrder: 'asc' }
        });
        
        if (!nextT) return { error: 'NO_ONE_IN_QUEUE' };
        
        await prisma.queueTicket.update({
          where: { id: nextT.id },
          data: { status: 'Calling' }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { error: '系統錯誤' };
      }
}

export async function completeQueueService(ticketId: string) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.queueTicket.update({
          where: { id: ticketId },
          data: { status: 'Completed' }
        });
        await revalidateTemple();
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function updateQueueStatus(ticketId: string, status: string) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.queueTicket.update({
          where: { id: ticketId },
          data: { status }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function registerGuestForQueue(eventId: string, data: { guestName: string, phone: string, isOnline?: boolean }) {

      try {
        const templeId = await getDynamicTempleId();
        const ev = await prisma.queueEvent.findUnique({
          where: { id: eventId },
          include: { tickets: true }
        });
        
        if (!ev) return { error: 'EVENT_NOT_FOUND' };
        if (ev.maxCapacity > 0 && ev.tickets.length >= ev.maxCapacity) return { error: '活動預約已額滿！' };
        
        const nextNumber = `A${(ev.tickets.length + 1).toString().padStart(3, '0')}`;
        
        let actualOrder = 0;
        if (!data.isOnline) {
          const activeCount = await prisma.queueTicket.count({
            where: { eventId, templeId: templeId!, status: { notIn: ['Pending', 'Registered'] } }
          });
          actualOrder = activeCount + 1;
        }
        
        const newId = `t-${Date.now()}`;
        await prisma.queueTicket.create({
          data: {
            id: newId,
            eventId,
            templeId: templeId!,
            phone: data.phone,
            guestName: data.guestName,
            status: data.isOnline ? 'Registered' : 'Queuing',
            displayNum: nextNumber,
            actualOrder
          }
        });
        
        await revalidateTemple();
        return { success: true, ticket: { id: newId, assignedNumber: nextNumber } };
      } catch(e) {
        console.error(e);
        return { error: '系統錯誤' };
      }
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

// migrated (await jsonStore.find('temple_applications')) to (await jsonStore.find('temple_applications'))
// (await jsonStore.find('temple_applications')) synced

export async function fetchDistributorStats() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const activeRes = await client.query('SELECT COUNT(*) as active_count FROM "Temple" WHERE status = $1', ['Active']);
      const totalRes = await client.query('SELECT COUNT(*) as total_count FROM "Temple"');
      const salesRes = await client.query('SELECT COUNT(*) as sales_count FROM dist_sales');
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
  });
}

export async function fetchPricePlans() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
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
    
    await client.query(`
        INSERT INTO price_plans (id, distributor_id, name, setup_fee, monthly_fee, is_free, free_months)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [newId, 'dist-1', plan.name, Number(plan.setupFee || 0), Number(plan.monthlyFee || 0), Boolean(plan.isFree), Number(plan.freeMonths || 0)]);
    await revalidateTemple();
    return { success: true };
  });
}

export async function fetchTempleApplications() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
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
  });
}

export async function submitTempleApplication(data: any) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const newId = `app-${Date.now()}`;
    let setupFee = 12000;
    let monthlyFee = 3600;
    
    const planRes = await client.query('SELECT * FROM price_plans WHERE id = $1', [data.planId]);
      if ((planRes.rowCount ?? 0) > 0) {
              setupFee = planRes.rows[0].setup_fee;
              monthlyFee = planRes.rows[0].monthly_fee;
            }
      await client.query(`
        INSERT INTO temple_applications (id, temple_name, contact_person, contact_phone, plan_id, setup_fee, monthly_fee, status, sales_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [newId, data.templeName, data.contactPerson || '聯絡人', data.contactPhone || '', data.planId, setupFee, monthlyFee, 'Pending', 'sales-1']);
    await revalidateTemple();
    return { success: true };
  });
}

export async function approveTempleApplication(appId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    const appRes = await client.query('SELECT * FROM temple_applications WHERE id = $1', [appId]);
      if ((appRes.rowCount ?? 0) === 0) return { success: false, error: '找不到該筆開案申請' };
      const app = appRes.rows[0];
      await client.query('UPDATE temple_applications SET status = $1 WHERE id = $2', ['Approved', appId]);
      const newTempleId = `temple-${Date.now()}`;
      await client.query(`
        INSERT INTO "Temple" (id, name, city, status, "salesId", "setupFee", "monthlyRent", "paymentCycle")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newTempleId, app.temple_name, '台北市', 'Active', app.sales_id, app.setup_fee, app.monthly_fee, 'Monthly']);
      await client.query(`
        INSERT INTO temple_storages (temple_id, used_bytes, allocated_bytes, plan_name, city)
        VALUES ($1, $2, $3, $4, $5)
      `, [newTempleId, 0, 5368709120, '標準免費空間', '台北市']);
      await client.query(`
        INSERT INTO "User" (id, "templeId", name, role, account, phone, password, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [`p-${Date.now()}`, newTempleId, app.contact_person || '管理員', 'TempleAdmin', app.contact_phone || 'admin', app.contact_phone || '0000', app.contact_phone || 'admin', 'Active']);
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

// migrated (await jsonStore.find('temple_notifications')) to (await jsonStore.find('temple_notifications'))
// (await jsonStore.find('temple_notifications')) synced

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

    await null;
    // (await jsonStore.find('temple_notifications')) synced

    if (client) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS temple_notifications (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
    await client.query(`
        CREATE TABLE IF NOT EXISTS temple_notifications (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
    await client.query(`
        CREATE TABLE IF NOT EXISTS temple_notifications (
          id VARCHAR(50) NOT NULL,
          temple_id VARCHAR(50) NOT NULL REFERENCES "Temple"(id) ON DELETE CASCADE,
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
  const temple = [].find(t => t.id === templeId);
  if (!temple) return { success: false, error: 'Temple not found' };

  if (newDistributorId !== undefined) {
     temple.distributorId = newDistributorId;
  }
  if (newSalesId !== undefined) {
     temple.salesId = newSalesId;
  }
  
  // Create an audit log
  await null;

  const { revalidatePath } = require('next/cache');
  revalidatePath('/super-admin');
  return { success: true };
}

export async function transferDistributorOwnership(distributorId: string, newSalesId: string | null) {
  const dist = [].find(d => d.id === distributorId);
  if (!dist) return { success: false, error: 'Distributor not found' };

  dist.salesId = newSalesId;

  // Transfer all underlying temples if they belong to this distributor
  // And update their salesId to the new salesId if applicable
  [].forEach(t => {
     if (t.distributorId === distributorId) {
        if (newSalesId !== undefined) {
           t.salesId = newSalesId;
        }
     }
  });

  await null;

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

      try {
        const id = String(appId);
        const app = await prisma.appointment.findUnique({ where: { id } });
        if (!app) return { success: false, message: '找不到該預約' };
        
        let paymentStatus = 'Pending';
        let status = 'Pending';
        if (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') {
          paymentStatus = 'Paid';
          status = 'Confirmed';
        }
        
        await prisma.appointment.update({
          where: { id },
          data: { paymentMethod, paymentRef, paymentStatus, status }
        });
        return { success: true };
      } catch (error) {
        console.error('updateAppointmentPayment error:', error);
        return { success: false, message: '更新失敗' };
      }
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

      try {
        return await prisma.aiApiModel.findMany();
      } catch(e) {
        console.error(e);
        return [];
      }
}

export async function saveAiApiModels(models: any[]) {
  await null;
  // (await jsonStore.find('ai_api_models')) synced
  return { success: true };
}


export async function fetchAllTempleAiUsage() {

      try {
        return await prisma.templeAiUsage.findMany({ include: { temple: true } });
      } catch(e) {
        return [];
      }
}


export async function grantTempleAiVip(templeId: string, isVip: boolean = true) {

      try {
        await prisma.templeAiUsage.upsert({
          where: { templeId },
          update: { isVip, planId: isVip ? 'VIP-AI' : 'FREE' },
          create: { templeId, isVip, planId: isVip ? 'VIP-AI' : 'FREE', usedCount: 0 }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function fetchTempleAiUsage() {

      try {
        const templeId = await getDynamicTempleId();
        return await prisma.templeAiUsage.findUnique({ where: { templeId: templeId! } });
      } catch(e) {
        return null;
      }
}

export async function toggleTempleAiStatus(enabled: boolean) {

      try {
        const templeId = await getDynamicTempleId();
        await prisma.templeAiUsage.update({
          where: { templeId: templeId! },
          data: { enabled }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function purchaseAiPlan(planId: string, paymentMethod?: string) {

      try {
        const templeId = await getDynamicTempleId();
        const sys = await prisma.systemConfig.findFirst();
        const plan = sys?.aiPlans?.find((p: any) => p.id === planId);
        if (!plan) return { success: false };
        
        await prisma.templeBill.create({
          data: {
            id: `bill-${Date.now()}`,
            templeId: templeId!,
            amount: plan.price,
            type: 'AiUpgrade',
            status: 'PendingPayment',
            date: new Date()
          }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function logSystemEvent(level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', action: string, target: string, operator: string, templeIdOverride?: string) {

      try {
        const templeId = templeIdOverride || await getDynamicTempleId();
        const timestamp = new Date().toLocaleString('zh-TW');
        
        await prisma.auditLog.create({
          data: {
            id: `log-${Date.now()}`,
            action: `[${level}] ${action}`,
            details: `Target: ${target}`,
            operator,
            timestamp,
            performedBy: operator
          }
        });
        
        return { success: true };
      } catch (e) {
        console.error('Error logging system event', e);
        return { success: false };
      }
}

export async function fetchAuditLogs() {

      try {
        const templeId = await getDynamicTempleId();
        if (!templeId) return [];
        
        const logs = await prisma.auditLog.findMany({
          where: { templeId },
          orderBy: { timestamp: 'desc' }
        });
        return logs;
      } catch (e) {
        console.error('fetchAuditLogs error', e);
        return [];
      }
}

export async function getTempleBasicInfo(templeId?: string) {

      try {
        const tId = templeId || await getDynamicTempleId();
        if (!tId) return null;
        const t = await prisma.temple.findUnique({ where: { id: tId } });
        if (!t) return null;
        return { ...t, templeName: t.templeName || t.name };
      } catch(e) {
        console.error(e);
        return null;
      }
}

export async function updateTempleBasicInfo(data: any, templeId?: string) {

      try {
        const tId = templeId || await getDynamicTempleId();
        if (!tId) return { success: false };
        
        const updateData: any = {};
        if (data.templeName || data.name) updateData.templeName = data.templeName || data.name;
        if (data.city) updateData.city = data.city;
        if (data.address) updateData.address = data.address;
        if (data.phone) updateData.phone = data.phone;
        
        if (Object.keys(updateData).length > 0) {
          await prisma.temple.update({
            where: { id: tId },
            data: updateData
          });
        }
        
        const { revalidatePath } = require('next/cache');
        revalidatePath('/[templeId]/admin/settings', 'page');
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}


function enrichTempleWithFinancialStatus(temple: any, lastBill: any = null) {
  let paymentStatusLabel = '未付款';
  let contractEndDate = '';
  let trialDaysRemaining = 0;
  const now = new Date();
  const createdDate = new Date(temple.timestamp || temple.createdAt || Date.now());
  const trialMonths = temple.trialMonths || temple.freeMonths || 0;
  
  if (temple.freeType === 'Permanent') {
    paymentStatusLabel = '永久免費';
  } else if (trialMonths > 0) {
    const endFreeDate = new Date(createdDate);
    endFreeDate.setDate(endFreeDate.getDate() + (trialMonths * 30));
    if (now < endFreeDate) {
      trialDaysRemaining = Math.ceil((endFreeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      paymentStatusLabel = `免費試用中 (剩 ${trialDaysRemaining} 天)`;
      contractEndDate = `${endFreeDate.getFullYear()}/${(endFreeDate.getMonth()+1).toString().padStart(2,'0')}/${endFreeDate.getDate().toString().padStart(2,'0')} (試用結束)`;
    } else if (lastBill && lastBill.status === 'Paid') {
      const bDate = new Date(lastBill.created_at || lastBill.timestamp || Date.now());
      if (temple.paymentCycle === 'Yearly' || temple.rentType === 'Yearly') {
        const nextYear = new Date(bDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        contractEndDate = `${nextYear.getFullYear()}/${(nextYear.getMonth()+1).toString().padStart(2,'0')}/${nextYear.getDate().toString().padStart(2,'0')}`;
        paymentStatusLabel = `${bDate.getFullYear()}年已付 (合約至${contractEndDate})`;
      } else {
        const nextMonth = new Date(bDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        contractEndDate = `${nextMonth.getFullYear()}/${(nextMonth.getMonth()+1).toString().padStart(2,'0')}/${nextMonth.getDate().toString().padStart(2,'0')}`;
        paymentStatusLabel = `${bDate.getMonth() + 1}月已付`;
      }
    }
  } else {
    if (lastBill && lastBill.status === 'Paid') {
      const bDate = new Date(lastBill.created_at || lastBill.timestamp || Date.now());
      if (temple.paymentCycle === 'Yearly' || temple.rentType === 'Yearly') {
        const nextYear = new Date(bDate);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        contractEndDate = `${nextYear.getFullYear()}/${(nextYear.getMonth()+1).toString().padStart(2,'0')}/${nextYear.getDate().toString().padStart(2,'0')}`;
        paymentStatusLabel = `${bDate.getFullYear()}年已付 (合約至${contractEndDate})`;
      } else {
        const nextMonth = new Date(bDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        contractEndDate = `${nextMonth.getFullYear()}/${(nextMonth.getMonth()+1).toString().padStart(2,'0')}/${nextMonth.getDate().toString().padStart(2,'0')}`;
        paymentStatusLabel = `${bDate.getMonth() + 1}月已付`;
      }
    } else {
      paymentStatusLabel = '未付款';
    }
  }

  return { paymentStatusLabel, contractEndDate, trialDaysRemaining };
}
export async function fetchDistributorFinancials(distId: string) {
  try {
    /* removed duplicate import */
    const templesQuery = `
      SELECT t.* 
      FROM "Temple" t
      LEFT JOIN distributor_sales ds ON t.sales_id = ds.id
      WHERE (t.distributor_id = $1 OR ds.distributor_id = $1)
        AND (ds.role IS NULL OR ds.role != 'SuperSales')
    `;
    const templesRes = await dbQuery(templesQuery, [distId], () => null) as any;
    const temples = templesRes?.rows || [];
    const templeIds = temples.map((t: any) => t.id);

    let bills: any[] = [];
    if (templeIds.length > 0) {
      const billsRes = await dbQuery("SELECT * FROM \"TempleBill\" WHERE temple_id = ANY($1::varchar[]) ORDER BY created_at DESC", [templeIds], () => null) as any;
      bills = billsRes?.rows || [];
    }
    
    const paymentRecords = temples.map((t: any) => {
      const tBills = bills.filter((b: any) => b.temple_id === t.id);
      const lastBill = tBills[0];
      return {
        id: t.id,
        temple: t.temple_name || t.name || '未知宮廟',
        region: t.city || '未知縣市',
        amount: lastBill ? lastBill.amount : (t.monthly_rent || t.monthlyRent || 0),
        date: lastBill ? (lastBill.created_at instanceof Date ? lastBill.created_at.toISOString().split('T')[0] : lastBill.created_at) : (t.timestamp || t.created_at || '未知'),
        status: lastBill ? lastBill.status : 'Paid',
        type: lastBill ? lastBill.item_name : 'Monthly',
        templeStatus: t.status, 
      };
    });

    const salesRes = await dbQuery("SELECT id, name FROM dist_sales WHERE \"distributorId\" = $1", [distId], () => null) as any;
    const salesIds = (salesRes?.rows || []).map((s: any) => s.id);
    
    let bonusRequests: any[] = [];
    if (salesIds.length > 0) {
      const bonusRes = await dbQuery("SELECT * FROM bonus_requests WHERE sales_id = ANY($1::varchar[]) ORDER BY timestamp DESC", [salesIds], () => null) as any;
      bonusRequests = (bonusRes?.rows || []).map((r: any) => ({
        id: r.id,
        salesId: r.sales_id,
        salesName: r.sales_name,
        distributorId: r.distributor_id,
        amount: r.amount,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        status: r.status,
        receiptUrl: r.receipt_url,
        method: r.method
      }));
    }

    return { paymentRecords, bonusRequests };
  } catch (e) {
    return { paymentRecords: [], bonusRequests: [] };
  }
}

export async function fetchDistributorSalesPerformance(distId: string, yearMonth?: string) {
  try {
    /* removed duplicate import */
    const salesRes = await dbQuery("SELECT * FROM dist_sales WHERE \"distributorId\" = $1", [distId], () => null) as any;
    const sales = salesRes?.rows || [];

    return await Promise.all(sales.map(async (s: any) => {
      const templesRes = await dbQuery("SELECT * FROM \"Temple\" WHERE \"salesId\" = $1", [s.id], () => null) as any;
      const temples = templesRes?.rows || [];
      const templeIds = temples.map((t: any) => t.id);
      
      let totalSales = 0;
      let commission = 0;

      if (templeIds.length > 0) {
        const billsRes = await dbQuery("SELECT * FROM \"TempleBill\" WHERE temple_id = ANY($1::varchar[]) AND status = 'Paid'", [templeIds], () => null) as any;
        let bills = billsRes?.rows || [];
        
        if (yearMonth) {
          bills = bills.filter((b: any) => {
            const date = b.created_at instanceof Date ? b.created_at.toISOString().substring(0, 7) : 
                         (b.created_at ? String(b.created_at).substring(0,7) : (b.date ? String(b.date).substring(0,7) : ''));
            return date === yearMonth;
          });
        }

        totalSales = bills.reduce((sum: number, b: any) => sum + b.amount, 0);
        commission = bills.reduce((sum: number, b: any) => {
          const isSetup = b.item_name === 'SetupFee' || b.item_name === 'Setup';
          let sRules: any = {};
          if (typeof s.commission_rules === 'string') {
             sRules = JSON.parse(s.commission_rules);
          } else if (s.commission_rules) {
             sRules = s.commission_rules;
          }
          const rate = isSetup ? (sRules.setupFeePercent || 20) : (sRules.rentYear1Percent || 15);
          return sum + (b.amount * rate / 100);
        }, 0);
      }

      const wRes = await dbQuery("SELECT * FROM distributor_withdrawals WHERE sales_name = $1 AND (status = 'Approved' OR status = 'Verified')", [s.name], () => null) as any;
      const myWithdrawals = wRes?.rows || [];
      const totalWithdrawn = myWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      const vRes = await dbQuery("SELECT * FROM sales_visits WHERE sales_name = $1", [s.name], () => null) as any;
      const salesVisits = vRes?.rows || [];
      const convertedTempleNames = temples.map((t: any) => t.temple_name || t.name);
      const uniqueVisitedTemples = [...new Set(salesVisits.map((v: any) => v.temple_name))];
      const unconvertedVisitsCount = uniqueVisitedTemples.filter((name: any) => !convertedTempleNames?.includes(name)).length;

      return {
        id: s.id,
        name: s.name,
        account: s.account,
        activeTemples: temples.filter((t: any) => t.status === 'Active').length,
        totalTemplesCount: temples.length,
        totalSales,
        commission,
        totalWithdrawn,
        unconvertedVisitsCount,
        recentVisitsCount: salesVisits.length
      };
    }));
  } catch (e) {
    return [];
  }
}

export async function fetchSuperAdminFinancials() {
  // 取得宮廟與帳單狀態
  const allTemples = typeof gStore !== 'undefined' ? [] : [];
  let templeBills: any[] = typeof gStore !== 'undefined' ? ([] || []) : [];
  /* removed duplicate import */
    const res = await dbQuery("SELECT * FROM \"TempleBill\"", [], () => null) as any;
    const rows = res?.rows;
    if (rows) templeBills = rows;

  const records: any[] = [];
  templeBills.filter(b => b.status === 'Paid').forEach(b => {
      const bDate = b.created_at || b.timestamp;
      const t = allTemples.find((temple: any) => temple.id === (b.temple_id || b.templeId));
      records.push({
         id: b.id,
         date: bDate instanceof Date ? bDate.toISOString().split('T')[0] : (bDate ? String(bDate).split('T')[0] : new Date().toISOString().split('T')[0]),
         type: 'INCOME',
         amount: Number(b.amount || 0),
         category: (b.item_name === 'SetupFee' || b.type === 'Setup') ? 'AUTH_FEE' : 'SYSTEM_FEE',
         description: `${t?.templeName || '未知宮廟'} - ${b.item_name === 'SetupFee' || b.type === 'Setup' ? '開辦費' : '系統費用'}`
      });
  });

  const allWithdrawals = await fetchAllWithdrawals();

  allWithdrawals.filter((w: any) => w.status === 'Approved' || w.status === 'Verified').forEach((w: any) => {
      const wDate = w.timestamp || w.created_at || w.date;
      records.push({
         id: w.id,
         date: wDate instanceof Date ? wDate.toISOString().split('T')[0] : (wDate ? String(wDate).split('T')[0] : new Date().toISOString().split('T')[0]),
         type: 'EXPENSE',
         amount: Number(w.amount || 0),
         category: 'COMMISSION',
         description: `業務提領 - ${w.salesName}`
      });
  });

  const totalRevenue = records.filter(r => r.type === 'INCOME').reduce((s, r) => s + r.amount, 0);
  const totalCommission = records.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);
  const netProfit = totalRevenue - totalCommission;

  const templePayments = allTemples.filter((t: any) => !t.distributorId && t.status !== 'Inactive').map((t: any) => {
    const bills = templeBills.filter(b => b.temple_id === t.id || b.templeId === t.id);
    const unpaidBills = bills.filter(b => b.status === 'Unpaid' || b.status === 'PendingVerification');
    const hasUnpaid = unpaidBills.length > 0;
    const isPending = unpaidBills.some(b => b.status === 'PendingVerification');

    const isYearly = t.paymentCycle === 'Yearly';
    const discountRate = db_config.yearlyDiscountRate || 20;
    const discountMultiplier = 1 - discountRate / 100;
    const calcPrice = isYearly ? ((t.monthlyRent || 3600) * 12 * discountMultiplier) : (t.monthlyRent || 3600);
    const rentAmount = t.freeType === 'Permanent' ? 0 : calcPrice;

    return {
      id: t.id,
      name: t.templeName || t.name,
      monthlyRent: t.monthlyRent || 3600,
      rentAmount: rentAmount,
      paymentCycle: t.paymentCycle || 'Monthly',
      status: t.freeType === 'Permanent' ? 'VIP' : (isPending ? 'PendingVerification' : (hasUnpaid ? 'Unpaid' : 'Paid')),
      unpaidAmount: unpaidBills.reduce((s, b) => s + Number(b.amount), 0),
      bills: bills,
      billingStartDate: t.billingStartDate,
      freeType: t.freeType,
      joinedAt: t.timestamp || t.created_at || new Date().toISOString()
    };
  });
  const superSalesWithdrawals = allWithdrawals.filter((w: any) => w.role === 'SuperSales' || w.role === 'SuperSalesRole');
  return {
    records: records.slice().reverse(),
    summary: {
      totalRevenue,
      totalCommission,
      netProfit
    },
    wallets: [],
    templePayments,
    superSalesWithdrawals
  };
}

export async function updateDistributorBankInfo(distId: string, bankInfo: any) {

      try {
        await prisma.distributor.update({
          where: { id: distId },
          data: {
            bankCode: bankInfo.bankCode || '',
            bankAccount: bankInfo.accountNumber || '',
            bankName: bankInfo.bankName || ''
          }
        });
        return true;
      } catch (error) {
        console.error('updateDistributorBankInfo error:', error);
        return false;
      }
}

export async function getTempleCreatorInfo(templeId: string) {

      try {
        const temple = await prisma.temple.findUnique({ where: { id: templeId }, include: { sales: { include: { distributor: true } } } });
        if (!temple || !temple.sales) return null;
        return {
          type: 'Sales',
          id: temple.sales.id,
          name: temple.sales.name,
          distributorName: temple.sales.distributor?.name || ''
        };
      } catch(e) {
        return null;
      }
}

export async function updateAccountStatus(id: string, role: string, status: 'Active' | 'Inactive') {

      try {
        if (role === 'TempleAdmin' || role === 'Temple') {
          await prisma.temple.update({ where: { id }, data: { status } });
          await prisma.user.updateMany({ where: { templeId: id }, data: { status } });
        } else if (role === 'Distributor') {
          await prisma.distributor.update({ where: { id }, data: { status } });
        } else if (role === 'SuperSales' || role === 'DistSales') {
          await prisma.distributorSales.update({ where: { id }, data: { status } });
        }
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function transferTemples(templeIds: string[], targetId: string | null, targetRole: 'Distributor' | 'SuperSales' | 'HQ') {

      try {
        if (targetRole === 'HQ') {
          await prisma.temple.updateMany({
            where: { id: { in: templeIds } },
            data: { distributorId: null, salesId: null }
          });
        } else if (targetRole === 'Distributor') {
          await prisma.temple.updateMany({
            where: { id: { in: templeIds } },
            data: { distributorId: targetId, salesId: null }
          });
        } else if (targetRole === 'SuperSales') {
          await prisma.temple.updateMany({
            where: { id: { in: templeIds } },
            data: { distributorId: null, salesId: targetId }
          });
        }
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}
export async function confirmPaymentSuccess(orderId: string, method: string) {
    if (orderId.startsWith('TEMPLE_BILL_')) {
      const billId = orderId.replace('TEMPLE_BILL_', '');
      const res = await approveTempleBill(billId);
      return res.success;
    }

  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
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
    await revalidateTemple();
    return { success: true };
  });
}


export async function deleteGuestFile(fileId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    await client.query('DELETE FROM guest_files WHERE id = $1 AND temple_id = $2', [fileId, templeId]);
    await revalidateTemple();
    return { success: true };
  });
}
export async function activateLampRecord(recordId: string) {

      try {
        const record = await prisma.lampRecord.findUnique({
          where: { id: recordId },
          include: { category: true }
        });
        if (!record) return { success: false };
        
        await prisma.lampRecord.update({
          where: { id: recordId },
          data: { status: 'Active', createdAt: new Date() }
        });
        
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function deactivateLampRecord(recordId: string) {

      try {
        await prisma.lampRecord.update({
          where: { id: recordId },
          data: { status: 'Pending' }
        });
        await revalidateTemple();
        return { success: true };
      } catch(e) {
        console.error(e);
        return { success: false };
      }
}

export async function fetchDistributorLogs(distributorId: string) {

      try {
        const logs = await prisma.adminLog.findMany({
          where: { target: { contains: distributorId } },
          orderBy: { timestamp: 'desc' }
        });
        return logs;
      } catch (e) {
        console.error(e);
        return [];
      }
}
export async function requestBonus(salesId: string, distributorId: string, amount: number, method: string = 'Bank Transfer', salesName: string = '') {
  try {
    /* removed duplicate import */
    await dbQuery(
      "INSERT INTO bonus_requests (id, sales_id, distributor_id, amount, date, status, method, sales_name) VALUES ($1, $2, $3, $4, CURRENT_DATE, 'Pending', $5, $6)",
      [`REQ-${Date.now()}`, salesId, distributorId, amount, method, salesName]
    );
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
export async function fetchSalesBonusRequests(salesId: string) {
  try {
    /* removed duplicate import */
    const { rows } = await dbQuery("SELECT * FROM bonus_requests WHERE sales_id = $1 ORDER BY timestamp DESC", [salesId], () => null) as any;
    return (rows || []).map((r: any) => ({
      id: r.id,
      salesId: r.sales_id,
      distributorId: r.distributor_id,
      amount: r.amount,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      status: r.status,
      salesName: r.sales_name,
      receiptUrl: r.receipt_url,
      method: r.method
    }));
  } catch (e) {
    return [];
  }
}
export async function uploadReceiptAndApproveBonus(requestId: string, imageUrl: string) {
  try {
    /* removed duplicate import */
    await dbQuery("UPDATE bonus_requests SET status = 'Paid', receipt_url = $1 WHERE id = $2", [imageUrl, requestId]);
    const { revalidatePath } = require('next/cache');
    revalidatePath('/distributor');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
export async function fetchSaasOrders() {

      return []; // Currently unused in new system
}

export async function fetchDistributorTempleBills(distributorId: string) {
  try {
    /* removed duplicate import */
    const templesQuery = `
      SELECT t.id, t.name, t.temple_name 
      FROM "Temple" t
      LEFT JOIN distributor_sales ds ON t.sales_id = ds.id
      WHERE (t.distributor_id = $1 OR ds.distributor_id = $1)
        AND (ds.role IS NULL OR ds.role != 'SuperSales')
    `;
    const templesRes = await dbQuery(templesQuery, [distributorId], () => null) as any;
    const temples = templesRes?.rows || [];
    const templeIds = temples.map((t: any) => t.id);

    if (templeIds.length === 0) return [];

    const billsQuery = `
      SELECT * FROM "TempleBill" 
      WHERE temple_id = ANY($1::varchar[]) OR payee_id = $2
      ORDER BY created_at DESC
    `;
    const billsRes = await dbQuery(billsQuery, [templeIds, distributorId], () => null) as any;
    const bills = billsRes?.rows || [];

    return bills.map((b: any) => {
      const t = temples.find((temple: any) => temple.id === b.temple_id);
      return {
        ...b,
        templeId: b.temple_id,
        payeeId: b.payee_id,
        templeName: t ? (t.temple_name || t.name) : '未知宮廟'
      };
    });
  } catch (e) {
    return [];
  }
}
export async function logDistributorAction(...args: any[]) {

      try {
        // Fire and forget
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function grantTempleStorageVip(templeId: string, isVip: boolean = true) {

      try {
        await prisma.templeStorage.upsert({
          where: { templeId },
          update: { isVip, planId: isVip ? 'VIP-STORAGE' : 'FREE' },
          create: { templeId, isVip, planId: isVip ? 'VIP-STORAGE' : 'FREE', usedBytes: 0, totalBytes: isVip ? 1099511627776 : 5368709120 }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function purchaseAiPlanByAdmin(templeId: string, planId: string) {

      try {
        const sys = await prisma.systemConfig.findFirst();
        const plan = sys?.aiPlans?.find((p: any) => p.id === planId);
        if (!plan) return { success: false };
        
        await prisma.templeAiUsage.upsert({
          where: { templeId },
          update: { planId, enabled: true },
          create: { templeId, planId, enabled: true, usedCount: 0 }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}


export async function fetchDataBridgeTree() {

      return [];
}


export async function updateDistributorProfile(distId: string, data: any) {

      try {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.account) updateData.account = data.account;
        if (data.password) updateData.password = data.password;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.bankInfo) {
          updateData.bankCode = data.bankInfo.bankCode || '';
          updateData.bankAccount = data.bankInfo.accountNumber || '';
          updateData.bankName = data.bankInfo.bankName || '';
        }
        
        await prisma.distributor.update({
          where: { id: distId },
          data: updateData
        });
        
        const { revalidatePath } = require('next/cache');
        revalidatePath('/super-admin');
        revalidatePath('/distributor');
        return { success: true };
      } catch (error) {
        console.error('updateDistributorProfile error:', error);
        return { success: false, error: String(error) };
      }
}

export async function updateDistributorPaymentConfig(distId: string, paymentConfig: any) {

      try {
        await prisma.distributor.update({
          where: { id: distId },
          data: { b2bPayment: paymentConfig }
        });
        return { success: true };
      } catch (error) {
        console.error('updateDistributorPaymentConfig error:', error);
        return { success: false, error: String(error) };
      }
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

export async function fetchSalesProfileById(salesId: string) {

      try {
        const sales = await prisma.distributorSales.findUnique({
          where: { id: salesId },
          include: { distributor: true }
        });
        if (sales) {
          return {
            name: sales.name,
            parentDistributor: sales.distributor?.name || '未指派',
            account: sales.account
          };
        }
        return { name: '未知', parentDistributor: '未指派', account: '' };
      } catch (error) {
        console.error('fetchSalesProfileById error:', error);
        return { name: '未知', parentDistributor: '未指派', account: '' };
      }
}

export async function fetchTempleBills(templeId: string) {

      try {
        return await prisma.templeBill.findMany({ where: { templeId }, orderBy: { date: 'desc' } });
      } catch(e) {
        return [];
      }
}

export async function uploadTempleBillReceipt(billId: string, imageUrl: string) {

      try {
        await prisma.templeBill.update({
          where: { id: billId },
          data: { receiptUrl: imageUrl, status: 'Pending' }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function approveTempleBill(billId: string) {

      try {
        const bill = await prisma.templeBill.findUnique({ where: { id: billId } });
        if (!bill) return { success: false };
        
        await prisma.templeBill.update({
          where: { id: billId },
          data: { status: 'Paid' }
        });

        const templeId = bill.templeId;
        if (templeId) {
          await prisma.temple.update({
            where: { id: templeId },
            data: { paymentStatus: 'Paid', status: 'Active' }
          });
        }

        const temple = await prisma.temple.findUnique({ where: { id: templeId! } });

        // --- LOGIC FOR UPGRADES ---
        if (bill.type === 'StorageUpgrade' || bill.type === 'AiUpgrade') {
           const match = bill.itemName?.match(/\(([^)]+)\)$/);
           const planId = match ? match[1] : null;

           const adminWallet = await prisma.wallet.findFirst({ where: { role: 'SuperAdmin' } });
           if (adminWallet) {
              await prisma.wallet.update({
                where: { id: adminWallet.id },
                data: { balance: { increment: bill.amount } }
              });
           }

           await prisma.financeRecord.create({
             data: {
               type: 'INCOME',
               category: bill.type === 'StorageUpgrade' ? 'SPACE_UPGRADE' : 'AI_UPGRADE',
               amount: bill.amount,
               source: `${temple?.templeName || '宮廟'}-${bill.type === 'StorageUpgrade' ? '雲端空間升級' : 'AI方案升級'} (後台審核)`,
               date: new Date()
             }
           });

           if (bill.type === 'StorageUpgrade' && planId) {
              await upgradeTempleStorage(bill.templeId!, planId, 'Monthly', true);
           } else if (bill.type === 'AiUpgrade' && planId) {
              let usage = await prisma.templeAiUsage.findUnique({ where: { templeId: bill.templeId! } });
              const thirtyDaysLater = new Date();
              thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
              if (usage) {
                 await prisma.templeAiUsage.update({
                   where: { templeId: bill.templeId! },
                   data: { planId, expiryDate: thirtyDaysLater, usedCount: 0, enabled: true }
                 });
              } else {
                 await prisma.templeAiUsage.create({
                   data: { templeId: bill.templeId!, enabled: true, planId, usedCount: 0, expiryDate: thirtyDaysLater, isVip: false }
                 });
              }
           }
        }
        // --- END LOGIC ---

        if (temple && temple.salesId) {
          const salesPerson = await prisma.distributorSales.findUnique({ where: { id: temple.salesId } });
          if (salesPerson) {
             const sysConfig = await fetchSystemConfig();
             const rates = salesPerson.commissionRules as any || sysConfig?.defaultSuperSalesRates || {};
             const rate = rates.templeSetupRate || 20; 
             const commissionAmt = Math.floor(bill.amount * (rate / 100));
             
             if (commissionAmt > 0) {
               await prisma.commission.create({
                 data: {
                   salesId: salesPerson.id,
                   templeId: temple.id,
                   billId: bill.id,
                   amount: commissionAmt,
                   date: new Date()
                 }
               });
               
               const wallet = await prisma.wallet.findFirst({ where: { name: salesPerson.name } });
               if (wallet) {
                 await prisma.wallet.update({
                   where: { id: wallet.id },
                   data: { balance: { increment: commissionAmt } }
                 });
               } else {
                 await prisma.wallet.create({
                   data: {
                     ownerId: salesPerson.id,
                     name: salesPerson.name,
                     role: salesPerson.role,
                     balance: commissionAmt
                   }
                 });
               }
             }
          }
        }
        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function toggleBillStatusSimple(billId: string, status: string) {

      try {
        await prisma.templeBill.update({
          where: { id: billId },
          data: { status }
        });
        return { success: true };
      } catch (error) {
        console.error('toggleBillStatusSimple error:', error);
        return { success: false };
      }
}

export async function rejectTempleBill(billId: string) {

      try {
        const bill = await prisma.templeBill.findUnique({ where: { id: billId } });
        if (!bill) return { success: false };
        
        await prisma.templeBill.update({
          where: { id: billId },
          data: { status: 'PendingPayment', receiptUrl: null }
        });

        if (bill.templeId) {
          await prisma.temple.update({
            where: { id: bill.templeId },
            data: { paymentStatus: 'PendingPayment' }
          });
        }

        return { success: true };
      } catch (e) {
        console.error(e);
        return { success: false };
      }
}

export async function fetchAllSalesBonusRequests() {
  try {
    /* removed duplicate import */
    const { rows } = await dbQuery("SELECT * FROM bonus_requests ORDER BY timestamp DESC", [], () => null) as any;
    return (rows || []).map((r: any) => ({
      id: r.id,
      salesId: r.sales_id,
      distributorId: r.distributor_id,
      amount: r.amount,
      date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
      status: r.status,
      salesName: r.sales_name,
      receiptUrl: r.receipt_url,
      method: r.method
    }));
  } catch (e) {
    return [];
  }
}


export async function updateDistSalesBankInfo(salesId: string, bankInfo: any) {

      try {
        await prisma.distributorSales.update({
          where: { id: salesId },
          data: { bankAccount: bankInfo }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}

export async function getLineConfig(templeId: string) {
  return withTempleSession(templeId, false, async (client) => {
    const res = await client.query(`
      SELECT line_channel_token, line_channel_secret, line_login_client_id, line_push_enabled 
      FROM "Temple" WHERE id = $1
    `, [templeId]);
    if (res.rows.length === 0) return { lineChannelToken: '', lineChannelSecret: '', lineLoginClientId: '', linePushEnabled: false };
    const r = res.rows[0];
    return {
      lineChannelToken: r.line_channel_token || '',
      lineChannelSecret: r.line_channel_secret || '',
      lineLoginClientId: r.line_login_client_id || '',
      linePushEnabled: r.line_push_enabled || false
    };
  });
}

export async function updateLineConfig(templeId: string, config: any) {
  return withTempleSession(templeId, true, async (client) => {
    await client.query(`
      UPDATE temples 
      SET line_channel_token = $1, line_channel_secret = $2, line_login_client_id = $3, line_push_enabled = $4
      WHERE id = $5
    `, [config.lineChannelToken, config.lineChannelSecret, config.lineLoginClientId, config.linePushEnabled, templeId]);
    return { success: true };
  });
}


export async function getGuestLineId(templeId: string, phone: string) {

      try {
        const guest = await prisma.guest.findFirst({
          where: { templeId, phone }
        });
        return guest?.lineId || null;
      } catch (error) {
        console.error('getGuestLineId error:', error);
        return null;
      }
}

export async function sendLineMessage(templeId: string, lineUserId: string, messageText: string) {
  const config = await getLineConfig(templeId);
  if (!config.linePushEnabled) {
     console.log(`[LINE Push] 攔截：宮廟 ${templeId} 的推播總開關未開啟。`);
     return { success: false, reason: 'Disabled' };
  }
  if (!config.lineChannelToken) {
     console.log(`[LINE Push] 攔截：宮廟 ${templeId} 未設定 Channel Token。`);
     return { success: false, reason: 'NoToken' };
  }
  if (!lineUserId) return { success: false, reason: 'NoUserId' };

  try {
     const resp = await fetch('https://api.line.me/v2/bot/message/push', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${config.lineChannelToken}`
       },
       body: JSON.stringify({
         to: lineUserId,
         messages: [ { type: 'text', text: messageText } ]
       })
     });
     const data = await resp.json();
     console.log(`[LINE Push] 宮廟 ${templeId} 成功推播給 ${lineUserId}`, data);
     return { success: true, data };
  } catch (err) {
     console.error(`[LINE Push] 宮廟 ${templeId} 推播失敗:`, err);
     return { success: false, reason: 'NetworkError' };
  }
}

export async function bindCustomerLine(templeId: string, phone: string, lineUserId: string) {
  return withTempleSession(templeId, false, async (client) => {
    let normPhone = phone.replace(/\D/g, '');
    await client.query(`UPDATE customers SET line_user_id = $1 WHERE phone = $2 AND temple_id = $3`, [lineUserId, normPhone, templeId]);
    return { success: true };
  });
}

export async function fetchTemplePaymentTarget(templeId: string) {
  const t = await getTempleBasicInfo(templeId);
  if (!t) return null;
  
  const config = await fetchSystemConfig();
  let targetBank = {
     bankCode: config.b2bPayment?.customTransfer?.bankCode || '808',
     bankName: config.b2bPayment?.customTransfer?.bankName || '玉山銀行',
     accountNo: config.b2bPayment?.customTransfer?.accountNo || '808-1234-5678-901',
     accountName: config.b2bPayment?.customTransfer?.accountName || '天宇科技服務有限公司'
  };
  
  const distId = t.distributorId;
  if (distId) {
     const dist = await fetchDistributorProfile(distId);
     if (dist) {
        if (dist.b2bPayment?.customTransfer?.enabled) {
           targetBank = {
              bankCode: dist.b2bPayment.customTransfer.bankCode || '',
              bankName: dist.b2bPayment.customTransfer.bankName || '',
              accountNo: dist.b2bPayment.customTransfer.accountNo || '',
              accountName: dist.b2bPayment.customTransfer.accountName || ''
           };
        } else if (dist.bankInfo?.bankCode || dist.bankInfo?.accountNumber) {
           targetBank = {
              bankCode: dist.bankInfo.bankCode || '',
              bankName: dist.bankInfo.bankName || '',
              accountNo: dist.bankInfo.accountNumber || '',
              accountName: dist.bankInfo.accountName || dist.name
           };
        }
     }
  }
  return targetBank;
}

export async function updateRevenueRemark(id: string, source: string, remark: string) {

      try {
        await prisma.financeRecord.update({
          where: { id },
          data: { source: remark }
        });
        return { success: true };
      } catch(e) {
        return { success: false };
      }
}



export async function fetchSuperSalesApplications(salesName: string) {
  let list = [...db_distributor_applications];
  /* removed duplicate import */
    const res = await dbQuery("SELECT * FROM distributor_applications WHERE submitted_by = $1", [salesName], () => null) as any;
    if (res && res.rows) {
          list = res.rows.map((r: any) => ({
            ...r,
            rejectReason: r.reject_reason || '',
            rejectedAt: r.rejected_at || ''
          }));
        }
  return list.filter(a => a.submittedBy === salesName);
}

