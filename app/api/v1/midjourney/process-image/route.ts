import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { image_url, dish_name, recipe_id } = await request.json();

    console.log('📷 Process image request:', {
      recipe_id: recipe_id || 'N/A',
      dish_name: dish_name || 'N/A',
      hasImageUrl: !!image_url,
    });

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 }
      );
    }

    // Call Railway agent (v2)
    const response = await fetch(`${RAILWAY_AGENT_URL}/process-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url,
        dish_name: dish_name || null,
      }),
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
    // v2 FORMAT
    // ============================================================
    const data = await response.json();

    console.log('📋 v2 Response:', {
      success: data.success,
      hasPrompt: !!data.prompt,
      hasOcrData: !!(data.ocr_recipe_name || data.ocr_ingredients || data.ocr_instructions),
      dishCategory: data.dish_category,
    });

    // Check if we have either OCR data or a generated prompt
    const hasOCRData = data.ocr_recipe_name || data.ocr_ingredients || data.ocr_instructions;
    const hasPrompt = data.success && data.prompt;

    if (!hasOCRData && !hasPrompt) {
      console.error('❌ Invalid response: no OCR data or prompt');
      return NextResponse.json(
        { error: 'Invalid response from agent: no data extracted' },
        { status: 500 }
      );
    }

    // ============================================================
    // SAVE TO SUPABASE
    // ============================================================
    if (recipe_id) {
      const supabase = createSupabaseAdminClient();

      // 1. Save OCR data to guest_recipes
      if (hasOCRData) {
        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Never update recipe_name - preserve user's title
        if (data.ocr_ingredients) updateData.ingredients = data.ocr_ingredients;
        if (data.ocr_instructions) updateData.instructions = data.ocr_instructions;
        if (data.ocr_confidence_score !== undefined) updateData.confidence_score = data.ocr_confidence_score;
        if (data.ocr_raw_text) updateData.raw_recipe_text = data.ocr_raw_text;

        const { error: updateError } = await supabase
          .from('guest_recipes')
          .update(updateData)
          .eq('id', recipe_id);

        if (updateError) {
          console.error('❌ Error saving OCR data:', updateError);
        } else {
          console.log('✅ OCR data saved:', Object.keys(updateData));
        }
      }

      // 2. Save prompt to midjourney_prompts
      if (hasPrompt) {
        const { error: insertError } = await supabase
          .from('midjourney_prompts')
          .upsert({
            recipe_id,
            generated_prompt: data.prompt,
            agent_metadata: data.metadata || {},
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'recipe_id',
          });

        if (insertError) {
          console.error('❌ Error saving prompt:', insertError);
        } else {
          console.log('✅ Prompt saved');
        }
      }

      // 3. Save print_ready to recipe_print_ready
      const printReady = data.print_ready;
      
      if (printReady && printReady.status === 'success') {
        console.log('✅ print_ready FOUND, saving...');
        
        const { error: printReadyError } = await supabase
          .from('recipe_print_ready')
          .upsert({
            recipe_id,
            recipe_name_clean: printReady.recipe_name,
            ingredients_clean: printReady.ingredients,
            instructions_clean: printReady.instructions,
            detected_language: printReady.language,
            cleaning_version: 2,
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
      }

      // 4. Save dish_category to guest_recipes
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