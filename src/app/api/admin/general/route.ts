import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { invalidateSiteSettingsCache } from '@/app/api/settings/route';

// GET /api/admin/general - Fetch GeneralSettings
export async function GET() {
  try {
    const settings = await db.generalSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    // Parse JSON fields
    const parseField = (field: string | null, fallback: unknown = null) => {
      try { return field ? JSON.parse(field) : fallback; } catch { return fallback; }
    };

    return NextResponse.json({
      id: settings.id,
      phone: settings.phone || '',
      whatsappNumber: settings.whatsappNumber || '',
      email: settings.email || '',
      address: settings.address || '',
      facebookUrl: settings.facebookUrl || '',
      twitterUrl: settings.twitterUrl || '',
      linkedinUrl: settings.linkedinUrl || '',
      instagramUrl: settings.instagramUrl || '',
      tiktokUrl: settings.tiktokUrl || '',
      youtubeUrl: settings.youtubeUrl || '',
      pinterestUrl: settings.pinterestUrl || '',
      googleMapsUrl: settings.googleMapsUrl || '',
      yandexMapsUrl: settings.yandexMapsUrl || '',
      footerAbout: settings.footerAbout || '',
      footerQuickLinks: parseField(settings.footerQuickLinks, []),
      footerActivityLinks: parseField(settings.footerActivityLinks, []),
      updatedAt: settings.updatedAt,
    });
  } catch (error) {
    console.error('Get general settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch general settings' }, { status: 500 });
  }
}

// PUT /api/admin/general - Update GeneralSettings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const allowedFields = [
      'phone',
      'whatsappNumber',
      'email',
      'address',
      'facebookUrl',
      'twitterUrl',
      'linkedinUrl',
      'instagramUrl',
      'tiktokUrl',
      'youtubeUrl',
      'pinterestUrl',
      'googleMapsUrl',
      'yandexMapsUrl',
      'footerAbout',
      'footerQuickLinks',
      'footerActivityLinks',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Stringify JSON array/object fields before saving to DB
    const jsonFields = ['footerQuickLinks', 'footerActivityLinks'];
    for (const field of jsonFields) {
      if (updateData[field] !== undefined && typeof updateData[field] !== 'string') {
        updateData[field] = JSON.stringify(updateData[field]);
      }
    }

    const settings = await db.generalSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
      },
    });

    // Parse JSON fields for response
    const parseField = (field: string | null, fallback: unknown = null) => {
      try { return field ? JSON.parse(field) : fallback; } catch { return fallback; }
    };

    // Invalidate the public settings cache so the site reflects changes immediately
    invalidateSiteSettingsCache();

    return NextResponse.json({
      success: true,
      settings: {
        id: settings.id,
        phone: settings.phone || '',
        whatsappNumber: settings.whatsappNumber || '',
        email: settings.email || '',
        address: settings.address || '',
        facebookUrl: settings.facebookUrl || '',
        twitterUrl: settings.twitterUrl || '',
        linkedinUrl: settings.linkedinUrl || '',
        instagramUrl: settings.instagramUrl || '',
        tiktokUrl: settings.tiktokUrl || '',
        youtubeUrl: settings.youtubeUrl || '',
        pinterestUrl: settings.pinterestUrl || '',
        googleMapsUrl: settings.googleMapsUrl || '',
        yandexMapsUrl: settings.yandexMapsUrl || '',
        footerAbout: settings.footerAbout || '',
        footerQuickLinks: parseField(settings.footerQuickLinks, []),
        footerActivityLinks: parseField(settings.footerActivityLinks, []),
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update general settings error:', error);
    return NextResponse.json({ error: 'Failed to update general settings' }, { status: 500 });
  }
}
