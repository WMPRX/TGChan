import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || 'global';
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'members';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type');

    const where: Record<string, unknown> = { isActive: true };

    if (language && language !== 'global') {
      where.language = language;
    }

    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { username: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (type) {
      where.type = type.toUpperCase();
    }

    const orderBy: Record<string, string> = {};
    if (sort === 'members') orderBy.memberCount = 'desc';
    else if (sort === 'growth') orderBy.weeklyGrowth = 'desc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';

    const [channels, total] = await Promise.all([
      db.channel.findMany({
        where,
        orderBy: [isPremiumSortFirst(), isFeaturedSortFirst(), orderBy],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          tags: { select: { id: true, name: true, slug: true } },
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
    console.error('Channels API error:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

function isPremiumSortFirst() {
  return { isPremium: 'desc' as const };
}

function isFeaturedSortFirst() {
  return { isFeatured: 'desc' as const };
}
