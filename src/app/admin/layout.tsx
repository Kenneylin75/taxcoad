import React from 'react';
import { getCurrentRole, getCurrentUser } from '@/app/actions';
import AdminShell from './AdminShell';
import { redirect } from 'next/navigation';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const currentRole = await getCurrentRole();
  const currentUser = await getCurrentUser();

  if (!currentRole || (currentRole as string) !== 'SuperAdmin') {
     redirect('/login');
  }
  
  return (
    <AdminShell currentRole={currentRole} currentUser={currentUser}>
       {children}
    </AdminShell>
  );
}
