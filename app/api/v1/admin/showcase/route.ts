import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    // Fetch guests who opted in, with their non-deleted recipes and group info
    const { data: guests, error: guestsError } = await supabase
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        notify_opt_in,
        notify_email,
        group_id,
        guest_recipes!inner (
          id,
          recipe_name,
          showcase_image_url,
          group_id
        ),
        groups:group_id (
          id,
          name,
          couple_display_name,
          book_status,
          book_close_date
        )
      `)
      .eq('notify_opt_in', true)
      .is('guest_recipes.deleted_at', null);

    if (guestsError) {
      return NextResponse.json({ error: guestsError.message }, { status: 500 });
    }

    // Flatten to one row per recipe
    interface FlatRecipe {
      guest_id: string;
      guest_name: string;
      guest_email: string;
      notify_email: string | null;
      group_id: string | null;
      group_name: string | null;
      couple_display_name: string | null;
      book_status: string | null;
      book_close_date: string | null;
      is_sendable: boolean;
      recipe_id: string;
      recipe_name: string;
      showcase_image_url: string | null;
      sent_at: string | null;
    }

    const rows: FlatRecipe[] = [];
    for (const guest of guests || []) {
      const recipes = guest.guest_recipes as Array<{
        id: string;
        recipe_name: string;
        showcase_image_url: string | null;
        group_id: string | null;
      }>;
      const group = guest.groups as unknown as {
        id: string;
        name: string;
        couple_display_name: string | null;
        book_status: string | null;
        book_close_date: string | null;
      } | null;

      const bookStatus = group?.book_status ?? null;
      // Reason: only 'printed' books are safe to send showcase emails — anything earlier
      // could spoil the surprise for the couple before they receive the physical book
      const isSendable = bookStatus === 'printed';

      for (const recipe of recipes) {
        rows.push({
          guest_id: guest.id,
          guest_name: `${guest.first_name} ${guest.last_name}`,
          guest_email: (guest as Record<string, unknown>).notify_email as string || guest.email,
          notify_email: (guest as Record<string, unknown>).notify_email as string | null,
          group_id: guest.group_id,
          group_name: group?.name ?? null,
          couple_display_name: group?.couple_display_name ?? null,
          book_status: bookStatus,
          book_close_date: group?.book_close_date ?? null,
          is_sendable: isSendable,
          recipe_id: recipe.id,
          recipe_name: recipe.recipe_name,
          showcase_image_url: recipe.showcase_image_url,
          sent_at: null,
        });
      }
    }

    // Fetch sent showcase emails from communication_log
    if (rows.length > 0) {
      const guestIds = [...new Set(rows.map(r => r.guest_id))];
      const { data: logs } = await supabase
        .from('communication_log')
        .select('guest_id, content, sent_at')
        .eq('type', 'recipe_showcase')
        .in('guest_id', guestIds);

      if (logs) {
        // Reason: content stores the recipe_id so we can match per-recipe
        const sentMap = new Map<string, string>();
        for (const log of logs) {
          if (log.content && log.sent_at) {
            sentMap.set(`${log.guest_id}:${log.content}`, log.sent_at);
          }
        }
        for (const row of rows) {
          row.sent_at = sentMap.get(`${row.guest_id}:${row.recipe_id}`) ?? null;
        }
      }
    }

    // Fetch distinct groups for the filter dropdown
    const groupIds = [...new Set(rows.map(r => r.group_id).filter(Boolean))];
    let groups: Array<{ id: string; name: string }> = [];
    if (groupIds.length > 0) {
      const { data: groupData } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds);
      groups = groupData || [];
    }

    return NextResponse.json({ recipes: rows, groups });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
