/**
 * Translate and Duplicate Recipes Script
 * 
 * This script:
 * 1. Finds the "Wedding Planner Edition" group
 * 2. Fetches Spanish recipes from the database
 * 3. Translates recipe_name, ingredients, instructions, and comments to English
 * 4. Creates new recipe entries in the Wedding Planner Edition group
 * 5. Preserves the same image_urls from the original recipes
 * 
 * Run with: npx ts-node scripts/translate-and-duplicate-recipes.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Configuration
const TARGET_GROUP_NAME = 'Wedding Planner Edition';
const TARGET_RECIPE_COUNT = 80;
const BATCH_SIZE = 5; // Process recipes in batches to avoid rate limits

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface Recipe {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  image_url: string | null;
  document_urls: string[] | null;
  user_id: string;
  guest_id: string;
  group_id: string | null;
}

interface TranslatedRecipe {
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
}

/**
 * Translate a recipe from Spanish to English using OpenAI
 */
async function translateRecipe(recipe: Recipe): Promise<TranslatedRecipe> {
  const systemPrompt = `You are a professional culinary translator. Translate Spanish recipe content to English while preserving:
- Cooking terminology and techniques
- Measurements and units (convert when appropriate, e.g., "tazas" → "cups")
- Recipe structure and formatting
- Personal tone and warmth in comments/notes
- All line breaks and formatting

Translate accurately and naturally. Do not add or remove content.`;

  const userPrompt = `Translate this Spanish recipe to English:

RECIPE NAME:
${recipe.recipe_name}

INGREDIENTS:
${recipe.ingredients}

INSTRUCTIONS:
${recipe.instructions}

${recipe.comments ? `COMMENTS/NOTES:\n${recipe.comments}` : ''}

Return a JSON object with this exact structure:
{
  "recipe_name": "translated recipe name",
  "ingredients": "translated ingredients",
  "instructions": "translated instructions",
  "comments": "translated comments" or null
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const translated = JSON.parse(content) as TranslatedRecipe;
    return translated;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Find the Wedding Planner Edition group
 */
async function findTargetGroup(): Promise<{ id: string; user_id: string } | null> {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('id, created_by')
    .ilike('name', TARGET_GROUP_NAME)
    .limit(1);

  if (error) {
    console.error('❌ Error finding group:', error);
    return null;
  }

  if (!groups || groups.length === 0) {
    console.error(`❌ Group "${TARGET_GROUP_NAME}" not found`);
    return null;
  }

  return {
    id: groups[0].id,
    user_id: groups[0].created_by
  };
}

/**
 * Get or create a system guest for the translated recipes
 */
async function getOrCreateSystemGuest(groupId: string, userId: string): Promise<string> {
  // Try to find an existing "System" or "Example Recipes" guest
  const { data: existingGuests } = await supabase
    .from('guests')
    .select('id')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .or('first_name.ilike.System,first_name.ilike.Example,first_name.ilike.Wedding Planner')
    .limit(1);

  if (existingGuests && existingGuests.length > 0) {
    return existingGuests[0].id;
  }

  // Create a new system guest
  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      user_id: userId,
      group_id: groupId,
      first_name: 'Wedding Planner',
      last_name: 'Example Recipes',
      email: 'example@smallplates.com',
      status: 'submitted',
      number_of_recipes: TARGET_RECIPE_COUNT,
      recipes_received: 0,
      source: 'manual'
    })
    .select('id')
    .single();

  if (error || !newGuest) {
    throw new Error(`Failed to create system guest: ${error?.message}`);
  }

  return newGuest.id;
}

/**
 * Fetch Spanish recipes from the database
 * You can modify this query to filter by specific criteria
 */
async function fetchSpanishRecipes(limit: number): Promise<Recipe[]> {
  // Fetch recipes that likely contain Spanish text
  // You may want to adjust this query based on your data
  const { data: recipes, error } = await supabase
    .from('guest_recipes')
    .select(`
      id,
      recipe_name,
      ingredients,
      instructions,
      comments,
      image_url,
      document_urls,
      user_id,
      guest_id,
      group_id
    `)
    .not('recipe_name', 'is', null)
    .not('ingredients', 'is', null)
    .not('instructions', 'is', null)
    .limit(limit * 2); // Get more to filter out non-Spanish ones

  if (error) {
    console.error('❌ Error fetching recipes:', error);
    return [];
  }

  if (!recipes || recipes.length === 0) {
    console.log('⚠️  No recipes found');
    return [];
  }

  // Filter for Spanish recipes (simple heuristic: check for common Spanish words/characters)
  // You can refine this logic based on your data
  const spanishRecipes = recipes.filter(recipe => {
    const text = `${recipe.recipe_name} ${recipe.ingredients} ${recipe.instructions}`.toLowerCase();
    const hasSpanishIndicators = 
      text.includes('taza') || text.includes('tazas') ||
      text.includes('cucharada') || text.includes('cucharadas') ||
      text.includes('cebolla') || text.includes('ajo') ||
      text.includes('sal') || text.includes('pimienta') ||
      text.includes('cocinar') || text.includes('agregar') ||
      text.includes('mezclar') || text.includes('servir');
    
    return hasSpanishIndicators;
  }).slice(0, limit) as Recipe[];

  return spanishRecipes;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting recipe translation and duplication...\n');
  console.log(`📋 Target: ${TARGET_RECIPE_COUNT} recipes for "${TARGET_GROUP_NAME}"\n`);

  // Step 1: Find the target group
  console.log('🔍 Step 1: Finding target group...');
  const targetGroup = await findTargetGroup();
  if (!targetGroup) {
    console.error('❌ Cannot proceed without target group');
    process.exit(1);
  }
  console.log(`✅ Found group: ${targetGroup.id}`);
  console.log(`   Owner: ${targetGroup.user_id}\n`);

  // Step 2: Get or create system guest
  console.log('🔍 Step 2: Setting up system guest...');
  const systemGuestId = await getOrCreateSystemGuest(targetGroup.id, targetGroup.user_id);
  console.log(`✅ System guest ID: ${systemGuestId}\n`);

  // Step 3: Fetch Spanish recipes
  console.log('🔍 Step 3: Fetching Spanish recipes...');
  const recipes = await fetchSpanishRecipes(TARGET_RECIPE_COUNT);
  console.log(`✅ Found ${recipes.length} Spanish recipes to translate\n`);

  if (recipes.length === 0) {
    console.log('⚠️  No recipes to process. Exiting.');
    process.exit(0);
  }

  console.log('─'.repeat(60));
  console.log('🔄 Starting translation and duplication...\n');

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Process recipes in batches
  for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
    const batch = recipes.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(recipes.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} recipes)`);

    // Process batch in parallel
    const batchPromises = batch.map(async (recipe, idx) => {
      const globalIdx = i + idx + 1;
      const progress = `[${globalIdx}/${recipes.length}]`;

      try {
        console.log(`\n${progress} 🔄 Translating: "${recipe.recipe_name.substring(0, 40)}..."`);

        // Translate the recipe
        const translated = await translateRecipe(recipe);

        console.log(`    ✅ Translated: "${translated.recipe_name.substring(0, 40)}..."`);

        // Create new recipe in target group
        const { data: newRecipe, error: insertError } = await supabase
          .from('guest_recipes')
          .insert({
            guest_id: systemGuestId,
            user_id: targetGroup.user_id,
            group_id: targetGroup.id,
            recipe_name: translated.recipe_name,
            ingredients: translated.ingredients,
            instructions: translated.instructions,
            comments: translated.comments,
            image_url: recipe.image_url,
            document_urls: recipe.document_urls,
            upload_method: recipe.document_urls && recipe.document_urls.length > 0 ? 'image' : 'text',
            submission_status: 'submitted',
            submitted_at: new Date().toISOString(),
            source: 'manual'
          })
          .select('id')
          .single();

        if (insertError || !newRecipe) {
          console.log(`${progress} ❌ Insert Error: ${insertError?.message}`);
          errorCount++;
          return;
        }

        console.log(`${progress} ✅ Created recipe: ${newRecipe.id}`);
        successCount++;

        // Small delay between recipes in batch
        await delay(500);

      } catch (err) {
        console.log(`${progress} ❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
        errorCount++;
      }
    });

    await Promise.all(batchPromises);

    // Delay between batches to avoid rate limits
    if (i + BATCH_SIZE < recipes.length) {
      console.log(`\n⏳ Waiting 2 seconds before next batch...`);
      await delay(2000);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TRANSLATION & DUPLICATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total processed: ${recipes.length}`);
  console.log(`🎯 Target group: ${TARGET_GROUP_NAME}`);
  console.log(`🆔 Group ID: ${targetGroup.id}`);
}

// Run
main()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
