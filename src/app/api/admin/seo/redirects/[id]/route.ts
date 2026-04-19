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

// PUT /api/admin/seo/redirects/[id] - Update a Redirect by id
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redirectId = parseInt(id);

    if (isNaN(redirectId)) {
      return NextResponse.json({ error: 'Invalid redirect id' }, { status: 400 });
    }

    const existing = await db.redirect.findUnique({
      where: { id: redirectId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    const body = await req.json();
    const { fromPath, toPath, statusCode, isActive, notes } = body;

    // If fromPath is being changed, check for duplicates
    if (fromPath && fromPath !== existing.fromPath) {
      const duplicate = await db.redirect.findUnique({
        where: { fromPath },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A redirect with this fromPath already exists' },
          { status: 409 }
        );
      }
    }

    const redirect = await db.redirect.update({
      where: { id: redirectId },
      data: {
        ...(fromPath !== undefined && { fromPath }),
        ...(toPath !== undefined && { toPath }),
        ...(statusCode !== undefined && { statusCode: safeInt(statusCode, existing.statusCode) }),
        ...(isActive !== undefined && { isActive: safeBool(isActive, true) }),
        ...(notes !== undefined && { notes: notes || null }),
      },
    });

    return NextResponse.json(redirect);
  } catch (error) {
    console.error('SEO redirect PUT error:', error);
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 });
  }
}

// DELETE /api/admin/seo/redirects/[id] - Delete a Redirect by id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const redirectId = parseInt(id);

    if (isNaN(redirectId)) {
      return NextResponse.json({ error: 'Invalid redirect id' }, { status: 400 });
    }

    const existing = await db.redirect.findUnique({
      where: { id: redirectId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    await db.redirect.delete({
      where: { id: redirectId },
    });

    return NextResponse.json({ message: 'Redirect deleted successfully' });
  } catch (error) {
    console.error('SEO redirect DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 });
  }
}
