import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { getUserWithGuestsAdmin, getUserOnboardingAdmin } from '@/lib/supabase/admin-users';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin authentication
    await requireAdminAuth();
    
    const { userId } = await params;
    
    // Use admin service client - sees ALL data
    const { profile, guests, error } = await getUserWithGuestsAdmin(userId);
    
    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }
    
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const onboarding = await getUserOnboardingAdmin(userId);

    return NextResponse.json({
      profile,
      guests,
      onboarding,
    });
  } catch (error) {
    console.error('Error in /api/admin/activity/users/[userId]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
