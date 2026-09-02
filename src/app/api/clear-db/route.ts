import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const confirmCode = (body.confirmCode || '').trim().toUpperCase();

    if (confirmCode !== 'CLEAR-ALL') {
      return NextResponse.json(
        { success: false, error: '安全驗證失敗：請輸入正確的確認代碼「CLEAR-ALL」以執行清空。' },
        { status: 403 }
      );
    }

    // 使用 TRUNCATE CASCADE 清空測試資料表與其關聯的所有子資料表
    await prisma.$executeRawUnsafe('TRUNCATE "Temple" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributors" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "dist_sales" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_applications" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "temple_applications" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "temple_bills" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_withdrawals" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_contracts" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "BonusRequest" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "sales_visits" CASCADE').catch(() => {});
    
    // 清除非超級管理員的使用者
    await prisma.$executeRawUnsafe(
      `DELETE FROM "User" WHERE role NOT IN ('super-admin', 'SuperAdmin') AND account != 'admin'`
    ).catch(() => {});

    return NextResponse.json({ success: true, message: '已成功清空所有宮廟、經銷商、業務與相關的測試資料！' });
  } catch (error: any) {
    console.error('Clear DB error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const confirmCode = (searchParams.get('confirmCode') || '').trim().toUpperCase();

  if (confirmCode !== 'CLEAR-ALL') {
    return NextResponse.json(
      { success: false, error: '安全驗證失敗：請帶入正確的確認代碼 ?confirmCode=CLEAR-ALL 以執行清空。' },
      { status: 403 }
    );
  }

  try {
    await prisma.$executeRawUnsafe('TRUNCATE "Temple" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributors" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "dist_sales" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_applications" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "temple_applications" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "temple_bills" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_withdrawals" CASCADE').catch(() => {});
    await prisma.$executeRawUnsafe('TRUNCATE "distributor_contracts" CASCADE').catch(() => {});
    
    await prisma.$executeRawUnsafe(
      `DELETE FROM "User" WHERE role NOT IN ('super-admin', 'SuperAdmin') AND account != 'admin'`
    ).catch(() => {});

    return NextResponse.json({ success: true, message: '已成功清空所有宮廟、經銷商、業務與相關的測試資料！' });
  } catch (error: any) {
    console.error('Clear DB error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

