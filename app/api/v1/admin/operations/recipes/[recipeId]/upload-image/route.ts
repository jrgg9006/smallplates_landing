import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    // Auth check
    await requireAdminAuth();

    const { recipeId } = await params;
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use PNG, JPG, or WebP.' }, { status: 400 });
    }

    // Get file extension
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    
    // Build storage path
    const storagePath = `generated/${recipe.group_id}/${recipeId}.${extension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipes')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recipes')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;

    // Update recipe with the URL
    const { error: updateError } = await supabase
      .from('guest_recipes')
      .update({ generated_image_url: publicUrl })
      .eq('id', recipeId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to save image URL' }, { status: 500 });
    }

    // Also mark image_generated as true in production_status
    const { data: existingStatus } = await supabase
      .from('recipe_production_status')
      .select('id')
      .eq('recipe_id', recipeId)
      .single();

    if (existingStatus) {
      await supabase
        .from('recipe_production_status')
        .update({ image_generated: true, updated_at: new Date().toISOString() })
        .eq('recipe_id', recipeId);
    } else {
      await supabase
        .from('recipe_production_status')
        .insert({
          recipe_id: recipeId,
          image_generated: true,
          text_finalized_in_indesign: false,
          image_placed_in_indesign: false,
        });
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      message: 'Image uploaded successfully'
    });

  } catch (error) {
    console.error('Error in upload-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
