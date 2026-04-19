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

// GET /api/admin/seo/keywords - List all SeoKeywords
export async function GET() {
  try {
    const keywords = await db.seoKeyword.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(keywords);
  } catch (error) {
    console.error('SEO keywords GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SEO keywords' }, { status: 500 });
  }
}

// POST /api/admin/seo/keywords - Create new SeoKeyword
export async function POST(req: NextRequest) {
  try {
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
      history,
      lastCheckedAt,
    } = body;

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 });
    }

    const seoKeyword = await db.seoKeyword.create({
      data: {
        keyword,
        language: language || 'en',
        country: country || null,
        currentPosition: safeNullableInt(currentPosition),
        previousPosition: safeNullableInt(previousPosition),
        searchVolume: safeNullableInt(searchVolume),
        difficulty: safeNullableInt(difficulty),
        targetUrl: targetUrl || null,
        isTracking: safeBool(isTracking, true),
        history: safeStringify(history),
        lastCheckedAt: lastCheckedAt ? new Date(lastCheckedAt) : null,
      },
    });

    return NextResponse.json(seoKeyword, { status: 201 });
  } catch (error) {
    console.error('SEO keywords POST error:', error);
    return NextResponse.json({ error: 'Failed to create SEO keyword' }, { status: 500 });
  }
}
