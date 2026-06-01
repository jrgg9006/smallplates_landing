import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

/**
 * PATCH /api/v1/groups/[groupId]/owner-approval
 * Records the OWNER's approval of the recipes for print (book-review flow, step 2
 * confirm modal). Only the group owner (groups.created_by) can approve — captains
 * may review in-UI but their confirmation is not persisted. This is distinct from
 * the admin's book_reviewed_at (book production pipeline).
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const supabase = await createSupabaseServer();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Reason: owner-only — verify created_by before recording approval.
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    if (group.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Only the owner can approve the book for print.' },
        { status: 403 }
      );
    }

    const { data, error: updateError } = await supabase
      .from('groups')
      .update({ owner_approved_at: new Date().toISOString() })
      .eq('id', groupId)
      .select('owner_approved_at')
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save approval' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error saving owner approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
