import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// Handles RFC 8058 one-click unsubscribe.
// Email clients (Gmail, Apple Mail) POST to this URL when the user clicks the
// native "Unsubscribe" button at the top of the email.
export async function POST(request: NextRequest) {
  const gid = request.nextUrl.searchParams.get('gid');
  if (!gid) {
    return new NextResponse(null, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from('guests')
    .update({ showcase_opted_out: true })
    .eq('id', gid);

  if (error) {
    return new NextResponse(null, { status: 500 });
  }

  // RFC 8058 requires 200 on success, no body needed
  return new NextResponse(null, { status: 200 });
}
