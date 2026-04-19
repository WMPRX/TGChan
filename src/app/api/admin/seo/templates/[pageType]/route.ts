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

// GET /api/admin/seo/templates/[pageType] - Get a specific MetaTemplate by pageType
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ pageType: string }> }
) {
  try {
    const { pageType } = await params;
    const coercedPageType = safePageType(pageType);

    const template = await db.metaTemplate.findUnique({
      where: { pageType: coercedPageType },
    });

    if (!template) {
      return NextResponse.json({ error: 'Meta template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('SEO template GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch meta template' }, { status: 500 });
  }
}

// PUT /api/admin/seo/templates/[pageType] - Update a MetaTemplate by pageType
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ pageType: string }> }
) {
  try {
    const { pageType } = await params;
    const coercedPageType = safePageType(pageType);

    const existing = await db.metaTemplate.findUnique({
      where: { pageType: coercedPageType },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Meta template not found' }, { status: 404 });
    }

    const body = await req.json();
    const {
      titleTemplate,
      descriptionTemplate,
      keywordsTemplate,
      ogTitleTemplate,
      ogDescriptionTemplate,
      ogImageTemplate,
      isActive,
      variables,
    } = body;

    const template = await db.metaTemplate.update({
      where: { pageType: coercedPageType },
      data: {
        ...(titleTemplate !== undefined && { titleTemplate: titleTemplate || null }),
        ...(descriptionTemplate !== undefined && { descriptionTemplate: descriptionTemplate || null }),
        ...(keywordsTemplate !== undefined && { keywordsTemplate: keywordsTemplate || null }),
        ...(ogTitleTemplate !== undefined && { ogTitleTemplate: ogTitleTemplate || null }),
        ...(ogDescriptionTemplate !== undefined && { ogDescriptionTemplate: ogDescriptionTemplate || null }),
        ...(ogImageTemplate !== undefined && { ogImageTemplate: ogImageTemplate || null }),
        ...(isActive !== undefined && { isActive: safeBool(isActive, true) }),
        ...(variables !== undefined && { variables: safeStringify(variables) }),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('SEO template PUT error:', error);
    return NextResponse.json({ error: 'Failed to update meta template' }, { status: 500 });
  }
}
