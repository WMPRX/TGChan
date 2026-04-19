import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const languageStats = await db.channel.groupBy({
      by: ['language'],
      _count: { id: true },
      _sum: { memberCount: true },
      where: { isActive: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const totalChannels = await db.channel.count({ where: { isActive: true } });
    const totalMembers = await db.channel.aggregate({
      _sum: { memberCount: true },
      where: { isActive: true },
    });

    const languages = languageStats.map((stat) => ({
      code: stat.language,
      channelCount: stat._count.id,
      memberCount: stat._sum.memberCount || 0,
    }));

    return NextResponse.json({
      totalChannels,
      totalMembers: totalMembers._sum.memberCount || 0,
      languages,
    });
  } catch (error) {
    console.error('Languages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch language stats' }, { status: 500 });
  }
}
