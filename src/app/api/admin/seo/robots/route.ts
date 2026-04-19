import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe boolean
function safeBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return fallback;
}

// Helper: safe Int
function safeInt(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

// Valid rule types
const VALID_RULE_TYPES = ['ALLOW', 'DISALLOW', 'CRAWL_DELAY', 'SITEMAP'] as const;
type RuleType = typeof VALID_RULE_TYPES[number];

function safeRuleType(val: unknown): RuleType {
  if (typeof val === 'string' && VALID_RULE_TYPES.includes(val as RuleType)) return val as RuleType;
  return 'DISALLOW';
}

// GET /api/admin/seo/robots - List all RobotsRules (ordered by order field)
export async function GET() {
  try {
    const rules = await db.robotsRule.findMany({
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(rules);
  } catch (error) {
    console.error('SEO robots GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch robots rules' }, { status: 500 });
  }
}

// PUT /api/admin/seo/robots - Replace all RobotsRules (delete all + create new ones)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { rules } = body;

    if (!Array.isArray(rules)) {
      return NextResponse.json({ error: 'rules must be an array' }, { status: 400 });
    }

    // Use a transaction to delete all and create new ones atomically
    const result = await db.$transaction(async (tx) => {
      // Delete all existing rules
      await tx.robotsRule.deleteMany({});

      // Create new rules with proper type coercion
      const created = await Promise.all(
        rules.map((rule: Record<string, unknown>, index: number) =>
          tx.robotsRule.create({
            data: {
              userAgent: (rule.userAgent as string) || '*',
              ruleType: safeRuleType(rule.ruleType),
              path: (rule.path as string) || '/',
              value: (rule.value as string) || null,
              order: safeInt(rule.order, index),
              isActive: safeBool(rule.isActive, true),
            },
          })
        )
      );

      return created;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('SEO robots PUT error:', error);
    return NextResponse.json({ error: 'Failed to replace robots rules' }, { status: 500 });
  }
}
