import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { annexDownloadFilename } from '@/lib/annex/selection';

export const maxDuration = 300;

// GET — zip of the book's upscaled originals (upscale_status='ready'), named {Recipe}_{Guest}.png.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    await requireAdminAuth();
    const { groupId } = await params;
    const supabase = createSupabaseAdminClient();

    const { data: rows, error: rowsError } = await supabase
      .from('recipe_annex_images')
      .select('recipe_id, position, print_url')
      .eq('group_id', groupId)
      .eq('upscale_status', 'ready')
      .not('print_url', 'is', null)
      .order('recipe_id')
      .order('position');

    if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No hay originals procesados para descargar' },
        { status: 400 }
      );
    }

    // Resolve recipe + guest names for legible filenames.
    const recipeIds = [...new Set(rows.map((r) => r.recipe_id as string))];
    const { data: recipeData } = await supabase
      .from('guest_recipes')
      .select('id, recipe_name, guests(first_name,last_name,printed_name), recipe_print_ready(recipe_name_clean)')
      .in('id', recipeIds);

    const nameMap = new Map<string, { name: string; guest: string }>();
    for (const r of recipeData ?? []) {
      const pr = Array.isArray(r.recipe_print_ready)
        ? r.recipe_print_ready[0] || null
        : r.recipe_print_ready || null;
      const guest = r.guests as unknown as {
        first_name: string | null;
        last_name: string | null;
        printed_name: string | null;
      } | null;
      const guestName =
        guest?.printed_name ||
        `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
        'Invitado';
      const name =
        (pr as { recipe_name_clean?: string } | null)?.recipe_name_clean ||
        (r.recipe_name as string) ||
        'Original';
      nameMap.set(r.id as string, { name, guest: guestName });
    }

    // Couple name for the zip filename.
    const { data: group } = await supabase
      .from('groups')
      .select('couple_display_name, print_couple_name, couple_first_name, partner_first_name')
      .eq('id', groupId)
      .single();
    const coupleName =
      group?.print_couple_name ||
      group?.couple_display_name ||
      `${group?.couple_first_name || ''} & ${group?.partner_first_name || ''}`.trim() ||
      'Originals';

    // Build the download list with a per-recipe duplicate index.
    const perRecipeCount = new Map<string, number>();
    const downloads: { url: string; filename: string }[] = [];
    for (const row of rows) {
      const recipeId = row.recipe_id as string;
      const dupIndex = perRecipeCount.get(recipeId) ?? 0;
      perRecipeCount.set(recipeId, dupIndex + 1);
      const info = nameMap.get(recipeId) ?? { name: 'Original', guest: 'Invitado' };
      downloads.push({
        url: row.print_url as string,
        filename: annexDownloadFilename(info.name, info.guest, dupIndex),
      });
    }

    // Download images to memory in batches (same pattern as /package).
    const BATCH_SIZE = 10;
    const files: { filename: string; buffer: Buffer }[] = [];
    for (let i = 0; i < downloads.length; i += BATCH_SIZE) {
      const batch = downloads.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (d) => {
          const res = await fetch(d.url, { signal: AbortSignal.timeout(30_000) });
          if (!res.ok) return null;
          return { filename: d.filename, buffer: Buffer.from(await res.arrayBuffer()) };
        })
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) files.push(result.value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No se pudo descargar ninguna imagen' },
        { status: 502 }
      );
    }

    // Build the ZIP in one shot — all buffers are in memory.
    const passthrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 5 } });
    const collectPromise = new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      passthrough.on('data', (chunk: Buffer) => chunks.push(chunk));
      passthrough.on('end', () => resolve(Buffer.concat(chunks)));
      passthrough.on('error', reject);
      archive.on('error', reject);
    });

    archive.pipe(passthrough);
    for (const f of files) {
      archive.append(f.buffer, { name: f.filename });
    }
    archive.finalize();

    const zipBuffer = await collectPromise;

    const safeName = coupleName
      .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ&\s]/g, '')
      .replace(/\s+/g, '_');

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="SmallPlates_Originals_${safeName}.zip"`,
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
