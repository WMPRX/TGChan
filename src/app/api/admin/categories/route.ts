import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { invalidateSiteSettingsCache } from '@/app/api/settings/route';

// POST /api/admin/categories - Create a new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, icon, order, isActive } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check for duplicate slug
    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }

    // Build i18n name JSON
    const nameJson = JSON.stringify({ en: name, tr: name, ru: name });

    const category = await db.category.create({
      data: {
        name: nameJson,
        slug,
        icon: icon || null,
        order: order || 0,
        isActive: isActive !== false,
        channelCount: 0,
      },
    });

    invalidateSiteSettingsCache();

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// PUT /api/admin/categories - Update a category
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, slug, icon, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const existing = await db.category.findUnique({ where: { id: parseInt(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // If name provided, build i18n JSON
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) {
      updateData.name = JSON.stringify({ en: name, tr: name, ru: name });
    }
    if (slug !== undefined) updateData.slug = slug;
    if (icon !== undefined) updateData.icon = icon || null;
    if (order !== undefined) updateData.order = parseInt(order);
    if (isActive !== undefined) updateData.isActive = isActive;

    const category = await db.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    invalidateSiteSettingsCache();

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/admin/categories - Delete a category
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Unlink channels from this category first
    await db.channel.updateMany({
      where: { categoryId: parseInt(id) },
      data: { categoryId: null },
    });

    await db.category.delete({ where: { id: parseInt(id) } });

    invalidateSiteSettingsCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
