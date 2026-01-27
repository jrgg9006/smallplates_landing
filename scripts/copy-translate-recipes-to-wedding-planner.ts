/**
 * Copy and Translate Recipes to Wedding Planner Edition
 * 
 * This script:
 * 1. Finds source groups (e.g., "Rocio & Victor") and target group ("Wedding Planner Edition")
 * 2. Fetches all recipes from source groups (READ-ONLY)
 * 3. For each recipe:
 *    - Creates a new guest with generic name but real contributor name in printed_name
 *    - Translates recipe from Spanish to English using OpenAI
 *    - Copies generated images in storage
 *    - Creates new translated recipe in target group
 * 4. Ensures 100% read-only access to source data
 * 
 * Run with: npx ts-node scripts/copy-translate-recipes-to-wedding-planner.ts
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
const SOURCE_GROUP_IDS = ['79670c62-9aa9-4d75-ad9a-7a72478d6f39']; // Rocio & Victor - can add more group IDs
const TARGET_GROUP_NAME = 'Wedding Planner Edition';
const BATCH_SIZE = 5; // Process recipes in batches
const TRANSLATION_DELAY = 1000; // Delay between OpenAI calls

// Test mode - set to false to process all recipes
const TEST_MODE = false;
const TEST_RECIPE_LIMIT = 5;

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface SourceRecipe {
  id: string;
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
  image_url: string | null;
  document_urls: string[] | null;
  generated_image_url: string | null;
  upload_method: 'text' | 'audio' | 'image';
  guest_id: string;
  user_id: string;
  group_id: string | null;
  guests: {
    id: string;
    first_name: string;
    last_name: string;
    printed_name: string | null;
  } | null | Array<{
    id: string;
    first_name: string;
    last_name: string;
    printed_name: string | null;
  }>;
  recipe_print_ready: {
    recipe_name_clean: string;
    ingredients_clean: string;
    instructions_clean: string;
  } | null;
}

interface TranslatedRecipe {
  recipe_name: string;
  ingredients: string;
  instructions: string;
  comments: string | null;
}

interface GroupInfo {
  id: string;
  name: string;
  created_by: string;
}

/**
 * Extract storage path from Supabase Storage public URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/recipes/generated/{group_id}/{recipe_id}.png
 * Returns: generated/{group_id}/{recipe_id}.png
 */
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url);
    // Extract path after /recipes/
    const match = urlObj.pathname.match(/\/recipes\/(.+)$/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting storage path from URL:', url, error);
    return null;
  }
}

/**
 * Translate a recipe from Spanish to English using OpenAI
 */
async function translateRecipe(recipe: SourceRecipe): Promise<TranslatedRecipe> {
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
      model: 'gpt-4o-mini',
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
 * Find group by name
 */
async function findGroupByName(groupName: string): Promise<GroupInfo | null> {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('id, name, created_by')
    .ilike('name', groupName)
    .limit(1);

  if (error) {
    console.error(`❌ Error finding group "${groupName}":`, error);
    return null;
  }

  if (!groups || groups.length === 0) {
    console.error(`❌ Group "${groupName}" not found`);
    return null;
  }

  return {
    id: groups[0].id,
    name: groups[0].name,
    created_by: groups[0].created_by
  };
}

/**
 * Find group by ID
 */
async function findGroupById(groupId: string): Promise<GroupInfo | null> {
  const { data: group, error } = await supabase
    .from('groups')
    .select('id, name, created_by')
    .eq('id', groupId)
    .single();

  if (error) {
    console.error(`❌ Error finding group with ID "${groupId}":`, error);
    return null;
  }

  if (!group) {
    console.error(`❌ Group with ID "${groupId}" not found`);
    return null;
  }

  return {
    id: group.id,
    name: group.name,
    created_by: group.created_by
  };
}

/**
 * Fetch source recipes from a group (READ-ONLY)
 * Uses recipe_print_ready (cleaned version) if available, otherwise falls back to guest_recipes
 */
async function fetchSourceRecipes(groupId: string): Promise<SourceRecipe[]> {
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
      generated_image_url,
      upload_method,
      guest_id,
      user_id,
      group_id,
      guests (
        id,
        first_name,
        last_name,
        printed_name
      ),
      recipe_print_ready (
        recipe_name_clean,
        ingredients_clean,
        instructions_clean
      )
    `)
    .eq('group_id', groupId)
    .not('recipe_name', 'is', null)
    .not('ingredients', 'is', null)
    .not('instructions', 'is', null);

  if (error) {
    console.error('❌ Error fetching recipes:', error);
    return [];
  }

  // Handle the case where guests might be an array or single object
  // Also use recipe_print_ready (cleaned) if available, otherwise use original
  const normalizedRecipes = (recipes || []).map((recipe: any) => {
    // If guests is an array, take the first one (should only be one due to foreign key)
    const guest = Array.isArray(recipe.guests) ? recipe.guests[0] : recipe.guests;
    
    // Use cleaned version from recipe_print_ready if available, otherwise use original
    const printReady = Array.isArray(recipe.recipe_print_ready) 
      ? recipe.recipe_print_ready[0] 
      : recipe.recipe_print_ready;
    
    const recipeName = printReady?.recipe_name_clean || recipe.recipe_name;
    const ingredients = printReady?.ingredients_clean || recipe.ingredients;
    const instructions = printReady?.instructions_clean || recipe.instructions;
    
    return {
      ...recipe,
      recipe_name: recipeName,
      ingredients: ingredients,
      instructions: instructions,
      guests: guest || null,
      recipe_print_ready: printReady || null
    };
  });

  return normalizedRecipes as SourceRecipe[];
}

/**
 * Check if recipe with same name already exists in target group
 */
async function recipeExistsInTargetGroup(groupId: string, recipeName: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('guest_recipes')
    .select('id')
    .eq('group_id', groupId)
    .ilike('recipe_name', recipeName)
    .limit(1);

  if (error) {
    console.error('Error checking duplicate:', error);
    return false; // If error, proceed anyway
  }

  return (data && data.length > 0) || false;
}

/**
 * Normalize guest from array or single object to single object
 */
function normalizeGuest(guest: SourceRecipe['guests']): {
  id: string;
  first_name: string;
  last_name: string;
  printed_name: string | null;
} | null {
  if (!guest) return null;
  if (Array.isArray(guest)) {
    return guest[0] || null;
  }
  return guest;
}

/**
 * Create a new guest for a recipe
 */
async function createGuestForRecipe(
  originalGuest: SourceRecipe['guests'],
  sourceGroupId: string,
  targetGroupId: string,
  targetUserId: string,
  guestCounter: number,
  originalRecipeId: string // Add recipe ID to make email unique
): Promise<string> {
  const guest = normalizeGuest(originalGuest);
  if (!guest) {
    throw new Error('Original guest not found');
  }

  // Determine printed_name: use printed_name if exists, otherwise first_name + last_name
  const printedName = guest.printed_name 
    ? guest.printed_name
    : `${guest.first_name} ${guest.last_name}`.trim();

  // Use recipe_id in email to ensure uniqueness (constraint requires unique user_id + email + group_id)
  const uniqueEmail = `wedding-planner-example-${sourceGroupId}-${guestCounter}-${originalRecipeId.substring(0, 8)}@smallplates.com`;

  const { data: newGuest, error } = await supabase
    .from('guests')
    .insert({
      user_id: targetUserId,
      group_id: targetGroupId,
      first_name: 'Wedding Guest',
      last_name: String(guestCounter),
      printed_name: printedName,
      email: uniqueEmail,
      tags: ['wedding-planner-example'],
      source: 'manual',
      status: 'submitted',
      number_of_recipes: 1,
      recipes_received: 0
    })
    .select('id')
    .single();

  if (error || !newGuest) {
    throw new Error(`Failed to create guest: ${error?.message}`);
  }

  return newGuest.id;
}

/**
 * Copy generated image from source to target group
 */
async function copyGeneratedImage(
  sourceImageUrl: string,
  sourceGroupId: string,
  sourceRecipeId: string,
  targetGroupId: string,
  targetRecipeId: string
): Promise<string | null> {
  try {
    // Extract storage path from URL
    const sourcePath = extractStoragePath(sourceImageUrl);
    if (!sourcePath) {
      console.warn(`⚠️  Could not extract storage path from URL: ${sourceImageUrl}`);
      return null;
    }

    // Verify it's a generated image path
    if (!sourcePath.startsWith('generated/')) {
      console.warn(`⚠️  Image is not a generated image: ${sourcePath}`);
      return null;
    }

    // Extract file extension
    const fileExt = sourcePath.split('.').pop() || 'png';
    
    // Create target path
    const targetPath = `generated/${targetGroupId}/${targetRecipeId}.${fileExt}`;

    // Copy file in storage
    const { data: copyData, error: copyError } = await supabase.storage
      .from('recipes')
      .copy(sourcePath, targetPath);

    if (copyError) {
      console.error('Error copying image:', copyError);
      return null;
    }

    // Get public URL for copied image
    const { data: { publicUrl } } = supabase.storage
      .from('recipes')
      .getPublicUrl(targetPath);

    return publicUrl;
  } catch (error) {
    console.error('Error in copyGeneratedImage:', error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting recipe copy and translation to Wedding Planner Edition...\n');
  
  if (TEST_MODE) {
    console.log(`⚠️  TEST MODE: Only processing first ${TEST_RECIPE_LIMIT} recipes\n`);
  }

  // Step 1: Find target group
  console.log('🔍 Step 1: Finding target group...');
  const targetGroup = await findGroupByName(TARGET_GROUP_NAME);
  if (!targetGroup) {
    console.error('❌ Cannot proceed without target group');
    process.exit(1);
  }
  console.log(`✅ Found target group: ${targetGroup.name} (${targetGroup.id})\n`);

  // Step 2: Process each source group
  for (const sourceGroupId of SOURCE_GROUP_IDS) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📦 Processing source group ID: ${sourceGroupId}`);
    console.log('═'.repeat(60) + '\n');

    // Find source group by ID
    console.log(`🔍 Finding source group by ID...`);
    const sourceGroup = await findGroupById(sourceGroupId);
    if (!sourceGroup) {
      console.error(`❌ Source group with ID "${sourceGroupId}" not found. Skipping.\n`);
      continue;
    }
    console.log(`✅ Found source group: ${sourceGroup.name} (${sourceGroup.id})\n`);

    // Fetch source recipes (READ-ONLY)
    console.log('🔍 Fetching source recipes (READ-ONLY)...');
    const allRecipes = await fetchSourceRecipes(sourceGroup.id);
    const recipes = TEST_MODE 
      ? allRecipes.slice(0, TEST_RECIPE_LIMIT)
      : allRecipes;
    
    console.log(`✅ Found ${allRecipes.length} total recipes`);
    if (TEST_MODE) {
      console.log(`   Processing ${recipes.length} recipes in test mode\n`);
    } else {
      console.log(`   Processing all ${recipes.length} recipes\n`);
    }

    if (recipes.length === 0) {
      console.log('⚠️  No recipes to process. Skipping.\n');
      continue;
    }

    // Process recipes
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let guestCounter = 1;

    console.log('─'.repeat(60));
    console.log('🔄 Starting translation and duplication...\n');

    for (let i = 0; i < recipes.length; i += BATCH_SIZE) {
      const batch = recipes.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(recipes.length / BATCH_SIZE);

      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} recipes)`);

      // Process batch
      for (const recipe of batch) {
        const globalIdx = i + batch.indexOf(recipe) + 1;
        const progress = `[${globalIdx}/${recipes.length}]`;

        try {
          console.log(`\n${progress} 🔄 Processing: "${recipe.recipe_name.substring(0, 40)}..."`);

          // Check for duplicates
          const translatedNamePreview = recipe.recipe_name; // We'll check after translation
          // For now, skip duplicate check by name - we'll do it after translation
          
          // Get original guest info
          const originalGuest = normalizeGuest(recipe.guests);
          if (!originalGuest) {
            console.log(`${progress} ⚠️  No guest info found. Skipping.`);
            skippedCount++;
            continue;
          }

          // Translate recipe
          console.log(`    🌐 Translating...`);
          const translated = await translateRecipe(recipe);
          console.log(`    ✅ Translated: "${translated.recipe_name.substring(0, 40)}..."`);

          // Check for duplicates with translated name
          const exists = await recipeExistsInTargetGroup(targetGroup.id, translated.recipe_name);
          if (exists) {
            console.log(`${progress} ⏭️  Duplicate found. Skipping.`);
            skippedCount++;
            continue;
          }

          // Create new guest
          console.log(`    👤 Creating guest...`);
          const newGuestId = await createGuestForRecipe(
            recipe.guests,
            sourceGroup.id,
            targetGroup.id,
            targetGroup.created_by,
            guestCounter,
            recipe.id // Pass original recipe ID to ensure unique email
          );
          console.log(`    ✅ Guest created: Wedding Guest ${guestCounter} (${originalGuest.printed_name || `${originalGuest.first_name} ${originalGuest.last_name}`})`);
          guestCounter++;

          // Create new recipe first to get new recipe_id
          // Use both group_id (for direct relationship) AND group_recipes (for admin filters)
          const { data: newRecipe, error: recipeError } = await supabase
            .from('guest_recipes')
            .insert({
              guest_id: newGuestId,
              user_id: targetGroup.created_by,
              group_id: targetGroup.id, // Set group_id for direct relationship
              recipe_name: translated.recipe_name,
              ingredients: translated.ingredients,
              instructions: translated.instructions,
              comments: translated.comments,
              image_url: recipe.image_url, // Keep original if exists
              document_urls: null, // Don't copy document_urls
              upload_method: recipe.upload_method || 'text',
              submission_status: 'submitted',
              submitted_at: new Date().toISOString(),
              source: 'manual'
            })
            .select('id')
            .single();

          if (recipeError || !newRecipe) {
            console.log(`${progress} ❌ Recipe insert error: ${recipeError?.message}`);
            errorCount++;
            continue;
          }

          console.log(`    ✅ Recipe created: ${newRecipe.id}`);

          // Add recipe to group using group_recipes join table (needed for admin filters)
          console.log(`    🔗 Adding recipe to group_recipes...`);
          const { error: groupRecipeError } = await supabase
            .from('group_recipes')
            .insert({
              group_id: targetGroup.id,
              recipe_id: newRecipe.id,
              added_by: targetGroup.created_by
            });

          if (groupRecipeError) {
            console.log(`${progress} ⚠️  Warning: Could not add recipe to group_recipes: ${groupRecipeError.message}`);
            // Continue anyway - recipe was created with group_id, but won't appear in admin filters
          } else {
            console.log(`    ✅ Recipe added to group_recipes`);
          }

          // Copy generated image if exists
          let newGeneratedImageUrl: string | null = null;
          if (recipe.generated_image_url) {
            console.log(`    🖼️  Copying generated image...`);
            newGeneratedImageUrl = await copyGeneratedImage(
              recipe.generated_image_url,
              sourceGroup.id,
              recipe.id,
              targetGroup.id,
              newRecipe.id
            );

            if (newGeneratedImageUrl) {
              // Update recipe with new image URL
              await supabase
                .from('guest_recipes')
                .update({ generated_image_url: newGeneratedImageUrl })
                .eq('id', newRecipe.id);
              console.log(`    ✅ Image copied`);
            } else {
              console.log(`    ⚠️  Could not copy image`);
            }
          }

          console.log(`${progress} ✅ Complete!`);
          successCount++;

          // Small delay between recipes
          await delay(500);

        } catch (err) {
          console.log(`${progress} ❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
          errorCount++;
        }
      }

      // Delay between batches
      if (i + BATCH_SIZE < recipes.length) {
        console.log(`\n⏳ Waiting ${TRANSLATION_DELAY}ms before next batch...`);
        await delay(TRANSLATION_DELAY);
      }
    }

    // Summary for this source group
    console.log('\n' + '═'.repeat(60));
    console.log(`📊 SUMMARY for "${sourceGroup.name}"`);
    console.log('═'.repeat(60));
    console.log(`✅ Success: ${successCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total processed: ${recipes.length}`);
    console.log(`🎯 Target group: ${TARGET_GROUP_NAME}`);
  }

  // Final summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 ALL GROUPS PROCESSED');
  console.log('═'.repeat(60));
  if (TEST_MODE) {
    console.log('⚠️  This was a TEST RUN. Set TEST_MODE = false to process all recipes.');
  }
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
