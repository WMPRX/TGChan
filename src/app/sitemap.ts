import { db } from '@/lib/db'
import type { MetadataRoute } from 'next'

export const revalidate = 3600 // 1 hour

/**
 * Maps Prisma ChangeFreqEnum values to sitemap changeFrequency strings.
 */
function mapChangeFreq(
  freq: string
): MetadataRoute.Sitemap[number]['changeFrequency'] {
  const map: Record<string, MetadataRoute.Sitemap[number]['changeFrequency']> = {
    ALWAYS: 'always',
    HOURLY: 'hourly',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    NEVER: 'never',
  }
  return map[freq] ?? 'weekly'
}

/**
 * Resolves the canonical base URL from SeoSettings or falls back to default.
 */
async function getBaseUrl(): Promise<string> {
  try {
    const seoSettings = await db.seoSettings.findUnique({ where: { id: 1 } })
    if (seoSettings?.canonicalDomain) {
      return seoSettings.canonicalDomain.startsWith('http')
        ? seoSettings.canonicalDomain
        : `https://${seoSettings.canonicalDomain}`
    }
  } catch {
    // Database not available or table empty — use default
  }
  return 'https://telegram-directory.com'
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl()

  const entries: MetadataRoute.Sitemap = []

  // ── Homepage ──────────────────────────────────────────
  entries.push({
    url: `${baseUrl}/`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  })

  // ── Channel detail pages ──────────────────────────────
  try {
    const channels = await db.channel.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    })
    for (const channel of channels) {
      entries.push({
        url: `${baseUrl}/#/channel/${channel.id}`,
        lastModified: channel.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }
  } catch {
    // Skip channels on error
  }

  // ── Category pages ────────────────────────────────────
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    for (const category of categories) {
      entries.push({
        url: `${baseUrl}/#/category/${category.slug}`,
        lastModified: category.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    // Skip categories on error
  }

  // ── Custom SitemapEntry records ───────────────────────
  try {
    const customEntries = await db.sitemapEntry.findMany({
      where: { isExcluded: false },
    })
    for (const entry of customEntries) {
      entries.push({
        url: entry.url.startsWith('http') ? entry.url : `${baseUrl}${entry.url}`,
        lastModified: entry.lastMod,
        changeFrequency: mapChangeFreq(entry.changeFreq),
        priority: entry.priority,
      })
    }
  } catch {
    // Skip custom entries on error
  }

  return entries
}
