import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Handles RFC 8058 one-click unsubscribe for profile-targeted emails
// (captain_reminder, weekly_status). Email clients POST to this URL when the user
// clicks the native "Unsubscribe" button at the top of the email.
export async function POST(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  if (!uid) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('profiles')
    .update({ notification_emails_opt_out: true })
    .eq('id', uid);

  if (error) {
    return new NextResponse(null, { status: 500 });
  }

  // RFC 8058 requires 200 on success, no body needed
  return new NextResponse(null, { status: 200 });
}
