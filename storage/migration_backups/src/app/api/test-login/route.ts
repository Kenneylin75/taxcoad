import { NextResponse } from 'next/server';
import { createDistributorAccount, loginAccount } from '@/app/actions';

export async function GET() {
  try {
    const data = {
      name: 'Test Dist',
      account: 'admin333',
      password: 'password123',
      planId: 'PLAN-A',
      customPrice: '160000',
      years: '2'
    };
    
    const createRes = await createDistributorAccount(data);
    
    const fd = new FormData();
    fd.append('account', 'admin333');
    fd.append('password', 'password123');
    
    const loginRes = await loginAccount(fd);
    
    return NextResponse.json({
      createRes,
      loginRes
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
