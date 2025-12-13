import { createSupabaseClient } from '@/lib/supabase/client';
import type { InvitationStatus } from '@/lib/types/database';

export interface GroupInvitation {
  id: string;
  group_id: string;
  email: string;
  name: string | null;
  invited_by: string;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
}

/**
 * Get all pending invitations for a specific group
 */
export async function getGroupPendingInvitations(
  groupId: string
): Promise<{ data: GroupInvitation[] | null; error: string | null }> {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  const { data, error } = await supabase
    .from('group_invitations')
    .select('*')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString()) // Only non-expired invitations
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as GroupInvitation[], error: null };
}

/**
 * Cancel a pending group invitation
 */
export async function cancelGroupInvitation(
  groupId: string,
  invitationId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const response = await fetch(`/api/v1/groups/${groupId}/invitations/${invitationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to cancel invitation' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel invitation' 
    };
  }
}

