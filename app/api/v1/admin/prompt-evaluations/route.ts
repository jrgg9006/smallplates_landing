import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

// GET - Fetch evaluation for a recipe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipe_id');

    if (!recipeId) {
      return NextResponse.json({ error: 'recipe_id is required' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('prompt_evaluations')
      .select('*')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      console.error('Error fetching evaluation:', error);
      return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
    }

    return NextResponse.json({ evaluation: data || null });
  } catch (error) {
    console.error('Error in GET prompt-evaluations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update evaluation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      recipe_id,
      prompt_text,
      midjourney_image_url,
      rating,
      what_worked,
      what_failed,
      notes,
      was_edited,
      edited_prompt,
      dish_category,
      hero_element,
      container_used,
      agent_version,
      generation_duration_ms,
    } = body;

    if (!recipe_id || !rating) {
      return NextResponse.json(
        { error: 'recipe_id and rating are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    // Check if evaluation already exists for this recipe
    const { data: existing } = await supabase
      .from('prompt_evaluations')
      .select('id')
      .eq('recipe_id', recipe_id)
      .single();

    const evaluationData = {
      recipe_id,
      prompt_text,
      midjourney_image_url,
      rating,
      what_worked,
      what_failed,
      notes,
      was_edited: was_edited || false,
      edited_prompt,
      dish_category,
      hero_element,
      container_used,
      agent_version,
      generation_duration_ms,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('prompt_evaluations')
        .update(evaluationData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating evaluation:', error);
        return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('prompt_evaluations')
        .insert(evaluationData)
        .select()
        .single();

      if (error) {
        console.error('Error creating evaluation:', error);
        return NextResponse.json({ error: 'Failed to create evaluation' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      evaluation: result,
      message: existing ? 'Evaluation updated' : 'Evaluation created'
    });
  } catch (error) {
    console.error('Error in POST prompt-evaluations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}