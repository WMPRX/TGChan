import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const plans = await db.premiumPlan.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Premium plans API error:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
