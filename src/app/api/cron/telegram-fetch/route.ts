import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fetchAndSaveChannels } from '@/lib/telegram-api';

// CRON endpoint for auto-fetching Telegram channel data
// This endpoint should be called by an external cron service or scheduler
// Security: Requires a cron secret to prevent unauthorized access

const CRON_SECRET = process.env.CRON_SECRET || 'telegram-cron-secret-2024';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if auto-fetch is enabled
    const settings = await db.telegramApiSettings.findUnique({ where: { id: 1 } });

    if (!settings?.autoFetch || !settings.botToken) {
      return NextResponse.json({
        skipped: true,
        reason: !settings?.autoFetch ? 'Auto-fetch is disabled' : 'Bot token not configured',
      });
    }

    // Check if enough time has passed since last fetch
    if (settings.lastFetchAt) {
      const lastFetch = new Date(settings.lastFetchAt).getTime();
      const now = Date.now();
      const intervalMs = settings.fetchInterval * 60 * 1000;
      const elapsed = now - lastFetch;

      if (elapsed < intervalMs) {
        const remaining = Math.ceil((intervalMs - elapsed) / 60000);
        return NextResponse.json({
          skipped: true,
          reason: `Too early. ${remaining} minutes remaining until next fetch.`,
          lastFetchAt: settings.lastFetchAt,
          fetchInterval: settings.fetchInterval,
        });
      }
    }

    // Execute fetch
    const summary = await fetchAndSaveChannels();

    return NextResponse.json({
      executed: true,
      summary,
    });
  } catch (error) {
    console.error('Cron fetch error:', error);
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}

// Also support POST for flexibility
export async function POST(req: NextRequest) {
  return GET(req);
}
