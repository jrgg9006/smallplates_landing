import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const body = await req.json();
    const { groupId, guestId, newGuest, recipe_name, ingredients, instructions, comments } = body;

    if (!groupId || !recipe_name || !ingredients || !instructions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get group owner
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('created_by')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const ownerId = group.created_by;
    let resolvedGuestId = guestId;

    // Create new guest if needed
    if (!guestId && newGuest) {
      const { data: guest, error: guestError } = await supabase
        .from('guests')
        .insert({
          user_id: ownerId,
          group_id: groupId,
          first_name: newGuest.first_name,
          last_name: newGuest.last_name,
          email: newGuest.email || `manual-${Date.now()}@placeholder.local`,
          source: 'manual' as const,
          number_of_recipes: 1,
        })
        .select('id')
        .single();

      if (guestError || !guest) {
        return NextResponse.json(
          { error: guestError?.message || 'Failed to create guest' },
          { status: 500 }
        );
      }
      resolvedGuestId = guest.id;
    }

    if (!resolvedGuestId) {
      return NextResponse.json({ error: 'No guest specified' }, { status: 400 });
    }

    // Insert recipe (user_id = group owner so it shows in their dashboard)
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .insert({
        guest_id: resolvedGuestId,
        user_id: ownerId,
        recipe_name,
        ingredients,
        instructions,
        comments: comments || null,
        submission_status: 'submitted',
        submitted_at: new Date().toISOString(),
        group_id: groupId,
        source: 'manual' as const,
      })
      .select('id')
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json(
        { error: recipeError?.message || 'Failed to create recipe' },
        { status: 500 }
      );
    }

    // Link recipe to group
    const { error: linkError } = await supabase
      .from('group_recipes')
      .insert({
        group_id: groupId,
        recipe_id: recipe.id,
        added_by: admin.id,
      });

    if (linkError) {
      return NextResponse.json({ error: linkError.message }, { status: 500 });
    }

    // Update guest recipes_received count
    if (guestId) {
      // Reason: for existing guests, increment their received count
      const { data: currentGuest } = await supabase
        .from('guests')
        .select('recipes_received')
        .eq('id', guestId)
        .single();

      if (currentGuest) {
        await supabase
          .from('guests')
          .update({ recipes_received: (currentGuest.recipes_received || 0) + 1 })
          .eq('id', guestId);
      }
    }

    // Add to group cookbook
    const { data: cookbook } = await supabase
      .from('cookbooks')
      .select('id')
      .eq('group_id', groupId)
      .eq('is_group_cookbook', true)
      .single();

    if (cookbook) {
      await supabase.from('cookbook_recipes').insert({
        cookbook_id: cookbook.id,
        recipe_id: recipe.id,
        user_id: ownerId,
      });
    }

    // Fire-and-forget: trigger Midjourney prompt generation
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    fetch(`${siteUrl}/api/v1/midjourney/generate-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dish_name: recipe_name,
        recipe: `${ingredients}\n\n${instructions}`,
        recipe_id: recipe.id,
      }),
    }).catch(() => {
      // Reason: fire-and-forget, don't block on prompt generation failure
    });

    return NextResponse.json({ id: recipe.id, guestId: resolvedGuestId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unauthorized' },
      { status: 401 }
    );
  }
}
