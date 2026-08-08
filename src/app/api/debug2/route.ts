import { fetchFinancialOverview } from '@/app/actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const data = await fetchFinancialOverview();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}
