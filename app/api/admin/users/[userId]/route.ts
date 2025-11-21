/**
 * API Route - Delete User (Admin Only)
 * Deletes a user and all related data via CASCADE
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

    console.log('🗑️ Admin deleting user:', userId);

    const supabaseAdmin = createSupabaseAdminClient();

    // First, verify user exists and get waitlist_id if exists
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError || !userData) {
      console.error('❌ User not found:', getUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get waitlist_id from user metadata before deleting
    const waitlistId = userData.user?.user_metadata?.waitlist_id;
    if (waitlistId) {
      console.log('📋 Found waitlist_id:', waitlistId);
    }

    // STEP 1: Handle group ownership transfer BEFORE deleting user
    // Get all groups created by this user
    const { data: userGroups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('created_by', userId);

    if (groupsError) {
      console.error('⚠️ Error fetching user groups:', groupsError);
    } else if (userGroups && userGroups.length > 0) {
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
          // No other members - group will be deleted by CASCADE
          console.log(`ℹ️ Group "${group.name}" has no other members, will be deleted by CASCADE`);
        }
      }
    }

    // STEP 2: Now proceed with user deletion
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
      // Delete from public tables first, then auth.users
      console.log('🔄 Attempting alternative deletion method...');
      
      try {
        // Delete from public tables manually (CASCADE should handle this, but let's be explicit)
        // Note: We're using admin client which bypasses RLS
        
        // Delete group invitations where user is the inviter
        await supabaseAdmin
          .from('group_invitations')
          .delete()
          .eq('invited_by', userId);
        
        // Get groups created by this user to delete their invitations
        const { data: userGroups } = await supabaseAdmin
          .from('groups')
          .select('id')
          .eq('created_by', userId);
        
        if (userGroups && userGroups.length > 0) {
          const groupIds = userGroups.map(g => g.id);
          await supabaseAdmin
            .from('group_invitations')
            .delete()
            .in('group_id', groupIds);
        }
        
        // Delete group members
        await supabaseAdmin
          .from('group_members')
          .delete()
          .eq('profile_id', userId);
        
        // Delete group_recipes where user added the recipe
        await supabaseAdmin
          .from('group_recipes')
          .delete()
          .eq('added_by', userId);
        
        // Delete groups where user is still the creator
        // Note: Groups with other members should have had ownership transferred already
        // Only delete groups where user is still the creator (no other members)
        await supabaseAdmin
          .from('groups')
          .delete()
          .eq('created_by', userId);
        
        // Delete guest recipes
        await supabaseAdmin
          .from('guest_recipes')
          .delete()
          .eq('user_id', userId);
        
        // Delete communication log
        await supabaseAdmin
          .from('communication_log')
          .delete()
          .eq('user_id', userId);
        
        // Delete guests
        await supabaseAdmin
          .from('guests')
          .delete()
          .eq('user_id', userId);
        
        // Delete cookbooks
        await supabaseAdmin
          .from('cookbooks')
          .delete()
          .eq('user_id', userId);
        
        // Delete shipping addresses
        await supabaseAdmin
          .from('shipping_addresses')
          .delete()
          .eq('user_id', userId);
        
        // Delete profile
        await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', userId);
        
        // Now try to delete from auth.users again
        const { error: retryError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        
        if (retryError) {
          console.error('❌ Still failed after manual cleanup:', retryError);
          return NextResponse.json(
            { error: `Failed to delete user even after manual cleanup: ${retryError.message}` },
            { status: 500 }
          );
        }
        
        console.log('✅ User deleted successfully using alternative method');
        
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
            // Don't fail the whole operation if waitlist deletion fails
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'User deleted successfully'
        });
        
      } catch (cleanupError) {
        console.error('❌ Error during manual cleanup:', cleanupError);
        return NextResponse.json(
          { error: `Failed to delete user: ${deleteError.message}. Cleanup attempt also failed.` },
          { status: 500 }
        );
      }
    }

    console.log('✅ User deleted successfully');

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
        // Don't fail the whole operation if waitlist deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

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

