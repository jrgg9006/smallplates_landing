/**
 * API Route - Debug Logs (Admin Only)
 * GET: List logs with filters + stats
 * PATCH: Update status/notes on a log
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    await requireAdminAuth();

    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'active';
    const eventType = url.searchParams.get('event_type');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    const supabase = createSupabaseAdminClient();

    // Fetch logs
    let query = supabase
      .from('debug_logs')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching debug logs:', error);
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
    }

    // Fetch counts for stats
    const { count: activeCount } = await supabase
      .from('debug_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: reviewedCount } = await supabase
      .from('debug_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'reviewed');

    // Reason: enrich logs with real guest/group data from the DB.
    // The context JSONB often lacks guest names (e.g. analysis_failed from Railway).
    // We look up by recipe_name in guest_recipes → guests → groups to get the real info.
    const enrichedLogs = await enrichLogsWithRecipeData(supabase, logs || []);

    return NextResponse.json({
      logs: enrichedLogs,
      stats: {
        activeCount: activeCount || 0,
        reviewedCount: reviewedCount || 0,
      },
    });
  } catch (error) {
    console.error('Error in debug logs GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}

// Reason: look up real guest + group info for each log by matching recipe_name
// from context against guest_recipes. Returns enriched logs with _guest and _group fields.
async function enrichLogsWithRecipeData(supabase: ReturnType<typeof createSupabaseAdminClient>, logs: Record<string, unknown>[]) {
  // Collect unique recipe names from context
  const recipeNames = logs
    .map(log => {
      const ctx = (log.context || {}) as Record<string, unknown>;
      return (ctx.recipe_name as string) || (ctx.recipeName as string) || null;
    })
    .filter((n): n is string => !!n);

  if (recipeNames.length === 0) return logs;

  const uniqueNames = [...new Set(recipeNames)];

  const { data: recipes } = await supabase
    .from('guest_recipes')
    .select(`
      id, recipe_name, guest_id,
      guests (
        id, first_name, last_name, printed_name, group_id,
        groups:group_id ( id, name )
      )
    `)
    .in('recipe_name', uniqueNames);

  // Build lookup by recipe_name → first match
  const recipeMap = new Map<string, Record<string, unknown>>();
  for (const r of recipes || []) {
    if (!recipeMap.has(r.recipe_name)) {
      recipeMap.set(r.recipe_name, r);
    }
  }

  return logs.map(log => {
    const ctx = (log.context || {}) as Record<string, unknown>;
    const name = (ctx.recipe_name as string) || (ctx.recipeName as string) || null;
    const match = name ? recipeMap.get(name) : null;

    if (!match) return log;

    const guest = match.guests as Record<string, unknown> | null;
    const group = guest?.groups as Record<string, unknown> | null;
    const guestName = (guest?.printed_name as string)
      || `${(guest?.first_name as string) || ''} ${(guest?.last_name as string) || ''}`.trim()
      || null;

    return {
      ...log,
      _guest: guest ? { id: guest.id, name: guestName } : null,
      _group: group ? { id: group.id, name: group.name } : null,
    };
  });
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAdminAuth();

    const body = await request.json();
    const { id, status, admin_notes } = body as {
      id: string;
      status?: string;
      admin_notes?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Reason: build update payload dynamically so we only touch fields that were sent
    const updates: Record<string, unknown> = {};

    if (status === 'reviewed') {
      updates.status = 'reviewed';
      updates.reviewed_at = new Date().toISOString();
      updates.reviewed_by = user.id;
    } else if (status === 'active') {
      updates.status = 'active';
      updates.reviewed_at = null;
      updates.reviewed_by = null;
    }

    if (admin_notes !== undefined) {
      updates.admin_notes = admin_notes;
    }

    const { data, error } = await supabase
      .from('debug_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating debug log:', error);
      return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
    }

    return NextResponse.json({ log: data });
  } catch (error) {
    console.error('Error in debug logs PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}
