import React from 'react';
import { getCurrentRole, getCurrentUser, getTempleBasicInfo, fetchTempleBills } from '@/app/actions';
import TempleShell from './TempleShell';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function TempleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ templeId: string }> | { templeId: string } }) {
  const currentRole = await getCurrentRole();
  const currentUser = await getCurrentUser();
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || headersList.get('next-url') || '';
  const isLoginPage = pathname.includes('/admin/login');

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Basic security check for Temple module
  if (!currentRole || !currentUser || !['TempleAdmin', 'Staff', 'Service', 'SuperAdmin'].includes(currentRole)) {
     redirect('/login');
  }

  const templeInfo = await getTempleBasicInfo(templeId);

  const bills = await fetchTempleBills(templeId);
  const hasUnpaid = bills?.some((e: any) => e.status === 'Unpaid');
  
  // 計算過期與寬限期邏輯 (3 天寬限期)
  let isExpired = false;
  const isSuperAdmin = currentRole === 'SuperAdmin' || (currentRole as any) === 'super-admin';
  
  if (templeInfo && templeInfo.billingStartDate) {
    const expirationDate = new Date(templeInfo.billingStartDate);
    expirationDate.setDate(expirationDate.getDate() + 3); // 3 天寬限期
    
    if (new Date() >= expirationDate) {
      isExpired = true;
    }
  }

  // 只有當「已過期(含寬限期)」且「有未繳帳單」，且「不是總部超級管理員」時，才強制阻斷跳轉
  if (!isSuperAdmin && isExpired && hasUnpaid && !pathname.includes('/billing') && !pathname.includes('/payment-setup')) {
    redirect(`/${templeId}/admin/billing`);
  }


  if (templeInfo && (templeInfo.status === 'PendingPayment' || templeInfo.status === 'UnderReview')) {
    if (!pathname.includes('/activation')) {
      redirect(`/${templeId}/admin/activation`);
    }
    // Render without TempleShell
    return <>{children}</>;
  }
  
  return (
    <TempleShell currentRole={currentRole} currentUser={currentUser} templeId={templeId}>
       {children}
    </TempleShell>
  );
}
