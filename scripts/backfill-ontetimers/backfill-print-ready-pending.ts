/**
 * Backfill script: Generate print-ready for SPECIFIC recipes only
 * 
 * Only processes the 6 recipes that:
 * - Already have text extracted (from OCR)
 * - Are NOT yet in recipe_print_ready
 * 
 * Run with: npx ts-node scripts/backfill-print-ready-pending.ts
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

// ONLY these 6 recipes (already have text, not yet in print_ready)
const RECIPE_IDS_TO_PROCESS = [
  'd58f6ee3-f552-4c5f-9402-25e28f23e974', // Salsa napolitana
  '4336dd9f-075f-4005-a265-a806d85766f5', // Galletas de la familia
  '21c39429-43b1-44c5-a782-9f2f2d7a90e2', // Tacos de Pollo con Nuez de la India
  '0fa73380-cc92-4e9f-8e54-827fc6044cf6', // SOUFFLE DE COLIFLOR
  'cc76335a-f3d1-45d4-9045-70f01807a2e9', // CREME DE BETERRABA
  '6abd3bf8-ee8e-4f5f-a7fa-215eb24f9c6b', // Probando Collection Link group (test)
];

async function backfillPendingRecipes() {
  console.log('🚀 Starting backfill for 6 SPECIFIC recipes...\n');

  // Get these specific recipes
  const { data: recipes, error } = await supabase
    .from('guest_recipes')
    .select('id, recipe_name, ingredients, instructions')
    .in('id', RECIPE_IDS_TO_PROCESS);

  if (error) {
    console.error('❌ Error fetching recipes:', error);
    return;
  }

  if (!recipes || recipes.length === 0) {
    console.log('❌ No recipes found with those IDs');
    return;
  }

  console.log(`📋 Found ${recipes.length} recipes to process\n`);
  console.log('─'.repeat(60));

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const progress = `[${i + 1}/${recipes.length}]`;

    // Skip if no content
    if (!recipe.ingredients && !recipe.instructions) {
      console.log(`${progress} ⏭️  Skipping "${recipe.recipe_name?.substring(0, 30)}" - no content`);
      skippedCount++;
      continue;
    }

    // Skip if still has placeholder text
    if (recipe.ingredients?.includes('See uploaded images') || recipe.instructions?.includes('See uploaded images')) {
      console.log(`${progress} ⏭️  Skipping "${recipe.recipe_name?.substring(0, 30)}" - still has placeholder`);
      skippedCount++;
      continue;
    }

    // Combine ingredients and instructions
    const recipeText = [
      recipe.ingredients || '',
      recipe.instructions || ''
    ].filter(Boolean).join('\n\n');

    console.log(`\n${progress} 🔄 Processing: ${recipe.recipe_name || 'Unnamed'}...`);

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
        await delay(2000);
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
        await delay(2000);
        continue;
      }

      // Update dish_category in guest_recipes
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
    await delay(5000);
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 BACKFILL COMPLETE');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total: ${recipes.length}`);
}

// Run
backfillPendingRecipes()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });