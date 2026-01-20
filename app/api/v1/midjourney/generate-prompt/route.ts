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

    // === DEBUG: Log completo de la respuesta del agente ===
    console.log('📋 ========================================');
    console.log('📋 Railway Agent Response for recipe_id:', recipe_id || 'N/A');
    console.log('📋 ========================================');
    console.log('📋 Full promptData:', JSON.stringify(promptData, null, 2));
    console.log('📋 promptData top-level keys:', Object.keys(promptData));
    console.log('📋 agent_metadata exists?', !!promptData.agent_metadata);
    console.log('📋 agent_metadata keys:', Object.keys(promptData.agent_metadata || {}));
    
    // Check both root level AND agent_metadata
    console.log('📋 print_ready in root?', !!promptData.print_ready);
    console.log('📋 print_ready in agent_metadata?', !!promptData.agent_metadata?.print_ready);
    console.log('📋 dish_category in root?', !!promptData.dish_category);
    console.log('📋 dish_category in agent_metadata?', !!promptData.agent_metadata?.dish_category);
    console.log('📋 ========================================');

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
      // Check BOTH root level AND agent_metadata (agent returns it at root)
      const printReady = promptData.print_ready || promptData.agent_metadata?.print_ready;
      
      console.log('🔍 Checking print_ready for recipe_id:', recipe_id);
      console.log('🔍 printReady from root:', promptData.print_ready);
      console.log('🔍 printReady from agent_metadata:', promptData.agent_metadata?.print_ready);
      console.log('🔍 Final printReady value:', printReady);
      console.log('🔍 printReady type:', typeof printReady);
      console.log('🔍 printReady truthy?', !!printReady);
      
      if (printReady) {
        console.log('✅ print_ready FOUND! Saving to database...');
        console.log('✅ print_ready content:', JSON.stringify(printReady, null, 2));
        
        // Validate print_ready has required fields
        if (!printReady.ingredients_clean && !printReady.instructions_clean) {
          console.warn('⚠️ print_ready exists but missing required fields:', printReady);
        } else {
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
            console.log('✅ Print-ready text saved successfully for recipe:', recipe_id);
          }
        }
      } else {
        console.warn('⚠️  print_ready NOT FOUND for recipe:', recipe_id);
        console.warn('⚠️  Checked both root level and agent_metadata.');
        console.warn('⚠️  This means the Railway agent did not return cleaned text.');
        console.warn('⚠️  Full response structure:', JSON.stringify(promptData, null, 2));
      }

      // === NUEVO: Save dish_category to guest_recipes ===
      // Check BOTH root level AND agent_metadata (agent returns it at root)
      const dishCategory = promptData.dish_category || promptData.agent_metadata?.dish_category;
      
      console.log('🔍 Checking dish_category for recipe_id:', recipe_id);
      console.log('🔍 dishCategory from root:', promptData.dish_category);
      console.log('🔍 dishCategory from agent_metadata:', promptData.agent_metadata?.dish_category);
      console.log('🔍 Final dishCategory value:', dishCategory);
      
      if (dishCategory) {
        console.log('✅ dish_category FOUND! Saving to database...');
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
      } else {
        console.warn('⚠️  dish_category NOT FOUND for recipe:', recipe_id);
        console.warn('⚠️  Checked both root level and agent_metadata.');
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