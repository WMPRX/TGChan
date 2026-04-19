import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, username } = body;

    if (!name || !email || !password || !username) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // Check existing email
    const existingEmail = await db.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Check existing username
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await db.user.create({
      data: {
        name: String(name),
        email: String(email),
        password: hashedPassword,
        username: String(username),
        role: 'USER',
        isEmailVerified: false,
        isActive: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
