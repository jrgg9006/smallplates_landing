import type { SupabaseClient } from '@supabase/supabase-js';
import { PAID_STATUSES } from './aggregate';

// A group with any paid / in-production order must never be archived: hiding it from Operations
// could drop a real order. Uses limit(1) on a list (a group can have MULTIPLE paid orders:
// book close + extra copies), NOT maybeSingle() which errors on 2+ rows and would skip the check.
export async function isGroupPaid(supabase: SupabaseClient, groupId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .eq('group_id', groupId)
    .in('status', Array.from(PAID_STATUSES))
    .limit(1);
  if (error) throw error;
  return !!(data && data.length > 0);
}

export const PAID_BOOK_ARCHIVE_ERROR =
  'Este libro ya pagó o está en producción. No se puede dar por muerto.';
