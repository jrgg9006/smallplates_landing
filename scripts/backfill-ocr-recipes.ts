/**
 * Backfill script: Extract text from uploaded images using OCR
 * 
 * TARGETS: Recipes that have:
 * - "See uploaded images" in ingredients OR instructions
 * - At least one image/PDF in document_urls
 * 
 * UPDATES:
 * - ingredients (with extracted text)
 * - instructions (with extracted text)
 * 
 * Run with: npx ts-node scripts/backfill-ocr-recipes.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Recipe {
  id: string;
  recipe_name: string | null;
  ingredients: string | null;
  instructions: string | null;
  document_urls: string[] | null;
}

interface OCRResponse {
  generated_prompt: string;
  agent_metadata: any;
  recipe_name: string | null;
  ingredients: string | null;
  instructions: string | null;
  confidence_score: number | null;
  raw_text: string | null;
}

async function backfillOCRRecipes() {
  console.log('🔍 Starting OCR backfill for image-uploaded recipes...\n');

  // Step 1: Get recipes that need OCR processing
  const { data: recipes, error } = await supabase
    .from('guest_recipes')
    .select('id, recipe_name, ingredients, instructions, document_urls')
    .is('deleted_at', null)
    .not('document_urls', 'is', null);

  if (error) {
    console.error('❌ Error fetching recipes:', error);
    return;
  }

  // Filter: Only recipes with "See uploaded images" AND images in document_urls
  const recipesToProcess = (recipes as Recipe[])?.filter(r => {
    const hasPlaceholderText = 
      (r.ingredients?.includes('See uploaded images') || r.ingredients?.includes('image uploaded')) ||
      (r.instructions?.includes('See uploaded images') || r.instructions?.includes('image uploaded'));
    
    const hasImages = r.document_urls && r.document_urls.length > 0;
    
    return hasPlaceholderText && hasImages;
  }) || [];

  if (recipesToProcess.length === 0) {
    console.log('✅ No recipes need OCR processing!');
    return;
  }

  console.log(`📋 Found ${recipesToProcess.length} recipes needing OCR extraction\n`);
  console.log('─'.repeat(60));

  // Step 2: Process each recipe
  let successCount = 0;
  let errorCount = 0;
  let partialCount = 0;

  for (let i = 0; i < recipesToProcess.length; i++) {
    const recipe = recipesToProcess[i];
    const progress = `[${i + 1}/${recipesToProcess.length}]`;
    const imageUrl = recipe.document_urls![0]; // Use first image
    const fileType = imageUrl.split('.').pop()?.toLowerCase();

    console.log(`\n${progress} 🔄 Processing: "${recipe.recipe_name || 'Unnamed'}"`);
    console.log(`    📎 File type: ${fileType}`);
    console.log(`    🖼️  URL: ${imageUrl.substring(0, 80)}...`);

    try {
      // Call the /process-image endpoint
      const response = await fetch(`${RAILWAY_AGENT_URL}/process-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          dish_name: recipe.recipe_name || 'Recipe',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Agent returned ${response.status}: ${errorText}`);
      }

      const data: OCRResponse = await response.json();

      // Check if we got useful text
      const hasIngredients = data.ingredients && data.ingredients.trim().length > 0;
      const hasInstructions = data.instructions && data.instructions.trim().length > 0;

      if (!hasIngredients && !hasInstructions) {
        console.log(`${progress} ⚠️  OCR returned no text - might be unreadable image`);
        if (data.raw_text) {
          console.log(`    Raw text preview: "${data.raw_text.substring(0, 100)}..."`);
        }
        errorCount++;
        await delay(2000);
        continue;
      }

      // Prepare update object
      const updateData: { ingredients?: string; instructions?: string } = {};
      
      if (hasIngredients) {
        updateData.ingredients = data.ingredients!;
      }
      if (hasInstructions) {
        updateData.instructions = data.instructions!;
      }

      // Update the recipe
      const { error: updateError } = await supabase
        .from('guest_recipes')
        .update(updateData)
        .eq('id', recipe.id);

      if (updateError) {
        console.log(`${progress} ❌ DB Update Error: ${updateError.message}`);
        errorCount++;
        await delay(2000);
        continue;
      }

      // Success!
      if (hasIngredients && hasInstructions) {
        console.log(`${progress} ✅ Extracted both ingredients & instructions`);
        successCount++;
      } else {
        console.log(`${progress} ⚠️  Partial extraction: ${hasIngredients ? '✓ ingredients' : '✗ ingredients'}, ${hasInstructions ? '✓ instructions' : '✗ instructions'}`);
        partialCount++;
      }

      // Preview extracted text
      if (hasIngredients) {
        console.log(`    📝 Ingredients preview: "${data.ingredients!.substring(0, 60)}..."`);
      }
      if (hasInstructions) {
        console.log(`    📝 Instructions preview: "${data.instructions!.substring(0, 60)}..."`);
      }

    } catch (err) {
      console.log(`${progress} ❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      errorCount++;
    }

    // Wait between requests (OCR is slower)
    await delay(6000);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 OCR BACKFILL COMPLETE');
  console.log('═'.repeat(60));
  console.log(`✅ Full success: ${successCount}`);
  console.log(`⚠️  Partial:     ${partialCount}`);
  console.log(`❌ Errors:       ${errorCount}`);
  console.log(`📋 Total:        ${recipesToProcess.length}`);
}

// Run
backfillOCRRecipes()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });