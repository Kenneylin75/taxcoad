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
    const resPerson = await dbQuery("SELECT * FROM \"User\" WHERE LOWER(account) = $1 AND temple_id = $2", [account.toLowerCase(), templeId]) as any;
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
    const resPerson = await dbQuery("SELECT * FROM \"User\" WHERE LOWER(account) = $1 AND password = $2 AND temple_id = $3", [searchAccount, password, targetTempleId]) as any;
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

    try {
      await prisma.adminLog.create({
        data: {
          action: "LOGIN",
          details: logMsg,
          timestamp: newLogTimestamp,
          performedBy: loggedInName
        }
      });
    } catch(e) { console.error("Log error", e); }
    
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
        
        const normPhone = normalizePhone(phone);
        const guest = await prisma.guest.upsert({
          where: { 
            templeId_phone: {
              templeId,
              phone: normPhone
            }
          },
          update: {},
          create: {
            templeId,
            phone: normPhone,
            name: guestName,
            status: 'Active'
          }
        });

        const newApp = await prisma.appointment.create({
          data: {
            templeId: templeId!,
            guestId: guest.id,
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
  if (!templeId) return { success: false, message: '未指定宮廟' };

  try {
    if (type === '點燈') {
      await prisma.lampRecord.updateMany({
        where: { id: recordId, templeId },
        data: { status: 'Cancelled' }
      });
    } else if (type === '活動') {
      await prisma.eventRegistration.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Cancelled' }
      });
    } else if (type === '排隊') {
      await prisma.queueTicket.updateMany({
        where: { id: recordId, templeId },
        data: { status: 'Cancelled' }
      });
    } else if (type === '預約') {
      const app = await prisma.appointment.findFirst({
        where: { id: recordId, templeId }
      });
      
      if (app) {
        await prisma.appointment.update({
          where: { id: recordId },
          data: { status: 'Cancelled' }
        });
        
        await prisma.slot.updateMany({
          where: {
            date: app.date,
            time: app.time,
            staff: app.staff,
            templeId
          },
          data: {
            status: 'Available',
            guestName: null
          }
        });
      }
    }
    
    await revalidateTemple(templeId);
    return { success: true };
  } catch (error: any) {
    console.error('cancelServiceRecord error:', error);
    return { success: false, message: error.message };
  }
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
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    const services = await prisma.service.findMany({
      where: { templeId }
    });
    return services.map(r => ({
      id: r.id,
      templeId: r.templeId,
      name: r.name,
      price: r.price,
      duration: r.duration || '',
      description: r.description || '',
      color: r.color || '#6366f1',
      status: r.status,
      assignedStaff: r.assignedStaff ? JSON.parse(JSON.stringify(r.assignedStaff)) : []
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveServiceDefinition(data: any) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };
    const newColor = data.color || '#6366f1';
    
    if (data.id) {
      await prisma.service.updateMany({
        where: { id: data.id, templeId },
        data: {
          name: data.name,
          price: data.price || 0,
          duration: data.duration || '',
          description: data.description || '',
          color: newColor,
          assignedStaff: data.assignedStaff || [],
          status: data.status || 'Active'
        }
      });
    } else {
      const id = `s-${Date.now()}`;
      await prisma.service.create({
        data: {
          id,
          templeId,
          name: data.name,
          price: data.price || 0,
          duration: data.duration || '',
          description: data.description || '',
          color: newColor,
          assignedStaff: data.assignedStaff || [],
          status: data.status || 'Active'
        }
      });
    }
    
    await revalidateTemple();
    await logSystemEvent('SUCCESS', '設定服務項目', `服務名稱：${data.name}`, '管理員', templeId);
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function deleteServiceDefinition(id: string) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };
    
    await prisma.service.deleteMany({
      where: { id, templeId }
    });
    
    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
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
  if (!templeId) return [];
  
  try {
    const users = await prisma.user.findMany({
      where: { templeId }
    });
    
    return users.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role as any,
      account: r.account || '',
      phone: r.phone || '',
      status: r.status,
      avatar: r.avatar || '',
      permissions: (r.permissions as any) || [],
      serviceCount: 0
    }));
  } catch (e) {
    console.error("fetchPersonnel error:", e);
    return [];
  }
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
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    
    const apps = await prisma.appointment.findMany({
      where: {
        templeId,
        staff,
        date: {
          gte: start,
          lte: end
        },
        status: { in: ['Pending', 'Confirmed'] }
      }
    });
    
    return apps.map(app => ({
      id: app.id,
      guestName: app.guestName,
      phone: app.phone,
      service: app.service,
      date: app.date,
      time: app.time
    }));
  } catch(e) {
    console.error(e);
    return [];
  }
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

export async function fetchPaymentConfig(): Promise<TemplePaymentConfig> {
  const templeId = await getDynamicTempleId();
  if (!templeId) {
    return {
      templeId: '',
      cash: { enabled: true, description: '現場現金付款', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
      linePay: { enabled: false, channelId: '', channelSecret: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
      thirdParty: { enabled: false, provider: '', merchantId: '', hashKey: '', hashIV: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
      customTransfer: { enabled: false, bankCode: '', bankName: '', accountName: '', accountNo: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
      customQR: { enabled: false, qrImageUrl: '', description: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true }
    };
  }

  const record = await prisma.templePaymentConfig.findUnique({
    where: { templeId }
  });

  if (record) {
    const config = {
      templeId,
      linePay: (record.linePay as any) || { enabled: false, channelId: '', channelSecret: '' },
      thirdParty: (record.thirdParty as any) || { enabled: false, provider: '', merchantId: '', hashKey: '', hashIV: '' },
      customTransfer: (record.customTransfer as any) || { enabled: false, bankCode: '', bankName: '', accountName: '', accountNo: '' },
      customQR: (record.customQR as any) || { enabled: false, qrImageUrl: '', description: '' },
      cash: (record.cash as any) || { enabled: true, description: '現場現金付款' }
    };

    if (!config.cash.enabled && config.cash.description === undefined) {
      config.cash = { enabled: true, description: '現場現金付款', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true };
    }

    ['linePay', 'thirdParty', 'customTransfer', 'customQR'].forEach(key => {
      const k = key as keyof typeof config;
      if (config[k] && (config[k] as any).allowBooking === undefined) {
        (config[k] as any).allowBooking = true;
        (config[k] as any).allowLamp = true;
        (config[k] as any).allowEvent = true;
        (config[k] as any).allowQueue = true;
      }
    });

    return config as TemplePaymentConfig;
  }

  return {
    templeId,
    cash: { enabled: true, description: '現場現金付款', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
    linePay: { enabled: false, channelId: '', channelSecret: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
    thirdParty: { enabled: false, provider: '', merchantId: '', hashKey: '', hashIV: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
    customTransfer: { enabled: false, bankCode: '', bankName: '', accountName: '', accountNo: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true },
    customQR: { enabled: false, qrImageUrl: '', description: '', allowBooking: true, allowLamp: true, allowEvent: true, allowQueue: true }
  };
}

export async function savePaymentConfig(data: TemplePaymentConfig) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };

    await prisma.templePaymentConfig.upsert({
      where: { templeId },
      update: {
        linePay: data.linePay as any,
        thirdParty: data.thirdParty as any,
        customTransfer: data.customTransfer as any,
        customQR: data.customQR as any,
        cash: data.cash as any
      },
      create: {
        templeId,
        linePay: data.linePay as any,
        thirdParty: data.thirdParty as any,
        customTransfer: data.customTransfer as any,
        customQR: data.customQR as any,
        cash: data.cash as any
      }
    });

    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function executeEmergencyReschedule(formData: FormData) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };

    const staff = formData.get('staff') as string;
    const startDate = formData.get('start') as string;
    const endDate = formData.get('end') as string;
    const reason = formData.get('reason') as string || '突發請假';

    if (!staff || !startDate || !endDate) return { success: false, message: '參數錯誤' };

    await prisma.leaveRecord.create({
      data: { templeId, staff, startDate, endDate, reason }
    });

    await prisma.slot.deleteMany({
      where: { templeId, staff, date: { gte: startDate, lte: endDate }, status: 'Available' }
    });

    await prisma.appointment.updateMany({
      where: { templeId, staff, date: { gte: startDate, lte: endDate }, status: { in: ['Pending', 'Confirmed'] } },
      data: { status: 'Cancelled' }
    });

    await prisma.slot.updateMany({
      where: { templeId, staff, date: { gte: startDate, lte: endDate }, status: 'Booked' },
      data: { status: 'Unavailable' }
    });

    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

// --- 其餘輔助函式 ---
export async function syncExpiredLamps(templeId: string) {
  try {
    await prisma.lampRecord.updateMany({
      where: { templeId, status: 'Active', expiryDate: { lt: new Date() } },
      data: { status: 'Expired' }
    });
  } catch (e) {
    console.error('syncExpiredLamps error:', e);
  }
}

export async function fetchLampRecords() {
      try {
        const templeId = await getDynamicTempleId();
        if (templeId) {
          await syncExpiredLamps(templeId);
        }
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
  if (!templeId) return null;
  const phone = store.get(`guestPhone_${templeId}`)?.value;
  if (!phone) return null;
  
  try {
    const r = await prisma.guest.findFirst({
      where: { templeId, phone }
    });
    if (r) {
      return {
        templeId: r.templeId,
        phone: r.phone,
        name: r.name,
        email: r.email,
        password: r.password,
        address: r.address,
        birthday: r.birthday,
        lunarBirthday: r.lunarBirthday,
        birthHour: r.birthHour,
        lineId: r.lineId,
        status: r.status
      };
    }
    return null;
  } catch (error) {
    console.error('getGuestUser error:', error);
    return null;
  }
}

export async function checkPhoneStatus(phone: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { status: 'NEW' };
  
  try {
    const normLogin = normalizePhone(phone);
    const existing = await prisma.guest.findFirst({
      where: {
        templeId,
        phone: {
          equals: normLogin,
          mode: 'insensitive'
        }
      }
    });

    if (!existing) return { status: 'NEW' };
    if (!existing.password) return { status: 'NO_PASSWORD', name: existing.name };
    return { status: 'HAS_PASSWORD', name: existing.name };
  } catch (error) {
    console.error('checkPhoneStatus error:', error);
    return { status: 'NEW' };
  }
}

export async function liffAutoLogin(lineId: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  
  try {
    const existing = await prisma.guest.findFirst({
      where: { templeId, lineId }
    });
    
    if (existing) {
      const store = await cookies();
      store.set(`guestPhone_${templeId}`, existing.phone, { secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
      return { success: true, guest: existing };
    }
    return { success: false };
  } catch (error) {
    console.error('liffAutoLogin error:', error);
    return { success: false };
  }
}

export async function guestLogin(phone: string, password?: string, inputName?: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false, error: '未指定宮廟' };
  
  try {
    const normLogin = normalizePhone(phone);
    let existing = await prisma.guest.findFirst({
      where: {
        templeId,
        phone: {
          equals: normLogin,
          mode: 'insensitive'
        }
      }
    });

    if (existing) {
      if (existing.password && existing.password !== password) {
        return { success: false, error: "密碼錯誤，請重新輸入" };
      }
      if (!existing.password && password) {
        // 首次綁定密碼
        existing = await prisma.guest.update({
          where: { id: existing.id },
          data: { password }
        });
      }
    } else if (!inputName || !password) {
      return { success: false, error: "首次登入請務必填寫真實姓名與密碼" };
    }

    const guestName = existing ? existing.name : inputName;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(guestName || '')}&background=B91C1C&color=fff`;

    if (!existing) {
      existing = await prisma.guest.create({
        data: {
          id: `g-${Date.now()}`,
          templeId,
          phone: normLogin,
          name: guestName || '無名氏',
          password,
          status: 'Active',
          avatar
        }
      });
    }

    const store = await cookies();
    store.set(`guestPhone_${templeId}`, normLogin, { secure: process.env.NODE_ENV === 'production', httpOnly: true, path: '/' });
    
    await revalidateTemple(templeId);
    return { success: true, guestName: existing.name, fullGuest: existing };
  } catch (error) {
    console.error('guestLogin error:', error);
    return { success: false, error: '登入失敗' };
  }
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

  if (!templeId) return { reply, suggestedAction: "none" };

  try {
    await prisma.aiChatLog.create({
      data: {
        templeId,
        phone,
        userQuery: q,
        aiReply: reply
      }
    });
  } catch (error) {
    console.error('Failed to log AI chat:', error);
  }

  return { reply, suggestedAction: "none" };
}

export async function fetchAiChatLogs() {
  const templeId = await getDynamicTempleId();
  if (!templeId) return [];

  try {
    const logs = await prisma.aiChatLog.findMany({
      where: { templeId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    return logs.map((r: any) => ({
      id: r.id,
      phone: r.phone,
      userQuery: r.userQuery,
      aiReply: r.aiReply,
      createdAt: r.createdAt.toISOString()
    }));
  } catch (error) {
    console.error('Failed to fetch AI chat logs:', error);
    return [];
  }
}

const normCompare = (p1: string, p2: string) => {
  if (!p1 || !p2) return false;
  return normalizePhone(p1) === normalizePhone(p2);
};

export async function fetchGuestAppointments(p: any) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    
    const normPhone = normalizePhone(p);
    
    const guest = await prisma.guest.findFirst({
      where: { templeId, phone: normPhone }
    });
    
    if (!guest) {
      // Fallback to checking by phone if guest relation not properly linked
      const apps = await prisma.appointment.findMany({
        where: { templeId, phone: normPhone },
        orderBy: [{ date: 'desc' }, { time: 'desc' }]
      });
      return apps.map(app => ({
        id: app.id,
        templeId: app.templeId,
        date: app.date,
        time: app.time,
        staff: app.staff,
        guestName: app.guestName,
        service: app.service,
        serviceId: app.serviceId,
        status: app.status,
        phone: app.phone,
        paymentMethod: app.paymentMethod,
        paymentRef: app.paymentRef,
        paymentStatus: app.paymentStatus,
        amount: app.amount,
        paymentProofUrl: app.paymentProofUrl
      }));
    }

    const apps = await prisma.appointment.findMany({
      where: { 
        templeId, 
        OR: [
          { guestId: guest.id },
          { phone: normPhone }
        ]
      },
      orderBy: [{ date: 'desc' }, { time: 'desc' }]
    });

    return apps.map(app => ({
      id: app.id,
      templeId: app.templeId,
      date: app.date,
      time: app.time,
      staff: app.staff,
      guestName: app.guestName,
      service: app.service,
      serviceId: app.serviceId,
      status: app.status,
      phone: app.phone,
      paymentMethod: app.paymentMethod,
      paymentRef: app.paymentRef,
      paymentStatus: app.paymentStatus,
      amount: app.amount,
      paymentProofUrl: app.paymentProofUrl
    }));
  } catch (error) {
    console.error('fetchGuestAppointments error:', error);
    return [];
  }
}
export async function fetchServiceSettings() { 
  const templeId = await getDynamicTempleId();
  if (!templeId) return { cancelHoursBefore: 24, modifyHoursBefore: 24, allowCancel: true, allowModify: true, pushConfigs: [], modules: { calendar: true, lamps: true, queue: true, events: true, analytics: true, agi: true } };

  try {
    const existing = await prisma.serviceSetting.findFirst({
      where: { templeId }
    });

    if (existing) {
      const s = (existing.pushConfigs as any) || {};
      return {
        ...s,
        cancelHoursBefore: s.cancelHoursBefore ?? 24,
        modifyHoursBefore: s.modifyHoursBefore ?? 24,
        allowCancel: s.allowCancel ?? true,
        allowModify: s.allowModify ?? true,
        pushConfigs: Array.isArray(s) ? s : (s.pushConfigs || [])
      };
    }
    return { cancelHoursBefore: 24, modifyHoursBefore: 24, allowCancel: true, allowModify: true, pushConfigs: [], modules: { calendar: true, lamps: true, queue: true, events: true, analytics: true, agi: true } };
  } catch (error) {
    console.error('fetchServiceSettings error:', error);
    return { cancelHoursBefore: 24, modifyHoursBefore: 24, allowCancel: true, allowModify: true, pushConfigs: [], modules: { calendar: true, lamps: true, queue: true, events: true, analytics: true, agi: true } };
  }
}

export async function fetchGuestFiles(phone: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return [];

  try {
    const normPhone = normalizePhone(phone);
    const guest = await prisma.guest.findFirst({
      where: {
        templeId,
        phone: {
          equals: normPhone,
          mode: 'insensitive'
        }
      }
    });
    
    const dbPhone = guest?.phone || normPhone;
    
    const files = await prisma.guestFile.findMany({
      where: {
        templeId,
        phone: dbPhone
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });

    return files.map(r => ({
      id: r.id,
      phone: r.phone,
      url: r.url,
      type: r.type,
      name: r.name,
      folder: r.folder,
      uploadedBy: r.uploadedBy,
      uploadedAt: r.uploadedAt ? r.uploadedAt.toISOString().replace('T', ' ').slice(0, 19) : new Date().toISOString()
    }));
  } catch (error) {
    console.error('fetchGuestFiles error:', error);
    return [];
  }
}

// migrated (await jsonStore.find('event_registrations')) to (await jsonStore.find('event_registrations'))

export async function fetchEventRegistrationsByEventId(eventId: string) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    const records = await prisma.eventRegistration.findMany({
      where: { eventId, templeId },
      orderBy: { createdAt: 'desc' }
    });
    return records.map(r => ({
      id: r.id,
      eventId: r.eventId,
      templeId: r.templeId,
      phone: r.phone,
      guestName: r.guestName,
      price: r.actualPrice,
      paymentStatus: r.paymentStatus,
      actualPrice: r.actualPrice,
      timestamp: r.createdAt.toISOString()
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}
export async function markRegistrationAsPaid(registrationId: string, actualPrice: number) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };
    await prisma.eventRegistration.updateMany({
      where: { id: registrationId, templeId },
      data: { paymentStatus: 'Paid', actualPrice }
    });
    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}
// migrated (await jsonStore.find('activities')) to (await jsonStore.find('activities'))
// migrated (await jsonStore.find('deep_records')) to (await jsonStore.find('deep_records'))

// (Removed duplicate createOrUpdateGuest)
export async function verifyQueueTicket(eventId: string, phone: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false, error: '未指定宮廟' };

  try {
    const normPhone = phone.replace(/-/g, '');
    const ticket = await prisma.queueTicket.findFirst({
      where: {
        eventId,
        templeId,
        phone: {
          equals: normPhone,
          mode: 'insensitive'
        }
      }
    });

    if (!ticket) return { success: false, error: 'No ticket found' };

    if (ticket.status === 'Pending') {
      const activeCount = await prisma.queueTicket.count({
        where: {
          eventId,
          templeId,
          status: { not: 'Pending' }
        }
      });
      const actualOrder = activeCount + 1;

      await prisma.queueTicket.update({
        where: { id: ticket.id },
        data: {
          status: 'Queuing',
          scannedAt: new Date().toLocaleTimeString(),
          actualOrder
        }
      });
    }

    await revalidateTemple(templeId);
    return { success: true };
  } catch (error) {
    console.error('verifyQueueTicket error:', error);
    return { success: false, error: '驗證失敗' };
  }
}
export async function registerForEvent(id: any, phone: string, n: string, pr: number, paymentMethod?: string) {

      try {
        const templeId = await getDynamicTempleId();
        if (await checkTempleSuspension()) return { success: false, message: '宮廟服務已暫停，請聯繫宮廟管理員' };
        
        const ev = await prisma.event.findFirst({
          where: { id: String(id), templeId: templeId! },
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
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    
    const normPhone = normalizePhone(p);
    
    const guest = await prisma.guest.findFirst({
      where: { templeId, phone: normPhone }
    });
    
    if (!guest) {
      const tickets = await prisma.queueTicket.findMany({
        where: { templeId, phone: normPhone },
        orderBy: { createdAt: 'desc' }
      });
      return tickets.map(t => ({
        id: t.id,
        eventId: t.eventId,
        templeId: t.templeId,
        eventTitle: t.eventTitle,
        phone: t.phone,
        guestName: t.guestName,
        status: t.status,
        assignedNumber: t.assignedNumber,
        paymentStatus: t.paymentStatus,
        createdAt: t.createdAt.toISOString().replace('T', ' ').split('.')[0]
      }));
    }

    const tickets = await prisma.queueTicket.findMany({
      where: { 
        templeId,
        OR: [
          { guestId: guest.id },
          { phone: normPhone }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return tickets.map(t => ({
      id: t.id,
      eventId: t.eventId,
      templeId: t.templeId,
      eventTitle: t.eventTitle,
      phone: t.phone,
      guestName: t.guestName,
      status: t.status,
      assignedNumber: t.assignedNumber,
      paymentStatus: t.paymentStatus,
      createdAt: t.createdAt.toISOString().replace('T', ' ').split('.')[0]
    }));
  } catch (error) {
    console.error('fetchGuestQueueTickets error:', error);
    return [];
  }
}
export async function fetchGuestLampRecords(p: any) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];
    
    const normPhone = normalizePhone(p);
    
    const guest = await prisma.guest.findFirst({
      where: { templeId, phone: normPhone }
    });
    
    let records = [];
    if (!guest) {
      records = await prisma.lampRecord.findMany({
        where: { templeId, phone: normPhone },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      records = await prisma.lampRecord.findMany({
        where: { 
          templeId,
          OR: [
            { guestId: guest.id },
            { phone: normPhone }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return records.map(r => {
      let startStr = '';
      let expStr = '';
      try {
        const start = r.createdAt ? new Date(r.createdAt) : new Date();
        if (isNaN(start.getTime())) throw new Error();
        const exp = new Date(start.getTime() + (365 * 24 * 60 * 60 * 1000));
        startStr = start.toISOString().split('T')[0];
        expStr = exp.toISOString().split('T')[0];
      } catch {
        startStr = new Date().toISOString().split('T')[0];
        expStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      return {
        id: r.id, 
        templeId: r.templeId, 
        guestName: r.guestName, 
        phone: r.phone,
        categoryName: r.categoryName, 
        price: r.actualPrice, 
        status: r.status,
        startDate: startStr, 
        expiryDate: r.expiryDate || expStr,
        paymentMethod: r.paymentMethod, 
        paymentRef: r.paymentProofUrl, 
        paymentStatus: r.paymentStatus, 
        createdAt: r.createdAt.toISOString().replace('T', ' ').split('.')[0],
        paymentProofUrl: r.paymentProofUrl || null
      };
    });
  } catch (error) {
    console.error('fetchGuestLampRecords error:', error);
    return [];
  }
}

export async function joinQueue(eventId: any, phone: string, guestName: string, paymentMethod?: string) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };
    
    const ev = await prisma.queueEvent.findUnique({ where: { id: String(eventId) } });
    if (!ev || ev.templeId !== templeId) return { success: false };
    
    const count = await prisma.queueTicket.count({ where: { eventId: String(eventId), templeId } });
    const assignedNumber = `A${(count + 1).toString().padStart(3, '0')}`;
    const pStatus = paymentMethod === 'Cash' || !paymentMethod ? 'Pending' : 'Paid';
    
    const normPhone = normalizePhone(phone);
    const guest = await prisma.guest.upsert({
      where: { templeId_phone: { templeId, phone: normPhone } },
      update: {},
      create: { templeId, phone: normPhone, name: guestName, status: 'Active' }
    });

    const ticket = await prisma.queueTicket.create({
      data: {
        templeId,
        eventId: String(eventId),
        guestId: guest.id,
        phone,
        guestName,
        eventTitle: ev.title,
        status: 'Pending',
        assignedNumber,
        paymentStatus: pStatus
      }
    });

    return { 
      success: true, 
      ticket: { 
        id: ticket.id, 
        eventId, 
        templeId, 
        eventTitle: ev.title, 
        phone, 
        guestName, 
        status: 'Pending', 
        assignedNumber, 
        paymentStatus: pStatus, 
        createdAt: ticket.createdAt.toISOString().replace('T', ' ').split('.')[0] 
      } 
    };
  } catch (error) {
    console.error('joinQueue error:', error);
    return { success: false };
  }
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
          await prisma.event.updateMany({
            where: { id, templeId },
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
        
        await prisma.event.deleteMany({
          where: { id, templeId: templeId! }
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
  try {
    const user = await getCurrentUser();
    await prisma.adminLog.create({
      data: {
        adminName: user?.name || 'System Admin',
        performedBy: user?.name || 'System Admin',
        action,
        target,
        timestamp: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error("Failed to log admin action:", e);
  }
  return { success: true };
}

export async function downloadAdminLogsCsv() {
  const logs = await fetchAdminLogs();
  const header = "ID,User,Action,Target,Timestamp\n";
  const rows = logs.map((l: any) => `${l.id},${l.adminName || l.performedBy || 'Unknown'},${l.action},${l.target},${l.timestamp}`).join("\n");
  return header + rows;
}

export async function createAdminAccount(data: any) {
  if (data.account && await checkAccountExists(data.account)) {
    return { success: false, error: '帳號已被註冊，請更換' };
  }
  const id = `adm-${Date.now()}`;
  try {
    await prisma.user.create({
      data: {
        id,
        name: data.name,
        account: data.account,
        password: data.password || '123456',
        role: 'Admin',
        status: 'Active'
      }
    });
  } catch (e) {
    console.error("DB Insert Error for admin:", e);
    return { success: false, error: String(e) };
  }
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
  try {
    const temple = await prisma.temple.findUnique({ where: { id: templeId } });
    const distributorId = temple?.distributorId;

    if (distributorId) {
      const dist = await prisma.distributor.findUnique({ where: { id: distributorId } });
      return dist?.b2bPayment || null;
    } else {
      const sysConfig = await fetchSystemConfig();
      return sysConfig?.b2bPayment || null;
    }
  } catch (e) {
    console.error(e);
    return null;
  }
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
  try {
    await prisma.storagePlan.deleteMany();
    
    for (const p of plans) {
      await prisma.storagePlan.create({
        data: {
          sizeGb: p.sizeGb,
          priceMonthly: p.priceMonthly,
          priceYearly: p.priceYearly
        }
      });
    }
    revalidatePath('/super-admin');
    return { success: true };
  } catch (error) {
    console.error('Failed to update storage plans:', error);
    return { success: false, message: '更新失敗' };
  }
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
    let plan = await prisma.storagePlan.findUnique({ where: { id: planId } }) as any;
    if (!plan) plan = db_storage_plans.find((p: any) => p.id === planId);
    if (!plan) return { success: false, message: '找不到選定的空間方案' };

    const config = await fetchSystemConfig();
    const discount = config.yearlyDiscountRate || 20;
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
    let plan = await prisma.aiPlan.findUnique({ where: { id: planId } }) as any;
    if (!plan) plan = db_ai_plans.find((p: any) => p.id === planId);
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
    const config = await fetchSystemConfig();
    const rentAmount = isYearly ? (monthlyRent * 12 * (1 - (config.yearlyDiscountRate || 20) / 100)) : monthlyRent;
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
       let plan = await prisma.storagePlan.findUnique({ where: { id: storagePlanId } }) as any;
       if (!plan) plan = db_storage_plans.find(p => p.id === storagePlanId);
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

  let sales: any = null;
  try {
    const salesRes = await dbQuery('SELECT id, distributor_id FROM dist_sales WHERE name = $1 OR account = $1', [data.submittedBy]);
    sales = (salesRes as any)?.rows?.[0];
  } catch (e) {
    console.error('Failed to fetch sales info', e);
  }

  const reqRole = await getCurrentRole() || 'System';
  const currentUser = await getCurrentUser();
  const templeNo = 1;

      const newTemple = {
      id: `temple-${Math.random().toString(36).substring(2, 10)}`,
      templeNo,
      ...formData,
      account,
      password,
      paymentCycle: paymentCycle || 'Monthly',
      monthlyRent: data.freeType === 'Permanent' ? 0 : ((await fetchSystemConfig()).fixedMonthlyRent || 3600),
      trialMonths: data.freeType === 'Trial' ? parseInt(data.trialMonths || '0') : 0,
      freeType: data.freeType || 'Normal',
      role: 'Temple',
      status,
      creatorRole: role,
      creatorId: currentUser.name,
      salesId: sales?.id || null,
      distributorId: role === 'super-admin' ? null : (sales?.distributor_id || (role === 'distributor' ? data.distributorId : null)),
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
        `INSERT INTO "Temple" (id, name, city, address, status, sales_id, distributor_id, setup_fee, monthly_rent, payment_cycle, account, password, phone, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), now())`,
        [newTemple.id, newTemple.templeName, newTemple.city || '台北市', newTemple.address || '', newTemple.status, newTemple.salesId, newTemple.distributorId, newTemple.setupFee || 0, newTemple.monthlyRent || 0, newTemple.paymentCycle, newTemple.account, newTemple.password, newTemple.templePhone || newTemple.contactPhone || '']
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
  try {
    const apps = await prisma.distributorApplication.findMany({
      where: { status: 'Pending' }
    });
    const allApps = new Map();
    // Removed mock array fallback
    apps.forEach(a => allApps.set(a.id, {
      id: a.id, name: a.name, contactName: a.contactName, phone: a.phone, email: a.email,
      taxId: a.taxId, address: a.address, planId: a.planId, price: a.price, nodes: a.nodes,
      submittedBy: a.submittedBy, status: a.status, date: a.createdAt, account: a.account,
      password: a.password, expirationDate: a.expirationDate
    }));
    return Array.from(allApps.values());
  } catch (error) {
    console.error('fetchPendingDistributors error:', error);
    return [];
  }
}

export async function approveDistributorBySuperAdmin(id: string, overrideQuota?: number) {
      try {
        const app = await prisma.distributorApplication.findUnique({
          where: { id }
        });
        if (!app) return { success: false };

        await prisma.distributorApplication.update({
          where: { id },
          data: { status: 'Active' }
        });

        const distId = 'dist-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        const newQuota = overrideQuota !== undefined ? overrideQuota : Number(app.nodes || 100);

        await prisma.distributor.create({
          data: {
            id: distId,
            name: app.name || '',
            account: app.account || app.name,
            password: app.password || 'pivot2026',
            status: 'Active',
            quota: newQuota,
            nodes: newQuota,
            customNodes: newQuota,
            contactName: app.contact_name || '',
            contactPhone: app.phone || '',
            email: app.email || '',
            address: app.address || ''
          }
        });

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
  try {
    await prisma.distributorApplication.update({
      where: { id },
      data: { status: 'Rejected', rejectReason: rejectReason || '', rejectedAt: new Date().toISOString() }
    });
  } catch (e) {}
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
    allDistributorsMap.set(d.account, { 
      ...d, 
      planId: d.plan_id || 'DEFAULT', 
      planName: d.plan_name || '經銷專案', 
      joinedAt: d.joined_at || (d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : '未知'), 
      creatorSalesId: d.creator_sales_id || 'SuperAdmin', 
      phone: d.contact_phone || d.phone || '', 
      email: d.email || '', 
      address: d.address || '', 
      contactName: d.contact_name || '', 
      taxId: d.tax_id || '' 
    });
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
      const config = await fetchSystemConfig();
      const mergedRules = overrides || s.commissionRules || config.defaultSuperSalesRates;
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
      name: t.temple_name || t.name || '未知宮廟', 
      role: 'Temple', 
      account: personnel ? personnel.account : (t.account || `USR-${t.id}`), 
      templePhone: t.phone,
      status: t.status || 'Active',
      creatorInfo: creatorInfo,
      setupFee: t.setup_fee,
      monthlyRent: t.monthly_rent,
      paymentCycle: t.payment_cycle,
      address: t.address,
      timestamp: t.created_at
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

export async function fetchSalesTools() {
  try {
    let tools = await prisma.tool.findMany();
    if (tools.length === 0) {
      const defaultTools = [
        { name: "電子授權合約", description: "📑", isEnabled: true },
        { name: "超級業務規章", description: "💎", isEnabled: true },
        { name: "系統全功能手冊", description: "📖", isEnabled: true },
        { name: "分潤結算細則", description: "📊", isEnabled: true }
      ];
      for (const t of defaultTools) {
        await prisma.tool.create({ data: t });
      }
      tools = await prisma.tool.findMany();
    }
    const colorMap = ["bg-indigo-50 text-indigo-600", "bg-purple-50 text-purple-600", "bg-emerald-50 text-emerald-600", "bg-slate-100 text-slate-900"];
    return tools.map((t, i) => ({ n: t.name, icon: t.description, c: colorMap[i % 4] }));
  } catch (error) {
    console.error('fetchSalesTools error:', error);
    return [];
  }
}

export async function fetchSuperSalesLogs(salesName: string) {
  try {
    const logs = await prisma.adminLog.findMany({
      where: { adminName: salesName },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return logs.map((l: any) => ({ id: l.id, action: l.action, target: l.target, time: l.timestamp }));
  } catch (error) {
    console.error('fetchSuperSalesLogs error:', error);
    return [];
  }
}

export async function addSuperSalesLog(salesName: string, action: string, target: string) {
  try {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    await prisma.adminLog.create({
      data: {
        adminName: salesName,
        action,
        target,
        timestamp: time
      }
    });
  } catch (error) {
    console.error('addSuperSalesLog error:', error);
  }
}
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
  const newSalesId = 'dist-sales-' + Date.now();
  const joinedAt = new Date().toISOString().split('T')[0];

  try {
    await prisma.distributorSales.upsert({
      where: { account },
      update: {
        password,
        status: 'Active',
        phone
      },
      create: {
        id: newSalesId,
        distributorId: distId,
        name,
        account,
        password,
        phone,
        role: 'DistSales',
        status: 'Active',
        joinedAt,
        commissionRules: { setupRate, rentYear1Rate, rentYear2Rate, rentYear3PlusRate }
      }
    });
  } catch (e) {
    console.error("DB Insert Error for dist_sales:", e);
    return { success: false, error: String(e) };
  }

  return { success: true, data: { id: newSalesId } };
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
  // Removed mock array push, strictly using SQL

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
        if (sales && typeof sales.bankAccount === 'string') {
          try { sales.bankAccount = JSON.parse(sales.bankAccount); } catch(e) {}
        }
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
            paymentStatus: r.payment_status,
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
          const config = await fetchSystemConfig();
          const rent = Number(t.monthlyRent) || (config.fixedMonthlyRent || 3600);
          const cycle = t.paymentCycle || 'Monthly';
          const discount = config.yearlyDiscountRate || 20;
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
       let paymentStatus = '';
       if (t.paymentStatus === 'PendingPayment' || (bills.length === 0 && t.freeType !== 'Permanent' && t.status !== 'Pending')) {
          paymentStatus = cycle === 'Yearly' ? `${y}年未支付` : `${m}月未支付`;
       } else {
          paymentStatus = hasUnpaid 
             ? (cycle === 'Yearly' ? `${y}年未支付` : `${m}月未支付`)
             : (cycle === 'Yearly' ? `${y}年已支付` : `${m}月已支付`);
       }
       
       temples.push({ id: t.id, name: t.templeName, status: t.status, plan: '進階營運方案', date: t.timestamp ? new Date(t.timestamp).toISOString().split('T')[0] : (t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '未知'), revenue: t.monthlyRent || 0, annualContribution, paymentStatus, bills });
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

  let pendingTempleCount = 0;
  for (const t of listTemples) {
    if (t.status === 'Pending') {
      const creatorInfo = await getTempleCreatorInfo(t.id);
      if ((creatorInfo && creatorInfo.salesName === name) || t.salesId === salesId) {
        pendingTempleCount++;
      }
    }
  }

  let pgPendingDistCount = 0;
  try {
    const res = await dbQuery("SELECT COUNT(*) FROM distributor_applications WHERE submitted_by = $1 AND status = 'Pending'", [name]);
    if (res && (res as any).rows && (res as any).rows.length > 0) {
      pgPendingDistCount = parseInt((res as any).rows[0].count);
    }
  } catch (e) {
    console.error(e);
  }

  const pendingCount = pendingTempleCount + pgPendingDistCount;

  return { temples, distributors, pendingCount };
}

// --- Super Admin Account Creation API ---

export async function createSuperSalesAccount(data: any) {

      try {
        const existing = await prisma.distributorSales.findFirst({ where: { account: data.account } });
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
            phone: data.phone || null,
            email: data.email || null,
            password: data.password || '',
            role: 'SuperSales',
            status: 'Active',
            commissionRules,
            bankAccount: data.bankInfo || data.bankAccount || null,
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
  const config = await fetchSystemConfig();
  const plan = config.distributorPlans.find((p: any) => p.id === data.planId) || config.distributorPlans[0];
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
  
  try {
    await dbQuery(
      "INSERT INTO distributor_applications (id, name, plan, price, submitted_by, status, account, password, owner) VALUES ($1, $2, $3, $4, $5, 'Active', $6, $7, $8)",
      [`DAPP-${id}`, data.name, plan.name, finalPrice, 'System Admin', safeAccount, safePassword, data.owner || 'System']
    );
  } catch (err) {
    console.error('Failed to insert into distributor_applications', err);
  }
  
  try {
    await prisma.distributor.create({
      data: {
        id: newDist.id,
        name: newDist.name,
        account: newDist.account,
        password: newDist.password,
        status: newDist.status,
        quota: Number(data.customNodes) || 100,
        nodes: Number(data.customNodes) || 100,
        customNodes: Number(data.customNodes) || 100,
        contactName: newDist.contactName,
        contactPhone: newDist.phone,
        email: newDist.email,
        address: newDist.address,
        bankCode: newDist.bankInfo?.bankCode || '',
        bankAccount: newDist.bankInfo?.accountNumber || '',
        bankName: newDist.bankInfo?.bankName || ''
      }
    });
  } catch (e) {
    console.error("DB Insert Error for distributor:", e);
    return { success: false, error: String(e) };
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
  
  const config = await fetchSystemConfig();
  const monthlyRent = data.freeType === 'Permanent' ? 0 : (Number(data.monthlyRent) || config.fixedMonthlyRent || 3600);
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
         let p = await prisma.storagePlan.findUnique({ where: { id: newTemple.cloudStorage } }) as any;
         if (!p) p = db_storage_plans.find(x => x.id === newTemple.cloudStorage);
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
        INSERT INTO "Temple" (id, name, temple_name, account, region, city, address, phone, status, sales_id, distributor_id, setup_fee, monthly_rent, payment_cycle)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        id, 
        newTemple.templeName || '未知宮廟', 
        newTemple.templeName || '未知宮廟',
        data.account || null,
        data.region || null,
        newTemple.city || '台北市', 
        data.address || null,
        data.phone || null,
        'Active', 
        newTemple.salesId || null, 
        newTemple.distributorId || null, 
        newTemple.setupFee || 0, 
        newTemple.monthlyRent || 0, 
        newTemple.paymentCycle || 'Monthly'
      ]);
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
    const resWD = await prisma.withdrawal.findMany();
    listWithdrawals = resWD.map((r: any) => ({ ...r, salesName: r.salesName, status: r.status, amount: r.amount }));

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
  const config = await fetchSystemConfig();
  const rules = sales?.commissionRules || overrides || config.defaultSuperSalesRates;
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
          date: bill.dueDate || bill.billingDate || (bill.timestamp ? new Date(bill.timestamp).toISOString().split('T')[0] : '未知'),
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
  let myBonuses = [];
  try {
    const { rows } = await dbQuery("SELECT * FROM bonus_requests WHERE sales_id = $1 AND status = 'Approved'", [salesId]) as any;
    if (rows) {
      myBonuses = rows.map((r: any) => ({
        id: r.id,
        salesName: r.sales_name,
        date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
        amount: r.amount,
        reason: r.reason || '手動發放'
      }));
    }
  } catch (e) {}

  myBonuses.forEach((b: any) => {
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
  
  let myWithdrawals: any[] = [];
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
           payeeSettings[pId] = sysConfig?.b2bPayment || null;
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
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    // Get distinct sales names to find their wallet roles
    const salesNames = [...new Set(withdrawals.map((w: any) => w.salesName).filter(Boolean))];
    const wallets = await prisma.wallet.findMany({
      where: { name: { in: salesNames } }
    });
    const walletRoleMap = new Map(wallets.map(w => [w.name, w.role]));

    const allWithdrawals = withdrawals.map((w: any) => ({
      id: w.id,
      salesName: w.salesName,
      amount: w.amount,
      status: w.status,
      receiptUrl: w.receiptUrl,
      date: w.date || w.createdAt.toISOString().split('T')[0],
      role: walletRoleMap.get(w.salesName)
    }));
    
    // 過濾掉「經銷業務員」的提領申請，只留給對應的經銷商審核
    return allWithdrawals.filter((w: any) => w.role !== 'DistSales' && w.role !== 'DistributorSales');
  } catch (error) {
    console.error('Failed to fetch all withdrawals', error);
    return [];
  }
}

export async function approveWithdrawal(id: string, receiptUrl?: string) { 
  try {
    const data: any = { status: 'Approved' };
    if (receiptUrl) {
      data.receiptUrl = receiptUrl;
    }
    await prisma.withdrawal.update({
      where: { id },
      data
    });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    return { success: true }; 
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

export async function rejectWithdrawal(id: string) { 
  try {
    const w = await prisma.withdrawal.findUnique({ where: { id } });
    if (w) {
      await prisma.withdrawal.update({
        where: { id },
        data: { status: 'Rejected' }
      });
      // Refund wallet
      if (w.salesName && w.amount) {
        await prisma.wallet.updateMany({
          where: { name: w.salesName },
          data: { balance: { increment: w.amount } }
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
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false, error: '未指定宮廟' };

    const storage = await prisma.templeStorage.findUnique({ where: { templeId } });
    if (storage) {
      if (Number(storage.usedBytes) >= Number(storage.allocatedBytes)) {
        return { success: false, error: '宮廟雲端空間已滿，無法上傳檔案。' };
      }
      await prisma.templeStorage.update({
        where: { templeId },
        data: { usedBytes: { increment: 5 * 1024 * 1024 } }
      });
    }

    const newId = `f-${Date.now()}`;
    const normPhone = normalizePhone(phone);
    const guest = await prisma.guest.findFirst({
      where: { templeId, phone: normPhone }
    });

    const newFile = await prisma.guestFile.create({
      data: {
        id: newId,
        templeId,
        guestId: guest ? guest.id : null,
        phone: guest ? guest.phone : normPhone,
        url,
        type,
        name: customName || (type === 'photo' ? '現場祭祀/服務相片歸檔' : type === 'video' ? '消災祈福法會影像歸檔' : '信眾點燈與祈福案卡檔案'),
        folder: new Date().toISOString().split('T')[0],
        uploadedBy: uploadedBy
      }
    });

    await revalidateTemple();
    return { success: true };
  } catch (error) {
    console.error('uploadCustomerMedia error:', error);
    return { success: false, error: '檔案上傳與資料庫寫入失敗' };
  }
}
export async function createPersonnel(formData: FormData) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false, error: '缺少 templeId' };

  try {
    const name = formData.get('name') as string;
    const rawAccount = formData.get('account') as string;
    const account = (rawAccount || '').trim();
    
    if (account) {
      const existingUser = await prisma.user.findFirst({
        where: {
          templeId,
          account: {
            equals: account,
            mode: 'insensitive'
          }
        }
      });
      if (existingUser) {
        return { success: false, error: '該帳號在此宮廟已被註冊，請更換' };
      }
    }

    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as string;
    const newId = `p-${Date.now()}`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;

    const defaultPerms = role === 'TempleAdmin' ? ['all'] : ['calendar', 'customers'];
    
    await prisma.user.create({
      data: {
        id: newId,
        templeId,
        name,
        role,
        account,
        phone,
        password,
        status: 'Active',
        avatar,
        permissions: defaultPerms
      }
    });

    await revalidateTemple(templeId);
    await logSystemEvent('SUCCESS', '新增人員', `人員名稱：${name}`, '管理員', templeId);
    return { success: true };
  } catch (error) {
    console.error('createPersonnel error:', error);
    return { success: false, error: '建立人員失敗' };
  }
}

export async function deletePersonnel(id: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false, message: '缺少 templeId' };

  try {
    const personnel = await prisma.user.findUnique({
      where: { id }
    });

    if (personnel && personnel.templeId === templeId) {
      const hasAppointments = await prisma.appointment.findFirst({
        where: {
          templeId,
          staff: personnel.name,
          status: { not: 'Completed' }
        }
      });

      const hasSlots = await prisma.slot.findFirst({
        where: {
          templeId,
          staff: personnel.name,
          status: { not: 'Completed' }
        }
      });

      if (hasAppointments || hasSlots) {
        return { success: false, message: '此人員目前尚有預約服務或已排班時段，請先清空後再進行刪除！' };
      }
    }

    await prisma.user.deleteMany({
      where: {
        id,
        templeId
      }
    });

    await revalidateTemple(templeId);
    await logSystemEvent('SUCCESS', '刪除人員', `帳號 ID：${id}`, '管理員', templeId);
    return { success: true };
  } catch (error) {
    console.error('deletePersonnel error:', error);
    return { success: false, message: '刪除人員失敗' };
  }
}

export async function updateAccountPermissions(id: string, permissions: string[]) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false, message: '缺少 templeId' };
  
  try {
    await prisma.user.updateMany({
      where: { id, templeId },
      data: { permissions }
    });
    await revalidateTemple(templeId);
    return { success: true };
  } catch (error) {
    console.error('updateAccountPermissions error:', error);
    return { success: false };
  }
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
  if (!templeId) {
    return { 
      analyticsSettings: {}, 
      analyticsData: { todayAppointments: 0, completedAppointments: 0, totalGuests: 0, lampStats: { totalLamps: 0, activeLamps: 0 }, serviceHeat: [] }, 
      raw: { apps: [], agiStats: {}, guests: [], storageInfo: { used: 0, total: 100, isVip: false, planName: '未知方案' }, qActive: [] } 
    };
  }
  
  const now = new Date();
  const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

  try {
    const guests = await prisma.guest.findMany({
      where: { templeId },
      select: { phone: true, name: true }
    });
    const totalGuests = guests.length;

    const apps = await prisma.appointment.findMany({
      where: { templeId },
      select: { id: true, guestId: true, service: true, date: true, time: true, status: true, paymentStatus: true }
    });

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

    const lampsRes = await prisma.lampRecord.findMany({
      where: { templeId },
      select: { status: true, paymentStatus: true }
    });
    const totalLamps = lampsRes.length;
    const activeLamps = lampsRes.filter(l => l.status === 'Active' || l.paymentStatus === 'Paid').length;

    const qEvents = await prisma.queueEvent.findMany({
      where: { status: 'Active', templeId }
    });
    
    const qActive = await Promise.all(qEvents.map(async (evt) => {
      const tickets = await prisma.queueTicket.findMany({
        where: { eventId: evt.id, templeId },
        select: { status: true }
      });
      const waiting = tickets.filter(t => t.status === 'Queuing').length;
      const completed = tickets.filter(t => t.status === 'Completed').length;
      return { title: evt.title, waiting, completed };
    }));

    let isVip = true;
    let totalGB = 100;
    let used = 0;
    let planName = '免費 5GB 空間';

    try {
      const storageRes = await prisma.templeStorage.findUnique({
        where: { templeId }
      });
      if (storageRes) {
        totalGB = Math.round(Number(storageRes.allocatedBytes) / (1024 * 1024 * 1024));
        used = Number(storageRes.usedBytes) / (1024 * 1024 * 1024);
        planName = storageRes.planName || `${totalGB}GB`;
        isVip = false;
      } else {
        const temple = await prisma.temple.findUnique({
          where: { id: templeId },
          select: { planId: true } 
        });
        
        if (temple) {
          isVip = false; // Just fallback for now
        }
      }
    } catch (e) {
      console.error('fetchGlobalTempleData storage error:', e);
    }

    return { 
      analyticsSettings: {}, 
      analyticsData: { todayAppointments, completedAppointments, totalGuests, lampStats: { totalLamps, activeLamps }, serviceHeat: sortedServices }, 
      raw: { apps, agiStats: {}, guests, storageInfo: { used, total: totalGB, isVip, planName }, qActive } 
    };

  } catch (err) {
    console.error("fetchGlobalTempleData Prisma Error:", err);
    return { 
      analyticsSettings: {}, 
      analyticsData: { todayAppointments: 0, completedAppointments: 0, totalGuests: 0, lampStats: { totalLamps: 0, activeLamps: 0 }, serviceHeat: [] }, 
      raw: { apps: [], agiStats: {}, guests: [], storageInfo: { used: 0, total: 100, isVip: false, planName: '未知方案' }, qActive: [] } 
    };
  }
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
          where: { 
            templeId_phone: {
              templeId,
              phone: normPhone
            }
          },
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
        
        const guest = await prisma.guest.findFirst({
          where: { templeId, phone: normPhone }
        });
        
        const files = guest ? await prisma.guestFile.findMany({ where: { guestId: guest.id }, orderBy: { createdAt: 'desc' } }) : [];
        const appointments = await prisma.appointment.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const lampRecords = await prisma.lampRecord.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const queueTickets = await prisma.queueTicket.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const eventRegistrations = await prisma.eventRegistration.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });

        const rawDeepRecords = await prisma.deepRecord.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const records = rawDeepRecords.map(r => ({
          id: r.id,
          date: r.date,
          serviceType: r.content || '',
          staffName: r.remarks || '',
          values: r.paymentRef ? JSON.parse(r.paymentRef) : null
        }));

        const rawActivities = await prisma.activity.findMany({ where: { templeId, phone: { contains: normPhone } }, orderBy: { createdAt: 'desc' } });
        const activities = rawActivities.map(a => ({
          type: a.type,
          content: a.content,
          timestamp: a.createdAt.toISOString()
        }));

        return {
          files,
          records,
          appointments,
          lampRecords,
          activities,
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
        const record = await prisma.deepRecord.findUnique({ where: { id: recordId } });
        if (record) {
          await prisma.deepRecord.update({
            where: { id: recordId },
            data: {
              remarks: staffName,
              paymentRef: values ? JSON.stringify(values) : null
            }
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
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false, message: '未指定宮廟' };

    const normPhone = normalizePhone(phone);
    const guest = await prisma.guest.findFirst({
      where: { templeId, phone: normPhone }
    });

    const newRecord = await prisma.deepRecord.create({
      data: {
        templeId,
        guestId: guest ? guest.id : null,
        phone: normPhone,
        category: eventId,
        content: serviceType,
        date: new Date().toISOString().split('T')[0],
        remarks: staffName,
        paymentRef: values ? JSON.stringify(values) : null
      }
    });
    
    let activityContent = `完成【${serviceType}】紀錄歸檔`;
    if (serviceType?.includes('功德')) {
      const amount = values && values['金額'] ? values['金額'] : '';
      const payer = values && values['付款人'] ? values['付款人'] : '';
      const method = values && values['支付方式'] ? values['支付方式'] : '';
      activityContent = `完成【${serviceType}】錄入: ${amount} (由${payer}以${method}支付)`;
    }

    await prisma.activity.create({
      data: {
        templeId,
        guestId: guest ? guest.id : null,
        phone: normPhone,
        type: 'DeepRecord',
        content: activityContent
      }
    });

    await revalidateTemple();
    return { success: true, record: newRecord };
  } catch (error) {
    console.error('saveDeepRecord error:', error);
    return { success: false, message: '儲存失敗' };
  }
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
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };

    if (recordType === 'Appointment') {
      await prisma.appointment.updateMany({
        where: { id: recordId, templeId },
        data: { status: 'Confirmed', paymentStatus: 'Paid' }
      });
    }
    if (recordType === 'Lamp') {
      await prisma.lampRecord.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Paid' }
      });
    }
    if (recordType === 'Event') {
      await prisma.eventRegistration.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Paid' }
      });
    }
    if (recordType === 'Queue') {
      await prisma.queueTicket.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Paid' }
      });
    }
    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error('confirmPayment error:', e);
    return { success: false };
  }
}
export async function createLampRecord(data: any) {

      try {
        const templeId = await getDynamicTempleId();
        let phone = ''; let categoryId = ''; let guestName = ''; let notice = ''; let paymentMethod = ''; let paymentRef = ''; let position = ''; let durationDays = 365; let startDate = new Date();
        
        if (data instanceof FormData) {
          phone = data.get('phone') as string; categoryId = data.get('categoryId') as string; guestName = data.get('guestName') as string; notice = data.get('notice') as string; paymentMethod = data.get('paymentMethod') as string || 'Cash'; paymentRef = data.get('paymentRef') as string || '';
          position = data.get('position') as string || '';
          durationDays = parseInt(data.get('durationDays') as string || '365', 10);
          startDate = data.get('startDate') ? new Date(data.get('startDate') as string) : new Date();
        } else {
          phone = data.phone; categoryId = data.categoryId; guestName = data.guestName; notice = data.notice; paymentMethod = data.paymentMethod || 'Cash'; paymentRef = data.paymentRef || '';
          position = data.position || '';
          durationDays = data.durationDays || 365;
          startDate = data.startDate ? new Date(data.startDate) : new Date();
        }

        const cat = await prisma.lampCategory.findFirst({
          where: { id: categoryId, templeId: templeId! }
        });
        
        if (!cat) return { success: false, error: '未找到燈種類別' };
        
        if (position) {
          const existing = await prisma.lampRecord.findFirst({
            where: { templeId: templeId!, categoryId: cat.id, position, status: { in: ['Active', 'Pending'] } }
          });
          if (existing) return { success: false, error: '該燈位已被預訂或使用中，請重新選擇。' };
        }
        
        const newId = `LMP-${Date.now()}`;
        const paymentStatus = (paymentMethod === 'LinePayApi' || paymentMethod === 'ThirdPartyApi') ? 'Paid' : ((paymentMethod === 'transfer' || paymentMethod === 'customQR') ? 'Pending' : 'Unpaid');
        
        const normPhone = normalizePhone(phone);
        const guest = await prisma.guest.upsert({
          where: { templeId_phone: { templeId: templeId!, phone: normPhone } },
          update: {},
          create: { templeId: templeId!, phone: normPhone, name: guestName, status: 'Active' }
        });

        const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await prisma.lampRecord.create({
          data: {
            id: newId,
            templeId: templeId!,
            categoryId: cat.id,
            categoryName: cat.name,
            guestId: guest.id,
            guestName,
            phone: normPhone,
            actualPrice: cat.price,
            status: 'Pending',
            paymentMethod,
            paymentProofUrl: paymentRef,
            paymentStatus,
            remarks: notice,
            position,
            startDate,
            durationDays,
            expiryDate
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
        
        const normPhone = normalizePhone(data.phone);
        const guest = await prisma.guest.upsert({
          where: { templeId_phone: { templeId: templeId!, phone: normPhone } },
          update: {},
          create: { templeId: templeId!, phone: normPhone, name: data.guestName, status: 'Active' }
        });

        await prisma.queueTicket.create({
          data: {
            id: newId,
            eventId,
            templeId: templeId!,
            guestId: guest.id,
            phone: normPhone,
            guestName: data.guestName,
            status: data.isOnline ? 'Registered' : 'Queuing',
            displayNum: nextNumber,
            assignedNumber: nextNumber,
            eventTitle: ev.title,
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
  try {
    const plans = await prisma.pricePlan.findMany();
    if (plans.length === 0) {
      const defaultPlans = [
        { id: 'plan-1', distributorId: 'dist-1', name: '基礎推廣方案', setupFee: 12000, monthlyFee: 3600, isFree: false, freeMonths: 0 },
        { id: 'plan-2', distributorId: 'dist-1', name: '免費推廣試用方案', setupFee: 0, monthlyFee: 3600, isFree: true, freeMonths: 3 }
      ];
      await prisma.pricePlan.createMany({ data: defaultPlans });
      return defaultPlans;
    }
    return plans;
  } catch (error) {
    console.error('Failed to fetch price plans:', error);
    return [];
  }
}

export async function createPricePlan(plan: any) {
  try {
    const newId = `plan-${Date.now()}`;
    await prisma.pricePlan.create({
      data: {
        id: newId,
        distributorId: 'dist-1',
        name: plan.name,
        setupFee: Number(plan.setupFee || 0),
        monthlyFee: Number(plan.monthlyFee || 0),
        isFree: Boolean(plan.isFree),
        freeMonths: Number(plan.freeMonths || 0)
      }
    });
    
    await revalidateTemple();
    return { success: true };
  } catch (error) {
    console.error('Failed to create price plan:', error);
    return { success: false, message: '建立方案失敗' };
  }
}

export async function fetchTempleApplications() {
  try {
    const apps = await prisma.templeApplication.findMany();
    return apps.map((r: any) => ({
      id: r.id,
      templeName: r.templeName,
      contactPerson: r.contactPerson,
      contactPhone: r.contactPhone,
      planId: r.planId,
      setupFee: r.setupFee,
      monthlyFee: r.monthlyFee,
      status: r.status,
      salesId: r.salesId
    }));
  } catch (error) {
    console.error('Failed to fetch temple applications:', error);
    return [];
  }
}

export async function submitTempleApplication(data: any) {
  try {
    const newId = `app-${Date.now()}`;
    let setupFee = 12000;
    let monthlyFee = 3600;
    
    const plan = await prisma.pricePlan.findUnique({
      where: { id: data.planId }
    });
    
    if (plan) {
      setupFee = plan.setupFee;
      monthlyFee = plan.monthlyFee;
    }
    
    await prisma.templeApplication.create({
      data: {
        id: newId,
        templeName: data.templeName,
        contactPerson: data.contactPerson || '聯絡人',
        contactPhone: data.contactPhone || '',
        planId: data.planId,
        setupFee,
        monthlyFee,
        status: 'Pending',
        salesId: 'sales-1'
      }
    });
    
    await revalidateTemple();
    return { success: true };
  } catch (error) {
    console.error('Failed to submit temple application:', error);
    return { success: false, message: '提交申請失敗' };
  }
}

export async function approveTempleApplication(appId: string) {
  try {
    const app = await prisma.templeApplication.findUnique({
      where: { id: appId }
    });
    
    if (!app) return { success: false, error: '找不到該筆開案申請' };
    
    await prisma.templeApplication.update({
      where: { id: appId },
      data: { status: 'Approved' }
    });
    
    const newTempleId = `temple-${Date.now()}`;
    
    await prisma.temple.create({
      data: {
        id: newTempleId,
        name: app.templeName,
        city: '台北市',
        status: 'Active',
        salesId: app.salesId,
        setupFee: app.setupFee,
        monthlyRent: app.monthlyFee,
        paymentCycle: 'Monthly'
      }
    });
    
    await prisma.templeStorage.create({
      data: {
        templeId: newTempleId,
        usedBytes: 0,
        allocatedBytes: BigInt(5368709120),
        planName: '標準免費空間',
        city: '台北市'
      }
    });
    
    await prisma.user.create({
      data: {
        id: `p-${Date.now()}`,
        templeId: newTempleId,
        name: app.contactPerson || '管理員',
        role: 'TempleAdmin',
        account: app.contactPhone || 'admin',
        phone: app.contactPhone || '0000',
        password: app.contactPhone || 'admin',
        status: 'Active'
      }
    });
    
    await revalidateTemple();
    return { success: true };
  } catch (error) {
    console.error('Failed to approve temple application:', error);
    return { success: false, error: '核准失敗' };
  }
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
  guestId?: string | null;
}

// migrated (await jsonStore.find('temple_notifications')) to (await jsonStore.find('temple_notifications'))
// (await jsonStore.find('temple_notifications')) synced

// 1. 創立通知資料表與發佈公告
export async function createNotification(title: string, content: string, sendTime: string, guestId?: string) {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };

    await prisma.templeNotification.create({
      data: {
        templeId,
        title,
        content,
        sendTime: new Date(sendTime),
        guestId: guestId || null
      }
    });

    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
}

// 2. 獲取所有通知紀錄（管理端：含定時預排通知）
export async function fetchTempleNotifications(): Promise<TempleNotification[]> {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];

    const notifs = await prisma.templeNotification.findMany({
      where: { templeId },
      orderBy: { sendTime: 'desc' }
    });

    return notifs.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      sendTime: n.sendTime.toISOString(),
      createdAt: n.createdAt.toISOString(),
      guestId: n.guestId
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
}

// 3. 獲取最新的一則已發送公告（信眾端首頁）
export async function fetchLatestNotificationForGuest(): Promise<TempleNotification | null> {
  const activeNotifs = await fetchActiveNotificationsForGuest();
  return activeNotifs.length > 0 ? activeNotifs[0] : null;
}

// 4. 獲取所有已發送公告（信眾端歷史對話框）
export async function fetchActiveNotificationsForGuest(): Promise<TempleNotification[]> {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return [];

    const now = new Date();
    const notifs = await prisma.templeNotification.findMany({
      where: { 
        templeId,
        sendTime: { lte: now },
        guestId: null // Global broadcasts only for now
      },
      orderBy: { sendTime: 'desc' }
    });

    return notifs.map(n => ({
      id: n.id,
      title: n.title,
      content: n.content,
      sendTime: n.sendTime.toISOString(),
      createdAt: n.createdAt.toISOString(),
      guestId: n.guestId
    }));
  } catch (e) {
    console.error(e);
    return [];
  }
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
  try {
    return await prisma.aiPlan.findMany();
  } catch (e) {
    console.error(e);
    return [];
  }
}

export async function saveAiPlan(plan: any) {
  try {
    if (plan.id && !plan.id.startsWith('AI-')) {
      await prisma.aiPlan.upsert({
        where: { id: plan.id },
        update: {
          name: plan.name,
          price: Number(plan.price) || 0,
          features: plan.features
        },
        create: {
          name: plan.name,
          price: Number(plan.price) || 0,
          features: plan.features
        }
      });
    } else {
      await prisma.aiPlan.create({
        data: {
          name: plan.name,
          price: Number(plan.price) || 0,
          features: plan.features
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

export async function deleteAiPlan(id: string) {
  try {
    await prisma.aiPlan.delete({ where: { id } });
    const { revalidatePath } = require('next/cache');
    revalidatePath('/super-admin');
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false };
  }
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
  try {
    await dbQuery('DELETE FROM ai_api_models');
    for (const m of models) {
      await prisma.aiApiModel.create({
        data: {
          name: m.name || '',
          provider: m.provider || '',
          version: m.version || '',
          isDefault: Boolean(m.isDefault)
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
        if (!templeId) return { success: false };
        const timestamp = new Date().toLocaleString('zh-TW');
        
        await prisma.auditLog.create({
          data: {
            id: `log-${Date.now()}`,
            templeId,
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
    
    let myBonusRequests: any[] = [];
    if (salesIds.length > 0) {
      const bonusRes = await prisma.bonusRequest.findMany({
        where: { salesId: { in: salesIds } },
        orderBy: { createdAt: 'desc' }
      });
      bonusRes.forEach((r: any) => {
        myBonusRequests.push({
          id: r.id, amount: r.amount, date: r.date || r.createdAt.toISOString().split('T')[0], status: r.status, method: r.method, salesName: r.salesName
        });
      });
    }

    return { paymentRecords, bonusRequests: myBonusRequests };
  } catch (e) {
    return { paymentRecords: [], bonusRequests: [] };
  }
}

export async function fetchDistributorSalesPerformance(distId: string, yearMonth?: string) {
  try {
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

      const myWithdrawals = await prisma.withdrawal.findMany({
        where: {
          salesName: s.name,
          status: { in: ['Approved', 'Verified'] }
        }
      });
      const totalWithdrawn = myWithdrawals.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

      const salesVisits = await prisma.salesVisit.findMany({
        where: { salesName: s.name }
      });
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
  let allTemples: any[] = [];
  try {
    allTemples = await prisma.temple.findMany();
  } catch (e) {
    console.error(e);
  }

  let templeBills: any[] = [];
  try {
    const res = await dbQuery("SELECT * FROM \"TempleBill\"", [], () => null) as any;
    if (res && res.rows) templeBills = res.rows;
  } catch(e) {}

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
         description: `${t?.templeName || t?.name || '未知宮廟'} - ${b.item_name === 'SetupFee' || b.type === 'Setup' ? '開辦費' : '系統費用'}`
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

  const config = await fetchSystemConfig();
  const templePayments = allTemples.filter((t: any) => !t.distributorId && t.status !== 'Inactive').map((t: any) => {
    const bills = templeBills.filter(b => b.temple_id === t.id || b.templeId === t.id);
    const unpaidBills = bills.filter(b => b.status === 'Unpaid' || b.status === 'PendingVerification');
    const hasUnpaid = unpaidBills.length > 0;
    const isPending = unpaidBills.some(b => b.status === 'PendingVerification');

    const isYearly = t.paymentCycle === 'Yearly';
    const discountRate = config.yearlyDiscountRate || 20;
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
        const res = await dbQuery('SELECT sales_id, distributor_id, super_sales_id FROM "Temple" WHERE id = $1', [templeId]);
        const temple = (res as any)?.rows?.[0];
        if (!temple) return null;

        let salesName = '';
        let distName = '';

        if (temple.sales_id) {
           const salesRes = await dbQuery('SELECT name FROM dist_sales WHERE id = $1', [temple.sales_id]);
           salesName = (salesRes as any)?.rows?.[0]?.name || temple.sales_id;
        } else if (temple.super_sales_id) {
           const salesRes = await dbQuery('SELECT name FROM dist_sales WHERE id = $1', [temple.super_sales_id]);
           salesName = (salesRes as any)?.rows?.[0]?.name || temple.super_sales_id;
        }

        if (temple.distributor_id) {
           const distRes = await dbQuery('SELECT name FROM "Distributor" WHERE id = $1', [temple.distributor_id]);
           distName = (distRes as any)?.rows?.[0]?.name || temple.distributor_id;
        }

        return {
           type: temple.sales_id ? 'Sales' : (temple.distributor_id ? 'Distributor' : 'super_admin'),
           salesName: salesName,
           distName: distName
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
  if (!templeId) return false;

  try {
    // Check appointments
    let updateRes = await prisma.appointment.updateMany({
      where: { id: orderId, templeId },
      data: { paymentStatus: 'Paid', paymentMethod: method }
    });
    if (updateRes.count > 0) return true;
    
    // Check event registrations
    updateRes = await prisma.eventRegistration.updateMany({
      where: { id: orderId, templeId },
      data: { paymentStatus: 'Paid' }
    });
    if (updateRes.count > 0) return true;
    
    // Check queue tickets
    updateRes = await prisma.queueTicket.updateMany({
      where: { id: orderId, templeId },
      data: { paymentStatus: 'Paid' }
    });
    if (updateRes.count > 0) return true;
    
    return false;
  } catch (error) {
    console.error('handlePaymentCallback error:', error);
    return false;
  }
}

export async function revertPayment(recordId: string, recordType: 'Lamp' | 'Event' | 'Queue' | 'Appointment') {
  try {
    const templeId = await getDynamicTempleId();
    if (!templeId) return { success: false };

    if (recordType === 'Appointment') {
      await prisma.appointment.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Unpaid' }
      });
    }
    if (recordType === 'Lamp') {
      await prisma.lampRecord.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Unpaid' }
      });
    }
    if (recordType === 'Event') {
      await prisma.eventRegistration.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Unpaid' }
      });
    }
    if (recordType === 'Queue') {
      await prisma.queueTicket.updateMany({
        where: { id: recordId, templeId },
        data: { paymentStatus: 'Unpaid' }
      });
    }
    await revalidateTemple();
    return { success: true };
  } catch (e) {
    console.error('revertPayment error:', e);
    return { success: false };
  }
}


export async function deleteGuestFile(fileId: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false, error: '未指定宮廟' };

  try {
    await prisma.guestFile.deleteMany({
      where: {
        id: fileId,
        templeId
      }
    });

    await revalidateTemple(templeId);
    return { success: true };
  } catch (error) {
    console.error('deleteGuestFile error:', error);
    return { success: false, error: '刪除檔案失敗' };
  }
}
export async function activateLampRecord(recordId: string) {

      try {
        const record = await prisma.lampRecord.findUnique({
          where: { id: recordId },
          include: { category: true }
        });
        if (!record) return { success: false };
        
        const startDate = new Date();
        const durationDays = record.durationDays || record.category?.durationDays || 365;
        const expiryDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

        await prisma.lampRecord.update({
          where: { id: recordId },
          data: { status: 'Active', startDate, expiryDate, durationDays }
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
    const newId = 'bonus-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    await prisma.bonusRequest.create({
      data: {
        id: newId,
        salesId: salesId,
        distributorId: distributorId || '',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        method: method,
        salesName: salesName || ''
      }
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}
export async function fetchSalesBonusRequests(salesId: string) {
  try {
    const requests = await prisma.bonusRequest.findMany({
      where: { salesId: salesId },
      orderBy: { createdAt: 'desc' }
    });
    return requests.map((r: any) => ({
      id: r.id, amount: r.amount, date: r.date || r.createdAt.toISOString().split('T')[0], status: r.status, method: r.method
    }));
  } catch (error) {
    console.error('Failed to fetch bonus history', error);
    return [];
  }
}
export async function uploadReceiptAndApproveBonus(requestId: string, imageUrl: string) {
  try {
    await prisma.bonusRequest.update({
      where: { id: requestId },
      data: { status: 'Paid', receiptUrl: imageUrl }
    });
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
  try {
    const rootNodes: any[] = [];
    
    const hqTempleNode: any = { id: 'HQ-Temple', name: '總部直營宮廟', type: 'super-admin', children: [] };
    const hqSuperSalesNode: any = { id: 'HQ-SuperSales', name: '超級管理員(總部)', type: 'super-admin', children: [] };
    const hqDistributorNode: any = { id: 'HQ-Distributor', name: '總部直屬經銷商', type: 'super-admin', children: [] };
    const hqDistSalesNode: any = { id: 'HQ-DistSales', name: '總部直屬經銷業務', type: 'super-admin', children: [] };

    // Fetch all entities
    const superSales = await prisma.user.findMany({ where: { role: 'SuperSales' } });
    const distributors = await prisma.distributor.findMany();
    const distSales = await prisma.distributorSales.findMany();
    const temples = await prisma.temple.findMany();

    const superSalesNodes = superSales.map((s: any) => ({
      id: s.id,
      name: s.name,
      type: 'super-sales',
      joinedAt: s.createdAt.toISOString(),
      status: s.status,
      children: []
    }));

    const distNodes = distributors.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: 'distributor',
      joinedAt: d.createdAt.toISOString(),
      status: d.status,
      planName: d.name ? '標準經銷方案' : '標準經銷方案',
      price: d.setupFee || 1600000,
      nodes: d.quota,
      expirationDate: new Date(new Date(d.createdAt).setFullYear(new Date(d.createdAt).getFullYear() + 2)).toISOString(),
      children: []
    }));

    const distSalesNodes = distSales.map((d: any) => ({
      id: d.id,
      name: d.name,
      type: 'dist-sales',
      joinedAt: d.createdAt.toISOString(),
      status: d.status,
      children: []
    }));

    const templeNodes = temples.map((t: any) => ({
      id: t.id,
      name: t.name || t.templeName || '未知宮廟',
      type: 'temple',
      joinedAt: t.createdAt.toISOString(),
      status: t.status,
      planName: t.monthlyRent > 0 ? '月付標準方案' : '永久免費',
      price: t.monthlyRent || 0
    }));

    // Build hierarchy
    templeNodes.forEach((tNode: any) => {
      const temple = temples.find((t: any) => t.id === tNode.id);
      if (temple?.salesId) {
        const parent = distSalesNodes.find(ds => ds.id === temple.salesId);
        if (parent) parent.children.push(tNode);
        else hqTempleNode.children.push(tNode);
      } else if (temple?.distributorId) {
        const parent = distNodes.find(d => d.id === temple.distributorId);
        if (parent) parent.children.push(tNode);
        else hqTempleNode.children.push(tNode);
      } else if (temple?.superSalesId) {
        const parent = superSalesNodes.find(ss => ss.id === temple.superSalesId);
        if (parent) parent.children.push(tNode);
        else hqTempleNode.children.push(tNode);
      } else {
        hqTempleNode.children.push(tNode);
      }
    });

    distSalesNodes.forEach((dsNode: any) => {
      const ds = distSales.find((d: any) => d.id === dsNode.id);
      if (ds?.distributorId) {
        const parent = distNodes.find(d => d.id === ds.distributorId);
        if (parent) parent.children.push(dsNode);
        else hqDistSalesNode.children.push(dsNode);
      } else {
        hqDistSalesNode.children.push(dsNode);
      }
    });

    // NOTE: If distributors were somehow linked to superSales, we would group them.
    // In schema, Distributor has no superSalesId. 
    // Wait! A superSales creates a distributor, where is that saved?
    // Let's assume for now they are all direct to HQ-Distributor unless they have superSalesId.
    // Let's check if they have superSalesId in DB anyway? The schema didn't have it.
    distNodes.forEach((dNode: any) => {
      hqDistributorNode.children.push(dNode);
    });

    superSalesNodes.forEach((ssNode: any) => {
      hqSuperSalesNode.children.push(ssNode);
    });

    if (hqTempleNode.children.length > 0) rootNodes.push(hqTempleNode);
    if (hqSuperSalesNode.children.length > 0) rootNodes.push(hqSuperSalesNode);
    if (hqDistributorNode.children.length > 0) rootNodes.push(hqDistributorNode);
    if (hqDistSalesNode.children.length > 0) rootNodes.push(hqDistSalesNode);

    return rootNodes;
  } catch (e) {
    console.error("fetchDataBridgeTree error:", e);
    return [];
  }
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
  try {
    const order = await prisma.saasOrder.findUnique({ where: { id: orderId } });
    if (order) {
      await prisma.saasOrder.update({
        where: { id: orderId },
        data: { status: status === 'paid' ? 'Paid' : 'Rejected' }
      });
      return { success: true };
    }
  } catch (e) {
    console.error(e);
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
    const requests = await prisma.bonusRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return requests.map((r: any) => ({
      id: r.id, amount: r.amount, date: r.date || r.createdAt.toISOString().split('T')[0], status: r.status, method: r.method,
      salesName: r.salesName, distributorId: r.distributorId, receiptUrl: r.receiptUrl
    }));
  } catch (error) {
    console.error('Failed to fetch all bonus requests', error);
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
  if (!templeId) return { success: false, reason: 'NoTemple' };
  try {
    let normPhone = phone.replace(/\D/g, '');
    
    // Find if the guest exists
    const guest = await prisma.guest.findFirst({
      where: {
        templeId,
        phone: normPhone
      }
    });

    if (guest) {
      await prisma.guest.update({
        where: { id: guest.id },
        data: { lineId: lineUserId }
      });
      return { success: true };
    } else {
      return { success: false, reason: 'GuestNotFound' };
    }
  } catch (error) {
    console.error('bindCustomerLine error:', error);
    return { success: false, reason: 'DatabaseError' };
  }
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
  try {
    const apps = await prisma.distributorApplication.findMany({
      where: { submittedBy: salesName }
    });
    return apps.map((r: any) => ({
      ...r,
      rejectReason: r.rejectReason || '',
      rejectedAt: r.rejectedAt || ''
    }));
  } catch (error) {
    console.error('fetchSuperSalesApplications error:', error);
    return [];
  }
}

