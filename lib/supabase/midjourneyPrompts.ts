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

    await response.json();
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

