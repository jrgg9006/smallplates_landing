import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { dish_name, recipe, recipe_id } = await request.json();

    if (!dish_name || !recipe) {
      return NextResponse.json(
        { error: 'dish_name and recipe are required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${RAILWAY_AGENT_URL}/generate-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dish_name,
        recipe,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Railway agent error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { error: `Agent returned ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const promptData = await response.json();

    if (!promptData.generated_prompt) {
      console.error('❌ Invalid response from agent: missing generated_prompt');
      return NextResponse.json(
        { error: 'Invalid response from agent: missing generated_prompt' },
        { status: 500 }
      );
    }

    if (recipe_id) {
      const supabase = createSupabaseAdminClient();
      
      // Save prompt to midjourney_prompts (existing)
      const { error: insertError } = await supabase
        .from('midjourney_prompts')
        .upsert({
          recipe_id,
          generated_prompt: promptData.generated_prompt,
          agent_metadata: promptData.agent_metadata || {},
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'recipe_id',
        });

      if (insertError) {
        console.error('❌ Error saving prompt to Supabase:', insertError);
      }

      // === NUEVO: Save print-ready text to recipe_print_ready ===
      const printReady = promptData.agent_metadata?.print_ready;
      if (printReady) {
        const { error: printReadyError } = await supabase
          .from('recipe_print_ready')
          .upsert({
            recipe_id,
            recipe_name_clean: printReady.recipe_name_clean,
            ingredients_clean: printReady.ingredients_clean,
            instructions_clean: printReady.instructions_clean,
            detected_language: printReady.detected_language,
            cleaning_version: printReady.cleaning_version || 1,
            agent_metadata: printReady,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'recipe_id',
          });

        if (printReadyError) {
          console.error('❌ Error saving print-ready to Supabase:', printReadyError);
        } else {
          console.log('✅ Print-ready text saved for recipe:', recipe_id);
        }
      }

      // === NUEVO: Save dish_category to guest_recipes ===
      const dishCategory = promptData.agent_metadata?.dish_category;
      if (dishCategory) {
        const { error: categoryError } = await supabase
          .from('guest_recipes')
          .update({ 
            dish_category: dishCategory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipe_id);

        if (categoryError) {
          console.error('❌ Error saving dish_category to Supabase:', categoryError);
        } else {
          console.log('✅ Dish category saved:', dishCategory, 'for recipe:', recipe_id);
        }
      }
      // === FIN NUEVO ===
    }

    return NextResponse.json(promptData);
  } catch (error) {
    console.error('❌ Error calling Railway agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}