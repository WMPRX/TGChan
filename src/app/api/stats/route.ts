import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      totalChannels,
      totalGroups,
      totalMembersAgg,
      todayAdded,
      registeredUsers,
      pendingSubmissions,
      activePremium,
    ] = await Promise.all([
      db.channel.count({ where: { type: 'CHANNEL', isActive: true } }),
      db.channel.count({ where: { type: { in: ['GROUP', 'SUPERGROUP'] }, isActive: true } }),
      db.channel.aggregate({ _sum: { memberCount: true }, where: { isActive: true } }),
      db.channel.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      db.user.count({ where: { isActive: true } }),
      db.channelSubmission.count({ where: { status: 'PENDING' } }),
      db.channel.count({ where: { isPremium: true, premiumUntil: { gt: new Date() } } }),
    ]);

    return NextResponse.json({
      totalChannels,
      totalGroups,
      totalMembers: totalMembersAgg._sum.memberCount || 0,
      todayAdded,
      registeredUsers,
      pendingSubmissions,
      activePremium,
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
