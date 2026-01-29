/**
 * API Route - Get Group Info (Public)
 * Returns basic group information for public join links
 * No authentication required - this is public info for join pages
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching public group info:', groupId);

    // Fetch group from database - only public info
    const { data: group, error } = await supabaseAdmin
      .from('groups')
      .select(`
        id,
        name,
        description,
        couple_image_url,
        created_at
      `)
      .eq('id', groupId)
      .single();

    if (error || !group) {
      console.error('❌ Group not found:', error);
      return NextResponse.json(
        { 
          error: 'Group not found',
          status: 'invalid'
        },
        { status: 404 }
      );
    }

    console.log('✅ Group found:', group.name);

    // Return public group info
    return NextResponse.json({
      success: true,
      data: {
        id: group.id,
        name: group.name,
        description: group.description,
        coupleImageUrl: group.couple_image_url,
        createdAt: group.created_at
      }
    });

  } catch (error) {
    console.error('❌ Unexpected error fetching group:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch group info',
        status: 'error'
      },
      { status: 500 }
    );
  }
}

