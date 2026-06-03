import React from 'react';
import { fetchPersonnel, getCurrentRole } from '@/app/actions';
import PersonnelManagerClient from './PersonnelManagerClient';

export default async function PersonnelPage() {
  const [accounts, role] = await Promise.all([
    fetchPersonnel(),
    getCurrentRole()
  ]);

  return <PersonnelManagerClient initialAccounts={accounts} currentRole={role} />;
}
