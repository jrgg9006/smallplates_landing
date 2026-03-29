import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

/**
 * PATCH /api/v1/groups/[groupId]/print-details
 * Confirm the couple name for printing and mark print details as confirmed.
 */
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
    const { print_couple_name } = body;

    if (!print_couple_name || typeof print_couple_name !== 'string' || !print_couple_name.trim()) {
      return NextResponse.json(
        { error: 'print_couple_name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    const { data, error: updateError } = await supabase
      .from('groups')
      .update({
        print_couple_name: print_couple_name.trim(),
        print_details_confirmed_at: new Date().toISOString(),
      })
      .eq('id', groupId)
      .select('print_couple_name, print_details_confirmed_at, couple_image_url')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save print details' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error saving print details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
