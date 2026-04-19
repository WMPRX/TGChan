import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: parseInt(userId) },
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
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth me GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, email, username, bio, telegramUsername, currentPassword, newPassword } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const parsedUserId = parseInt(userId);
    const existingUser = await db.user.findUnique({ where: { id: parsedUserId } });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Password change flow
    if (currentPassword && newPassword) {
      // Simple password comparison (in production, use bcrypt)
      if (currentPassword !== existingUser.password && !await comparePasswords(currentPassword, existingUser.password)) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }

      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await db.user.update({
        where: { id: parsedUserId },
        data: { password: hashedPassword },
      });

      return NextResponse.json({ success: true });
    }

    // Profile update flow
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (telegramUsername !== undefined) updateData.telegramUsername = telegramUsername;

    // Check for unique email/username if they are being changed
    if (email && email !== existingUser.email) {
      const emailTaken = await db.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 409 });
      }
    }
    if (username && username !== existingUser.username) {
      const usernameTaken = await db.user.findUnique({ where: { username } });
      if (usernameTaken) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
    }

    const updatedUser = await db.user.update({
      where: { id: parsedUserId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        avatar: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Auth me PUT error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // In a real app, you'd want to verify the user's password before deletion
    // and handle cascading deletes or soft delete
    await db.user.delete({ where: { id: parseInt(userId) } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth me DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}

// Helper to compare passwords
async function comparePasswords(plain: string, hashed: string): Promise<boolean> {
  try {
    const bcrypt = await import('bcryptjs');
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}
