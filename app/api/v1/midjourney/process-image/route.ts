import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production.up.railway.app';

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

    if (!promptData.generated_prompt) {
      console.error('❌ Invalid response from agent: missing generated_prompt');
      return NextResponse.json(
        { error: 'Invalid response from agent: missing generated_prompt' },
        { status: 500 }
      );
    }

    if (recipe_id) {
      const supabase = createSupabaseAdminClient();
      
      // Guardar datos extraídos del OCR en guest_recipes
      if (promptData.recipe_name || promptData.ingredients || promptData.instructions) {
        const { error: updateError } = await supabase
          .from('guest_recipes')
          .update({
            recipe_name: promptData.recipe_name,
            ingredients: promptData.ingredients,
            instructions: promptData.instructions,
            confidence_score: promptData.confidence_score,
            raw_recipe_text: promptData.raw_text,
            updated_at: new Date().toISOString(),
          })
          .eq('id', recipe_id);

        if (updateError) {
          console.error('❌ Error saving OCR data to Supabase:', updateError);
        }
      }
      
      // Guardar prompt (igual que con texto)
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