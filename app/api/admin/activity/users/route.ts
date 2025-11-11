import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getAllUsersAdmin } from '@/lib/supabase/admin-users';

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    // Use admin service client - sees ALL data
    const { data: users, error } = await getAllUsersAdmin();
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error in /api/admin/activity/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' }, 
      { status: 401 }
    );
  }
}