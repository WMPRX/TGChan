import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [totalChannels, totalGroups, totalMembers, registeredUsers, pendingSubmissions, activePremium] = await Promise.all([
      db.channel.count({ where: { type: 'CHANNEL', isActive: true } }),
      db.channel.count({ where: { type: { in: ['GROUP', 'SUPERGROUP'] }, isActive: true } }),
      db.channel.aggregate({ _sum: { memberCount: true }, where: { isActive: true } }),
      db.user.count({ where: { isActive: true } }),
      db.channelSubmission.count({ where: { status: 'PENDING' } }),
      db.channel.count({ where: { isPremium: true, premiumUntil: { gt: new Date() } } }),
    ]);

    return NextResponse.json({
      totalChannels,
      totalGroups,
      totalMembers: totalMembers._sum.memberCount || 0,
      registeredUsers,
      pendingSubmissions,
      activePremium,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
