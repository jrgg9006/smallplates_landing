import { createSupabaseClient } from '@/lib/supabase/client';
import type {
  CommunicationLog,
  CommunicationType,
  CommunicationChannel,
  CommunicationStatus,
} from '@/lib/types/database';

/**
 * Log a communication attempt
 */
export async function logCommunication(
  guestId: string,
  type: CommunicationType,
  channel: CommunicationChannel,
  subject?: string,
  content?: string
) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Use the RPC function we created
  const { data, error } = await supabase.rpc('log_communication', {
    guest_uuid: guestId,
    user_uuid: user.id,
    comm_type: type,
    comm_channel: channel,
    comm_subject: subject || null,
    comm_content: content || null,
  });

  return { data, error: error?.message || null };
}

/**
 * Update communication status
 */
export async function updateCommunicationStatus(
  logId: string,
  status: CommunicationStatus,
  errorMessage?: string
) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase.rpc('update_communication_status', {
    log_uuid: logId,
    new_status: status,
    error_msg: errorMessage || null,
  });

  return { data, error: error?.message || null };
}

/**
 * Get communication logs for a guest
 */
export async function getCommunicationsByGuest(guestId: string) {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('communication_log')
    .select('*')
    .eq('guest_id', guestId)
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Get all communications for the current user
 */
export async function getAllCommunications() {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('communication_log')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Get failed communications that need retry
 */
export async function getFailedCommunications() {
  const supabase = createSupabaseClient();
  
  const { data, error } = await supabase
    .from('communication_log')
    .select(`
      *,
      guests (
        first_name,
        last_name,
        email
      )
    `)
    .eq('status', 'failed')
    .lt('retry_count', 3) // Only get items with less than 3 retries
    .order('created_at', { ascending: false });

  return { data, error: error?.message || null };
}

/**
 * Batch log communications (for sending to multiple guests)
 */
export async function batchLogCommunications(
  guestIds: string[],
  type: CommunicationType,
  channel: CommunicationChannel,
  subject?: string,
  content?: string
) {
  const supabase = createSupabaseClient();
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { data: null, error: 'User not authenticated' };
  }

  // Create communication logs for each guest
  const logs = guestIds.map(guestId => ({
    guest_id: guestId,
    user_id: user.id,
    type,
    channel,
    subject,
    content,
    status: 'pending' as CommunicationStatus,
  }));

  const { data, error } = await supabase
    .from('communication_log')
    .insert(logs)
    .select();

  return { data, error: error?.message || null };
}