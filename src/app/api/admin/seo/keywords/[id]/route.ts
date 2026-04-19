import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe nullable Int
function safeNullableInt(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

// Helper: safe boolean
function safeBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return fallback;
}

// Helper: stringify if not already a string
function safeStringify(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

// PUT /api/admin/seo/keywords/[id] - Update SeoKeyword by id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const keywordId = parseInt(id);

    if (isNaN(keywordId)) {
      return NextResponse.json({ error: 'Invalid keyword id' }, { status: 400 });
    }

    const existing = await db.seoKeyword.findUnique({
      where: { id: keywordId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'SEO keyword not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      keyword,
      language,
      country,
      currentPosition,
      previousPosition,
      searchVolume,
      difficulty,
      targetUrl,
      isTracking,
      lastCheckedAt,
      history,
    } = body;

    const seoKeyword = await db.seoKeyword.update({
      where: { id: keywordId },
      data: {
        ...(keyword !== undefined && { keyword }),
        ...(language !== undefined && { language }),
        ...(country !== undefined && { country: country || null }),
        ...(currentPosition !== undefined && { currentPosition: safeNullableInt(currentPosition) }),
        ...(previousPosition !== undefined && { previousPosition: safeNullableInt(previousPosition) }),
        ...(searchVolume !== undefined && { searchVolume: safeNullableInt(searchVolume) }),
        ...(difficulty !== undefined && { difficulty: safeNullableInt(difficulty) }),
        ...(targetUrl !== undefined && { targetUrl: targetUrl || null }),
        ...(isTracking !== undefined && { isTracking: safeBool(isTracking, true) }),
        ...(lastCheckedAt !== undefined && { lastCheckedAt: lastCheckedAt ? new Date(lastCheckedAt) : null }),
        ...(history !== undefined && { history: safeStringify(history) }),
      },
    });

    return NextResponse.json(seoKeyword);
  } catch (error) {
    console.error('SEO keyword PUT error:', error);
    return NextResponse.json({ error: 'Failed to update SEO keyword' }, { status: 500 });
  }
}

// DELETE /api/admin/seo/keywords/[id] - Delete SeoKeyword by id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const keywordId = parseInt(id);

    if (isNaN(keywordId)) {
      return NextResponse.json({ error: 'Invalid keyword id' }, { status: 400 });
    }

    const existing = await db.seoKeyword.findUnique({
      where: { id: keywordId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'SEO keyword not found' }, { status: 404 });
    }

    await db.seoKeyword.delete({
      where: { id: keywordId },
    });

    return NextResponse.json({ message: 'SEO keyword deleted successfully' });
  } catch (error) {
    console.error('SEO keyword DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete SEO keyword' }, { status: 500 });
  }
}
