import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/admin/seo/stats - Return SEO dashboard stats
export async function GET() {
  try {
    const [
      activeRedirectsCount,
      unresolvedBrokenLinksCount,
      trackingKeywordsCount,
      sitemapEntriesCount,
      activeSchemasCount,
      latestAudit,
    ] = await Promise.all([
      // Total redirects count (active)
      db.redirect.count({ where: { isActive: true } }),

      // Total broken links count (unresolved)
      db.brokenLink.count({ where: { isResolved: false } }),

      // Total keywords count (tracking)
      db.seoKeyword.count({ where: { isTracking: true } }),

      // Total sitemap entries count
      db.sitemapEntry.count(),

      // Total structured data schemas count (active)
      db.structuredData.count({ where: { isActive: true } }),

      // Latest audit score
      db.seoAudit.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { score: true, url: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      overallScore: latestAudit?.score ?? 72,
      activeRedirects: activeRedirectsCount,
      brokenLinks: unresolvedBrokenLinksCount,
      trackedKeywords: trackingKeywordsCount,
      sitemapEntries: sitemapEntriesCount,
      activeSchemas: activeSchemasCount,
    });
  } catch (error) {
    console.error('SEO stats GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SEO stats' }, { status: 500 });
  }
}
