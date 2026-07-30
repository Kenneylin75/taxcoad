"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { getDynamicTempleId, revalidateTemple } from "./actions";

export interface AdminNotificationRow {
  id: string;
  templeId: string;
  guestId: string | null;
  category: string;
  message: string;
  isRead: boolean;
  linkPath: string | null;
  createdAt: Date | string;
}

// 1. Upload Payment Proof
export async function uploadPaymentProof(recordId: string, recordType: 'Appointment' | 'LampRecord' | 'EventRegistration', imageUrl: string, guestId?: string, paymentRef?: string, paymentMethod?: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  
  let message = `有信眾上傳了匯款截圖/後五碼，請盡快核對款項。`;
  let linkPath = `/${templeId}/admin/queue`; // Default fallback path

  try {
    
    if (recordType === 'Appointment') {
      await prisma.appointment.update({
        where: { id: recordId },
        data: {
          paymentProofUrl: imageUrl || undefined,
          paymentRef: paymentRef || undefined,
          paymentMethod: paymentMethod || undefined,
          paymentStatus: 'PENDING_REVIEW'
        }
      });
      message = `預約單號 ${recordId} 上傳了匯款截圖/後五碼`;
      linkPath = `/${templeId}/admin/calendar`;
    } else if (recordType === 'LampRecord') {
      await prisma.lampRecord.update({
        where: { id: recordId },
        data: {
          paymentProofUrl: imageUrl || undefined,
          paymentMethod: paymentMethod || undefined,
          paymentStatus: 'PENDING_REVIEW'
        }
      });
      message = `點燈紀錄 ${recordId} 上傳了匯款截圖/後五碼`;
      linkPath = `/${templeId}/admin/lamps`;
    } else if (recordType === 'EventRegistration') {
      await prisma.eventRegistration.update({
        where: { id: recordId },
        data: {
          paymentProofUrl: imageUrl || undefined,
          paymentRef: paymentRef || undefined,
          paymentMethod: paymentMethod || undefined,
          paymentStatus: 'PENDING_REVIEW'
        }
      });
      message = `法會報名 ${recordId} 上傳了匯款截圖/後五碼`;
      linkPath = `/${templeId}/admin/events`;
    }

    await prisma.adminNotification.create({
      data: {
        templeId,
        guestId: guestId || null,
        category: 'PENDING_REVIEW',
        message,
        isRead: false,
        linkPath
      }
    });

    await revalidateTemple(templeId);
    return { success: true };
  } catch (e) {
    console.error("uploadPaymentProof error:", e);
    return { success: false };
  }
}

// 2. Fetch Admin Notifications
export async function getAdminNotifications() {
  const templeId = await getDynamicTempleId();
  if (!templeId) return [];
  
  try {
    const notifications = await prisma.adminNotification.findMany({
      where: { templeId },
      orderBy: { createdAt: 'desc' }
    });
    
    return notifications.map(r => ({
      id: r.id,
      templeId: r.templeId,
      guestId: r.guestId,
      category: r.category,
      message: r.message,
      isRead: r.isRead,
      linkPath: r.linkPath,
      createdAt: r.createdAt.toISOString()
    }));
  } catch (e) {
    console.error("getAdminNotifications error:", e);
    return [];
  }
}

// 3. Toggle Payment Status
export async function togglePaymentStatus(recordId: string, recordType: 'Appointment' | 'LampRecord' | 'EventRegistration', currentStatus: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  // 由於是切換狀態，如果是 PAID 則切為 PENDING_REVIEW（待確認），否則就切回 PAID（已收款）
  const nextStatus = currentStatus === 'PAID' || currentStatus === 'Paid' ? 'PENDING_REVIEW' : 'PAID';
  
  try {
    if (recordType === 'Appointment') {
      await prisma.appointment.update({
        where: { id: recordId },
        data: { paymentStatus: nextStatus }
      });
    } else if (recordType === 'LampRecord') {
      await prisma.lampRecord.update({
        where: { id: recordId },
        data: { paymentStatus: nextStatus }
      });
    } else if (recordType === 'EventRegistration') {
      await prisma.eventRegistration.update({
        where: { id: recordId },
        data: { paymentStatus: nextStatus }
      });
    }
    await revalidateTemple(templeId);
    return { success: true, nextStatus };
  } catch (e) {
    console.error("togglePaymentStatus error:", e);
    return { success: false };
  }
}

// 4. Mark Notification as Read
export async function markNotificationAsRead(notifId: string) {
  const templeId = await getDynamicTempleId();
  if (!templeId) return { success: false };
  
  try {
    await prisma.adminNotification.update({
      where: { id: notifId },
      data: { isRead: true }
    });
    await revalidateTemple(templeId);
    return { success: true };
  } catch (e) {
    console.error("markNotificationAsRead error:", e);
    return { success: false };
  }
}
