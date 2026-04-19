import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/submissions - List submissions with pagination and status filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    const [submissions, total] = await Promise.all([
      db.channelSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true, username: true, avatar: true } },
          category: { select: { id: true, name: true, slug: true, icon: true } },
          channel: { select: { id: true, title: true, username: true } },
          reviewer: { select: { id: true, name: true } },
        },
      }),
      db.channelSubmission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Submissions API error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// PUT /api/admin/submissions - Review a submission (approve/reject/request revision)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, reviewNote, reviewedBy } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const validStatuses = ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const submission = await db.channelSubmission.update({
      where: { id: parseInt(id) },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedBy: reviewedBy ? parseInt(reviewedBy) : null,
        reviewedAt: new Date(),
      },
    });

    // If approved, create or link a channel
    if (status === 'APPROVED') {
      const existingChannel = await db.channel.findUnique({
        where: { username: submission.telegramUsername.replace('@', '') },
      });

      if (!existingChannel) {
        const newChannel = await db.channel.create({
          data: {
            telegramId: `sub_${submission.id}`,
            username: submission.telegramUsername.replace('@', ''),
            title: submission.title || submission.telegramUsername,
            description: submission.description,
            type: submission.type,
            language: submission.language,
            categoryId: submission.categoryId,
            submittedById: submission.userId,
            isActive: true,
          },
        });
        // Link submission to the new channel
        await db.channelSubmission.update({
          where: { id: submission.id },
          data: { channelId: newChannel.id },
        });
      } else {
        // Link to existing channel
        await db.channelSubmission.update({
          where: { id: submission.id },
          data: { channelId: existingChannel.id },
        });
      }
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Failed to review submission' }, { status: 500 });
  }
}
