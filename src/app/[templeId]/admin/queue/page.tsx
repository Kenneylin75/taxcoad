import React from 'react';
import { fetchQueueEvents, fetchQueueDashboard, fetchServiceDefinitions } from '@/app/actions';
import QueueManagerClient from './QueueManagerClient';

export default async function QueuePage(props: { searchParams: Promise<{ eventId?: string }> }) {
  const searchParams = await props.searchParams;
  const [events, services] = await Promise.all([
    fetchQueueEvents(),
    fetchServiceDefinitions()
  ]);
  
  const activeEvents = events.filter(e => e.status === 'Active');
  const activeEvent = searchParams.eventId 
    ? activeEvents.find(e => e.id === searchParams.eventId) || activeEvents[0]
    : activeEvents[0];

  let dashboardData: any = { tickets: [] };
  if (activeEvent) {
    dashboardData = await fetchQueueDashboard(activeEvent.id);
  }

  return <QueueManagerClient initialEvents={events} initialDashboard={dashboardData} services={services} activeEventId={activeEvent?.id} />;
}
