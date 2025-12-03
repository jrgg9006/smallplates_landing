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

