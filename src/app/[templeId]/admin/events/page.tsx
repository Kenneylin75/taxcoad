import React from 'react';
import { fetchEvents } from '@/app/actions';
import EventManagerClient from './EventManagerClient';

export default async function EventsPage() {
  const events = await fetchEvents();
  return <EventManagerClient initialEvents={events} />;
}
