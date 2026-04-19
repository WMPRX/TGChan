import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/comments - List all comments (with filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // PENDING | APPROVED | REJECTED | ALL
    const channelId = searchParams.get('channelId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (channelId) {
      where.channelId = parseInt(channelId);
    }

    const [comments, total] = await Promise.all([
      db.channelComment.findMany({
        where,
        include: {
          channel: {
            select: {
              id: true,
              title: true,
              username: true,
              avatarUrl: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.channelComment.count({ where }),
    ]);

    // Get counts by status
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      db.channelComment.count({ where: { status: 'PENDING' } }),
      db.channelComment.count({ where: { status: 'APPROVED' } }),
      db.channelComment.count({ where: { status: 'REJECTED' } }),
    ]);

    return NextResponse.json({
      comments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error('Admin Comments GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// PUT /api/admin/comments - Approve/reject/delete a comment
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, reviewerId, rejectReason } = body;

    if (!id || !action || !reviewerId) {
      return NextResponse.json({ error: 'id, action, and reviewerId are required' }, { status: 400 });
    }

    const commentId = parseInt(id);
    const existing = await db.channelComment.findUnique({ where: { id: commentId } });

    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (action === 'APPROVE') {
      const comment = await db.channelComment.update({
        where: { id: commentId },
        data: {
          status: 'APPROVED',
          reviewedBy: parseInt(reviewerId),
          reviewedAt: new Date(),
        },
        include: {
          channel: { select: { id: true, title: true, username: true } },
          user: { select: { id: true, name: true, username: true } },
        },
      });
      return NextResponse.json({ comment });
    }

    if (action === 'REJECT') {
      const comment = await db.channelComment.update({
        where: { id: commentId },
        data: {
          status: 'REJECTED',
          reviewedBy: parseInt(reviewerId),
          reviewedAt: new Date(),
          rejectReason: rejectReason || null,
        },
        include: {
          channel: { select: { id: true, title: true, username: true } },
          user: { select: { id: true, name: true, username: true } },
        },
      });
      return NextResponse.json({ comment });
    }

    return NextResponse.json({ error: 'Invalid action. Use APPROVE or REJECT' }, { status: 400 });
  } catch (error) {
    console.error('Admin Comments PUT error:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE /api/admin/comments?id=X - Delete a comment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const commentId = parseInt(id);
    const existing = await db.channelComment.findUnique({ where: { id: commentId } });

    if (!existing) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    await db.channelComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Comments DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
