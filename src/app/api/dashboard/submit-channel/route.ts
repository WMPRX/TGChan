import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, telegramUsername, title, description, type, language, categoryId, inviteLink } = body;

    if (!userId || !telegramUsername) {
      return NextResponse.json({ error: 'userId and telegramUsername are required' }, { status: 400 });
    }

    // Clean username - remove @ prefix
    const cleanUsername = telegramUsername.replace(/^@/, '').trim();

    if (!cleanUsername) {
      return NextResponse.json({ error: 'Invalid Telegram username' }, { status: 400 });
    }

    // Check if a submission for this username already exists by this user
    const existing = await db.channelSubmission.findFirst({
      where: {
        userId: parseInt(userId),
        telegramUsername: cleanUsername,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already submitted this channel' }, { status: 409 });
    }

    // Create the submission
    const submission = await db.channelSubmission.create({
      data: {
        userId: parseInt(userId),
        telegramUsername: cleanUsername,
        title: title || null,
        description: description || null,
        type: type || 'CHANNEL',
        language: language || 'en',
        categoryId: categoryId ? parseInt(categoryId) : null,
        inviteLink: inviteLink || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ submission }, { status: 201 });
  } catch (error) {
    console.error('Submit channel API error:', error);
    return NextResponse.json({ error: 'Failed to submit channel' }, { status: 500 });
  }
}
