import { NextResponse } from 'next/server';
import { ensurePlatformTables } from '@/app/actions';

export async function GET() {
  try {
    await ensurePlatformTables();
    
    // Fix existing bills in memory to point to admin200
    let count = 0;
    const gStore = globalThis as any;
    const allBills = gStore.db_temple_bills || [];
    
    for (const bill of allBills) {
      if (!bill.payeeRole && (bill.templeId.includes('201') || bill.templeId.includes('202'))) {
        bill.payeeRole = 'Distributor';
        bill.payeeId = 'admin200'; // Assuming admin200 is the distributor ID
        count++;
      }
    }
    
    return NextResponse.json({ success: true, count, message: 'In-memory bills fixed' });
  } catch (error: any) {
    console.error('Failed to fix bills', error);
    return NextResponse.json({ success: false, error: error.message });
  }
}
