import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Password comparison: support both bcrypt hashed and plain text passwords
    let passwordMatch = false;

    if (user.password.startsWith('$2')) {
      // Bcrypt hashed password
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Plain text password comparison (for legacy/migrated data)
      passwordMatch = user.password === password;
    }

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Account is banned', reason: user.banReason }, { status: 403 });
    }

    // Update last login (ignore errors)
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    }).catch(() => {});

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
