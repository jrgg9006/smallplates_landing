import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: membership, error: memberError } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('profile_id', user.id)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Permission denied. You must be a group member.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { event_date, event_time, event_location, event_venue, invite_title, invite_tagline, invite_message, email_invite_message, email_reminder_message, email_from_name, email_invite_subject, email_reminder_subject } = body;

    const updateFields: Record<string, string | null> = {};
    if (event_date !== undefined) updateFields.event_date = event_date?.trim() || null;
    if (event_time !== undefined) updateFields.event_time = event_time?.trim() || null;
    if (event_location !== undefined) updateFields.event_location = event_location?.trim() || null;
    if (event_venue !== undefined) updateFields.event_venue = event_venue?.trim() || null;
    if (invite_title !== undefined) updateFields.invite_title = invite_title?.trim() || null;
    if (invite_tagline !== undefined) updateFields.invite_tagline = invite_tagline?.trim() || null;
    if (invite_message !== undefined) updateFields.invite_message = invite_message?.trim() || null;
    if (email_invite_message !== undefined) updateFields.email_invite_message = email_invite_message?.trim() || null;
    if (email_reminder_message !== undefined) updateFields.email_reminder_message = email_reminder_message?.trim() || null;
    if (email_from_name !== undefined) updateFields.email_from_name = email_from_name?.trim() || null;
    if (email_invite_subject !== undefined) updateFields.email_invite_subject = email_invite_subject?.trim() || null;
    if (email_reminder_subject !== undefined) updateFields.email_reminder_subject = email_reminder_subject?.trim() || null;

    const { data, error: updateError } = await supabase
      .from('groups')
      .update(updateFields)
      .eq('id', groupId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
