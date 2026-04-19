import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/admin/users - List all users with pagination and search
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { username: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role.toUpperCase();
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          avatar: true,
          bio: true,
          telegramUsername: true,
          isEmailVerified: true,
          isBanned: true,
          banReason: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              channels: true,
              submissions: true,
              premiumOrders: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update user (ban/unban, change role)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update data with only allowed fields
    const allowedFields = [
      'name',
      'role',
      'avatar',
      'bio',
      'telegramUsername',
      'isEmailVerified',
      'isBanned',
      'banReason',
      'isActive',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        data[field] = updateData[field];
      }
    }

    // If unbanning, clear ban reason
    if (data.isBanned === false) {
      data.banReason = null;
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        telegramUsername: true,
        isEmailVerified: true,
        isBanned: true,
        banReason: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete a user
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
