import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe boolean
function safeBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return fallback;
}

// Helper: stringify if not already a string
function safeStringify(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string') return val;
  return JSON.stringify(val);
}

// Valid page types
const VALID_PAGE_TYPES = ['HOMEPAGE', 'CHANNEL_DETAIL', 'CATEGORY', 'TAG', 'SEARCH', 'LANGUAGE', 'USER_PROFILE', 'STATIC_PAGE', 'PREMIUM'] as const;
type PageType = typeof VALID_PAGE_TYPES[number];

function safePageType(val: unknown): PageType {
  if (typeof val === 'string' && VALID_PAGE_TYPES.includes(val as PageType)) return val as PageType;
  return 'HOMEPAGE';
}

// GET /api/admin/seo/templates - List all MetaTemplates
export async function GET() {
  try {
    const templates = await db.metaTemplate.findMany({
      orderBy: { pageType: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('SEO templates GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch meta templates' }, { status: 500 });
  }
}

// POST /api/admin/seo/templates - Create a new MetaTemplate
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pageType,
      titleTemplate,
      descriptionTemplate,
      keywordsTemplate,
      ogTitleTemplate,
      ogDescriptionTemplate,
      ogImageTemplate,
      isActive,
      variables,
    } = body;

    if (!pageType) {
      return NextResponse.json({ error: 'pageType is required' }, { status: 400 });
    }

    const coercedPageType = safePageType(pageType);

    // Check for duplicate pageType
    const existing = await db.metaTemplate.findUnique({
      where: { pageType: coercedPageType },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A meta template for this pageType already exists' },
        { status: 409 }
      );
    }

    const template = await db.metaTemplate.create({
      data: {
        pageType: coercedPageType,
        titleTemplate: titleTemplate || null,
        descriptionTemplate: descriptionTemplate || null,
        keywordsTemplate: keywordsTemplate || null,
        ogTitleTemplate: ogTitleTemplate || null,
        ogDescriptionTemplate: ogDescriptionTemplate || null,
        ogImageTemplate: ogImageTemplate || null,
        isActive: safeBool(isActive, true),
        variables: safeStringify(variables),
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('SEO templates POST error:', error);
    return NextResponse.json({ error: 'Failed to create meta template' }, { status: 500 });
  }
}
