import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { validateBotToken, fetchAndSaveChannels, fetchAllExistingChannels, discoverBotChannels } from '@/lib/telegram-api';

// GET - Fetch Telegram API settings
export async function GET() {
  try {
    let settings = await db.telegramApiSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    });

    // Mask sensitive fields
    return NextResponse.json({
      botToken: settings.botToken ? `${settings.botToken.slice(0, 10)}...***` : '',
      botTokenSet: !!settings.botToken,
      apiId: settings.apiId || '',
      apiHash: settings.apiHash ? `${settings.apiHash.slice(0, 6)}...***` : '',
      apiHashSet: !!settings.apiHash,
      fetchInterval: settings.fetchInterval,
      autoFetch: settings.autoFetch,
      lastFetchAt: settings.lastFetchAt,
      lastFetchStatus: settings.lastFetchStatus ? JSON.parse(settings.lastFetchStatus) : null,
      channelUsernames: settings.channelUsernames ? JSON.parse(settings.channelUsernames) : [],
    });
  } catch (error) {
    console.error('Telegram API settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update Telegram API settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Get current settings to check which fields to update
    const current = await db.telegramApiSettings.findUnique({ where: { id: 1 } });

    const updateData: Record<string, unknown> = {};

    // Only update botToken if it's a new value (not masked)
    if (body.botToken !== undefined) {
      if (body.botToken && !body.botToken.includes('***')) {
        updateData.botToken = body.botToken;
      } else if (body.botToken === '') {
        updateData.botToken = null;
      }
      // If it contains '***', keep the current value
    }

    if (body.apiId !== undefined) {
      updateData.apiId = body.apiId || null;
    }

    // Only update apiHash if it's a new value (not masked)
    if (body.apiHash !== undefined) {
      if (body.apiHash && !body.apiHash.includes('***')) {
        updateData.apiHash = body.apiHash;
      } else if (body.apiHash === '') {
        updateData.apiHash = null;
      }
    }

    if (body.fetchInterval !== undefined) {
      const interval = Number(body.fetchInterval);
      if ([30, 60, 180, 1440].includes(interval)) {
        updateData.fetchInterval = interval;
      }
    }

    if (body.autoFetch !== undefined) {
      updateData.autoFetch = Boolean(body.autoFetch);
    }

    if (body.channelUsernames !== undefined) {
      if (Array.isArray(body.channelUsernames)) {
        updateData.channelUsernames = JSON.stringify(
          body.channelUsernames.map((u: string) => u.trim().replace(/^@/, '').toLowerCase()).filter(Boolean)
        );
      }
    }

    const settings = await db.telegramApiSettings.upsert({
      where: { id: 1 },
      update: updateData,
      create: {
        id: 1,
        ...updateData,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram API settings PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

// POST - Validate bot token or trigger manual fetch
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'validate') {
      const { botToken } = body;
      if (!botToken) {
        return NextResponse.json({ error: 'Bot token is required' }, { status: 400 });
      }
      const result = await validateBotToken(botToken);
      return NextResponse.json(result);
    }

    if (action === 'fetch') {
      const summary = await fetchAndSaveChannels();
      return NextResponse.json(summary);
    }

    if (action === 'fetchAll') {
      const summary = await fetchAllExistingChannels();
      return NextResponse.json(summary);
    }

    if (action === 'discover') {
      const result = await discoverBotChannels();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Telegram API POST error:', error);
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
