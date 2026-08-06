import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // 使用 TRUNCATE CASCADE 清空測試資料表與其關聯的所有子資料表
    // 這將會清空宮廟、經銷商、業務以及相關的申請單
    await prisma.$executeRawUnsafe('TRUNCATE "Temple" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE "distributors" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE "dist_sales" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_applications" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE "temple_applications" CASCADE');
    
    // 順便清除可能建立的非管理員使用者 (如果有)
    await prisma.$executeRawUnsafe('DELETE FROM "User" WHERE role != \'super-admin\' AND role != \'SuperAdmin\'');

    return NextResponse.json({ success: true, message: '已成功清空所有宮廟、經銷商、業務與相關的測試資料！' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
