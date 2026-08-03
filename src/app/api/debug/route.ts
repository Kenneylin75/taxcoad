import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  return NextResponse.json({
    distributors: await prisma.distributor.findMany(),
    applications: await prisma.distributorApplication.findMany(),
    sales: await prisma.distributorSales.findMany(),
    temples: await prisma.temple.findMany()
  });
}
