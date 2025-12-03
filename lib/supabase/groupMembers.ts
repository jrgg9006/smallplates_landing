import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  GroupMember,
  GroupMemberInsert,
  GroupMemberUpdate,
  GroupMemberWithProfile,
  MemberRole,
} from '@/lib/types/database';

/**
 * Get all members of a specific group
 */
export async function getGroupMembers(groupId: string): Promise<{ data: GroupMemberWithProfile[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      profiles!group_members_profile_id_fkey(
        id,
        email,
        full_name
      )
    `)
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true }); // Show creators/earliest members first

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as GroupMemberWithProfile[], error: null };
}

/**
 * Add a member to a group (only owners and admins can do this)
 */
export async function addGroupMember(groupId: string, profileId: string, role: MemberRole = 'member') {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const memberData: GroupMemberInsert = {
    group_id: groupId,
    profile_id: profileId,
    role,
    invited_by: user.id,
  };

  const { data, error } = await supabase
    .from('group_members')
    .insert(memberData)
    .select(`
      *,
      profiles!group_members_profile_id_fkey(
        id,
        email,
        full_name
      )
    `)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Remove a member from a group (owners/admins can remove others, members can remove themselves)
 */
export async function removeGroupMember(groupId: string, profileId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', profileId);

  return { data: null, error: error?.message || null };
}

/**
 * Update a member's role (only owners and admins can do this)
 */
export async function updateMemberRole(groupId: string, profileId: string, newRole: MemberRole) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const updateData: GroupMemberUpdate = {
    role: newRole,
  };

  const { data, error } = await supabase
    .from('group_members')
    .update(updateData)
    .eq('group_id', groupId)
    .eq('profile_id', profileId)
    .select(`
      *,
      profiles!group_members_profile_id_fkey(
        id,
        email,
        full_name
      )
    `)
    .single();

  return { data, error: error?.message || null };
}

/**
 * Leave a group (user removes themselves)
 */
export async function leaveGroup(groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if user is the only owner
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('role, profile_id')
    .eq('group_id', groupId);

  if (membersError) {
    return { data: null, error: membersError.message };
  }

  const currentUserMember = members.find(m => m.profile_id === user.id);
  const owners = members.filter(m => m.role === 'owner');
  
  if (currentUserMember?.role === 'owner' && owners.length === 1) {
    return { data: null, error: 'Cannot leave group as the only owner. Transfer ownership or delete the group.' };
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', user.id);

  return { data: null, error: error?.message || null };
}

/**
 * Transfer group ownership to another member
 */
export async function transferOwnership(groupId: string, newOwnerId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if new owner is already a member
  const { data: newOwnerMember, error: memberError } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('profile_id', newOwnerId)
    .single();

  if (memberError) {
    return { data: null, error: 'New owner must be a member of the group' };
  }

  // Use a transaction-like approach: update new owner first, then demote current owner
  const { error: promoteError } = await supabase
    .from('group_members')
    .update({ role: 'owner' })
    .eq('group_id', groupId)
    .eq('profile_id', newOwnerId);

  if (promoteError) {
    return { data: null, error: promoteError.message };
  }

  const { error: demoteError } = await supabase
    .from('group_members')
    .update({ role: 'admin' })
    .eq('group_id', groupId)
    .eq('profile_id', user.id);

  if (demoteError) {
    // Try to revert the promotion
    await supabase
      .from('group_members')
      .update({ role: newOwnerMember.role })
      .eq('group_id', groupId)
      .eq('profile_id', newOwnerId);
    
    return { data: null, error: demoteError.message };
  }

  return { data: null, error: null };
}

/**
 * Get member count for a group
 */
export async function getGroupMemberCount(groupId: string): Promise<{ data: number; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { count, error } = await supabase
    .from('group_members')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (error) {
    return { data: 0, error: error.message };
  }

  return { data: count || 0, error: null };
}

/**
 * Check if a user is a member of a specific group
 */
export async function isGroupMember(groupId: string, profileId?: string): Promise<{ data: boolean; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Use provided profileId or get current user
  let userId = profileId;
  if (!userId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: false, error: 'User not authenticated' };
    }
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('profile_id')
    .eq('group_id', groupId)
    .eq('profile_id', userId)
    .single();

  if (error) {
    // If no record found, user is not a member
    if (error.code === 'PGRST116') {
      return { data: false, error: null };
    }
    return { data: false, error: error.message };
  }

  return { data: !!data, error: null };
}

/**
 * Get all groups a user is a member of
 */
export async function getUserGroups(profileId?: string): Promise<{ data: string[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Use provided profileId or get current user
  let userId = profileId;
  if (!userId) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { data: null, error: 'User not authenticated' };
    }
    userId = user.id;
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('profile_id', userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.map(item => item.group_id), error: null };
}