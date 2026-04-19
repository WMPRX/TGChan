import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe Int parse
function safeInt(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

// Helper: safe boolean
function safeBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return fallback;
}

// Valid twitter card values
const VALID_TWITTER_CARDS = ['SUMMARY', 'SUMMARY_LARGE_IMAGE'] as const;
type TwitterCard = typeof VALID_TWITTER_CARDS[number];

function safeTwitterCard(val: unknown): TwitterCard {
  if (typeof val === 'string' && VALID_TWITTER_CARDS.includes(val as TwitterCard)) return val as TwitterCard;
  return 'SUMMARY';
}

// GET /api/admin/seo/global - Fetch SeoSettings (singleton id=1)
export async function GET() {
  try {
    const settings = await db.seoSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        titleSeparator: ' | ',
        ogImageWidth: 1200,
        ogImageHeight: 630,
        twitterCard: 'SUMMARY',
        forceHttps: true,
        enableSitemap: true,
        enableRobotsTxt: true,
        enableRssFeed: false,
        defaultLanguage: 'en',
        urlStructure: 'subdirectory',
        enableHreflang: true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('SEO global GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch SEO settings' }, { status: 500 });
  }
}

// PUT /api/admin/seo/global - Update SeoSettings (upsert with id=1)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      defaultMetaTitle,
      defaultMetaDescription,
      defaultMetaKeywords,
      titleSeparator,
      titleSuffix,
      ogDefaultImage,
      ogImageWidth,
      ogImageHeight,
      twitterCard,
      twitterSite,
      twitterCreator,
      facebookAppId,
      googleSiteVerification,
      bingSiteVerification,
      yandexVerification,
      pinterestVerification,
      googleAnalyticsId,
      googleTagManagerId,
      facebookPixelId,
      hotjarId,
      microsoftClarityId,
      customHeadScripts,
      customBodyScripts,
      canonicalDomain,
      forceHttps,
      enableSitemap,
      enableRobotsTxt,
      enableRssFeed,
      defaultLanguage,
      urlStructure,
      enableHreflang,
    } = body;

    // Coerce types for Prisma
    const coercedOgImageWidth = safeInt(ogImageWidth, 1200);
    const coercedOgImageHeight = safeInt(ogImageHeight, 630);
    const coercedTwitterCard = safeTwitterCard(twitterCard);

    const settings = await db.seoSettings.upsert({
      where: { id: 1 },
      update: {
        ...(defaultMetaTitle !== undefined && { defaultMetaTitle: defaultMetaTitle || null }),
        ...(defaultMetaDescription !== undefined && { defaultMetaDescription: defaultMetaDescription || null }),
        ...(defaultMetaKeywords !== undefined && { defaultMetaKeywords: defaultMetaKeywords || null }),
        ...(titleSeparator !== undefined && { titleSeparator }),
        ...(titleSuffix !== undefined && { titleSuffix: titleSuffix || null }),
        ...(ogDefaultImage !== undefined && { ogDefaultImage: ogDefaultImage || null }),
        ...(ogImageWidth !== undefined && { ogImageWidth: coercedOgImageWidth }),
        ...(ogImageHeight !== undefined && { ogImageHeight: coercedOgImageHeight }),
        ...(twitterCard !== undefined && { twitterCard: coercedTwitterCard }),
        ...(twitterSite !== undefined && { twitterSite: twitterSite || null }),
        ...(twitterCreator !== undefined && { twitterCreator: twitterCreator || null }),
        ...(facebookAppId !== undefined && { facebookAppId: facebookAppId || null }),
        ...(googleSiteVerification !== undefined && { googleSiteVerification: googleSiteVerification || null }),
        ...(bingSiteVerification !== undefined && { bingSiteVerification: bingSiteVerification || null }),
        ...(yandexVerification !== undefined && { yandexVerification: yandexVerification || null }),
        ...(pinterestVerification !== undefined && { pinterestVerification: pinterestVerification || null }),
        ...(googleAnalyticsId !== undefined && { googleAnalyticsId: googleAnalyticsId || null }),
        ...(googleTagManagerId !== undefined && { googleTagManagerId: googleTagManagerId || null }),
        ...(facebookPixelId !== undefined && { facebookPixelId: facebookPixelId || null }),
        ...(hotjarId !== undefined && { hotjarId: hotjarId || null }),
        ...(microsoftClarityId !== undefined && { microsoftClarityId: microsoftClarityId || null }),
        ...(customHeadScripts !== undefined && { customHeadScripts: customHeadScripts || null }),
        ...(customBodyScripts !== undefined && { customBodyScripts: customBodyScripts || null }),
        ...(canonicalDomain !== undefined && { canonicalDomain: canonicalDomain || null }),
        ...(forceHttps !== undefined && { forceHttps: safeBool(forceHttps, true) }),
        ...(enableSitemap !== undefined && { enableSitemap: safeBool(enableSitemap, true) }),
        ...(enableRobotsTxt !== undefined && { enableRobotsTxt: safeBool(enableRobotsTxt, true) }),
        ...(enableRssFeed !== undefined && { enableRssFeed: safeBool(enableRssFeed, false) }),
        ...(defaultLanguage !== undefined && { defaultLanguage }),
        ...(urlStructure !== undefined && { urlStructure }),
        ...(enableHreflang !== undefined && { enableHreflang: safeBool(enableHreflang, true) }),
      },
      create: {
        id: 1,
        defaultMetaTitle: defaultMetaTitle || null,
        defaultMetaDescription: defaultMetaDescription || null,
        defaultMetaKeywords: defaultMetaKeywords || null,
        titleSeparator: titleSeparator || ' | ',
        titleSuffix: titleSuffix || null,
        ogDefaultImage: ogDefaultImage || null,
        ogImageWidth: coercedOgImageWidth,
        ogImageHeight: coercedOgImageHeight,
        twitterCard: coercedTwitterCard,
        twitterSite: twitterSite || null,
        twitterCreator: twitterCreator || null,
        facebookAppId: facebookAppId || null,
        googleSiteVerification: googleSiteVerification || null,
        bingSiteVerification: bingSiteVerification || null,
        yandexVerification: yandexVerification || null,
        pinterestVerification: pinterestVerification || null,
        googleAnalyticsId: googleAnalyticsId || null,
        googleTagManagerId: googleTagManagerId || null,
        facebookPixelId: facebookPixelId || null,
        hotjarId: hotjarId || null,
        microsoftClarityId: microsoftClarityId || null,
        customHeadScripts: customHeadScripts || null,
        customBodyScripts: customBodyScripts || null,
        canonicalDomain: canonicalDomain || null,
        forceHttps: safeBool(forceHttps, true),
        enableSitemap: safeBool(enableSitemap, true),
        enableRobotsTxt: safeBool(enableRobotsTxt, true),
        enableRssFeed: safeBool(enableRssFeed, false),
        defaultLanguage: defaultLanguage || 'en',
        urlStructure: urlStructure || 'subdirectory',
        enableHreflang: safeBool(enableHreflang, true),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('SEO global PUT error:', error);
    return NextResponse.json({ error: 'Failed to update SEO settings' }, { status: 500 });
  }
}
