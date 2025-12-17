import { createSupabaseClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';
import type {
  Group,
  GroupInsert,
  GroupUpdate,
  GroupWithMembers,
  GroupFormData,
} from '@/lib/types/database';

/**
 * Create a new group during onboarding (using admin client, no auth required)
 */
export async function createGroupAdmin(formData: GroupFormData) {
  // Use admin client to bypass RLS during onboarding
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  if (!formData.created_by) {
    return { data: null, error: 'created_by is required for admin group creation' };
  }

  const groupData: GroupInsert = {
    name: formData.name,
    description: formData.description,
    created_by: formData.created_by,
    wedding_date: formData.wedding_date || null,
    wedding_date_undecided: formData.wedding_date_undecided || false,
    wedding_timeline: formData.wedding_timeline || null,
    couple_first_name: formData.couple_first_name || null,
    couple_last_name: formData.couple_last_name || null,
    partner_first_name: formData.partner_first_name || null,
    partner_last_name: formData.partner_last_name || null,
    relationship_to_couple: formData.relationship_to_couple || null,
  };

  // Create the group
  const { data: group, error } = await supabaseAdmin
    .from('groups')
    .insert(groupData)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Add the creator as owner of the group
  const memberRelationship = formData.relationship_to_couple;
  const { error: memberError } = await supabaseAdmin
    .from('group_members')
    .insert({
      group_id: group.id,
      profile_id: formData.created_by,
      role: 'owner',
      relationship_to_couple: memberRelationship
    });

  if (memberError) {
    console.error('Error adding user to group:', memberError);
    // Group was created but member addition failed
    return { data: group, error: `Group created but failed to add member: ${memberError.message}` };
  }

  return { data: group, error: null };
}

/**
 * Create a new group and automatically add the creator as owner
 */
export async function createGroup(formData: GroupFormData) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const groupData: GroupInsert = {
    name: formData.name,
    description: formData.description,
    created_by: formData.created_by || user.id,
    wedding_date: formData.wedding_date || null,
    wedding_date_undecided: formData.wedding_date_undecided || false,
    wedding_timeline: formData.wedding_timeline || null,
    couple_first_name: formData.couple_first_name || null,
    couple_last_name: formData.couple_last_name || null,
    partner_first_name: formData.partner_first_name || null,
    partner_last_name: formData.partner_last_name || null,
    relationship_to_couple: formData.relationship_to_couple || null,
  };

  // Create the group - triggers will handle member addition and cookbook creation
  const { data, error } = await supabase
    .from('groups')
    .insert(groupData)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Get all groups that the current user is a member of
 */
export async function getMyGroups(): Promise<{ data: GroupWithMembers[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // First, get groups where user is a member
  const { data: userGroups, error: userGroupsError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('profile_id', user.id);

  if (userGroupsError) {
    return { data: null, error: userGroupsError.message };
  }

  if (!userGroups || userGroups.length === 0) {
    return { data: [], error: null };
  }

  const groupIds = userGroups.map(ug => ug.group_id);

  // Then get all group details including ALL members
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(
        *,
        profiles!group_members_profile_id_fkey(
          id,
          email,
          full_name
        )
      ),
      cookbooks(
        id,
        name,
        description,
        is_group_cookbook,
        group_id
      )
    `)
    .in('id', groupIds)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  // Transform the data to match our GroupWithMembers interface
  const transformedData = data?.map(group => ({
    ...group,
    member_count: group.group_members?.length || 0,
  })) as GroupWithMembers[];

  return { data: transformedData, error: null };
}

/**
 * Get a specific group by ID with members and cookbook information
 */
export async function getGroupById(groupId: string): Promise<{ data: GroupWithMembers | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members(
        *,
        profiles!group_members_profile_id_fkey(
          id,
          email,
          full_name
        )
      ),
      cookbooks(
        id,
        name,
        description,
        is_group_cookbook,
        group_id
      )
    `)
    .eq('id', groupId)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  // Transform the data to match our GroupWithMembers interface
  const transformedData = {
    ...data,
    member_count: data.group_members?.length || 0,
    recipe_count: 0, // Will be populated by separate query if needed
  } as GroupWithMembers;

  return { data: transformedData, error: null };
}

/**
 * Update group information
 */
export async function updateGroup(groupId: string, updates: GroupFormData) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const updateData: GroupUpdate = {
    name: updates.name,
    description: updates.description,
    wedding_date: updates.wedding_date,
    wedding_date_undecided: updates.wedding_date_undecided,
    wedding_timeline: updates.wedding_timeline,
    couple_first_name: updates.couple_first_name,
    couple_last_name: updates.couple_last_name,
    partner_first_name: updates.partner_first_name,
    partner_last_name: updates.partner_last_name,
    relationship_to_couple: updates.relationship_to_couple,
  };

  const { data, error } = await supabase
    .from('groups')
    .update(updateData)
    .eq('id', groupId)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Delete a group (only owners can delete)
 */
export async function deleteGroup(groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if user is the owner
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .single();

  if (!member || member.role !== 'owner') {
    return { data: null, error: 'Only group owners can delete groups' };
  }

  // Delete the group (cascade should handle related records)
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId)
    .eq('created_by', user.id); // Extra safety check

  return { data: { success: true }, error: error?.message || null };
}

/**
 * Exit a group (remove current user from group members)
 */
export async function exitGroup(groupId: string) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Check if user is a member of the group
  const { data: member } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .single();

  if (!member) {
    return { data: null, error: 'You are not a member of this group' };
  }

  // Prevent the group owner from exiting (they must delete or transfer ownership)
  if (member.role === 'owner') {
    return { data: null, error: 'Group owners cannot exit the group. You must delete the group or transfer ownership first.' };
  }

  // Remove user from group
  const { error: removeError } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('profile_id', user.id);

  if (removeError) {
    return { data: null, error: removeError.message };
  }

  return { data: { success: true }, error: null };
}

/**
 * Get user's role in a specific group
 */
export async function getUserRoleInGroup(groupId: string): Promise<{ data: string | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data.role, error: null };
}

/**
 * Check if user can manage group (owner or admin)
 */
export async function canManageGroup(groupId: string): Promise<{ data: boolean; error: string | null }> {
  const { data: role, error } = await getUserRoleInGroup(groupId);
  
  if (error) {
    return { data: false, error };
  }

  return { data: role === 'owner' || role === 'admin', error: null };
}

/**
 * Get group recipe count
 */
export async function getGroupRecipeCount(groupId: string): Promise<{ data: number; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { count, error } = await supabase
    .from('guest_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', groupId);

  if (error) {
    return { data: 0, error: error.message };
  }

  return { data: count || 0, error: null };
}

/**
 * Get the current user's share message for a specific group
 */
export async function getGroupShareMessage(groupId: string): Promise<{ 
  data: { custom_share_message: string | null; custom_share_signature: string | null } | null; 
  error: string | null 
}> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('group_members')
    .select('custom_share_message, custom_share_signature')
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

/**
 * Update the current user's share message for a specific group
 */
export async function updateGroupShareMessage(
  groupId: string, 
  customMessage: string, 
  customSignature: string
): Promise<{ data: unknown; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Validate message length
  if (customMessage.length > 280) {
    return { data: null, error: 'Message must be 280 characters or less' };
  }

  if (customMessage.trim().length === 0) {
    return { data: null, error: 'Message cannot be empty' };
  }

  if (customSignature.length > 50) {
    return { data: null, error: 'Signature must be 50 characters or less' };
  }

  const { data, error } = await supabase
    .from('group_members')
    .update({ 
      custom_share_message: customMessage.trim(),
      custom_share_signature: customSignature.trim() || null
    })
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .select()
    .single();

  return { data, error: error?.message || null };
}

/**
 * Reset the current user's share message for a specific group
 */
export async function resetGroupShareMessage(groupId: string): Promise<{ data: unknown; error: string | null }> {
  const supabase = createSupabaseClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('group_members')
    .update({ 
      custom_share_message: null,
      custom_share_signature: null 
    })
    .eq('group_id', groupId)
    .eq('profile_id', user.id)
    .select()
    .single();

  return { data, error: error?.message || null };
}