import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid channel ID' }, { status: 400 });
    }

    const channel = await db.channel.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!channel || !channel.isActive) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Channel detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}
