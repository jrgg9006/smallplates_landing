import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB - spreads can be large

export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const supabase = createSupabaseAdminClient();

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const recipeId = formData.get('recipe_id') as string | null;
    const groupId = formData.get('group_id') as string | null;

    if (!file || !recipeId) {
      return NextResponse.json(
        { error: 'image and recipe_id are required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only PNG and JPEG images are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Image must be under 8MB' },
        { status: 400 }
      );
    }

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const storagePath = `showcase/${groupId || 'ungrouped'}/${recipeId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('recipes')
      .getPublicUrl(storagePath);

    const url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('guest_recipes')
      .update({ showcase_image_url: url })
      .eq('id', recipeId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
