import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export const maxDuration = 300;

// Reason: Replicates the exact JSON structure from scripts/indesign/fetch-book.js
// so the InDesign generate-book_v10.jsx script works without changes.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    // 1. Group data
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('couple_first_name, partner_first_name, couple_display_name, wedding_date, book_status, print_couple_name')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.book_status !== 'ready_to_print') {
      return NextResponse.json({ error: 'Book must be in Ready to Print status' }, { status: 400 });
    }

    const coupleDisplayName = group.print_couple_name || group.couple_display_name ||
      `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

    // 2. Members (owners + captains)
    const { data: members } = await supabase
      .from('group_members')
      .select('role, profiles!group_members_profile_id_fkey (full_name, email)')
      .eq('group_id', groupId)
      .in('role', ['owner', 'member']);

    const ownerList = (members || [])
      .filter(m => m.role === 'owner')
      .map(m => {
        const profile = m.profiles as unknown as { full_name: string | null; email: string } | null;
        return profile?.full_name || profile?.email || 'Unknown';
      });

    const captainList = (members || [])
      .filter(m => m.role === 'member')
      .map(m => {
        const profile = m.profiles as unknown as { full_name: string | null; email: string } | null;
        return profile?.full_name || profile?.email || 'Unknown';
      });

    // 3. Active recipes
    const { data: activeGroupRecipes } = await supabase
      .from('group_recipes')
      .select('recipe_id')
      .eq('group_id', groupId)
      .is('removed_at', null);

    const activeRecipeIds = (activeGroupRecipes || []).map(gr => gr.recipe_id);

    if (activeRecipeIds.length === 0) {
      return NextResponse.json({ error: 'No active recipes found' }, { status: 400 });
    }

    const { data: recipes, error: recipesError } = await supabase
      .from('guest_recipes')
      .select(`
        id,
        recipe_name,
        comments,
        ingredients,
        instructions,
        generated_image_url,
        generated_image_url_print,
        guest_id,
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
      `)
      .in('id', activeRecipeIds)
      .is('deleted_at', null)
      .order('recipe_name');

    if (recipesError || !recipes) {
      return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
    }

    // 4. Build recipe data + collect image URLs
    const transformedRecipes: {
      id: string;
      recipe_name: string;
      guest_name: string;
      comments: string;
      ingredients: string;
      instructions: string;
      local_image_path: string | null;
      image_source: string | null;
    }[] = [];

    const imageDownloads: { url: string; zipPath: string }[] = [];

    for (const recipe of recipes) {
      const guest = recipe.guests as unknown as { first_name: string | null; last_name: string | null; printed_name: string | null } | null;
      const guestName = guest?.printed_name ||
        `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
        'Anonymous';

      const printReady = Array.isArray(recipe.recipe_print_ready)
        ? recipe.recipe_print_ready[0] || null
        : recipe.recipe_print_ready || null;

      const imageUrl = recipe.generated_image_url_print || recipe.generated_image_url;
      const imageSource = recipe.generated_image_url_print ? 'print' : 'original';

      let localImagePath: string | null = null;
      if (imageUrl) {
        const ext = imageUrl.split('.').pop()?.split('?')[0] || 'png';
        const imageFileName = `${recipe.id}.${ext}`;
        localImagePath = `image_assets/${groupId}/${imageFileName}`;
        imageDownloads.push({ url: imageUrl, zipPath: localImagePath });
      }

      transformedRecipes.push({
        id: recipe.id,
        recipe_name: (printReady as { recipe_name_clean?: string } | null)?.recipe_name_clean || recipe.recipe_name || '',
        guest_name: guestName,
        comments: recipe.comments || '',
        ingredients: (printReady as { ingredients_clean?: string } | null)?.ingredients_clean || recipe.ingredients || '',
        instructions: (printReady as { instructions_clean?: string } | null)?.instructions_clean || recipe.instructions || '',
        local_image_path: localImagePath,
        image_source: imageUrl ? imageSource : null,
      });
    }

    // 5. Contributors (deduplicated from recipes)
    const contributorSet = new Set<string>();
    const contributorList: string[] = [];
    for (const recipe of transformedRecipes) {
      const name = (recipe.guest_name || '').replace(/\s+/g, ' ').trim();
      if (name && !contributorSet.has(name)) {
        contributorSet.add(name);
        contributorList.push(name);
      }
    }
    contributorList.sort((a, b) => a.localeCompare(b));

    // 6. Build JSON (same structure as fetch-book.js)
    const bookData = {
      group_id: groupId,
      generated_at: new Date().toISOString(),
      couple: {
        couple_first_name: group.couple_first_name || '',
        partner_first_name: group.partner_first_name || '',
        couple_display_name: coupleDisplayName,
        wedding_date: group.wedding_date || null,
      },
      contributors: {
        count: contributorList.length,
        list: contributorList,
      },
      captains: {
        count: captainList.length,
        list: captainList,
      },
      owners: {
        count: ownerList.length,
        list: ownerList,
      },
      recipes: transformedRecipes,
    };

    // 7. Create ZIP with JSON + images
    const coupleName = `${(group.couple_first_name || '').trim()}y${(group.partner_first_name || '').trim()}`
      .replace(/\s+/g, '');
    const jsonFileName = `data/book.${coupleName}.json`;

    const passthrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(passthrough);

    // Add JSON
    archive.append(JSON.stringify(bookData, null, 2), { name: jsonFileName });

    // Reason: Download images in parallel batches of 10 to avoid serverless timeout
    const BATCH_SIZE = 10;
    for (let i = 0; i < imageDownloads.length; i += BATCH_SIZE) {
      const batch = imageDownloads.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (img) => {
          const res = await fetch(img.url);
          if (!res.ok) return null;
          const buffer = Buffer.from(await res.arrayBuffer());
          return { zipPath: img.zipPath, buffer };
        })
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          archive.append(result.value.buffer, { name: result.value.zipPath });
        }
      }
    }

    await archive.finalize();

    // Collect the ZIP buffer
    const chunks: Buffer[] = [];
    for await (const chunk of passthrough) {
      chunks.push(chunk as Buffer);
    }
    const zipBuffer = Buffer.concat(chunks);

    const safeName = coupleDisplayName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ&\s]/g, '').replace(/\s+/g, '_');

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="SmallPlates_${safeName}.zip"`,
        'Content-Length': String(zipBuffer.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
