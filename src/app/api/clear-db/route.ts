import { NextResponse } from 'next/server';
import { dbQuery } from '@/db/db';

export async function GET() {
  try {
    // 清空 distributors 與 distributor_sales 表格
    await dbQuery('DELETE FROM distributors');
    await dbQuery('DELETE FROM distributor_sales');
    return NextResponse.json({ success: true, message: '已成功清空所有經銷商與業務的資料！' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
