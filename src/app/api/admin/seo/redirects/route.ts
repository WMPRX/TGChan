import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// Helper: safe Int
function safeInt(val: unknown, fallback: number): number {
  if (val === null || val === undefined) return fallback;
  const n = typeof val === 'number' ? val : parseInt(String(val), 10);
  return isNaN(n) ? fallback : n;
}

// Helper: safe boolean
function safeBool(val: unknown, fallback: boolean): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') return val === 'true';
  return fallback;
}

// GET /api/admin/seo/redirects - List all Redirects with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [redirects, total] = await Promise.all([
      db.redirect.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.redirect.count(),
    ]);

    return NextResponse.json({
      redirects,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('SEO redirects GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 });
  }
}

// POST /api/admin/seo/redirects - Create a new Redirect
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromPath, toPath, statusCode, isActive, notes } = body;

    if (!fromPath || !toPath) {
      return NextResponse.json(
        { error: 'fromPath and toPath are required' },
        { status: 400 }
      );
    }

    // Check for duplicate fromPath
    const existing = await db.redirect.findUnique({
      where: { fromPath },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A redirect with this fromPath already exists' },
        { status: 409 }
      );
    }

    const redirect = await db.redirect.create({
      data: {
        fromPath,
        toPath,
        statusCode: safeInt(statusCode, 301),
        isActive: safeBool(isActive, true),
        notes: notes || null,
      },
    });

    return NextResponse.json(redirect, { status: 201 });
  } catch (error) {
    console.error('SEO redirects POST error:', error);
    return NextResponse.json({ error: 'Failed to create redirect' }, { status: 500 });
  }
}
