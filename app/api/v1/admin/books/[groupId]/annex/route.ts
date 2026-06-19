import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { isValidAnnexSource, nextAnnexPosition } from '@/lib/annex/selection';

// GET — list annex rows for this group (drives polling/hydration).
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('recipe_annex_images')
      .select('id, recipe_id, source_url, original_url, print_url, upscale_status, position')
      .eq('group_id', groupId)
      .order('position');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ annex_images: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// POST — mark an image as original. Body: { recipe_id, source_url }.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const { recipe_id, source_url } = (await request.json()) as {
      recipe_id?: string;
      source_url?: string;
    };

    if (!recipe_id || !source_url) {
      return NextResponse.json(
        { error: 'recipe_id and source_url are required' },
        { status: 400 }
      );
    }

    // Validate the recipe is actually in this group. Reason: guest_recipes.group_id
    // can be stale when recipes are linked/moved; group_recipes is the source of truth
    // (same pattern as the books GET route).
    const { data: membership } = await supabase
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .eq('recipe_id', recipe_id)
      .is('removed_at', null)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Recipe not found in this group' }, { status: 404 });
    }

    // Fetch the recipe's files to validate the source_url belongs to it.
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select('id, document_urls, image_url')
      .eq('id', recipe_id)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const documentUrls = (recipe as { document_urls: string[] | null }).document_urls;
    const imageUrl = (recipe as { image_url: string | null }).image_url;

    if (!isValidAnnexSource(source_url, documentUrls, imageUrl)) {
      return NextResponse.json(
        { error: 'source_url is not an eligible image for this recipe' },
        { status: 400 }
      );
    }

    // Compute next position from existing rows for this recipe.
    const { data: existing } = await supabase
      .from('recipe_annex_images')
      .select('position')
      .eq('recipe_id', recipe_id);

    const position = nextAnnexPosition((existing ?? []).map((r) => r.position as number));

    // Idempotent: UNIQUE(recipe_id, source_url) — re-marking is a no-op.
    const { error: insertError } = await supabase
      .from('recipe_annex_images')
      .upsert(
        { recipe_id, group_id: groupId, source_url, position },
        { onConflict: 'recipe_id,source_url', ignoreDuplicates: true }
      );

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// DELETE — unmark an image. Body: { recipe_id, source_url }.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const { recipe_id, source_url } = (await request.json()) as {
      recipe_id?: string;
      source_url?: string;
    };

    if (!recipe_id || !source_url) {
      return NextResponse.json(
        { error: 'recipe_id and source_url are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('recipe_annex_images')
      .delete()
      .eq('group_id', groupId)
      .eq('recipe_id', recipe_id)
      .eq('source_url', source_url);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}

// PATCH — set/clear the recipe-level "reviewed, not included" flag.
// Body: { recipe_id, annex_reviewed }.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();
    const { recipe_id, annex_reviewed } = (await request.json()) as {
      recipe_id?: string;
      annex_reviewed?: boolean;
    };

    if (!recipe_id || typeof annex_reviewed !== 'boolean') {
      return NextResponse.json(
        { error: 'recipe_id and annex_reviewed (boolean) are required' },
        { status: 400 }
      );
    }

    // Validate the recipe is actually in this group (same pattern as POST).
    const { data: membership } = await supabase
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .eq('recipe_id', recipe_id)
      .is('removed_at', null)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: 'Recipe not found in this group' }, { status: 404 });
    }

    const { error } = await supabase
      .from('recipe_production_status')
      .upsert(
        { recipe_id, annex_reviewed, updated_at: new Date().toISOString() },
        { onConflict: 'recipe_id' }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
