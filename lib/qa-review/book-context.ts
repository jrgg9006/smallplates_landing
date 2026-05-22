/**
 * Builds the QABookContext payload sent to the Railway QA agent.
 *
 * TypeScript port of scripts/indesign/fetch-book.js — same logic for picking
 * active recipes, deriving contributors from recipes (not from the guests
 * table), gathering captains, and falling back to original text when
 * recipe_print_ready isn't populated.
 */
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { QABookContext, QABookContextRecipe } from './types';

type GuestJoin = {
  first_name: string | null;
  last_name: string | null;
  printed_name: string | null;
};

type PrintReadyJoin = {
  recipe_name_clean: string;
  ingredients_clean: string;
  instructions_clean: string;
};

type RecipeRow = {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  generated_image_url_print: string | null;
  guests: GuestJoin | GuestJoin[] | null;
  recipe_print_ready: PrintReadyJoin | PrintReadyJoin[] | null;
};

function pickOne<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function normalizeName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

export async function buildBookContext(groupId: string): Promise<QABookContext> {
  const supabase = createSupabaseAdminClient();

  // 1. Group + couple ----------------------------------------------------------
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select(
      'couple_first_name, partner_first_name, couple_display_name, wedding_date, print_couple_name',
    )
    .eq('id', groupId)
    .single();

  if (groupError || !group) {
    throw new Error(`Group not found: ${groupError?.message || 'unknown error'}`);
  }

  const displayName =
    group.print_couple_name ||
    group.couple_display_name ||
    `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

  // 2. Captains (group_members with role='member') ----------------------------
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('role, profiles!group_members_profile_id_fkey(full_name, email)')
    .eq('group_id', groupId)
    .in('role', ['owner', 'member']);

  if (membersError) {
    throw new Error(`Failed loading members: ${membersError.message}`);
  }

  type MemberRow = {
    role: string;
    profiles: { full_name: string | null; email: string | null } | null;
  };
  const captains = (members as unknown as MemberRow[] | null || [])
    .filter((m) => m.role === 'member')
    .map((m) => m.profiles?.full_name || m.profiles?.email || 'Sin nombre')
    .map(normalizeName)
    .filter((s) => s.length > 0);

  // 3. Active recipes ---------------------------------------------------------
  const { data: groupRecipes, error: grError } = await supabase
    .from('group_recipes')
    .select('recipe_id')
    .eq('group_id', groupId)
    .is('removed_at', null);

  if (grError) {
    throw new Error(`Failed loading group_recipes: ${grError.message}`);
  }

  const activeIds = (groupRecipes || []).map((gr) => gr.recipe_id);

  if (activeIds.length === 0) {
    return {
      group_id: groupId,
      couple: {
        display_name: displayName,
        print_name: group.print_couple_name,
        first_name_a: group.couple_first_name,
        first_name_b: group.partner_first_name,
        wedding_date: group.wedding_date,
      },
      contributors: [],
      captains,
      recipes: [],
    };
  }

  // Reason: large IN() lists overflow the URL — chunk to stay under ~8KB.
  const CHUNK = 100;
  const idChunks: string[][] = [];
  for (let i = 0; i < activeIds.length; i += CHUNK) {
    idChunks.push(activeIds.slice(i, i + CHUNK));
  }

  const recipeResults = await Promise.all(
    idChunks.map((chunk) =>
      supabase
        .from('guest_recipes')
        .select(
          `
            id,
            recipe_name,
            ingredients,
            instructions,
            generated_image_url_print,
            guests (
              first_name,
              last_name,
              printed_name
            ),
            recipe_print_ready (
              recipe_name_clean,
              ingredients_clean,
              instructions_clean
            )
          `,
        )
        .in('id', chunk)
        .is('deleted_at', null),
    ),
  );

  const allRecipes: RecipeRow[] = [];
  for (const result of recipeResults) {
    if (result.error) {
      throw new Error(`Failed loading guest_recipes chunk: ${result.error.message}`);
    }
    if (result.data) {
      allRecipes.push(...(result.data as unknown as RecipeRow[]));
    }
  }

  // 4. Transform recipes + derive contributors --------------------------------
  const transformedRecipes: QABookContextRecipe[] = allRecipes.map((recipe) => {
    const guest = pickOne(recipe.guests);
    const printReady = pickOne(recipe.recipe_print_ready);

    const contributorName = normalizeName(
      guest?.printed_name ||
        `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
        'Anónimo',
    );

    return {
      id: recipe.id,
      recipe_name: printReady?.recipe_name_clean || recipe.recipe_name || '',
      contributor_name: contributorName,
      ingredients: printReady?.ingredients_clean || recipe.ingredients || '',
      instructions: printReady?.instructions_clean || recipe.instructions || '',
      has_print_image: !!recipe.generated_image_url_print,
      using_clean_text: !!printReady,
    };
  });

  // Contributors = unique normalized names that appear in the book
  const contributorSet = new Set<string>();
  const contributors: string[] = [];
  for (const recipe of transformedRecipes) {
    if (recipe.contributor_name && !contributorSet.has(recipe.contributor_name)) {
      contributorSet.add(recipe.contributor_name);
      contributors.push(recipe.contributor_name);
    }
  }
  contributors.sort((a, b) => a.localeCompare(b));

  return {
    group_id: groupId,
    couple: {
      display_name: displayName,
      print_name: group.print_couple_name,
      first_name_a: group.couple_first_name,
      first_name_b: group.partner_first_name,
      wedding_date: group.wedding_date,
    },
    contributors,
    captains,
    recipes: transformedRecipes,
  };
}
