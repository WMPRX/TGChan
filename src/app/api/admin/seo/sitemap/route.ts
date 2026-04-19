import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe Float parse
function safeFloat(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const n = typeof val === 'number' ? val : parseFloat(String(val));
  return isNaN(n) ? fallback : n;
}

// Helper: safe boolean
function safeBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return fallback;
}

// Valid change frequency values
const VALID_CHANGE_FREQ = ['ALWAYS', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'NEVER'] as const;
type ChangeFreq = typeof VALID_CHANGE_FREQ[number];

function safeChangeFreq(val: unknown): ChangeFreq {
  // Convert lowercase values to uppercase for flexibility
  const upper = typeof val === 'string' ? val.toUpperCase() : '';
  if (VALID_CHANGE_FREQ.includes(upper as ChangeFreq)) return upper as ChangeFreq;
  return 'WEEKLY';
}

// GET /api/admin/seo/sitemap - List all SitemapEntries
export async function GET() {
  try {
    const entries = await db.sitemapEntry.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('SEO sitemap GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sitemap entries' }, { status: 500 });
  }
}

// POST /api/admin/seo/sitemap - Create new SitemapEntry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, priority, changeFreq, lastMod, isExcluded } = body;

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Check for duplicate url
    const existing = await db.sitemapEntry.findUnique({
      where: { url },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A sitemap entry with this url already exists' },
        { status: 409 }
      );
    }

    const entry = await db.sitemapEntry.create({
      data: {
        url,
        priority: safeFloat(priority, 0.5),
        changeFreq: safeChangeFreq(changeFreq),
        lastMod: lastMod ? new Date(lastMod) : new Date(),
        isExcluded: safeBool(isExcluded, false),
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('SEO sitemap POST error:', error);
    return NextResponse.json({ error: 'Failed to create sitemap entry' }, { status: 500 });
  }
}
