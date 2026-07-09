"use server";
import { revalidatePath } from "next/cache";
import { withTempleSession } from "../db/db";
import { getDynamicTempleId, revalidateTemple } from "./actions";

const gStore = globalThis as any;

// Memory stores fallback
if (!gStore.db_admin_notifications) gStore.db_admin_notifications = [];

// 1. Upload Payment Proof
export async function uploadPaymentProof(recordId: string, recordType: 'Appointment' | 'LampRecord' | 'EventRegistration', imageUrl: string, guestId?: string) {
  const templeId = await getDynamicTempleId();
  
  return withTempleSession(templeId, false, async (client) => {
    let message = `有信眾上傳了匯款截圖，請盡快核對款項。`;
    let linkPath = `/${templeId}/admin/queue`; // Default fallback path

    if (!client) {
      // Memory mode
      if (recordType === 'Appointment') {
        const idx = gStore.db_appointments?.findIndex((a: any) => String(a.id) === String(recordId));
        if (idx !== undefined && idx !== -1) {
            gStore.db_appointments[idx].paymentProofUrl = imageUrl;
            gStore.db_appointments[idx].paymentStatus = 'PENDING_REVIEW';
            message = `預約單號 ${recordId} 上傳了匯款截圖`;
            linkPath = `/${templeId}/admin/calendar`;
        }
      } else if (recordType === 'LampRecord') {
        const idx = gStore.db_lamp_records?.findIndex((a: any) => String(a.id) === String(recordId));
        if (idx !== undefined && idx !== -1) {
            gStore.db_lamp_records[idx].paymentProofUrl = imageUrl;
            gStore.db_lamp_records[idx].paymentStatus = 'PENDING_REVIEW';
            message = `點燈紀錄 ${recordId} 上傳了匯款截圖`;
            linkPath = `/${templeId}/admin/lamps`;
        }
      } else if (recordType === 'EventRegistration') {
        const idx = gStore.db_event_registrations?.findIndex((a: any) => String(a.id) === String(recordId));
        if (idx !== undefined && idx !== -1) {
            gStore.db_event_registrations[idx].paymentProofUrl = imageUrl;
            gStore.db_event_registrations[idx].paymentStatus = 'PENDING_REVIEW';
            message = `法會報名 ${recordId} 上傳了匯款截圖`;
            linkPath = `/${templeId}/admin/events`;
        }
      }
      
      const newNotif = {
        id: `notif-${Date.now()}`,
        templeId,
        guestId: guestId || null,
        category: 'PENDING_REVIEW',
        message,
        isRead: false,
        linkPath,
        createdAt: new Date().toISOString()
      };
      gStore.db_admin_notifications.push(newNotif);
      
    } else {
      // DB mode
      let tableName = '';
      if (recordType === 'Appointment') { tableName = 'appointments'; linkPath = `/${templeId}/admin/calendar`; }
      else if (recordType === 'LampRecord') { tableName = 'lamp_records'; linkPath = `/${templeId}/admin/lamps`; }
      else if (recordType === 'EventRegistration') { tableName = 'event_registrations'; linkPath = `/${templeId}/admin/events`; }

      if (tableName) {
          try {
            // First try with camelCase (Prisma generated tables if any)
            await client.query(`UPDATE ${tableName} SET "paymentProofUrl" = $1, "paymentStatus" = 'PENDING_REVIEW' WHERE id = $2`, [imageUrl, recordId]);
          } catch(e) {
            try {
               // Then fallback to snake_case schema logic
               await client.query(`UPDATE ${tableName} SET payment_proof_url = $1, payment_status = 'PENDING_REVIEW' WHERE id = $2`, [imageUrl, recordId]);
            } catch (err) {}
          }
      }

      // 建立 AdminNotification 表格（如果不存在）
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_notifications (
          id VARCHAR(50) PRIMARY KEY,
          temple_id VARCHAR(50),
          guest_id VARCHAR(50),
          category VARCHAR(50),
          message TEXT,
          is_read BOOLEAN DEFAULT false,
          link_path TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(
        `INSERT INTO admin_notifications (id, temple_id, guest_id, category, message, is_read, link_path)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
         [`notif-${Date.now()}`, templeId, guestId || null, 'PENDING_REVIEW', message, false, linkPath]
      );
    }
    
    await revalidateTemple(templeId);
    return { success: true };
  });
}

// 2. Fetch Admin Notifications
export async function getAdminNotifications() {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      return (gStore.db_admin_notifications || [])
        .filter((n: any) => n.templeId === templeId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      try {
          const res = await client.query(`SELECT * FROM admin_notifications WHERE temple_id = $1 ORDER BY created_at DESC`, [templeId]);
          return res.rows.map(r => ({
            id: r.id,
            templeId: r.temple_id,
            guestId: r.guest_id,
            category: r.category,
            message: r.message,
            isRead: r.is_read,
            linkPath: r.link_path,
            createdAt: r.created_at
          }));
      } catch(e) {
          return [];
      }
    }
  });
}

// 3. Toggle Payment Status
export async function togglePaymentStatus(recordId: string, recordType: 'Appointment' | 'LampRecord' | 'EventRegistration', currentStatus: string) {
  const templeId = await getDynamicTempleId();
  // 由於是切換狀態，如果是 PAID 則切為 PENDING_REVIEW（待確認），否則就切回 PAID（已收款）
  const nextStatus = currentStatus === 'PAID' || currentStatus === 'Paid' ? 'PENDING_REVIEW' : 'PAID';
  
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      if (recordType === 'Appointment') {
        const idx = gStore.db_appointments?.findIndex((a: any) => String(a.id) === String(recordId));
        if (idx !== undefined && idx !== -1) gStore.db_appointments[idx].paymentStatus = nextStatus;
      } else if (recordType === 'LampRecord') {
        const idx = gStore.db_lamp_records?.findIndex((a: any) => String(a.id) === String(recordId));
        if (idx !== undefined && idx !== -1) gStore.db_lamp_records[idx].paymentStatus = nextStatus;
      } else if (recordType === 'EventRegistration') {
        const idx = gStore.db_event_registrations?.findIndex((a: any) => String(a.id) === String(recordId));
        if (idx !== undefined && idx !== -1) gStore.db_event_registrations[idx].paymentStatus = nextStatus;
      }
    } else {
      let tableName = '';
      if (recordType === 'Appointment') tableName = 'appointments';
      else if (recordType === 'LampRecord') tableName = 'lamp_records';
      else if (recordType === 'EventRegistration') tableName = 'event_registrations';
      
      if (tableName) {
          try {
            await client.query(`UPDATE ${tableName} SET "paymentStatus" = $1 WHERE id = $2`, [nextStatus, recordId]);
          } catch(e) {
            await client.query(`UPDATE ${tableName} SET payment_status = $1 WHERE id = $2`, [nextStatus, recordId]);
          }
      }
    }
    await revalidateTemple(templeId);
    return { success: true, nextStatus };
  });
}

// 4. Mark Notification as Read
export async function markNotificationAsRead(notifId: string) {
  const templeId = await getDynamicTempleId();
  return withTempleSession(templeId, false, async (client) => {
    if (!client) {
      const idx = (gStore.db_admin_notifications || []).findIndex((n: any) => n.id === notifId);
      if (idx !== -1) gStore.db_admin_notifications[idx].isRead = true;
    } else {
        try {
          await client.query(`UPDATE admin_notifications SET is_read = true WHERE id = $1`, [notifId]);
        } catch(e) {}
    }
    await revalidateTemple(templeId);
    return { success: true };
  });
}
