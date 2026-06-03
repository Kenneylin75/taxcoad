import { NextResponse } from 'next/server';
import { fetchServiceDefinitions, fetchForms, fetchAppointments, fetchAvailableSlots } from '@/app/actions';

export async function GET() {
  const services = await fetchServiceDefinitions();
  const forms = await fetchForms();
  const appointments = await fetchAppointments();
  const slots = await fetchAvailableSlots();
  
  return NextResponse.json({ services, forms, appointments, slots });
}
