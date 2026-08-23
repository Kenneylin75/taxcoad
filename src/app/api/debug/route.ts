import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();
  try {
    const temples = await prisma.temple.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    return NextResponse.json({ temples });
  } catch(e: any) {
    return NextResponse.json({ error: e.message });
  } finally {
    await prisma.$disconnect();
  }
}
