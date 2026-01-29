/**
 * API Route - Delete Own Account
 * Allows users to delete their own account using the same smart deletion logic as admin
 * - If user has content (recipes, guests, groups) → Soft delete (preserve data)
 * - If user has no content → Hard delete (remove completely)
 */

import { NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/client';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function DELETE(request: Request) {
  try {
    const supabase = createSupabaseClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const supabaseAdmin = createSupabaseAdminClient();

    // Get password from request body for verification
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Verify password
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: password
    });

    if (verifyError) {
      return NextResponse.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // Check if user already deleted (safety check)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('deleted_at')
      .eq('id', userId)
      .single();

    if (existingProfile?.deleted_at) {
      return NextResponse.json(
        { error: 'Account is already deleted' },
        { status: 400 }
      );
    }

    // Get waitlist_id from user metadata before deleting
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const waitlistId = userData?.user?.user_metadata?.waitlist_id;

    console.log('🗑️ User deleting own account:', userId);

    // STEP 1: Check if user has any content
    const { data: guests } = await supabaseAdmin
      .from('guests')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: recipes } = await supabaseAdmin
      .from('guest_recipes')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: userGroups } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('created_by', userId);

    // Check if any groups have recipes
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
          .neq('profile_id', userId);
        
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

    // STEP 3: Perform deletion based on content
    if (hasContent) {
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
          { error: `Failed to delete account: ${softDeleteError.message}` },
          { status: 500 }
        );
      }

      // Disable auth user (but don't delete to preserve foreign keys)
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

      // Delete waitlist entry if exists
      if (waitlistId) {
        try {
          await supabaseAdmin
            .from('waitlist')
            .delete()
            .eq('id', waitlistId);
          console.log('✅ Waitlist entry deleted:', waitlistId);
        } catch (waitlistError) {
          console.error('⚠️ Error deleting waitlist entry (non-critical):', waitlistError);
        }
      }

      // Sign out the user
      await supabase.auth.signOut();

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully - all data preserved',
        deletionType: 'soft'
      });

    } else {
      // HARD DELETE: User has no content, safe to delete completely
      console.log('🗑️ User has no content - performing HARD DELETE (complete removal)');
      
      // Try to delete user from auth.users
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
              { error: `Failed to delete account: ${retryError.message}` },
              { status: 500 }
            );
          }
          
          console.log('✅ User deleted successfully using alternative method');
          
        } catch (cleanupError) {
          console.error('❌ Error during manual cleanup:', cleanupError);
          return NextResponse.json(
            { error: `Failed to delete account: ${deleteError.message}. Cleanup attempt also failed.` },
            { status: 500 }
          );
        }
      } else {
        console.log('✅ User deleted successfully via CASCADE');
      }

      // Delete waitlist entry if exists
      if (waitlistId) {
        try {
          await supabaseAdmin
            .from('waitlist')
            .delete()
            .eq('id', waitlistId);
          console.log('✅ Waitlist entry deleted:', waitlistId);
        } catch (waitlistError) {
          console.error('⚠️ Error deleting waitlist entry (non-critical):', waitlistError);
        }
      }

      // Sign out (though user will be deleted anyway)
      await supabase.auth.signOut();

      return NextResponse.json({
        success: true,
        message: 'Account permanently deleted',
        deletionType: 'hard'
      });
    }

  } catch (error) {
    console.error('❌ Error in delete account route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
