import { NextResponse } from 'next/server';
export async function GET() {
  const gStore = globalThis as any;
  return NextResponse.json({
    distributors: gStore.db_distributors || [],
    applications: gStore.db_distributor_applications || [],
    sales: gStore.db_dist_sales || [],
    temples: gStore.db_temples || []
  });
}
