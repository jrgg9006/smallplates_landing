import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * API endpoint to add images to processing queue
 * This runs server-side so we can safely use the service role key
 */
export async function POST(request: NextRequest) {
  try {
    const { recipe_id, image_url, recipe_name } = await request.json();

    if (!recipe_id || !image_url) {
      return NextResponse.json(
        { error: 'recipe_id and image_url are required' },
        { status: 400 }
      );
    }

    console.log('📝 API: Adding image to processing queue for recipe:', recipe_id);

    // Use admin client (safe on server-side)
    const adminSupabase = createSupabaseAdminClient();
    
    const { error: queueError } = await adminSupabase
      .from('image_processing_queue')
      .insert({
        recipe_id,
        image_url,
        recipe_name
      });

    if (queueError) {
      console.error('❌ API: Error adding to processing queue:', queueError);
      return NextResponse.json(
        { error: 'Failed to add to queue', details: queueError.message },
        { status: 500 }
      );
    }

    console.log('✅ API: Image added to processing queue successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ API: Error in add-to-queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}