import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    await requireAdminAuth();

    const { recipeId } = await params;
    const { extension, contentType } = await request.json();

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, or WebP.' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // Get recipe to find group_id
    const { data: recipe, error: recipeError } = await supabase
      .from('guest_recipes')
      .select('id, group_id')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (!recipe.group_id) {
      return NextResponse.json({ error: 'Recipe has no group' }, { status: 400 });
    }

    const storagePath = `generated/${recipe.group_id}/${recipeId}.${extension}`;

    // Generate signed upload URL (bypasses RLS, valid for 2 minutes)
    const { data: signedData, error: signedError } = await supabase.storage
      .from('recipes')
      .createSignedUploadUrl(storagePath);

    if (signedError) {
      console.error('Signed URL error:', signedError);
      return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
    }

    // Get the public URL for after upload
    const { data: urlData } = supabase.storage
      .from('recipes')
      .getPublicUrl(storagePath);

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      token: signedData.token,
      publicUrl: urlData.publicUrl,
      storagePath,
    });

  } catch (error) {
    console.error('Error in upload-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
