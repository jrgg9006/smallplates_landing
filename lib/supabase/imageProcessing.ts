/**
 * Functions for processing recipe images and extracting structured data
 */

export interface ProcessedRecipeData {
  recipe_name?: string;
  ingredients?: string;
  instructions?: string;
  confidence_score?: number;
  raw_text?: string;
  generated_prompt?: string;
  agent_metadata?: any;
}

export async function processRecipeImage(
  imageUrl: string,
  recipeId: string,
  recipeName?: string
): Promise<{ data: ProcessedRecipeData | null; error: string | null }> {
  try {
    const response = await fetch('/api/v1/midjourney/process-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        recipe_id: recipeId,
        dish_name: recipeName || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image processing error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return {
        data: null,
        error: `Image processing failed: ${response.statusText}`,
      };
    }

    const processedData = await response.json();
    console.log('✅ Recipe image processed successfully:', {
      recipeId,
      hasExtractedData: !!(processedData.recipe_name || processedData.ingredients || processedData.instructions),
      confidenceScore: processedData.confidence_score,
    });

    return { data: processedData, error: null };
  } catch (error) {
    console.error('❌ Error processing recipe image:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to process image',
    };
  }
}

/**
 * Check if the image processing resulted in valid extracted data
 */
export function hasValidExtractedData(data: ProcessedRecipeData | null): boolean {
  if (!data) return false;
  
  // Check if we have at least recipe name and either ingredients or instructions
  return !!(data.recipe_name && (data.ingredients || data.instructions));
}

/**
 * Get placeholder text for when OCR extraction fails or returns incomplete data
 */
export function getImagePlaceholderText(imageCount: number): {
  ingredients: string;
  instructions: string;
} {
  return {
    ingredients: 'See uploaded images',
    instructions: `${imageCount} image${imageCount > 1 ? 's' : ''} uploaded`,
  };
}