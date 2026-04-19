import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/channels - List all channels with pagination, search, filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const type = searchParams.get('type');
    const isPremium = searchParams.get('isPremium');
    const isVerified = searchParams.get('isVerified');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { username: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    if (language) {
      where.language = language;
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    if (isPremium !== null && isPremium !== '') {
      where.isPremium = isPremium === 'true';
    }

    if (isVerified !== null && isVerified !== '') {
      where.isVerified = isVerified === 'true';
    }

    const [channels, total] = await Promise.all([
      db.channel.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          tags: { select: { id: true, name: true, slug: true } },
          submittedBy: { select: { id: true, name: true, username: true, email: true } },
        },
      }),
      db.channel.count({ where }),
    ]);

    return NextResponse.json({
      channels,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin channels GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

// POST /api/admin/channels - Create a new channel (admin adding manually)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      telegramId,
      username,
      title,
      description,
      type,
      avatarUrl,
      memberCount,
      language,
      categoryId,
      inviteLink,
      websiteUrl,
      isVerified,
      isFeatured,
      isPremium,
      premiumUntil,
      highlightColor,
      hasBadge,
    } = body;

    if (!telegramId || !username || !title) {
      return NextResponse.json(
        { error: 'telegramId, username, and title are required' },
        { status: 400 }
      );
    }

    // Check for existing telegramId or username
    const existing = await db.channel.findFirst({
      where: { OR: [{ telegramId }, { username }] },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A channel with this telegramId or username already exists' },
        { status: 409 }
      );
    }

    const channel = await db.channel.create({
      data: {
        telegramId,
        username,
        title,
        description: description || null,
        type: type || 'CHANNEL',
        avatarUrl: avatarUrl || null,
        memberCount: memberCount || 0,
        language: language || 'en',
        categoryId: categoryId || null,
        inviteLink: inviteLink || null,
        websiteUrl: websiteUrl || null,
        isVerified: isVerified || false,
        isFeatured: isFeatured || false,
        isPremium: isPremium || false,
        premiumUntil: premiumUntil ? new Date(premiumUntil) : null,
        highlightColor: highlightColor || null,
        hasBadge: hasBadge || false,
        isActive: true,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    console.error('Admin channels POST error:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}

// PUT /api/admin/channels - Update a channel
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Channel id is required' }, { status: 400 });
    }

    const existing = await db.channel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Handle date fields
    const data: Record<string, unknown> = { ...updateData };
    if (data.premiumUntil && typeof data.premiumUntil === 'string') {
      data.premiumUntil = new Date(data.premiumUntil);
    }

    const channel = await db.channel.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ channel });
  } catch (error) {
    console.error('Admin channels PUT error:', error);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

// DELETE /api/admin/channels - Delete a channel
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) {
      return NextResponse.json({ error: 'Channel id is required' }, { status: 400 });
    }

    const existing = await db.channel.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    await db.channel.delete({ where: { id } });

    return NextResponse.json({ message: 'Channel deleted successfully' });
  } catch (error) {
    console.error('Admin channels DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
