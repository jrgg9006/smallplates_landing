import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { PERSISTED_EVENTS } from '@/lib/analytics';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 2000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }
    const body = JSON.parse(raw) as { event_name?: unknown; group_id?: unknown; props?: unknown };

    const eventName = typeof body.event_name === 'string' ? body.event_name : '';
    if (!PERSISTED_EVENTS.has(eventName)) {
      return NextResponse.json({ error: 'Unknown event' }, { status: 400 });
    }
    const groupId =
      typeof body.group_id === 'string' && UUID_RE.test(body.group_id) ? body.group_id : null;
    const props =
      body.props && typeof body.props === 'object' && !Array.isArray(body.props)
        ? (body.props as Record<string, unknown>)
        : {};

    // Reason: user_id comes from the session cookie, never from the client payload.
    // Anonymous events are valid (pre-signup onboarding steps).
    let userId: string | null = null;
    try {
      const supabase = await createSupabaseServer();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      userId = null;
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('user_events').insert({
      event_name: eventName,
      user_id: userId,
      group_id: groupId,
      props,
    });
    if (error) {
      console.error('events: insert failed', error.message);
    }

    // Reason: the client fires-and-forgets; insert failures only matter in server logs.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in /api/v1/events:', error);
    return new NextResponse(null, { status: 204 });
  }
}
