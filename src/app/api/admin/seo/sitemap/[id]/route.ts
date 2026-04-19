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
  const upper = typeof val === 'string' ? val.toUpperCase() : '';
  if (VALID_CHANGE_FREQ.includes(upper as ChangeFreq)) return upper as ChangeFreq;
  return 'WEEKLY';
}

// PUT /api/admin/seo/sitemap/[id] - Update SitemapEntry by id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = parseInt(id);

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid sitemap entry id' }, { status: 400 });
    }

    const existing = await db.sitemapEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sitemap entry not found' }, { status: 404 });
    }

    const body = await req.json();
    const { url, priority, changeFreq, lastMod, isExcluded } = body;

    // If url is being changed, check for duplicates
    if (url && url !== existing.url) {
      const duplicate = await db.sitemapEntry.findUnique({
        where: { url },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A sitemap entry with this url already exists' },
          { status: 409 }
        );
      }
    }

    const entry = await db.sitemapEntry.update({
      where: { id: entryId },
      data: {
        ...(url !== undefined && { url }),
        ...(priority !== undefined && { priority: safeFloat(priority, existing.priority) }),
        ...(changeFreq !== undefined && { changeFreq: safeChangeFreq(changeFreq) }),
        ...(lastMod !== undefined && { lastMod: new Date(lastMod) }),
        ...(isExcluded !== undefined && { isExcluded: safeBool(isExcluded, false) }),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('SEO sitemap PUT error:', error);
    return NextResponse.json({ error: 'Failed to update sitemap entry' }, { status: 500 });
  }
}

// DELETE /api/admin/seo/sitemap/[id] - Delete SitemapEntry by id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entryId = parseInt(id);

    if (isNaN(entryId)) {
      return NextResponse.json({ error: 'Invalid sitemap entry id' }, { status: 400 });
    }

    const existing = await db.sitemapEntry.findUnique({
      where: { id: entryId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Sitemap entry not found' }, { status: 404 });
    }

    await db.sitemapEntry.delete({
      where: { id: entryId },
    });

    return NextResponse.json({ message: 'Sitemap entry deleted successfully' });
  } catch (error) {
    console.error('SEO sitemap DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete sitemap entry' }, { status: 500 });
  }
}
