import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleApiError } from '@/lib/errors/api-errors';

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

// Reason: write a debug_log row when the link-recipe pipeline fails so admins
// see WHY a recipe ends up orphan (not just THAT it's orphan via the synthetic
// detection). Fire-and-forget — never let logging break the request.
async function logLinkRecipeFailure(args: {
  recipeId: string;
  profileId: string | null;
  resolvedGroupId: string | null;
  cookbookId: string | null;
  failureReason: string;
  errorDetails?: unknown;
}) {
  try {
    await supabaseAdmin.from('debug_logs').insert({
      event_type: 'link_recipe_failed',
      recipe_id: args.recipeId,
      user_id: args.profileId,
      context: {
        function: 'link-recipe',
        resolved_group_id: args.resolvedGroupId,
        cookbook_id: args.cookbookId,
        failure_reason: args.failureReason,
        error_details: args.errorDetails ? String(args.errorDetails) : null,
      },
    });
  } catch (logErr) {
    console.error('Failed to write link_recipe_failed debug log:', logErr);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { recipeId, cookbookId, groupId, collectionToken } = await request.json();

    console.log('🔍 DEBUG - API endpoint called with:', { recipeId, cookbookId, groupId, hasToken: !!collectionToken });

    if (!recipeId || !collectionToken) {
      console.warn('❌ API - Missing required fields:', { recipeId: !!recipeId, collectionToken: !!collectionToken });
      return NextResponse.json(
        { error: 'Recipe ID and collection token are required' },
        { status: 400 }
      );
    }

    // Validate collection token and get user info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, collection_enabled, collection_link_token')
      .eq('collection_link_token', collectionToken)
      .eq('collection_enabled', true)
      .single();

    if (profileError) {
      console.error('❌ API - Profile lookup error:', profileError);
    }

    if (!profile) {
      console.warn('❌ API - Invalid collection token');
      return NextResponse.json(
        { error: 'Invalid collection token' },
        { status: 401 }
      );
    }

    // Reason: CRITICAL — auto-resolve groupId server-side if client sent null.
    // Captains (role='member') count as valid organizers too, same as in
    // validateCollectionToken — only auto-resolves when there's exactly one
    // active group for this profile.
    let resolvedGroupId = groupId;
    if (!resolvedGroupId && !cookbookId) {
      const { data: userGroups } = await supabaseAdmin
        .from('group_members')
        .select('group_id, groups!inner(id, name, book_closed_by_user)')
        .eq('profile_id', profile.id);

      if (userGroups && userGroups.length > 0) {
        const activeGroups = userGroups.filter((gm) => {
          const group = gm.groups as unknown as { book_closed_by_user: string | null };
          return !group.book_closed_by_user;
        });
        const candidates = activeGroups.length > 0 ? activeGroups : userGroups;
        if (candidates.length === 1) {
          resolvedGroupId = candidates[0].group_id;
          console.log(`🛡️ SERVER FAIL-SAFE: Auto-resolved groupId ${resolvedGroupId} for recipe ${recipeId}`);
        } else {
          console.error(`🚨 CRITICAL: Cannot auto-resolve group for recipe ${recipeId} — user has ${candidates.length} groups`);
          await logLinkRecipeFailure({
            recipeId, profileId: profile.id, resolvedGroupId: null, cookbookId,
            failureReason: `Cannot auto-resolve group: profile has ${candidates.length} active groups (multi-group edge case)`,
          });
        }
      }
    }

    let targetCookbookId: string | null = null;

    if (resolvedGroupId) {
      // Verify user is a member of the group
      const { data: groupMember } = await supabaseAdmin
        .from('group_members')
        .select('profile_id')
        .eq('group_id', resolvedGroupId)
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (!groupMember) {
        await logLinkRecipeFailure({
          recipeId, profileId: profile.id, resolvedGroupId, cookbookId,
          failureReason: 'User does not have access to this group',
        });
        return NextResponse.json(
          { error: 'User does not have access to this group' },
          { status: 403 }
        );
      }

      // Find the group's cookbook
      const { data: cookbook } = await supabaseAdmin
        .from('cookbooks')
        .select('id')
        .eq('group_id', resolvedGroupId)
        .eq('is_group_cookbook', true)
        .maybeSingle();

      if (!cookbook) {
        await logLinkRecipeFailure({
          recipeId, profileId: profile.id, resolvedGroupId, cookbookId,
          failureReason: 'Group cookbook not found',
        });
        return NextResponse.json(
          { error: 'Group cookbook not found' },
          { status: 404 }
        );
      }

      targetCookbookId = cookbook.id;
    } else if (cookbookId) {
      // Verify user has access to cookbook
      const { data: cookbook } = await supabaseAdmin
        .from('cookbooks')
        .select('id, user_id, is_group_cookbook, group_id')
        .eq('id', cookbookId)
        .single();

      if (!cookbook) {
        await logLinkRecipeFailure({
          recipeId, profileId: profile.id, resolvedGroupId, cookbookId,
          failureReason: 'Cookbook not found',
        });
        return NextResponse.json(
          { error: 'Cookbook not found' },
          { status: 404 }
        );
      }

      let hasAccess = false;
      if (cookbook.is_group_cookbook && cookbook.group_id) {
        const { data: groupMember } = await supabaseAdmin
          .from('group_members')
          .select('profile_id')
          .eq('group_id', cookbook.group_id)
          .eq('profile_id', profile.id)
          .maybeSingle();

        hasAccess = !!groupMember;
      } else {
        hasAccess = cookbook.user_id === profile.id;
      }

      if (!hasAccess) {
        await logLinkRecipeFailure({
          recipeId, profileId: profile.id, resolvedGroupId, cookbookId,
          failureReason: 'User does not have access to this cookbook',
        });
        return NextResponse.json(
          { error: 'User does not have access to this cookbook' },
          { status: 403 }
        );
      }

      targetCookbookId = cookbookId;
    } else {
      await logLinkRecipeFailure({
        recipeId, profileId: profile.id, resolvedGroupId: null, cookbookId: null,
        failureReason: 'Neither cookbookId nor groupId could be resolved',
      });
      return NextResponse.json(
        { error: 'Either cookbookId or groupId is required' },
        { status: 400 }
      );
    }

    // Check if recipe is already in cookbook
    const { data: existing } = await supabaseAdmin
      .from('cookbook_recipes')
      .select('id')
      .eq('cookbook_id', targetCookbookId)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: true, message: 'Recipe already in cookbook' },
        { status: 200 }
      );
    }

    // Get next display order
    const { count } = await supabaseAdmin
      .from('cookbook_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('cookbook_id', targetCookbookId);

    // Insert recipe into cookbook
    const { error: insertError, data: insertData } = await supabaseAdmin
      .from('cookbook_recipes')
      .insert({
        cookbook_id: targetCookbookId,
        recipe_id: recipeId,
        user_id: profile.id,
        display_order: (count || 0) + 1,
      })
      .select();

    if (insertError) {
      console.error('❌ API - Error inserting recipe into cookbook:', insertError);
      await logLinkRecipeFailure({
        recipeId, profileId: profile.id, resolvedGroupId, cookbookId: targetCookbookId,
        failureReason: 'Insert into cookbook_recipes failed',
        errorDetails: insertError,
      });
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    // Reason: CRITICAL — ensure ALL 3 tables are updated when linking recipe to group
    if (resolvedGroupId) {
      // 1. group_recipes (join table — source of truth for Operations & Book Production)
      const { data: existingGroupRecipe } = await supabaseAdmin
        .from('group_recipes')
        .select('group_id, recipe_id, removed_at')
        .eq('group_id', resolvedGroupId)
        .eq('recipe_id', recipeId)
        .maybeSingle();

      if (!existingGroupRecipe) {
        const { error: groupRecipeError } = await supabaseAdmin
          .from('group_recipes')
          .insert({
            group_id: resolvedGroupId,
            recipe_id: recipeId,
            added_by: profile.id,
            note: null
          });

        if (groupRecipeError) {
          console.error('Error adding to group_recipes:', groupRecipeError);
          // Reason: this is the silent failure that produced the "Pulpito" orphan.
          // Endpoint still returns 200 to keep the guest's submit success — but
          // we now record the WHY for admin visibility.
          await logLinkRecipeFailure({
            recipeId, profileId: profile.id, resolvedGroupId, cookbookId: targetCookbookId,
            failureReason: 'Insert into group_recipes failed',
            errorDetails: groupRecipeError,
          });
        }
      } else if (existingGroupRecipe.removed_at) {
        const { error: reactivateError } = await supabaseAdmin
          .from('group_recipes')
          .update({
            removed_at: null,
            removed_by: null,
            added_by: profile.id,
            added_at: new Date().toISOString()
          })
          .eq('group_id', resolvedGroupId)
          .eq('recipe_id', recipeId);

        if (reactivateError) {
          console.error('Error reactivating in group_recipes:', reactivateError);
          await logLinkRecipeFailure({
            recipeId, profileId: profile.id, resolvedGroupId, cookbookId: targetCookbookId,
            failureReason: 'Reactivate in group_recipes failed',
            errorDetails: reactivateError,
          });
        }
      }
      // If it exists and is active, do nothing (already in group)

      // 2. guest_recipes.group_id — update if null
      await supabaseAdmin
        .from('guest_recipes')
        .update({ group_id: resolvedGroupId })
        .eq('id', recipeId)
        .is('group_id', null);

      // 3. guests.group_id — update if null
      const { data: recipeRow } = await supabaseAdmin
        .from('guest_recipes')
        .select('guest_id')
        .eq('id', recipeId)
        .single();

      if (recipeRow?.guest_id) {
        await supabaseAdmin
          .from('guests')
          .update({ group_id: resolvedGroupId })
          .eq('id', recipeRow.guest_id)
          .is('group_id', null);
      }
    }

    return NextResponse.json(
      { success: true, message: 'Recipe added to cookbook', data: insertData },
      { status: 200 }
    );
  } catch (error) {
    const apiError = handleApiError(error, 'link-recipe API', 'Failed to link recipe');
    return NextResponse.json(
      { 
        error: apiError.message,
        type: apiError.type,
        timestamp: apiError.timestamp,
        ...(apiError.details && { details: apiError.details })
      },
      { status: apiError.statusCode }
    );
  }
}
