import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ==================== Server-side cache ====================

interface CachedSettings {
  data: Record<string, unknown>;
  timestamp: number;
}

let settingsCache: CachedSettings | null = null;
const CACHE_TTL = 30_000; // 30 seconds

/**
 * Invalidate the server-side settings cache.
 * Call this from admin update endpoints so the next public GET returns fresh data.
 */
export function invalidateSiteSettingsCache() {
  settingsCache = null;
  // Dispatch a CustomEvent on window if running on the client (unlikely for a route,
  // but keeps the export contract consistent)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-settings-cache-invalidated'));
  }
}

// ==================== i18n resolve helper ====================

/**
 * Resolve a JSON i18n field value for the given language.
 * Fallback chain: requested lang → 'en' → 'tr' → first available key → raw string.
 */
export function resolveI18nField(field: unknown, lang: string): string {
  if (field === null || field === undefined) return '';

  // If it's already a plain string, return as-is
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (typeof parsed === 'object' && parsed !== null) {
        return resolveObject(parsed, lang);
      }
      return String(parsed);
    } catch {
      return field;
    }
  }

  // If it's an object (already parsed), resolve directly
  if (typeof field === 'object' && field !== null) {
    return resolveObject(field as Record<string, unknown>, lang);
  }

  return String(field);
}

function resolveObject(obj: Record<string, unknown>, lang: string): string {
  if (obj[lang] !== undefined && obj[lang] !== null) return String(obj[lang]);
  if (obj['en'] !== undefined && obj['en'] !== null) return String(obj['en']);
  if (obj['tr'] !== undefined && obj['tr'] !== null) return String(obj['tr']);
  const firstKey = Object.keys(obj)[0];
  if (firstKey && obj[firstKey] !== undefined && obj[firstKey] !== null) return String(obj[firstKey]);
  return '';
}

// ==================== Parse helper ====================

function safeJsonParse(field: string | null, fallback: unknown = null): unknown {
  if (!field) return fallback;
  try {
    return JSON.parse(field);
  } catch {
    return fallback;
  }
}

// ==================== Build settings payload ====================

async function buildSettingsPayload(): Promise<Record<string, unknown>> {
  // Fetch all settings in parallel
  const [siteSettings, generalSettings, legalPages, cookieConsent] = await Promise.all([
    db.siteSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        siteName: 'Telegram Directory',
        siteDescription: JSON.stringify({ en: 'The most comprehensive Telegram channel and group directory', tr: 'En kapsamlı Telegram kanal ve grup dizini', ru: 'Самый полный каталог Telegram каналов и групп' }),
        defaultLanguage: 'en',
        supportedLanguages: JSON.stringify(['tr', 'en', 'ru', 'zh', 'id', 'vi', 'es', 'ar', 'de', 'fr']),
        socialLinks: JSON.stringify({ telegram: '', twitter: '', discord: '' }),
        footerText: JSON.stringify({ en: '© 2026 Telegram Directory', tr: '© 2026 Telegram Dizini' }),
      },
    }),
    db.generalSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    }),
    db.legalPage.findMany({
      where: { isPublished: true },
      orderBy: { order: 'asc' },
      select: { id: true, title: true, slug: true, pageType: true, heroImage: true },
    }),
    db.cookieConsent.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        enabled: true,
        position: 'bottom',
        theme: 'light',
        message: JSON.stringify({ en: 'We use cookies to improve your experience.', tr: 'Deneyiminizi iyileştirmek için çerezleri kullanıyoruz.' }),
        acceptText: JSON.stringify({ en: 'Accept All', tr: 'Tümünü Kabul Et' }),
        rejectText: JSON.stringify({ en: 'Reject All', tr: 'Tümünü Reddet' }),
        settingsText: JSON.stringify({ en: 'Cookie Settings', tr: 'Çerez Ayarları' }),
        categories: JSON.stringify([]),
      },
    }),
  ]);

  // Parse SiteSettings JSON fields
  const socialLinks = safeJsonParse(siteSettings.socialLinks, {}) as Record<string, string>;
  const supportedLanguages = safeJsonParse(siteSettings.supportedLanguages, ['en']) as string[];

  // Parse GeneralSettings JSON fields
  const footerQuickLinks = safeJsonParse(generalSettings.footerQuickLinks, []) as Array<{ label: string; url: string }>;
  const footerActivityLinks = safeJsonParse(generalSettings.footerActivityLinks, []) as Array<{ label: string; url: string }>;

  // Parse CookieConsent JSON fields
  const cookieMessage = safeJsonParse(cookieConsent.message, null);
  const cookieAcceptText = safeJsonParse(cookieConsent.acceptText, null);
  const cookieRejectText = safeJsonParse(cookieConsent.rejectText, null);
  const cookieSettingsText = safeJsonParse(cookieConsent.settingsText, null);
  const cookieCategories = safeJsonParse(cookieConsent.categories, null);

  // Build the flat merged response
  return {
    // From SiteSettings
    siteName: siteSettings.siteName,
    siteDescription: siteSettings.siteDescription,
    logo: siteSettings.logo || null,
    favicon: siteSettings.favicon || null,
    defaultLanguage: siteSettings.defaultLanguage,
    supportedLanguages,
    maintenanceMode: siteSettings.maintenanceMode,
    adsEnabled: siteSettings.adsEnabled,
    socialTelegram: socialLinks.telegram || '',
    socialTwitter: socialLinks.twitter || '',
    socialDiscord: socialLinks.discord || '',
    metaKeywords: siteSettings.metaKeywords || null,
    metaDescription: siteSettings.metaDescription || null,
    footerText: siteSettings.footerText || null,
    analyticsId: siteSettings.analyticsId || null,

    // From GeneralSettings
    phone: generalSettings.phone || '',
    whatsappNumber: generalSettings.whatsappNumber || '',
    email: generalSettings.email || '',
    address: generalSettings.address || null,
    facebookUrl: generalSettings.facebookUrl || '',
    twitterUrl: generalSettings.twitterUrl || '',
    linkedinUrl: generalSettings.linkedinUrl || '',
    instagramUrl: generalSettings.instagramUrl || '',
    tiktokUrl: generalSettings.tiktokUrl || '',
    youtubeUrl: generalSettings.youtubeUrl || '',
    pinterestUrl: generalSettings.pinterestUrl || '',
    googleMapsUrl: generalSettings.googleMapsUrl || '',
    yandexMapsUrl: generalSettings.yandexMapsUrl || '',
    footerAbout: generalSettings.footerAbout || null,
    footerQuickLinks,
    footerActivityLinks,

    // Legal pages (only published, lightweight)
    legalPages: legalPages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      pageType: p.pageType,
      heroImage: p.heroImage,
    })),

    // Cookie consent
    cookieConsent: {
      enabled: cookieConsent.enabled,
      position: cookieConsent.position,
      theme: cookieConsent.theme,
      message: cookieMessage,
      acceptText: cookieAcceptText,
      rejectText: cookieRejectText,
      settingsText: cookieSettingsText,
      policyUrl: cookieConsent.policyUrl || '',
      categories: cookieCategories,
    },
  };
}

// ==================== GET handler ====================

export async function GET(req: NextRequest) {
  try {
    // Check for cache invalidation request
    const invalidate = req.nextUrl.searchParams.get('invalidate');
    if (invalidate === '1') {
      settingsCache = null;
    }

    // Return cached data if still valid
    if (settingsCache && Date.now() - settingsCache.timestamp < CACHE_TTL) {
      return NextResponse.json(settingsCache.data);
    }

    // Build fresh payload
    const data = await buildSettingsPayload();

    // Update cache
    settingsCache = { data, timestamp: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Public settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
