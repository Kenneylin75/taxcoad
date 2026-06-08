import React from 'react';
import { fetchQueueEvents, fetchQueueDashboard, fetchServiceDefinitions } from '@/app/actions';
import QueueManagerClient from './QueueManagerClient';

export default async function QueuePage() {
  const [events, services] = await Promise.all([
    fetchQueueEvents(),
    fetchServiceDefinitions()
  ]);
  
  const activeEvent = events.find(e => e.status === 'Active');

  let dashboardData: any = { tickets: [] };
  if (activeEvent) {
    dashboardData = await fetchQueueDashboard(activeEvent.id);
  }

  return <QueueManagerClient initialEvents={events} initialDashboard={dashboardData} services={services} />;
}
