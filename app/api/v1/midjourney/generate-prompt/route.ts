import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { dish_name, recipe, recipe_id } = await request.json();

    console.log('📨 Received request:', {
      recipe_id: recipe_id || 'N/A',
      dish_name: dish_name?.substring(0, 50) || 'N/A',
      recipeLength: recipe?.length || 0,
    });

    if (!dish_name || !recipe) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'dish_name and recipe are required' },
        { status: 400 }
      );
    }

    // Call Railway agent (v2)
    const response = await fetch(`${RAILWAY_AGENT_URL}/generate-prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dish_name, recipe }),
    });

    console.log('🚂 Railway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Railway agent error:', errorText);
      return NextResponse.json(
        { error: `Agent returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    // ============================================================
    // v2 FORMAT - New field names
    // ============================================================
    const data = await response.json();

    console.log('📋 v2 Response:', {
      success: data.success,
      hasPrompt: !!data.prompt,
      dishCategory: data.dish_category,
      hasPrintReady: !!data.print_ready,
      pipelineSteps: data.pipeline_trace?.length || 0,
    });

    // Validate response
    if (!data.success || !data.prompt) {
      console.error('❌ Agent returned unsuccessful result:', data.error);
      return NextResponse.json(
        { error: data.error || 'Agent failed to generate prompt' },
        { status: 500 }
      );
    }

    // ============================================================
    // SAVE TO SUPABASE
    // ============================================================
    if (recipe_id) {
      const supabase = createSupabaseAdminClient();

      // 1. Save prompt to midjourney_prompts
      const { error: insertError } = await supabase
        .from('midjourney_prompts')
        .upsert({
          recipe_id,
          generated_prompt: data.prompt,  // v2: prompt → generated_prompt (DB column name)
          agent_metadata: data.metadata || {},  // v2: metadata (includes version, timing, etc)
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'recipe_id',
        });

      if (insertError) {
        console.error('❌ Error saving prompt:', insertError);
      } else {
        console.log('✅ Prompt saved');
      }

      // 2. Save print_ready to recipe_print_ready
      const printReady = data.print_ready;
      
      if (printReady && printReady.status === 'success') {
        console.log('✅ print_ready FOUND, saving...');
        
        const { error: printReadyError } = await supabase
          .from('recipe_print_ready')
          .upsert({
            recipe_id,
            recipe_name_clean: printReady.recipe_name,      // v2 field name
            ingredients_clean: printReady.ingredients,       // v2 field name
            instructions_clean: printReady.instructions,     // v2 field name
            detected_language: printReady.language,          // v2 field name
            cleaning_version: 2,  // Mark as v2
            agent_metadata: printReady,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'recipe_id',
          });

        if (printReadyError) {
          console.error('❌ Error saving print_ready:', printReadyError);
        } else {
          console.log('✅ Print-ready saved');
        }
      } else {
        console.warn('⚠️ print_ready not available or failed');
      }

      // 3. Save dish_category to guest_recipes
      if (data.dish_category) {
        console.log('✅ dish_category FOUND:', data.dish_category);
        
        const { error: categoryError } = await supabase
          .from('guest_recipes')
          .update({ 
            dish_category: data.dish_category,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipe_id);

        if (categoryError) {
          console.error('❌ Error saving dish_category:', categoryError);
        } else {
          console.log('✅ Dish category saved');
        }
      }
    }

    // ============================================================
    // RETURN v2 FORMAT TO FRONTEND
    // ============================================================
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}