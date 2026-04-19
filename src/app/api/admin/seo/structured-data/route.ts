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

// Valid schema types
const VALID_SCHEMA_TYPES = ['ORGANIZATION', 'WEBSITE', 'BREADCRUMB', 'ITEMLIST', 'ARTICLE', 'PRODUCT', 'FAQ', 'LOCALBUSINESS', 'CUSTOM'] as const;
type SchemaType = typeof VALID_SCHEMA_TYPES[number];

function safeSchemaType(val: unknown): SchemaType {
  if (typeof val === 'string' && VALID_SCHEMA_TYPES.includes(val as SchemaType)) return val as SchemaType;
  return 'CUSTOM';
}

// Valid page types
const VALID_PAGE_TYPES = ['HOMEPAGE', 'CHANNEL_DETAIL', 'CATEGORY', 'TAG', 'SEARCH', 'LANGUAGE', 'USER_PROFILE', 'STATIC_PAGE', 'PREMIUM'] as const;
type PageType = typeof VALID_PAGE_TYPES[number];

function safePageType(val: unknown): PageType | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'string' && VALID_PAGE_TYPES.includes(val as PageType)) return val as PageType;
  return null;
}

// GET /api/admin/seo/structured-data - List all StructuredData
export async function GET() {
  try {
    const schemas = await db.structuredData.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(schemas);
  } catch (error) {
    console.error('SEO structured-data GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch structured data' }, { status: 500 });
  }
}

// POST /api/admin/seo/structured-data - Create new StructuredData
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, schemaType, pageType, jsonLd, isActive, isGlobal } = body;

    if (!name || !schemaType || !jsonLd) {
      return NextResponse.json(
        { error: 'name, schemaType, and jsonLd are required' },
        { status: 400 }
      );
    }

    const schema = await db.structuredData.create({
      data: {
        name,
        schemaType: safeSchemaType(schemaType),
        pageType: safePageType(pageType),
        jsonLd: safeStringify(jsonLd) || '{}',
        isActive: safeBool(isActive, true),
        isGlobal: safeBool(isGlobal, true),
      },
    });

    return NextResponse.json(schema, { status: 201 });
  } catch (error) {
    console.error('SEO structured-data POST error:', error);
    return NextResponse.json({ error: 'Failed to create structured data' }, { status: 500 });
  }
}
