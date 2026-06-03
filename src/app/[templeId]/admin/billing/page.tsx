// @ts-nocheck
import React from 'react';
import { fetchFinancialOverview, fetchFreeApplications } from '@/app/actions';
import FinancialManagerClient from './FinancialManagerClient';

export default async function BillingPage() {
  const [financialData, freeApps] = await Promise.all([
    fetchFinancialOverview(),
    fetchFreeApplications()
  ]);

  return <FinancialManagerClient initialData={financialData} freeApps={freeApps} />;
}
