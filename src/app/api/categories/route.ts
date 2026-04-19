import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const category = await db.category.findUnique({
        where: { slug },
        include: { children: true },
      });
      if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      return NextResponse.json(category);
    }

    const categories = await db.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { order: 'asc' },
      include: { children: true },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
