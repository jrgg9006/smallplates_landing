import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { buildShowcaseEmailHTML } from '@/lib/email/showcase-template';

// Reason: no auth check — this is a read-only preview, doesn't modify data,
// and requires knowing exact guest_id + recipe_id UUIDs to access.
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient();

    const url = new URL(request.url);
    const recipeId = url.searchParams.get('recipe_id');
    const guestId = url.searchParams.get('guest_id');

    if (!recipeId || !guestId) {
      return NextResponse.json(
        { error: 'recipe_id and guest_id are required' },
        { status: 400 }
      );
    }

    // Fetch guest info
    const { data: guest } = await supabase
      .from('guests')
      .select('first_name, last_name, group_id, groups:group_id(couple_display_name)')
      .eq('id', guestId)
      .single();

    // Fetch recipe info
    const { data: recipe } = await supabase
      .from('guest_recipes')
      .select('recipe_name, showcase_image_url')
      .eq('id', recipeId)
      .single();

    if (!guest || !recipe) {
      return NextResponse.json({ error: 'Guest or recipe not found' }, { status: 404 });
    }

    const guestName = `${guest.first_name} ${guest.last_name}`;
    const group = guest.groups as unknown as { couple_display_name: string | null } | null;
    const coupleNamePlain = group?.couple_display_name || 'The couple';
    const coupleNameHtml = coupleNamePlain.replace(/&/g, '&amp;');

    // Reason: for email preview, replace cid:recipe-spread with the actual showcase URL
    // so it renders in the browser without needing a CID attachment
    let html = buildShowcaseEmailHTML({
      guestName,
      coupleName: coupleNameHtml,
      coupleNamePlain,
      recipeName: recipe.recipe_name,
    });

    // Swap cid:recipe-spread with actual image URL for browser preview
    if (recipe.showcase_image_url) {
      html = html.replace('cid:recipe-spread', recipe.showcase_image_url);
    } else {
      // Reason: if no showcase image yet, use the generate endpoint as fallback
      html = html.replace(
        'cid:recipe-spread',
        `/api/v1/admin/showcase/preview?recipe_id=${recipeId}`
      );
    }

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
