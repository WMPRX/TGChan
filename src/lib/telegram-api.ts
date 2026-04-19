import { db } from '@/lib/db';

// ============ TYPES ============

interface TelegramChat {
  id: number;
  username?: string;
  title?: string;
  description?: string;
  type: string;
  photo?: { small_file_id: string; big_file_id: string };
}

interface FetchResult {
  username: string;
  success: boolean;
  data?: {
    telegramId: string;
    username: string;
    title: string;
    description: string | null;
    type: string;
    memberCount: number;
    avatarUrl: string | null;
  };
  error?: string;
}

interface FetchSummary {
  success: boolean;
  totalChannels: number;
  channelsFetched: number;
  channelsFailed: number;
  errors: string[];
  duration: number;
}

// ============ CONSTANTS ============

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const RATE_LIMIT_DELAY = 350; // ms between API calls

// ============ HELPERS ============

function normalizeUsername(username: string): string {
  return username.trim().replace(/^@/, '').toLowerCase();
}

function mapChatType(type: string): 'CHANNEL' | 'GROUP' | 'SUPERGROUP' {
  switch (type) {
    case 'channel': return 'CHANNEL';
    case 'group': return 'GROUP';
    case 'supergroup': return 'SUPERGROUP';
    default: return 'CHANNEL';
  }
}

async function callTelegramApi(botToken: string, method: string, params?: Record<string, unknown>) {
  const url = `${TELEGRAM_API_BASE}${botToken}/${method}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
    signal: AbortSignal.timeout(30000),
  });

  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.description || `Telegram API error: ${method}`);
  }
  return json.result;
}

// ============ EXPORTED FUNCTIONS ============

export async function validateBotToken(botToken: string): Promise<{
  valid: boolean;
  botInfo?: { id: number; username: string; firstName: string };
  error?: string;
}> {
  try {
    const result = await callTelegramApi(botToken, 'getMe');
    return {
      valid: true,
      botInfo: {
        id: result.id,
        username: result.username,
        firstName: result.first_name,
      },
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Invalid bot token',
    };
  }
}

export async function getChatInfo(botToken: string, username: string): Promise<TelegramChat | null> {
  try {
    const normalized = normalizeUsername(username);
    const result = await callTelegramApi(botToken, 'getChat', { chat_id: `@${normalized}` });
    return result as TelegramChat;
  } catch {
    return null;
  }
}

export async function getChatMemberCount(botToken: string, chatId: string | number): Promise<number> {
  try {
    const result = await callTelegramApi(botToken, 'getChatMemberCount', { chat_id: chatId });
    return result as number;
  } catch {
    return 0;
  }
}

export async function getChatPhotoUrl(botToken: string, fileId: string): Promise<string | null> {
  try {
    const result = await callTelegramApi(botToken, 'getFile', { file_id: fileId });
    return `${TELEGRAM_API_BASE}${botToken}/${result.file_path}`;
  } catch {
    return null;
  }
}

export async function fetchChannelsData(botToken: string, usernames: string[]): Promise<FetchResult[]> {
  // Validate token first
  const validation = await validateBotToken(botToken);
  if (!validation.valid) {
    return usernames.map(u => ({
      username: normalizeUsername(u),
      success: false,
      error: validation.error || 'Invalid bot token',
    }));
  }

  const results: FetchResult[] = [];

  for (const raw of usernames) {
    const username = normalizeUsername(raw);
    if (!username) continue;

    try {
      const chat = await getChatInfo(botToken, username);
      if (!chat) {
        results.push({ username, success: false, error: 'Channel not found or bot is not a member' });
        continue;
      }

      const memberCount = await getChatMemberCount(botToken, chat.id);

      let avatarUrl: string | null = null;
      if (chat.photo?.big_file_id) {
        avatarUrl = await getChatPhotoUrl(botToken, chat.photo.big_file_id);
      }

      results.push({
        username,
        success: true,
        data: {
          telegramId: String(chat.id),
          username: chat.username || username,
          title: chat.title || username,
          description: chat.description || null,
          type: mapChatType(chat.type),
          memberCount,
          avatarUrl,
        },
      });
    } catch (err) {
      results.push({
        username,
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    // Rate limiting
    if (usernames.indexOf(raw) < usernames.length - 1) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY));
    }
  }

  return results;
}

export async function saveFetchedChannels(results: FetchResult[]): Promise<{ updated: number; created: number }> {
  let updated = 0;
  let created = 0;

  const maxRank = await db.channel.aggregate({ _max: { rank: true } });
  let nextRank = (maxRank._max.rank || 0) + 1;

  for (const result of results) {
    if (!result.success || !result.data) continue;

    const { telegramId, username, title, description, type, memberCount, avatarUrl } = result.data;

    // Try to find existing channel by telegramId first, then by username
    let existing = await db.channel.findUnique({ where: { telegramId } });
    if (!existing) {
      existing = await db.channel.findUnique({ where: { username } });
    }

    if (existing) {
      const memberDiff = memberCount - existing.memberCount;
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      const weekMs = 7 * dayMs;
      const monthMs = 30 * dayMs;

      let dailyGrowth = existing.dailyGrowth;
      let weeklyGrowth = existing.weeklyGrowth;
      let monthlyGrowth = existing.monthlyGrowth;

      if (now.getTime() - existing.updatedAt.getTime() < dayMs) {
        dailyGrowth += memberDiff;
      } else {
        dailyGrowth = memberDiff;
      }
      if (now.getTime() - existing.updatedAt.getTime() < weekMs) {
        weeklyGrowth += memberDiff;
      } else {
        weeklyGrowth = memberDiff;
      }
      if (now.getTime() - existing.updatedAt.getTime() < monthMs) {
        monthlyGrowth += memberDiff;
      } else {
        monthlyGrowth = memberDiff;
      }

      await db.channel.update({
        where: { id: existing.id },
        data: {
          telegramId,
          title,
          description,
          type: type as 'CHANNEL' | 'GROUP' | 'SUPERGROUP',
          memberCount,
          avatarUrl,
          isActive: true,
          previousRank: existing.rank,
          dailyGrowth,
          weeklyGrowth,
          monthlyGrowth,
        },
      });

      // Create statistic entry
      await db.channelStatistic.create({
        data: {
          channelId: existing.id,
          memberCount,
          date: new Date(),
        },
      });

      updated++;
    } else {
      await db.channel.create({
        data: {
          telegramId,
          username,
          title,
          description,
          type: type as 'CHANNEL' | 'GROUP' | 'SUPERGROUP',
          memberCount,
          avatarUrl,
          isActive: true,
          language: 'und',
          rank: nextRank++,
        },
      });
      created++;
    }
  }

  return { updated, created };
}

export async function fetchAndSaveChannels(): Promise<FetchSummary> {
  const startTime = Date.now();

  try {
    const settings = await db.telegramApiSettings.findUnique({ where: { id: 1 } });

    if (!settings?.botToken) {
      return {
        success: false,
        totalChannels: 0,
        channelsFetched: 0,
        channelsFailed: 0,
        errors: ['Bot token not configured'],
        duration: Date.now() - startTime,
      };
    }

    const usernames: string[] = settings.channelUsernames
      ? JSON.parse(settings.channelUsernames)
      : [];

    if (usernames.length === 0) {
      return {
        success: false,
        totalChannels: 0,
        channelsFetched: 0,
        channelsFailed: 0,
        errors: ['No channels configured for monitoring'],
        duration: Date.now() - startTime,
      };
    }

    const results = await fetchChannelsData(settings.botToken, usernames);
    const { updated, created } = await saveFetchedChannels(results);

    const failedResults = results.filter(r => !r.success);
    const channelsFetched = results.filter(r => r.success).length;

    const summary: FetchSummary = {
      success: true,
      totalChannels: usernames.length,
      channelsFetched,
      channelsFailed: failedResults.length,
      errors: failedResults.map(r => `${r.username}: ${r.error}`),
      duration: Date.now() - startTime,
    };

    // Update last fetch status
    await db.telegramApiSettings.update({
      where: { id: 1 },
      data: {
        lastFetchAt: new Date(),
        lastFetchStatus: JSON.stringify(summary),
      },
    });

    return summary;
  } catch (err) {
    const summary: FetchSummary = {
      success: false,
      totalChannels: 0,
      channelsFetched: 0,
      channelsFailed: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
      duration: Date.now() - startTime,
    };

    // Update last fetch status even on failure
    try {
      await db.telegramApiSettings.update({
        where: { id: 1 },
        data: {
          lastFetchStatus: JSON.stringify(summary),
        },
      });
    } catch {
      // Ignore DB update error
    }

    return summary;
  }
}

// ============ FETCH ALL EXISTING CHANNELS FROM DATABASE ============

export async function fetchAllExistingChannels(): Promise<FetchSummary> {
  const startTime = Date.now();

  try {
    const settings = await db.telegramApiSettings.findUnique({ where: { id: 1 } });

    if (!settings?.botToken) {
      return {
        success: false,
        totalChannels: 0,
        channelsFetched: 0,
        channelsFailed: 0,
        errors: ['Bot token not configured'],
        duration: Date.now() - startTime,
      };
    }

    // Get all active channels from the database
    const channels = await db.channel.findMany({
      where: { isActive: true },
      select: { username: true },
    });

    if (channels.length === 0) {
      return {
        success: false,
        totalChannels: 0,
        channelsFetched: 0,
        channelsFailed: 0,
        errors: ['No channels found in the database'],
        duration: Date.now() - startTime,
      };
    }

    const usernames = channels.map(c => c.username);

    const results = await fetchChannelsData(settings.botToken, usernames);
    const { updated, created } = await saveFetchedChannels(results);

    const failedResults = results.filter(r => !r.success);
    const channelsFetched = results.filter(r => r.success).length;

    const summary: FetchSummary = {
      success: true,
      totalChannels: usernames.length,
      channelsFetched,
      channelsFailed: failedResults.length,
      errors: failedResults.map(r => `${r.username}: ${r.error}`),
      duration: Date.now() - startTime,
    };

    // Update last fetch status
    await db.telegramApiSettings.update({
      where: { id: 1 },
      data: {
        lastFetchAt: new Date(),
        lastFetchStatus: JSON.stringify(summary),
      },
    });

    return summary;
  } catch (err) {
    const summary: FetchSummary = {
      success: false,
      totalChannels: 0,
      channelsFetched: 0,
      channelsFailed: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
      duration: Date.now() - startTime,
    };

    try {
      await db.telegramApiSettings.update({
        where: { id: 1 },
        data: {
          lastFetchStatus: JSON.stringify(summary),
        },
      });
    } catch {
      // Ignore DB update error
    }

    return summary;
  }
}

// ============ DISCOVER BOT CHANNELS VIA getUpdates ============

interface DiscoveredChat {
  chatId: number;
  username?: string;
  title?: string;
  type: string;
}

export async function discoverBotChannels(): Promise<{
  success: boolean;
  discovered: DiscoveredChat[];
  addedToMonitor: number;
  totalMonitored: number;
  errors: string[];
}> {
  try {
    const settings = await db.telegramApiSettings.findUnique({ where: { id: 1 } });

    if (!settings?.botToken) {
      return {
        success: false,
        discovered: [],
        addedToMonitor: 0,
        totalMonitored: 0,
        errors: ['Bot token not configured'],
      };
    }

    // Get bot info first to filter out the bot itself
    const botInfo = await callTelegramApi(settings.botToken, 'getMe');
    const botId = botInfo.id;

    // Fetch recent updates to discover chats
    const updates = await callTelegramApi(settings.botToken, 'getUpdates', {
      limit: 100,
      timeout: 0,
    });

    // Extract unique chats from updates
    const chatMap = new Map<number, DiscoveredChat>();

    for (const update of updates as Array<Record<string, unknown>>) {
      // Check various update types for chat info
      const message = update.message as Record<string, unknown> | undefined;
      const channelPost = update.channel_post as Record<string, unknown> | undefined;
      const editedMessage = update.edited_message as Record<string, unknown> | undefined;
      const editedChannelPost = update.edited_channel_post as Record<string, unknown> | undefined;
      const myChatMember = update.my_chat_member as Record<string, unknown> | undefined;
      const chatJoinRequest = update.chat_join_request as Record<string, unknown> | undefined;

      const sources = [message, channelPost, editedMessage, editedChannelPost, myChatMember, chatJoinRequest];

      for (const source of sources) {
        if (!source) continue;
        const chat = source.chat as Record<string, unknown> | undefined;
        if (!chat) continue;

        const chatId = chat.id as number;
        const chatType = chat.type as string;

        // Skip private chats and the bot itself
        if (chatType === 'private' || chatId === botId) continue;
        // Only include channels, groups, and supergroups
        if (!['channel', 'group', 'supergroup'].includes(chatType)) continue;

        if (!chatMap.has(chatId)) {
          chatMap.set(chatId, {
            chatId,
            username: chat.username as string | undefined,
            title: chat.title as string | undefined,
            type: chatType,
          });
        }
      }
    }

    const discovered = Array.from(chatMap.values());

    // Add discovered channels with usernames to the monitored list
    const currentMonitored: string[] = settings.channelUsernames
      ? JSON.parse(settings.channelUsernames)
      : [];

    let addedToMonitor = 0;

    for (const chat of discovered) {
      if (chat.username) {
        const normalized = normalizeUsername(chat.username);
        if (normalized && !currentMonitored.includes(normalized)) {
          currentMonitored.push(normalized);
          addedToMonitor++;
        }
      }
    }

    // Save updated monitored list
    if (addedToMonitor > 0) {
      await db.telegramApiSettings.update({
        where: { id: 1 },
        data: {
          channelUsernames: JSON.stringify(currentMonitored),
        },
      });
    }

    return {
      success: true,
      discovered,
      addedToMonitor,
      totalMonitored: currentMonitored.length,
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      discovered: [],
      addedToMonitor: 0,
      totalMonitored: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
    };
  }
}

export type { FetchResult, FetchSummary, TelegramChat, DiscoveredChat };
