import React from 'react';
import { fetchQueueEvents, fetchQueueDashboard, fetchServiceDefinitions } from '@/app/actions';
import QueueManagerClient from './QueueManagerClient';

export default async function QueuePage() {
  const [events, services] = await Promise.all([
    fetchQueueEvents(),
    fetchServiceDefinitions()
  ]);
  // DEMO INJECTION: If no events, create a fake active one
  let displayEvents = events;
  if (events.length === 0) {
    displayEvents = [{ id: 'qe-demo', title: '週年慶特別服務', date: new Date().toISOString().split('T')[0], location: '大雄寶殿', maxCapacity: 100, serviceType: '收驚解厄', status: 'Active', startTime: '09:00', endTime: '17:00' }];
  }

  let activeEvent = displayEvents.find(e => e.status === 'Active');
  
  // If no active event, make the first one active for demo
  if (!activeEvent && displayEvents.length > 0) {
    displayEvents[0].status = 'Active';
    activeEvent = displayEvents[0];
  }

  let dashboardData = null;
  if (activeEvent) {
    dashboardData = await fetchQueueDashboard(activeEvent.id);
    
    // If no tickets, add demo tickets
    if (!dashboardData || !dashboardData.tickets || dashboardData.tickets.length === 0) {
      dashboardData = {
        tickets: [
          { id: 't1-demo', eventId: activeEvent.id, status: 'Calling', assignedNumber: 'A001', guestName: '王大明', phone: '0912-345-678', actualOrder: 1, scannedAt: '15:10:00' },
          { id: 't2-demo', eventId: activeEvent.id, status: 'Queuing', assignedNumber: 'A002', guestName: '林小美', phone: '0988-777-666', actualOrder: 2, scannedAt: '15:12:30' },
          { id: 't3-demo', eventId: activeEvent.id, status: 'Queuing', assignedNumber: 'A003', guestName: '張志強', phone: '0933-111-222', actualOrder: 3, scannedAt: '15:15:45' }
        ]
      };
    }
  }

  return <QueueManagerClient initialEvents={displayEvents} initialDashboard={dashboardData} services={services} />;
}
