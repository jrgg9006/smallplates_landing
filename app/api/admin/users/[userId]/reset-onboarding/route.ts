/**
 * API Route - Reset Onboarding State (Admin Only)
 * Resets onboarding_state to default for a specific user
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const DEFAULT_ONBOARDING_STATE = {
  has_seen_welcome: false,
  welcome_dismissed_at: null,
  completed_steps: [],
  last_onboarding_shown: null,
  dismissal_count: 0,
  first_recipe_showcase_sent: false
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check admin authentication
    await requireAdminAuth();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Admin resetting onboarding state for user:', userId);

    const supabaseAdmin = createSupabaseAdminClient();

    // Verify user exists
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError || !userData) {
      console.error('❌ User not found:', getUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Reset onboarding_state to default
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ onboarding_state: DEFAULT_ONBOARDING_STATE })
      .eq('id', userId);

    if (error) {
      console.error('❌ Error resetting onboarding state:', error);
      return NextResponse.json(
        { error: 'Failed to reset onboarding state' },
        { status: 500 }
      );
    }

    console.log('✅ Onboarding state reset successfully');

    return NextResponse.json({
      success: true,
      message: 'Onboarding state reset to default'
    });

  } catch (error) {
    console.error('❌ Error in reset onboarding route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}

