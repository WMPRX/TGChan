import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { invalidateSiteSettingsCache } from '@/app/api/settings/route';

// GET /api/admin/settings - Fetch site settings
export async function GET() {
  try {
    let settings = await db.siteSettings.findUnique({ where: { id: 1 } });

    if (!settings) {
      settings = await db.siteSettings.create({
        data: {
          id: 1,
          siteName: 'Telegram Directory',
          siteDescription: JSON.stringify({ en: 'The most comprehensive Telegram channel and group directory', tr: 'En kapsamlı Telegram kanal ve grup dizini', ru: 'Самый полный каталог Telegram каналов и групп' }),
          defaultLanguage: 'en',
          supportedLanguages: JSON.stringify(['tr', 'en', 'ru', 'zh', 'id', 'vi', 'es', 'ar', 'de', 'fr']),
          socialLinks: JSON.stringify({ telegram: '', twitter: '', discord: '' }),
          footerText: JSON.stringify({ en: '© 2026 Telegram Directory', tr: '© 2026 Telegram Dizini' }),
        },
      });
    }

    let socialLinks: Record<string, string> = {};
    try { socialLinks = JSON.parse(settings.socialLinks || '{}'); } catch {}

    let siteDesc = '';
    try {
      const parsed = JSON.parse(settings.siteDescription || '""');
      siteDesc = typeof parsed === 'object' ? (parsed.en || '') : parsed;
    } catch { siteDesc = settings.siteDescription || ''; }

    return NextResponse.json({
      siteName: settings.siteName,
      siteDescription: siteDesc,
      defaultLanguage: settings.defaultLanguage,
      maintenanceMode: settings.maintenanceMode,
      socialTelegram: socialLinks.telegram || '',
      socialTwitter: socialLinks.twitter || '',
      socialDiscord: socialLinks.discord || '',
      adsEnabled: settings.adsEnabled,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/admin/settings - Update site settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { siteName, siteDescription, defaultLanguage, maintenanceMode, socialTelegram, socialTwitter, socialDiscord, adsEnabled } = body;

    const socialLinks = JSON.stringify({
      telegram: socialTelegram || '',
      twitter: socialTwitter || '',
      discord: socialDiscord || '',
    });

    // Build i18n description
    const descJson = JSON.stringify({ en: siteDescription || '', tr: siteDescription || '', ru: siteDescription || '' });

    const settings = await db.siteSettings.upsert({
      where: { id: 1 },
      update: {
        ...(siteName !== undefined && { siteName }),
        ...(siteDescription !== undefined && { siteDescription: descJson }),
        ...(defaultLanguage !== undefined && { defaultLanguage }),
        ...(maintenanceMode !== undefined && { maintenanceMode }),
        ...(adsEnabled !== undefined && { adsEnabled }),
        socialLinks,
      },
      create: {
        id: 1,
        siteName: siteName || 'Telegram Directory',
        siteDescription: descJson,
        defaultLanguage: defaultLanguage || 'en',
        socialLinks,
        maintenanceMode: maintenanceMode || false,
        adsEnabled: adsEnabled || false,
      },
    });

    // Invalidate the public settings cache so the site reflects changes immediately
    invalidateSiteSettingsCache();

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
