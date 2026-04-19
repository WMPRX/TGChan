import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe Int
function safeInt(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

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

// PUT /api/admin/seo/broken-links/[id] - Update BrokenLink by id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const linkId = parseInt(id);

    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'Invalid broken link id' }, { status: 400 });
    }

    const existing = await db.brokenLink.findUnique({
      where: { id: linkId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Broken link not found' }, { status: 404 });
    }

    const body = await req.json();
    const { url, statusCode, referrer, userAgent, hitCount, lastHitAt, isResolved, resolvedWithRedirectId } = body;

    const brokenLink = await db.brokenLink.update({
      where: { id: linkId },
      data: {
        ...(url !== undefined && { url }),
        ...(statusCode !== undefined && { statusCode: safeInt(statusCode, existing.statusCode) }),
        ...(referrer !== undefined && { referrer: referrer || null }),
        ...(userAgent !== undefined && { userAgent: userAgent || null }),
        ...(hitCount !== undefined && { hitCount: safeInt(hitCount, existing.hitCount) }),
        ...(lastHitAt !== undefined && { lastHitAt: new Date(lastHitAt) }),
        ...(isResolved !== undefined && { isResolved: safeBool(isResolved, false) }),
        ...(resolvedWithRedirectId !== undefined && { resolvedWithRedirectId: safeNullableInt(resolvedWithRedirectId) }),
      },
    });

    return NextResponse.json(brokenLink);
  } catch (error) {
    console.error('SEO broken-link PUT error:', error);
    return NextResponse.json({ error: 'Failed to update broken link' }, { status: 500 });
  }
}

// DELETE /api/admin/seo/broken-links/[id] - Delete BrokenLink by id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const linkId = parseInt(id);

    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'Invalid broken link id' }, { status: 400 });
    }

    const existing = await db.brokenLink.findUnique({
      where: { id: linkId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Broken link not found' }, { status: 404 });
    }

    await db.brokenLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ message: 'Broken link deleted successfully' });
  } catch (error) {
    console.error('SEO broken-link DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete broken link' }, { status: 500 });
  }
}
