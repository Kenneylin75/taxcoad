import React from 'react';
import { getCurrentRole, getCurrentUser, getTempleBasicInfo } from '@/app/actions';
import TempleShell from './TempleShell';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function TempleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ templeId: string }> | { templeId: string } }) {
  const currentRole = await getCurrentRole();
  const currentUser = await getCurrentUser();
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;

  // Basic security check for Temple module
  if (!currentRole || !['TempleAdmin', 'Staff', 'Service', 'SuperAdmin'].includes(currentRole)) {
     redirect('/login');
  }

  const templeInfo = await getTempleBasicInfo(templeId);
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') || '';

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
