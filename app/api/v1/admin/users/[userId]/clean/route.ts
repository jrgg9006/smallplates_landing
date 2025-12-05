/**
 * API Route - Clean User Data (Admin Only)
 * Removes all user content but keeps the account and default group
 * Returns user to "default" state like a new user
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(
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

    console.log('🧹 Admin cleaning user data:', userId);

    const supabaseAdmin = createSupabaseAdminClient();

    // Verify user exists
    const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError || !userData) {
      console.error('❌ User not found:', getUserError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Step 1: Get or create default group
    // First, check if user has a default group
    const { data: existingGroups, error: groupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('created_by', userId)
      .eq('name', 'My First Book')
      .limit(1);

    let defaultGroupId: string | null = null;

    if (groupsError) {
      console.error('⚠️ Error checking for default group:', groupsError);
    } else if (existingGroups && existingGroups.length > 0) {
      defaultGroupId = existingGroups[0].id;
      console.log('✅ Found existing default group:', defaultGroupId);
    } else {
      // Create default group if it doesn't exist
      const { data: newGroup, error: createGroupError } = await supabaseAdmin
        .from('groups')
        .insert({
          name: 'My First Book',
          description: 'Add recipes and invite friends to build your book',
          created_by: userId,
          visibility: 'private'
        })
        .select('id')
        .single();

      if (createGroupError) {
        console.error('❌ Error creating default group:', createGroupError);
        return NextResponse.json(
          { error: 'Failed to create default group' },
          { status: 500 }
        );
      }

      defaultGroupId = newGroup.id;
      console.log('✅ Created default group:', defaultGroupId);
    }

    // Step 2: Handle groups created by user (transfer ownership or delete)
    const { data: userCreatedGroups, error: createdGroupsError } = await supabaseAdmin
      .from('groups')
      .select('id, name')
      .eq('created_by', userId)
      .neq('id', defaultGroupId); // Exclude default group

    if (!createdGroupsError && userCreatedGroups && userCreatedGroups.length > 0) {
      console.log(`📋 Found ${userCreatedGroups.length} groups created by user. Processing...`);
      
      for (const group of userCreatedGroups) {
        // Get all members (excluding the user being cleaned)
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
          // Transfer ownership to first member
          const newOwnerId = members[0].profile_id;
          await supabaseAdmin
            .from('groups')
            .update({ created_by: newOwnerId })
            .eq('id', group.id);
          await supabaseAdmin
            .from('group_members')
            .update({ role: 'owner' })
            .eq('group_id', group.id)
            .eq('profile_id', newOwnerId);
          console.log(`✅ Transferred ownership of group "${group.name}" to user ${newOwnerId}`);
        } else {
          // No other members - delete the group (CASCADE will handle members, invitations, etc.)
          await supabaseAdmin
            .from('groups')
            .delete()
            .eq('id', group.id);
          console.log(`✅ Deleted empty group "${group.name}"`);
        }
      }
    }

    // Step 3: Remove user from all groups except default
    const { data: allUserGroups, error: allGroupsError } = await supabaseAdmin
      .from('group_members')
      .select('group_id')
      .eq('profile_id', userId)
      .neq('group_id', defaultGroupId);

    if (!allGroupsError && allUserGroups && allUserGroups.length > 0) {
      const groupsToLeave = allUserGroups.map(gm => gm.group_id);
      await supabaseAdmin
        .from('group_members')
        .delete()
        .eq('profile_id', userId)
        .in('group_id', groupsToLeave);
      console.log(`✅ Removed user from ${groupsToLeave.length} groups`);
    }

    // Step 4: Ensure user is owner of default group
    const { data: defaultGroupMember } = await supabaseAdmin
      .from('group_members')
      .select('role')
      .eq('group_id', defaultGroupId)
      .eq('profile_id', userId)
      .single();

    if (!defaultGroupMember) {
      // Add user as owner to default group
      await supabaseAdmin
        .from('group_members')
        .insert({
          group_id: defaultGroupId,
          profile_id: userId,
          role: 'owner'
        });
      console.log('✅ Added user as owner to default group');
    } else if (defaultGroupMember.role !== 'owner') {
      // Update role to owner
      await supabaseAdmin
        .from('group_members')
        .update({ role: 'owner' })
        .eq('group_id', defaultGroupId)
        .eq('profile_id', userId);
      console.log('✅ Updated user role to owner in default group');
    }

    // Step 5: Delete all guest recipes
    const { error: recipesError } = await supabaseAdmin
      .from('guest_recipes')
      .delete()
      .eq('user_id', userId);

    if (recipesError) {
      console.error('⚠️ Error deleting recipes:', recipesError);
    } else {
      console.log('✅ Deleted all guest recipes');
    }

    // Step 6: Delete all guests
    const { error: guestsError } = await supabaseAdmin
      .from('guests')
      .delete()
      .eq('user_id', userId);

    if (guestsError) {
      console.error('⚠️ Error deleting guests:', guestsError);
    } else {
      console.log('✅ Deleted all guests');
    }

    // Step 7: Delete all cookbooks (except the one from default group if it exists)
    // First, get cookbook ID from default group
    let defaultCookbookId: string | null = null;
    if (defaultGroupId) {
      const { data: defaultCookbook } = await supabaseAdmin
        .from('cookbooks')
        .select('id')
        .eq('group_id', defaultGroupId)
        .single();

      if (defaultCookbook) {
        defaultCookbookId = defaultCookbook.id;
      }
    }

    // Delete all cookbooks except default
    if (defaultCookbookId) {
      await supabaseAdmin
        .from('cookbooks')
        .delete()
        .eq('user_id', userId)
        .neq('id', defaultCookbookId);
      console.log('✅ Deleted all cookbooks except default');
    } else {
      await supabaseAdmin
        .from('cookbooks')
        .delete()
        .eq('user_id', userId);
      console.log('✅ Deleted all cookbooks');
    }

    // Step 8: Delete group_recipes where user added recipes
    const { error: groupRecipesError } = await supabaseAdmin
      .from('group_recipes')
      .delete()
      .eq('added_by', userId);

    if (groupRecipesError) {
      console.error('⚠️ Error deleting group recipes:', groupRecipesError);
    } else {
      console.log('✅ Deleted all group recipes added by user');
    }

    // Step 9: Delete communication log
    const { error: commLogError } = await supabaseAdmin
      .from('communication_log')
      .delete()
      .eq('user_id', userId);

    if (commLogError) {
      console.error('⚠️ Error deleting communication log:', commLogError);
    } else {
      console.log('✅ Deleted all communication logs');
    }

    // Step 10: Delete shipping addresses
    const { error: addressesError } = await supabaseAdmin
      .from('shipping_addresses')
      .delete()
      .eq('user_id', userId);

    if (addressesError) {
      console.error('⚠️ Error deleting shipping addresses:', addressesError);
    } else {
      console.log('✅ Deleted all shipping addresses');
    }

    // Step 11: Delete group invitations where user is the inviter
    const { error: invitationsError } = await supabaseAdmin
      .from('group_invitations')
      .delete()
      .eq('invited_by', userId);

    if (invitationsError) {
      console.error('⚠️ Error deleting group invitations:', invitationsError);
    } else {
      console.log('✅ Deleted all group invitations sent by user');
    }

    console.log('✅ User data cleaned successfully');

    return NextResponse.json({
      success: true,
      message: 'User data cleaned successfully. User is now in default state.'
    });

  } catch (error) {
    console.error('❌ Error in clean user route:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unauthorized'
      },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}

