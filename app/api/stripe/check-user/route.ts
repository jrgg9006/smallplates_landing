import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ exists: false });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    // Reason: Query profiles table directly — indexed on email, no pagination issues
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (!profile) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: true, fullName: profile.full_name });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
