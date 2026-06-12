import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Record an event into user_events from server code (API routes).
 * Fire-and-forget contract: never throws, errors only go to server logs.
 */
export async function recordServerEvent(
  eventName: string,
  userId: string | null,
  groupId: string | null,
  props: Record<string, unknown> = {}
): Promise<void> {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('user_events').insert({
      event_name: eventName,
      user_id: userId,
      group_id: groupId,
      props,
    });
    if (error) {
      console.error('recordServerEvent: insert failed', error.message);
    }
  } catch (error) {
    console.error('recordServerEvent failed', error);
  }
}
