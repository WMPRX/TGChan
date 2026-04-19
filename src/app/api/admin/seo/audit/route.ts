import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe nullable Int
function safeNullableInt(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

// Valid target types
const VALID_TARGET_TYPES = ['CHANNEL', 'CATEGORY', 'PAGE', 'GLOBAL'] as const;
type TargetType = typeof VALID_TARGET_TYPES[number];

function safeTargetType(val: unknown): TargetType {
  if (typeof val === 'string' && VALID_TARGET_TYPES.includes(val as TargetType)) return val as TargetType;
  return 'GLOBAL';
}

// GET /api/admin/seo/audit - List recent SeoAudits (last 10)
export async function GET() {
  try {
    const audits = await db.seoAudit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error('SEO audit GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SEO audits' }, { status: 500 });
  }
}

// POST /api/admin/seo/audit - Create a new SeoAudit (run basic audit checks)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { targetType, targetId, url } = body;

    if (!url) {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // Run basic audit checks
    const issues: string[] = [];
    const warnings: string[] = [];
    const passed: string[] = [];
    let score = 100;

    // Check SEO settings
    const seoSettings = await db.seoSettings.findUnique({ where: { id: 1 } });

    if (seoSettings) {
      if (seoSettings.defaultMetaTitle) {
        passed.push('Default meta title is configured');
      } else {
        issues.push('Default meta title is not configured');
        score -= 10;
      }

      if (seoSettings.defaultMetaDescription) {
        passed.push('Default meta description is configured');
      } else {
        warnings.push('Default meta description is not configured');
        score -= 5;
      }

      if (seoSettings.ogDefaultImage) {
        passed.push('Open Graph default image is set');
      } else {
        warnings.push('Open Graph default image is not set');
        score -= 5;
      }

      if (seoSettings.canonicalDomain) {
        passed.push('Canonical domain is configured');
      } else {
        warnings.push('Canonical domain is not configured');
        score -= 5;
      }

      if (seoSettings.googleSiteVerification) {
        passed.push('Google site verification is set');
      } else {
        warnings.push('Google site verification is not set');
        score -= 3;
      }

      if (seoSettings.enableSitemap) {
        passed.push('Sitemap is enabled');
      } else {
        issues.push('Sitemap is disabled');
        score -= 10;
      }

      if (seoSettings.enableRobotsTxt) {
        passed.push('Robots.txt is enabled');
      } else {
        issues.push('Robots.txt is disabled');
        score -= 10;
      }
    } else {
      issues.push('SEO settings are not configured');
      score -= 30;
    }

    // Check sitemap entries count
    const sitemapCount = await db.sitemapEntry.count({
      where: { isExcluded: false },
    });
    if (sitemapCount > 0) {
      passed.push(`Sitemap has ${sitemapCount} entries`);
    } else {
      warnings.push('Sitemap has no entries');
      score -= 5;
    }

    // Check structured data
    const activeSchemasCount = await db.structuredData.count({
      where: { isActive: true },
    });
    if (activeSchemasCount > 0) {
      passed.push(`${activeSchemasCount} active structured data schema(s)`);
    } else {
      warnings.push('No active structured data schemas');
      score -= 5;
    }

    // Check broken links
    const unresolvedBrokenLinks = await db.brokenLink.count({
      where: { isResolved: false },
    });
    if (unresolvedBrokenLinks > 0) {
      issues.push(`${unresolvedBrokenLinks} unresolved broken link(s)`);
      score -= Math.min(unresolvedBrokenLinks * 2, 20);
    } else {
      passed.push('No unresolved broken links');
    }

    // Check meta templates
    const templateCount = await db.metaTemplate.count({
      where: { isActive: true },
    });
    if (templateCount > 0) {
      passed.push(`${templateCount} active meta template(s)`);
    } else {
      warnings.push('No active meta templates');
      score -= 5;
    }

    // Ensure score is between 0 and 100
    score = Math.max(0, Math.min(100, score));

    const audit = await db.seoAudit.create({
      data: {
        targetType: safeTargetType(targetType),
        targetId: safeNullableInt(targetId),
        url,
        score,
        issues: JSON.stringify(issues),
        warnings: JSON.stringify(warnings),
        passed: JSON.stringify(passed),
        scannedAt: new Date(),
      },
    });

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('SEO audit POST error:', error);
    return NextResponse.json({ error: 'Failed to create SEO audit' }, { status: 500 });
  }
}
