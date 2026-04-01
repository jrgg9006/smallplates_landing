import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildShowcaseEmailHTML } from '@/lib/email/showcase-template';

// Reason: no auth check — this is a read-only preview, doesn't modify data,
// and requires knowing exact guest_id UUID to access.
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const url = new URL(request.url);
    const guestId = url.searchParams.get('guest_id');

    if (!guestId) {
      return NextResponse.json(
        { error: 'guest_id is required' },
        { status: 400 }
      );
    }

    // Fetch guest info with group
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name, last_name, group_id, groups:group_id(couple_display_name)')
      .eq('id', guestId)
      .single();

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    // Fetch all non-deleted recipes for this guest
    const { data: recipes } = await supabase
      .from('guest_recipes')
      .select('id, recipe_name, showcase_image_url')
      .eq('guest_id', guestId)
      .is('deleted_at', null);

    if (!recipes?.length) {
      return NextResponse.json({ error: 'No recipes found for this guest' }, { status: 404 });
    }

    const guestName = `${guest.first_name} ${guest.last_name}`;
    const group = guest.groups as unknown as { couple_display_name: string | null } | null;
    const coupleNamePlain = group?.couple_display_name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    let html = buildShowcaseEmailHTML({
      guestName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      recipes: recipes.map((r, i) => ({
        recipeName: r.recipe_name,
        cid: `cid:recipe-spread-${i}`,
      })),
    });

    // Swap each cid:recipe-spread-N with actual image URL for browser preview
    recipes.forEach((recipe, i) => {
      const cid = `cid:recipe-spread-${i}`;
      const imageUrl = recipe.showcase_image_url
        || `/api/v1/admin/showcase/preview?recipe_id=${recipe.id}`;
      html = html.replace(cid, imageUrl);
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
