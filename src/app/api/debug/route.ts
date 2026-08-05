import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming this is where prisma is exported from

export async function GET() {
  try {
    // Try using global prisma if @/lib/prisma is not the right path
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    
    const temples = await p.temple.findMany();
    const dists = await p.distributor.findMany();
    const distSales = await p.distributorSales.findMany();
    const users = await p.user.findMany({ where: { role: 'SuperSales' }});
    
    return NextResponse.json({ temples, dists, distSales, users });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
