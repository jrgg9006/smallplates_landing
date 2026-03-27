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

    // Reason: Check if user already has groups — if so, they completed onboarding and should go to dashboard
    const { count } = await supabaseAdmin
      .from('group_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('role', 'owner');

    return NextResponse.json({
      exists: true,
      fullName: profile.full_name,
      hasGroups: (count ?? 0) > 0,
    });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
