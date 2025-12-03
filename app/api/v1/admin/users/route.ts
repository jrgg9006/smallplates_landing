/**
 * API Route - Get All Users (Admin Only)
 * Returns list of all users for admin panel
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getAllUsersAdmin } from '@/lib/supabase/admin-users';

export async function GET() {
  try {
    // Check admin authentication
    await requireAdminAuth();

    const { data, error } = await getAllUsersAdmin();

    if (error) {
      return NextResponse.json(
        { error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('❌ Error in get users route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}

