/**
 * API Route - Hard Delete Preview (Admin Only)
 * Returns everything that would be deleted if hard delete runs.
 * Does NOT mutate anything — pure read.
 * Guarded: only works on profiles with is_test_account = true.
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminAuth();
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Fetch profile (includes is_test_account guardrail check)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.is_test_account) {
      return NextResponse.json(
        { error: 'Preview only available for profiles with is_test_account = true' },
        { status: 403 }
      );
    }

    // Gather owned group IDs first (we need them for related queries)
    const { data: ownedGroups } = await supabaseAdmin
      .from('groups')
      .select('id, name, created_at, created_by, book_status')
      .eq('created_by', userId);

    const ownedGroupIds = (ownedGroups || []).map(g => g.id);

    // Gather user's recipe IDs (for cookbook_recipes / recipe_* child tables)
    const { data: userRecipes } = await supabaseAdmin
      .from('guest_recipes')
      .select('id, recipe_name, submission_status, created_at, guest_id')
      .eq('user_id', userId);

    const userRecipeIds = (userRecipes || []).map(r => r.id);

    // Gather user's cookbook IDs
    const { data: userCookbooks } = await supabaseAdmin
      .from('cookbooks')
      .select('id, name, is_default, is_group_cookbook, group_id, created_at')
      .eq('user_id', userId);

    const userCookbookIds = (userCookbooks || []).map(c => c.id);

    // Queries run sequentially but each is small; simplicity over parallelism
    const [
      { data: orders },
      { data: guests },
      { data: shippingAddresses },
      { data: communicationLog },
      { data: groupMembers },
      { data: groupInvitations },
      { data: groupRecipes },
      { data: cookbookRecipes },
      { data: recipeEditHistory },
    ] = await Promise.all([
      supabaseAdmin.from('orders')
        .select('id, status, amount_total, order_type, stripe_payment_intent, created_at, email')
        .eq('user_id', userId),
      supabaseAdmin.from('guests')
        .select('id, first_name, last_name, email, status, group_id, created_at')
        .eq('user_id', userId),
      supabaseAdmin.from('shipping_addresses')
        .select('id, recipient_name, city, country, group_id, created_at')
        .eq('user_id', userId),
      supabaseAdmin.from('communication_log')
        .select('id, type, channel, status, sent_at, guest_id')
        .eq('user_id', userId),
      supabaseAdmin.from('group_members')
        .select('group_id, profile_id, role, joined_at')
        .or(
          ownedGroupIds.length > 0
            ? `profile_id.eq.${userId},group_id.in.(${ownedGroupIds.join(',')})`
            : `profile_id.eq.${userId}`
        ),
      supabaseAdmin.from('group_invitations')
        .select('id, group_id, email, status, invited_by, created_at')
        .or(
          ownedGroupIds.length > 0
            ? `invited_by.eq.${userId},group_id.in.(${ownedGroupIds.join(',')})`
            : `invited_by.eq.${userId}`
        ),
      supabaseAdmin.from('group_recipes')
        .select('id, group_id, recipe_id, added_by, added_at')
        .or(
          ownedGroupIds.length > 0
            ? `added_by.eq.${userId},group_id.in.(${ownedGroupIds.join(',')})`
            : `added_by.eq.${userId}`
        ),
      supabaseAdmin.from('cookbook_recipes')
        .select('id, cookbook_id, recipe_id, user_id, display_order')
        .or(
          [
            `user_id.eq.${userId}`,
            userRecipeIds.length > 0 ? `recipe_id.in.(${userRecipeIds.join(',')})` : null,
            userCookbookIds.length > 0 ? `cookbook_id.in.(${userCookbookIds.join(',')})` : null,
          ].filter(Boolean).join(',')
        ),
      supabaseAdmin.from('recipe_edit_history')
        .select('id, recipe_id, edited_by, edited_at, edit_target')
        .eq('edited_by', userId),
    ]);

    const payload = {
      profile,
      generatedAt: new Date().toISOString(),
      tables: {
        profiles: [profile],
        orders: orders || [],
        groups_owned: ownedGroups || [],
        cookbooks: userCookbooks || [],
        guests: guests || [],
        guest_recipes: userRecipes || [],
        shipping_addresses: shippingAddresses || [],
        communication_log: communicationLog || [],
        group_members: groupMembers || [],
        group_invitations: groupInvitations || [],
        group_recipes: groupRecipes || [],
        cookbook_recipes: cookbookRecipes || [],
        recipe_edit_history: recipeEditHistory || [],
      },
      counts: {
        profiles: 1,
        orders: (orders || []).length,
        groups_owned: (ownedGroups || []).length,
        cookbooks: (userCookbooks || []).length,
        guests: (guests || []).length,
        guest_recipes: (userRecipes || []).length,
        shipping_addresses: (shippingAddresses || []).length,
        communication_log: (communicationLog || []).length,
        group_members: (groupMembers || []).length,
        group_invitations: (groupInvitations || []).length,
        group_recipes: (groupRecipes || []).length,
        cookbook_recipes: (cookbookRecipes || []).length,
        recipe_edit_history: (recipeEditHistory || []).length,
      },
    };

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}
