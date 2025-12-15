/**
 * API Route - Admin Invitations List
 * Provides detailed invitation data with filtering, pagination, and sorting
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminAuth } from '@/lib/auth/admin';

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

export async function GET(request: Request) {
  try {
    // Check admin authentication
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Simple filter parameters
    const status = searchParams.get('status'); // pending, accepted, declined, expired

    console.log('📋 Admin fetching invitations list with filters:', {
      page,
      limit,
      status
    });

    // Build base query
    let query = supabaseAdmin
      .from('group_invitations')
      .select(`
        id,
        email,
        name,
        status,
        created_at,
        expires_at,
        group_id,
        invited_by,
        groups (
          id,
          name,
          description,
          created_at
        ),
        inviter:profiles!group_invitations_invited_by_fkey (
          id,
          full_name,
          email
        )
      `);

    // Apply simple status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Simple sorting by created_at
    query = query.order('created_at', { ascending: false });

    // Get total count for pagination (before applying limit/offset)
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('group_invitations')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting total count:', countError);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: invitations, error: queryError } = await query;

    if (queryError) {
      console.error('❌ Error fetching invitations:', queryError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Process the data with minimal fields
    const processedInvitations = (invitations || []).map(invitation => {
      return {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        status: invitation.status,
        createdAt: invitation.created_at,
        
        // Group information
        group: {
          name: (invitation.groups as any)?.name || 'Unknown Group'
        },
        
        // Inviter information
        inviter: {
          name: (invitation.inviter as any)?.full_name || (invitation.inviter as any)?.email || 'Unknown User'
        }
      };
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;


    console.log(`✅ Successfully fetched ${processedInvitations.length} invitations (page ${page}/${totalPages})`);

    return NextResponse.json({
      success: true,
      data: {
        invitations: processedInvitations,
        
        // Pagination
        pagination: {
          page,
          limit,
          totalCount: totalCount || 0,
          totalPages,
          hasNextPage,
          hasPreviousPage
        },
        
        // Applied filters
        appliedFilters: {
          status
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching admin invitations list:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: 401 }
    );
  }
}