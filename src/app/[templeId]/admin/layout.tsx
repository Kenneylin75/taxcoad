import React from 'react';
import { getCurrentRole, getCurrentUser } from '@/app/actions';
import TempleShell from './TempleShell';
import { redirect } from 'next/navigation';

export default async function TempleLayout({ children, params }: { children: React.ReactNode, params: Promise<{ templeId: string }> | { templeId: string } }) {
  const currentRole = await getCurrentRole();
  const currentUser = await getCurrentUser();
  const resolvedParams = await params;
  const templeId = resolvedParams.templeId;

  // Basic security check for Temple module
  if (!currentRole || !['TempleAdmin', 'Staff', 'Service', 'SuperAdmin'].includes(currentRole)) {
     redirect('/login');
  }
  
  return (
    <TempleShell currentRole={currentRole} currentUser={currentUser} templeId={templeId}>
       {children}
    </TempleShell>
  );
}
