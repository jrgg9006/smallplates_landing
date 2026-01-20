/**
 * Functions for generating and storing Midjourney prompts for recipes
 */

export async function generateAndSaveMidjourneyPrompt(
  recipeId: string,
  recipeName: string,
  ingredients: string,
  instructions: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipeText = `Recipe Title: ${recipeName}

Ingredients:
${ingredients}

Instructions:
${instructions}`;

    // === DEBUG: Log qué se está enviando ===
    console.log('🚀 Calling /api/v1/midjourney/generate-prompt with:', {
      recipeId,
      recipeName,
      ingredientsLength: ingredients.length,
      instructionsLength: instructions.length,
      recipeTextLength: recipeText.length,
    });

    const response = await fetch('/api/v1/midjourney/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dish_name: recipeName,
        recipe: recipeText,
        recipe_id: recipeId,
      }),
    });

    console.log('📥 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Railway agent error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return {
        success: false,
        error: `Agent returned ${response.status}: ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    console.log('✅ Response received:', {
      hasGeneratedPrompt: !!responseData.generated_prompt,
      hasAgentMetadata: !!responseData.agent_metadata,
      hasPrintReady: !!responseData.print_ready || !!responseData.agent_metadata?.print_ready,
      debugInfo: responseData._debug,
    });

    console.log('✅ Midjourney prompt generated and saved successfully for recipe:', recipeId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error generating Midjourney prompt:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

