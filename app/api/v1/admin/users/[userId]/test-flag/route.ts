/**
 * API Route - Toggle is_test_account flag (Admin Only)
 * PATCH /api/v1/admin/users/[userId]/test-flag  body: { is_test_account: boolean }
 */

import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdminAuth();

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const isTest = Boolean(body?.is_test_account);

    const supabaseAdmin = createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ is_test_account: isTest })
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, is_test_account: isTest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: error instanceof Error && error.message.includes('Admin') ? 401 : 500 }
    );
  }
}
