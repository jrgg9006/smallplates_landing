/**
 * API Route - Check Conversion
 * Backup endpoint to ensure waitlist users get converted when they access their profile.
 * This runs as a safety net to catch users who completed setup but weren't converted.
 */

import { NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/route';
import { convertWaitlistUser } from '@/lib/supabase/waitlist';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRoute();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('ℹ️ No authenticated user for conversion check');
      return NextResponse.json({ success: true, message: 'No user to check' });
    }

    console.log('🔍 Checking conversion status for user:', user.id);

    // Check if user came from waitlist
    const userMetadata = user.user_metadata || {};
    const waitlistId = userMetadata.waitlist_id;

    if (!waitlistId) {
      console.log('ℹ️ User did not come from waitlist');
      return NextResponse.json({ success: true, message: 'Not from waitlist' });
    }

    // Check current waitlist status
    const { data: waitlistUser, error: waitlistError } = await supabase
      .from('waitlist')
      .select('status, converted_at')
      .eq('id', waitlistId)
      .single();

    if (waitlistError) {
      console.error('❌ Error fetching waitlist user:', waitlistError);
      return NextResponse.json({ success: true, message: 'Waitlist record not found' });
    }

    if (waitlistUser.status === 'converted') {
      console.log('✅ User already converted');
      return NextResponse.json({ success: true, message: 'Already converted' });
    }

    // Check if user has profile (indicating completed setup)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('ℹ️ No profile found - user hasn\'t completed setup');
      return NextResponse.json({ success: true, message: 'Setup not complete' });
    }

    // User has profile and last sign-in, so they completed setup - convert them!
    console.log('🔧 User completed setup but not converted - fixing now!');
    
    const { success, error } = await convertWaitlistUser(waitlistId);

    if (!success) {
      console.error('❌ Failed to convert waitlist user:', error);
      return NextResponse.json({ success: false, error: 'Conversion failed' });
    }

    console.log('✅ Successfully converted waitlist user via check-conversion');
    return NextResponse.json({
      success: true,
      message: 'User converted successfully',
      converted: true
    });

  } catch (error) {
    console.error('❌ Unexpected error in check-conversion route:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}