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

// PUT /api/admin/seo/structured-data/[id] - Update StructuredData by id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schemaId = parseInt(id);

    if (isNaN(schemaId)) {
      return NextResponse.json({ error: 'Invalid structured data id' }, { status: 400 });
    }

    const existing = await db.structuredData.findUnique({
      where: { id: schemaId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Structured data not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, schemaType, pageType, jsonLd, isActive, isGlobal } = body;

    const schema = await db.structuredData.update({
      where: { id: schemaId },
      data: {
        ...(name !== undefined && { name }),
        ...(schemaType !== undefined && { schemaType: safeSchemaType(schemaType) }),
        ...(pageType !== undefined && { pageType: safePageType(pageType) }),
        ...(jsonLd !== undefined && { jsonLd: safeStringify(jsonLd) || existing.jsonLd }),
        ...(isActive !== undefined && { isActive: safeBool(isActive, true) }),
        ...(isGlobal !== undefined && { isGlobal: safeBool(isGlobal, true) }),
      },
    });

    return NextResponse.json(schema);
  } catch (error) {
    console.error('SEO structured-data PUT error:', error);
    return NextResponse.json({ error: 'Failed to update structured data' }, { status: 500 });
  }
}

// DELETE /api/admin/seo/structured-data/[id] - Delete StructuredData by id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const schemaId = parseInt(id);

    if (isNaN(schemaId)) {
      return NextResponse.json({ error: 'Invalid structured data id' }, { status: 400 });
    }

    const existing = await db.structuredData.findUnique({
      where: { id: schemaId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Structured data not found' }, { status: 404 });
    }

    await db.structuredData.delete({
      where: { id: schemaId },
    });

    return NextResponse.json({ message: 'Structured data deleted successfully' });
  } catch (error) {
    console.error('SEO structured-data DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete structured data' }, { status: 500 });
  }
}
