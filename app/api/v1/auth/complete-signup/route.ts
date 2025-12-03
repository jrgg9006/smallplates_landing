/**
 * API Route - Complete Signup
 * Called after user successfully sets their password during invitation acceptance.
 * Updates waitlist status to 'converted' for users who came from waitlist.
 */

import { NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/route';
import { convertWaitlistUser } from '@/lib/supabase/waitlist';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRoute();

    // Verify user is authenticated using server client (handles cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error in complete-signup:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - user must be logged in' },
        { status: 401 }
      );
    }

    console.log('🔄 Processing signup completion for user:', user.id);

    // Check if user came from waitlist (has waitlist_id in metadata)
    const userMetadata = user.user_metadata || {};
    const waitlistId = userMetadata.waitlist_id;

    if (!waitlistId) {
      console.log('ℹ️ User did not come from waitlist, no conversion needed');
      return NextResponse.json({
        success: true,
        message: 'Signup completed (not from waitlist)'
      });
    }

    console.log('📋 User came from waitlist, converting:', waitlistId);

    // Convert waitlist user to 'converted' status
    const { success, error } = await convertWaitlistUser(waitlistId);

    if (!success) {
      console.error('❌ Failed to convert waitlist user:', error);
      // Don't fail the request - signup was still successful
      // Just log the error and return success
      console.log('⚠️ Waitlist conversion failed but signup was successful');
      return NextResponse.json({
        success: true,
        message: 'Signup completed',
        warning: 'Waitlist conversion failed but account is active'
      });
    }

    console.log('✅ Successfully completed signup and converted waitlist user');
    return NextResponse.json({
      success: true,
      message: 'Signup completed and waitlist converted',
      converted: true
    });

  } catch (error) {
    console.error('❌ Unexpected error in complete-signup route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}