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

// GET /api/admin/seo/broken-links - List BrokenLinks with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const resolved = searchParams.get('resolved');

    const where: Record<string, unknown> = {};

    if (resolved !== null && resolved !== '') {
      where.isResolved = resolved === 'true';
    }

    const [brokenLinks, total] = await Promise.all([
      db.brokenLink.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.brokenLink.count({ where }),
    ]);

    return NextResponse.json({
      brokenLinks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('SEO broken-links GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch broken links' }, { status: 500 });
  }
}

// POST /api/admin/seo/broken-links - Create new BrokenLink
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, statusCode, referrer, userAgent, hitCount, lastHitAt, isResolved, resolvedWithRedirectId } = body;

    if (!url || statusCode === undefined) {
      return NextResponse.json(
        { error: 'url and statusCode are required' },
        { status: 400 }
      );
    }

    const brokenLink = await db.brokenLink.create({
      data: {
        url,
        statusCode: safeInt(statusCode, 404),
        referrer: referrer || null,
        userAgent: userAgent || null,
        hitCount: safeInt(hitCount, 1),
        lastHitAt: lastHitAt ? new Date(lastHitAt) : new Date(),
        isResolved: safeBool(isResolved, false),
        resolvedWithRedirectId: safeNullableInt(resolvedWithRedirectId),
      },
    });

    return NextResponse.json(brokenLink, { status: 201 });
  } catch (error) {
    console.error('SEO broken-links POST error:', error);
    return NextResponse.json({ error: 'Failed to create broken link' }, { status: 500 });
  }
}
