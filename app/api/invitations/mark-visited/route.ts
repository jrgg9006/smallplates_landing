/**
 * API Route - Mark Invitation as Visited
 * Records when a user clicks the invitation link and visits the join page
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase Admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    // Validate input
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    console.log('👁️ Marking invitation as visited:', token);

    // Update visited_at timestamp for this token
    const { data, error } = await supabaseAdmin
      .from('waitlist_invitations')
      .update({ 
        visited_at: new Date().toISOString() 
      })
      .eq('token', token)
      .eq('used', false) // Only update if not already used
      .select('email, visited_at')
      .single();

    if (error) {
      console.error('❌ Error marking invitation as visited:', error);
      return NextResponse.json(
        { error: 'Failed to mark as visited' },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('⚠️ No invitation found or already used for token:', token);
      return NextResponse.json(
        { error: 'Invitation not found or already used' },
        { status: 404 }
      );
    }

    console.log('✅ Invitation marked as visited:', {
      email: data.email,
      visited_at: data.visited_at
    });

    return NextResponse.json({
      success: true,
      message: 'Marked as visited',
      data: {
        email: data.email,
        visited_at: data.visited_at
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error in mark-visited route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to mark as visited'
      },
      { status: 500 }
    );
  }
}