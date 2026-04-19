import { LANGUAGE_FLAGS, LANGUAGE_CODES_MAP } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/i18n/types';

/**
 * Parse a JSON-encoded multilingual string and return the value for the given language.
 * Falls back to 'en', then to the raw string if parsing fails.
 * e.g. '{"en":"Entertainment","tr":"Eğlence"}' with lang='tr' → 'Eğlence'
 */
export function parseI18nField(jsonStr: string | null | undefined, lang: LanguageCode | string = 'en'): string {
  if (!jsonStr) return '';
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object') {
      return parsed[lang] || parsed.en || parsed[Object.keys(parsed)[0]] || jsonStr;
    }
    return jsonStr;
  } catch {
    return jsonStr;
  }
}

/**
 * Parse a JSON-encoded features object
 */
export function parseFeatures(jsonStr: string | null | undefined): Record<string, unknown> {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Format member count: 1000 -> 1K, 1000000 -> 1M
 */
export function formatMemberCount(count: number, t?: (key: string) => string): string {
  if (count >= 1000000) {
    const suffix = t ? t('members.million') : 'M';
    return `${(count / 1000000).toFixed(1).replace(/\.0$/, '')}${suffix}`;
  }
  if (count >= 1000) {
    const suffix = t ? t('members.thousand') : 'K';
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}${suffix}`;
  }
  return count.toString();
}

/**
 * Get language flag emoji
 */
export function getLanguageFlag(code: string): string {
  return LANGUAGE_FLAGS[code] || '🌐';
}

/**
 * Get language code display (uppercase)
 */
export function getLanguageCode(code: string): string {
  return LANGUAGE_CODES_MAP[code] || code.toUpperCase();
}

/**
 * Generate a consistent color from a string (for avatars)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
    '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6',
    '#A855F7', '#D946EF', '#EC4899', '#F43F5E',
  ];
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(/[\s_-]+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Get rank change indicator
 */
export function getRankChange(current: number | null, previous: number | null): { direction: 'up' | 'down' | 'same'; value: number } {
  if (current === null || previous === null) return { direction: 'same', value: 0 };
  const diff = previous - current; // positive = went up (better rank)
  if (diff > 0) return { direction: 'up', value: diff };
  if (diff < 0) return { direction: 'down', value: Math.abs(diff) };
  return { direction: 'same', value: 0 };
}

/**
 * Get premium highlight styles
 */
export function getPremiumStyles(channel: { isPremium: boolean; highlightColor: string | null; hasBadge: boolean }) {
  if (!channel.isPremium) return {};
  return {
    backgroundColor: channel.highlightColor ? `${channel.highlightColor}15` : 'rgba(255, 215, 0, 0.08)',
    borderLeft: channel.highlightColor ? `3px solid ${channel.highlightColor}` : '3px solid #FFD700',
  };
}
