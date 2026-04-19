import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/comments?channelId=X - Get approved comments for a channel
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get('channelId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      db.channelComment.findMany({
        where: {
          channelId: parseInt(channelId),
          status: 'APPROVED',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.channelComment.count({
        where: {
          channelId: parseInt(channelId),
          status: 'APPROVED',
        },
      }),
    ]);

    return NextResponse.json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/comments - Submit a new comment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { channelId, userId, content } = body;

    if (!channelId || !userId || !content) {
      return NextResponse.json({ error: 'channelId, userId, and content are required' }, { status: 400 });
    }

    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content cannot be empty' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Comment is too long (max 1000 characters)' }, { status: 400 });
    }

    // Verify channel exists
    const channel = await db.channel.findUnique({
      where: { id: parseInt(channelId) },
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Verify user exists and is not banned
    const user = await db.user.findUnique({
      where: { id: parseInt(userId) },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'You are banned from commenting' }, { status: 403 });
    }

    // Check if user already has a pending comment for this channel (rate limiting)
    const existingPending = await db.channelComment.findFirst({
      where: {
        channelId: parseInt(channelId),
        userId: parseInt(userId),
        status: 'PENDING',
      },
    });

    if (existingPending) {
      return NextResponse.json({ error: 'You already have a pending comment for this channel' }, { status: 429 });
    }

    const comment = await db.channelComment.create({
      data: {
        channelId: parseInt(channelId),
        userId: parseInt(userId),
        content: content.trim(),
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: 'Failed to submit comment' }, { status: 500 });
  }
}
