import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Get channels submitted by this user via ChannelSubmission
    const submissions = await db.channelSubmission.findMany({
      where: { userId: parseInt(userId) },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        channel: {
          select: {
            id: true,
            username: true,
            title: true,
            type: true,
            memberCount: true,
            language: true,
            isPremium: true,
            isVerified: true,
            isFeatured: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format the response - merge submission status with channel data
    const channels = submissions.map((sub) => {
      const channelData = sub.channel;
      return {
        id: sub.id,
        channelId: channelData?.id || null,
        username: sub.telegramUsername,
        title: sub.title || channelData?.title || sub.telegramUsername,
        description: sub.description,
        type: sub.type,
        memberCount: channelData?.memberCount || 0,
        language: sub.language,
        status: sub.status,
        isPremium: channelData?.isPremium || false,
        isVerified: channelData?.isVerified || false,
        isFeatured: channelData?.isFeatured || false,
        category: sub.category,
        inviteLink: sub.inviteLink,
        createdAt: sub.createdAt,
      };
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Dashboard channels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}
