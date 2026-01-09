import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    const { image_url, dish_name, recipe_id } = await request.json();

    if (!image_url) {
      return NextResponse.json(
        { error: 'image_url is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${RAILWAY_AGENT_URL}/process-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url,
        dish_name: dish_name || null,
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

    // Check if we have either OCR data or a generated prompt
    const hasOCRData = promptData.recipe_name || promptData.ingredients || promptData.instructions;
    const hasPrompt = promptData.generated_prompt;

    if (!hasOCRData && !hasPrompt) {
      console.error('❌ Invalid response from agent: no OCR data or prompt');
      return NextResponse.json(
        { error: 'Invalid response from agent: no data extracted' },
        { status: 500 }
      );
    }

    if (recipe_id) {
      const supabase = createSupabaseAdminClient();
      
      // Guardar datos extraídos del OCR en guest_recipes
      if (hasOCRData) {
        // Build update object with only the fields that have values
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };
        
        // Never update recipe_name - always preserve user's title
        
        if (promptData.ingredients) updateData.ingredients = promptData.ingredients;
        if (promptData.instructions) updateData.instructions = promptData.instructions;
        if (promptData.confidence_score !== undefined) updateData.confidence_score = promptData.confidence_score;
        if (promptData.raw_text) updateData.raw_recipe_text = promptData.raw_text;
        
        const { error: updateError } = await supabase
          .from('guest_recipes')
          .update(updateData)
          .eq('id', recipe_id);

        if (updateError) {
          console.error('❌ Error saving OCR data to Supabase:', updateError);
        } else {
          console.log('✅ OCR data saved successfully:', {
            recipeId: recipe_id,
            fieldsUpdated: Object.keys(updateData),
          });
        }
      }
      
      // Guardar prompt si existe
      if (hasPrompt) {
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
        } else {
          console.log('✅ Prompt saved successfully for recipe:', recipe_id);
        }
      }
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