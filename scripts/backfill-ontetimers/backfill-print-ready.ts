/**
 * Backfill script: Generate print-ready versions for ALL recipes
 * 
 * SAFE: 
 * - Only READS from guest_recipes
 * - Only INSERTS into recipe_print_ready
 * - Only UPDATES dish_category in guest_recipes
 * - Does NOT touch midjourney_prompts
 * 
 * Run with: npx ts-node scripts/backfill-print-ready.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });  // ← CARGAR ENV VARS

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const RAILWAY_AGENT_URL = process.env.RAILWAY_AGENT_URL || 'https://smallplatesweb-production-f5e1.up.railway.app';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function backfillPrintReady() {
  console.log('🚀 Starting backfill for recipe_print_ready...');
  console.log('⚠️  This will NOT touch midjourney_prompts\n');

  // Step 1: Get existing print_ready recipe_ids
  const { data: existingPrintReady } = await supabase
    .from('recipe_print_ready')
    .select('recipe_id');
  
  const existingIds = new Set(existingPrintReady?.map(r => r.recipe_id) || []);
  console.log(`📋 Found ${existingIds.size} recipes already with print_ready\n`);

  // Step 2: Get all active recipes
  const { data: recipes, error } = await supabase
    .from('guest_recipes')
    .select('id, recipe_name, ingredients, instructions')
    .is('deleted_at', null);

  if (error) {
    console.error('❌ Error fetching recipes:', error);
    return;
  }

  // Filter out recipes that already have print_ready
  const recipesToProcess = recipes?.filter(r => !existingIds.has(r.id)) || [];

  if (recipesToProcess.length === 0) {
    console.log('✅ All recipes already have print-ready versions!');
    return;
  }

  console.log(`📋 Will process ${recipesToProcess.length} recipes\n`);

  // Step 3: Process each recipe
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < recipesToProcess.length; i++) {
    const recipe = recipesToProcess[i];
    const progress = `[${i + 1}/${recipesToProcess.length}]`;

    // Skip if no content
    if (!recipe.ingredients && !recipe.instructions) {
      console.log(`${progress} ⏭️  Skipping "${recipe.recipe_name?.substring(0, 30)}" - no content`);
      skippedCount++;
      continue;
    }

    // Combine ingredients and instructions
    const recipeText = [
      recipe.ingredients || '',
      recipe.instructions || ''
    ].filter(Boolean).join('\n\n');

    console.log(`${progress} 🔄 Processing: ${recipe.recipe_name?.substring(0, 40) || 'Unnamed'}...`);

    try {
      // Call the clean-only endpoint
      const response = await fetch(`${RAILWAY_AGENT_URL}/clean-only`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_id: recipe.id,
          dish_name: recipe.recipe_name || 'Recipe',
          recipe: recipeText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Agent returned ${response.status}`);
      }

      const data = await response.json();

      if (!data.success || !data.print_ready) {
        console.log(`${progress} ⚠️  No print_ready returned`);
        errorCount++;
        await delay(1000);
        continue;
      }

      // Save to recipe_print_ready
      const { error: insertError } = await supabase
        .from('recipe_print_ready')
        .upsert({
          recipe_id: recipe.id,
          recipe_name_clean: data.print_ready.recipe_name_clean,
          ingredients_clean: data.print_ready.ingredients_clean,
          instructions_clean: data.print_ready.instructions_clean,
          detected_language: data.print_ready.detected_language,
          cleaning_version: data.print_ready.cleaning_version || 1,
          agent_metadata: data.print_ready,
        }, {
          onConflict: 'recipe_id',
        });

      if (insertError) {
        console.log(`${progress} ❌ DB Error: ${insertError.message}`);
        errorCount++;
        await delay(1000);
        continue;
      }

      // Update dish_category in guest_recipes (only this field)
      if (data.dish_category) {
        await supabase
          .from('guest_recipes')
          .update({ dish_category: data.dish_category })
          .eq('id', recipe.id);
      }

      console.log(`${progress} ✅ ${data.print_ready.recipe_name_clean} (${data.print_ready.detected_language})`);
      successCount++;

    } catch (err) {
      console.log(`${progress} ❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      errorCount++;
    }

    // Wait between requests
    await delay(2000);
  }

  // Summary
  console.log('\n========================================');
  console.log('📊 BACKFILL COMPLETE');
  console.log('========================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total: ${recipesToProcess.length}`);
  console.log('\n⚠️  midjourney_prompts was NOT touched');
}

// Run
backfillPrintReady()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });