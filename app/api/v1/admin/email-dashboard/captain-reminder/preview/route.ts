import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  buildCaptainReminderHTML,
  buildCaptainReminderSubject,
} from '@/lib/email/captain-reminder-template';

// Reason: read-only preview, no auth check — same pattern as pdf-delivery/preview-email.
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();
    const url = new URL(request.url);
    const groupId = url.searchParams.get('group_id');

    if (!groupId) {
      return NextResponse.json({ error: 'group_id is required' }, { status: 400 });
    }

    const { data: group } = await supabase
      .from('groups')
      .select('id, name, couple_display_name, created_by')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const { data: organizer } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('id', group.created_by)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');
    const organizerFirstName = organizer?.full_name?.split(' ')[0] || 'There';

    const html = buildCaptainReminderHTML({
      organizerName: organizerFirstName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      joinLink: `${baseUrl}/groups/${groupId}/join`,
      unsubscribeUrl: `${baseUrl}/api/v1/unsubscribe-profile?uid=${group.created_by}`,
    });

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Email-Subject': buildCaptainReminderSubject(coupleNamePlain),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preview' },
      { status: 500 }
    );
  }
}
