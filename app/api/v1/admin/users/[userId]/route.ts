/**
 * API Route - Delete User (Admin Only)
 * Implements smart deletion:
 * - If user has content (recipes, guests, groups) → Soft delete (preserve data)
 * - If user has no content → Hard delete (remove completely)
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(
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

    // Reason: optional explicit override of smart deletion. Default keeps the legacy
    // smart behavior so existing callers don't change. UI can pass ?mode=hard or ?mode=soft
    // to force a specific path regardless of whether the user has content.
    const url = new URL(request.url);
    const mode = url.searchParams.get('mode'); // 'hard' | 'soft' | null
    const forceHard = mode === 'hard';
    const forceSoft = mode === 'soft';

    console.log('🗑️ Admin deleting user:', userId, mode ? `(forced mode=${mode})` : '(smart)');

    const supabaseAdmin = createSupabaseAdminClient();

    // First, verify user exists
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError || !userData) {
      console.error('❌ User not found:', getUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already deleted (safety check)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('deleted_at, is_test_account')
      .eq('id', userId)
      .single();

    if (existingProfile?.deleted_at) {
      return NextResponse.json(
        { error: 'User is already deleted' },
        { status: 400 }
      );
    }

    // Reason: hard delete is irreversible — only allowed on profiles explicitly flagged as test accounts.
    // This prevents accidentally nuking a real user's data even if the admin clicks the wrong button.
    if (forceHard && !existingProfile?.is_test_account) {
      return NextResponse.json(
        { error: 'Hard delete is only allowed on profiles with is_test_account = true. Mark the user as TEST first.' },
        { status: 403 }
      );
    }

    // STEP 1: Check if user has any content
    // We need to preserve recipes and guests if they exist
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('guests')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: recipes, error: recipesError } = await supabaseAdmin
      .from('guest_recipes')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: userGroups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('created_by', userId);

    // Check if any groups have recipes (even if user didn't create them)
    let hasGroupContent = false;
    if (userGroups && userGroups.length > 0) {
      const groupIds = userGroups.map(g => g.id);
      const { data: groupRecipes } = await supabaseAdmin
        .from('group_recipes')
        .select('id')
        .in('group_id', groupIds)
        .limit(1);
      hasGroupContent = (groupRecipes && groupRecipes.length > 0) || false;
    }

    // Also check if user is a member of any groups with content
    const { data: memberGroups } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', userId);
    
    if (memberGroups && memberGroups.length > 0) {
      const memberGroupIds = memberGroups.map(m => m.group_id);
      const { data: memberGroupRecipes } = await supabaseAdmin
        .from('group_recipes')
        .select('id')
        .in('group_id', memberGroupIds)
        .limit(1);
      if (memberGroupRecipes && memberGroupRecipes.length > 0) {
        hasGroupContent = true;
      }
    }

    const hasContent = 
      (guests && guests.length > 0) || 
      (recipes && recipes.length > 0) || 
      (userGroups && userGroups.length > 0 && hasGroupContent) ||
      (memberGroups && memberGroups.length > 0 && hasGroupContent);

    console.log('📊 User content check:', {
      hasGuests: guests && guests.length > 0,
      hasRecipes: recipes && recipes.length > 0,
      hasGroups: userGroups && userGroups.length > 0,
      hasGroupContent,
      hasContent
    });

    // STEP 2: Handle group ownership transfer BEFORE any deletion
    if (userGroups && userGroups.length > 0) {
      console.log(`📋 Found ${userGroups.length} groups created by user. Processing ownership transfer...`);
      
      for (const group of userGroups) {
        // Get all members of this group (excluding the user being deleted)
        const { data: members, error: membersError } = await supabaseAdmin
          .from('group_members')
          .select('profile_id, role')
          .eq('group_id', group.id)
          .neq('profile_id', userId); // Exclude the user being deleted
        
        if (membersError) {
          console.error(`⚠️ Error getting members for group ${group.id}:`, membersError);
          continue;
        }

        if (members && members.length > 0) {
          // There are other members - transfer ownership to the first one
          const newOwnerId = members[0].profile_id;
          console.log(`🔄 Transferring ownership of group "${group.name}" to user ${newOwnerId}`);
          
          // Update group.created_by
          const { error: updateGroupError } = await supabaseAdmin
            .from('groups')
            .update({ created_by: newOwnerId })
            .eq('id', group.id);
          
          if (updateGroupError) {
            console.error(`❌ Error updating group ownership:`, updateGroupError);
            continue;
          }
          
          // Update new owner's role to 'owner' in group_members
          const { error: updateRoleError } = await supabaseAdmin
            .from('group_members')
            .update({ role: 'owner' })
            .eq('group_id', group.id)
            .eq('profile_id', newOwnerId);
          
          if (updateRoleError) {
            console.error(`❌ Error updating member role:`, updateRoleError);
            // Try to revert group ownership change
            await supabaseAdmin
              .from('groups')
              .update({ created_by: userId })
              .eq('id', group.id);
            continue;
          }
          
          console.log(`✅ Ownership transferred successfully for group "${group.name}"`);
        } else {
          // No other members - group will be deleted by CASCADE (only if hard delete)
          console.log(`ℹ️ Group "${group.name}" has no other members`);
        }
      }
    }

    // STEP 3: Perform deletion based on content (or forced mode)
    // forceSoft → always soft, forceHard → always hard, otherwise smart based on hasContent
    const shouldSoftDelete = forceSoft || (!forceHard && hasContent);
    if (shouldSoftDelete) {
      // SOFT DELETE: User has content, preserve everything
      console.log('🛡️ User has content - performing SOFT DELETE (preserving data)');
      
      // Mark profile as deleted
      const { error: softDeleteError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          deleted_at: new Date().toISOString(),
          email: `deleted_${Date.now()}_${userId.substring(0, 8)}@deleted.local`,
          full_name: 'Deleted User',
          collection_enabled: false
        })
        .eq('id', userId);

      if (softDeleteError) {
        console.error('❌ Error performing soft delete:', softDeleteError);
        return NextResponse.json(
          { error: `Failed to soft delete user: ${softDeleteError.message}` },
          { status: 500 }
        );
      }

      // Disable auth user (but don't delete to preserve foreign keys)
      // We'll update the email in auth.users to prevent login
      try {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { 
            email: `deleted_${Date.now()}_${userId.substring(0, 8)}@deleted.local`,
            email_confirm: false
          }
        );
        if (updateAuthError) {
          console.error('⚠️ Error updating auth user email (non-critical):', updateAuthError);
        }
      } catch (authError) {
        console.error('⚠️ Error updating auth user (non-critical):', authError);
      }

      console.log('✅ User soft deleted successfully - all data preserved');

      return NextResponse.json({
        success: true,
        message: 'User soft deleted successfully - all data preserved',
        deletionType: 'soft'
      });

    } else {
      // HARD DELETE: User has no content, safe to delete completely
      console.log('🗑️ User has no content - performing HARD DELETE (complete removal)');
      
    // Try to delete user from auth.users
    // This should CASCADE delete all related records in public tables
    let deleteError = null;
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      deleteError = error;
    } catch (err) {
      console.error('❌ Exception during delete:', err);
      deleteError = err as any;
    }

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      console.error('❌ Error details:', JSON.stringify(deleteError, null, 2));
      
      // If direct deletion fails, try alternative approach
      console.log('🔄 Attempting alternative deletion method...');
      
      try {
          // Delete from public tables manually
        await supabaseAdmin
          .from('group_invitations')
          .delete()
          .eq('invited_by', userId);
        
        if (userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(g => g.id);
          await supabaseAdmin
            .from('group_invitations')
            .delete()
            .in('group_id', groupIds);
        }
        
        await supabaseAdmin
          .from('group_members')
          .delete()
          .eq('profile_id', userId);
        
        await supabaseAdmin
          .from('group_recipes')
          .delete()
          .eq('added_by', userId);
        
        await supabaseAdmin
          .from('groups')
          .delete()
          .eq('created_by', userId);
        
        await supabaseAdmin
          .from('guest_recipes')
          .delete()
          .eq('user_id', userId);
        
        await supabaseAdmin
          .from('communication_log')
          .delete()
          .eq('user_id', userId);
        
        await supabaseAdmin
          .from('guests')
          .delete()
          .eq('user_id', userId);
        
        await supabaseAdmin
          .from('cookbooks')
          .delete()
          .eq('user_id', userId);
        
        await supabaseAdmin
          .from('shipping_addresses')
          .delete()
          .eq('user_id', userId);
        
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);
        
        const { error: retryError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (retryError) {
          console.error('❌ Still failed after manual cleanup:', retryError);
          return NextResponse.json(
            { error: `Failed to delete user even after manual cleanup: ${retryError.message}` },
            { status: 500 }
          );
        }
        
        console.log('✅ User deleted successfully using alternative method');
        
      } catch (cleanupError) {
        console.error('❌ Error during manual cleanup:', cleanupError);
        return NextResponse.json(
          { error: `Failed to delete user: ${deleteError.message}. Cleanup attempt also failed.` },
          { status: 500 }
        );
      }
      } else {
        console.log('✅ User deleted successfully via CASCADE');
    }

    return NextResponse.json({
      success: true,
        message: 'User deleted completely (hard delete)',
        deletionType: 'hard'
    });
    }

  } catch (error) {
    console.error('❌ Error in delete user route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}

