import { db } from '@/lib/db'
import type { MetadataRoute } from 'next'

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

/**
 * Fetches active RobotsRule rows from the database and groups them by
 * userAgent to build the MetadataRoute.Robots rules array.
 */
async function buildRulesFromDatabase(): Promise<MetadataRoute.Robots['rules']> {
  try {
    const robotsRules = await db.robotsRule.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })

    if (robotsRules.length === 0) return []

    // Group rules by userAgent
    const grouped = new Map<
      string,
      {
        allows: string[]
        disallows: string[]
        crawlDelay?: number
        sitemaps: string[]
      }
    >()

    for (const rule of robotsRules) {
      const ua = rule.userAgent || '*'
      if (!grouped.has(ua)) {
        grouped.set(ua, { allows: [], disallows: [], sitemaps: [] })
      }
      const group = grouped.get(ua)!

      switch (rule.ruleType) {
        case 'ALLOW':
          group.allows.push(rule.path)
          break
        case 'DISALLOW':
          group.disallows.push(rule.path)
          break
        case 'CRAWL_DELAY':
          group.crawlDelay = rule.value ? parseInt(rule.value, 10) : undefined
          break
        case 'SITEMAP':
          group.sitemaps.push(rule.path)
          break
      }
    }

    // Build the rules array from grouped data
    const result: MetadataRoute.Robots['rules'] = []
    for (const [userAgent, group] of grouped) {
      const ruleEntry: MetadataRoute.Robots['rules'][number] = { userAgent }

      if (group.allows.length > 0) {
        ruleEntry.allow = group.allows.length === 1 ? group.allows[0] : group.allows
      }
      if (group.disallows.length > 0) {
        ruleEntry.disallow =
          group.disallows.length === 1 ? group.disallows[0] : group.disallows
      }
      if (group.crawlDelay !== undefined) {
        ruleEntry.crawlDelay = group.crawlDelay
      }

      result.push(ruleEntry)
    }

    return result
  } catch {
    return []
  }
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl()

  // Try to fetch rules from the database
  let rules = await buildRulesFromDatabase()

  // Default rules if none exist in the database
  if (rules.length === 0) {
    rules = [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ]
  }

  return {
    rules,
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
