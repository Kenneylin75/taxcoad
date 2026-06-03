import React from 'react';
import { 
  getCurrentRole, 
  getCurrentUser,
  fetchGlobalTempleData,
  fetchStoragePlans
} from '@/app/actions';
import DashboardContainer from './DashboardContainer';
import SuperAdminView from './SuperAdminView';
import SalesView from './SalesView';

export default async function AdminDashboard() {
  const currentRole = await getCurrentRole();
  const currentUser = await getCurrentUser();
  
  // 🔗 使用中央數據樞紐 (Orchestration Layer)
  const {
    analyticsSettings,
    analyticsData,
    raw
  } = await fetchGlobalTempleData();

  const storagePlans = await fetchStoragePlans();

  return (
    <DashboardContainer 
      storagePlans={storagePlans}
      initialAppointments={raw.apps} 
      agiStats={raw.agiStats}
      todayCount={analyticsData.todayAppointments}
      guests={raw.guests}
      storageInfo={raw.storageInfo}
      queueSummary={raw.qActive} 
      analyticsSettings={analyticsSettings}
      analyticsData={analyticsData}
    />
  );
}
