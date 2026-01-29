/**
 * API Route - Get User Preview (Admin Only)
 * Returns detailed information about a user for preview before deletion
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
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

    const supabaseAdmin = createSupabaseAdminClient();

    // Get user profile (including deleted_at for soft delete status)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = not found, which is okay (user might exist in auth but not in profiles)
      console.error('Error fetching profile:', profileError);
    }

    // Get user from auth
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);

    // Count recipes
    const { count: recipesCount } = await supabaseAdmin
      .from('guest_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count guests
    const { count: guestsCount } = await supabaseAdmin
      .from('guests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get groups where user is owner
    const { data: ownedGroups } = await supabaseAdmin
      .from('groups')
      .select(`
        id,
        name,
        created_at,
        cookbooks (
          id,
          name
        )
      `)
      .eq('created_by', userId);

    // Get groups where user is member (but not owner)
    const { data: memberGroups } = await supabaseAdmin
      .from('group_members')
      .select(`
        role,
        groups (
          id,
          name,
          created_at,
          cookbooks (
            id,
            name
          )
        )
      `)
      .eq('profile_id', userId)
      .neq('role', 'owner');

    // Count recipes in owned groups
    let totalRecipesInOwnedGroups = 0;
    if (ownedGroups && ownedGroups.length > 0) {
      const groupIds = ownedGroups.map(g => g.id);
      const { count: recipesInGroups } = await supabaseAdmin
        .from('group_recipes')
        .select('*', { count: 'exact', head: true })
        .in('group_id', groupIds);
      totalRecipesInOwnedGroups = recipesInGroups || 0;
    }

    // Count recipes in member groups
    let totalRecipesInMemberGroups = 0;
    if (memberGroups && memberGroups.length > 0) {
      const memberGroupIds = memberGroups.map(m => (m.groups as any)?.id).filter(Boolean);
      if (memberGroupIds.length > 0) {
        const { count: recipesInMemberGroups } = await supabaseAdmin
          .from('group_recipes')
          .select('*', { count: 'exact', head: true })
          .in('group_id', memberGroupIds);
        totalRecipesInMemberGroups = recipesInMemberGroups || 0;
      }
    }

    // Count cookbooks
    const { count: cookbooksCount } = await supabaseAdmin
      .from('cookbooks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count shipping addresses
    const { count: shippingAddressesCount } = await supabaseAdmin
      .from('shipping_addresses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Count communication logs
    const { count: communicationLogsCount } = await supabaseAdmin
      .from('communication_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Check if user has waitlist entry
    const waitlistId = authUser?.user?.user_metadata?.waitlist_id;
    let waitlistEntry = null;
    if (waitlistId) {
      const { data: waitlist } = await supabaseAdmin
        .from('waitlist')
        .select('*')
        .eq('id', waitlistId)
        .single();
      waitlistEntry = waitlist;
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: profile || null,
        authUser: authUser?.user ? {
          email: authUser.user.email,
          created_at: authUser.user.created_at,
          email_confirmed_at: authUser.user.email_confirmed_at,
        } : null,
        isDeleted: profile?.deleted_at !== null && profile?.deleted_at !== undefined,
        deletedAt: profile?.deleted_at || null,
        counts: {
          recipes: recipesCount || 0,
          guests: guestsCount || 0,
          cookbooks: cookbooksCount || 0,
          shippingAddresses: shippingAddressesCount || 0,
          communicationLogs: communicationLogsCount || 0,
        },
        groups: {
          owned: ownedGroups?.map(g => ({
            id: g.id,
            name: g.name,
            created_at: g.created_at,
            cookbooks: (g.cookbooks as any[]) || [],
          })) || [],
          ownedCount: ownedGroups?.length || 0,
          totalRecipesInOwnedGroups,
          memberships: memberGroups?.map(m => ({
            role: m.role,
            group: {
              id: (m.groups as any)?.id,
              name: (m.groups as any)?.name,
              created_at: (m.groups as any)?.created_at,
              cookbooks: ((m.groups as any)?.cookbooks as any[]) || [],
            }
          })) || [],
          membershipsCount: memberGroups?.length || 0,
          totalRecipesInMemberGroups,
        },
        waitlist: waitlistEntry,
      }
    });

  } catch (err) {
    console.error('Error getting user preview:', err);
    return NextResponse.json(
      { 
        error: err instanceof Error ? err.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
