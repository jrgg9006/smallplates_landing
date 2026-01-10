/**
 * API Route - Verify Admin Delete Password
 * Server-side password verification for sensitive admin operations
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';

export async function POST(request: Request) {
  try {
    // Check admin authentication first
    await requireAdminAuth();

    const { password } = await request.json();

    // Validate password against environment variable
    const adminDeletePassword = process.env.ADMIN_DELETE_PASSWORD;

    if (!adminDeletePassword) {
      console.error('ADMIN_DELETE_PASSWORD not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (password !== adminDeletePassword) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in verify-delete-password route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}
