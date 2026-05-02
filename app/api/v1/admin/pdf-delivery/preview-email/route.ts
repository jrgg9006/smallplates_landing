import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildPdfDeliveryEmailHTML } from '@/lib/email/pdf-delivery-template';

// Reason: no auth check — read-only preview, no data mutation,
// and requires knowing a valid group_id UUID to access.
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
      .select('id, couple_display_name, name')
      .eq('id', groupId)
      .single();

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Recipe + contributor counts for the stats block
    const { data: recipes } = await supabase
      .from('guest_recipes')
      .select('id, guest_id')
      .eq('group_id', groupId)
      .in('submission_status', ['submitted', 'approved']);

    const totalRecipes = recipes?.length ?? 0;
    const totalContributors = new Set(recipes?.map(r => r.guest_id) ?? []).size;

    const coupleNamePlain = group.couple_display_name || group.name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    // Reason: in browser preview we pass a real URL; in actual email sends this becomes a CID attachment
    const { origin } = new URL(request.url);
    const coverUrl = `${origin}/api/v1/admin/pdf-delivery/preview-cover?group_id=${groupId}`;

    const guestName = url.searchParams.get('guest_name') || 'Alex';

    const html = buildPdfDeliveryEmailHTML({
      guestName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      totalRecipeCount: totalRecipes,
      totalContributorCount: totalContributors,
      bookCoverCid: coverUrl,
      guestId: 'preview',
    });

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to preview' },
      { status: 500 }
    );
  }
}
