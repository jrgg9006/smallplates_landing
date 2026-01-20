/**
 * Fix Ingredients Capitalization Script
 * 
 * Reads ingredients_clean from recipe_print_ready,
 * sends to AI for capitalization fix only,
 * updates the same column.
 * 
 * Run with: npx ts-node scripts/fix-ingredients-caps.ts
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

// Delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fixIngredientCaps(ingredients: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // Cheaper model, sufficient for this task
    messages: [
      {
        role: 'system',
        content: 'You are an editorial assistant. Fix capitalization ONLY. Change nothing else. Preserve EXACT formatting, spacing, punctuation, and structure.'
      },
      {
        role: 'user',
        content: `Fix the capitalization of these ingredients for a printed cookbook.

CAPITALIZATION RULES:
- If line starts with a LETTER → First letter UPPERCASE, rest lowercase (e.g., "Pechugas de pollo")
- If line starts with a NUMBER or FRACTION (½, ¼, 1, 2, etc.) → First letter after the number must be LOWERCASE (e.g., "4 huevos", "½ taza de harina")
- PRESERVE brand names and proper nouns (e.g., "Bragg's Liquid Aminos", "Queso Oaxaca", "Vino Rioja")

CRITICAL - PRESERVE EXACTLY (DO NOT CHANGE):
- All whitespace (spaces, tabs, multiple spaces) - keep EXACT same spacing
- All line breaks - same number of lines, same line breaks
- All punctuation marks - commas, periods, hyphens, etc.
- All special characters - Unicode, fractions (½, ¼), symbols
- All spelling - do NOT correct spelling errors
- Line order - keep ingredients in same order
- Line structure - do NOT add or remove lines
- Character count - should remain very similar (only letter case changes)

INGREDIENTS:
${ingredients}

Return ONLY the corrected ingredients with EXACT same formatting and structure, one per line, nothing else.`
      }
    ],
    temperature: 0.1,
    max_tokens: 2000
  });

  return response.choices[0].message.content?.trim() || ingredients;
}

/**
 * Validates that the fixed ingredients only changed capitalization
 * Returns true if safe to proceed, false if suspicious changes detected
 */
function validateOnlyCapsChanged(original: string, fixed: string): { isValid: boolean; reason?: string } {
  const originalLines = original.split('\n');
  const fixedLines = fixed.split('\n');

  // Check line count matches
  if (originalLines.length !== fixedLines.length) {
    return { 
      isValid: false, 
      reason: `Line count changed: ${originalLines.length} → ${fixedLines.length}` 
    };
  }

  // Check if character count is very different (more than 20% difference suggests content changed)
  const lengthDiff = Math.abs(original.length - fixed.length);
  const lengthPercentDiff = (lengthDiff / original.length) * 100;
  if (lengthPercentDiff > 20) {
    return { 
      isValid: false, 
      reason: `Length changed significantly: ${original.length} → ${fixed.length} chars (${lengthPercentDiff.toFixed(1)}% diff)` 
    };
  }

  // Check if any line structure changed dramatically (compare non-whitespace, non-case content)
  for (let i = 0; i < originalLines.length; i++) {
    const origNormalized = originalLines[i].replace(/[a-zA-Z]/g, '').replace(/\s/g, '');
    const fixedNormalized = fixedLines[i].replace(/[a-zA-Z]/g, '').replace(/\s/g, '');
    
    if (origNormalized !== fixedNormalized) {
      return { 
        isValid: false, 
        reason: `Line ${i + 1} structure changed (punctuation/symbols modified)` 
      };
    }
  }

  return { isValid: true };
}

async function main() {
  console.log('🔧 Starting ingredient capitalization fix...\n');

  // Get all records from recipe_print_ready
  const { data: records, error } = await supabase
    .from('recipe_print_ready')
    .select('id, recipe_id, recipe_name_clean, ingredients_clean')
    .not('ingredients_clean', 'is', null);

  if (error) {
    console.error('❌ Error fetching records:', error);
    return;
  }

  console.log(`📋 Found ${records?.length || 0} recipes to process\n`);
  console.log('─'.repeat(60));

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < (records?.length || 0); i++) {
    const record = records![i];
    const progress = `[${i + 1}/${records!.length}]`;

    if (!record.ingredients_clean || record.ingredients_clean.trim() === '') {
      console.log(`${progress} ⏭️  Skipping "${record.recipe_name_clean?.substring(0, 30)}" - no ingredients`);
      skippedCount++;
      continue;
    }

    console.log(`\n${progress} 🔄 Fixing: ${record.recipe_name_clean?.substring(0, 40) || 'Unnamed'}...`);

    try {
      // Show before
      const firstLineBefore = record.ingredients_clean.split('\n')[0] || '';
      console.log(`    📝 Before: "${firstLineBefore.substring(0, 50)}..."`);

      // Fix capitalization
      const fixedIngredients = await fixIngredientCaps(record.ingredients_clean);

      // Validate that only capitalization changed
      const validation = validateOnlyCapsChanged(record.ingredients_clean, fixedIngredients);
      
      if (!validation.isValid) {
        console.log(`${progress} ⚠️  VALIDATION FAILED: ${validation.reason}`);
        console.log(`    ⏭️  Skipping update - keeping original to prevent data loss`);
        skippedCount++;
        continue;
      }

      // Show after
      const firstLineAfter = fixedIngredients.split('\n')[0] || '';
      console.log(`    ✨ After:  "${firstLineAfter.substring(0, 50)}..."`);

      // Update database
      const { error: updateError } = await supabase
        .from('recipe_print_ready')
        .update({
          ingredients_clean: fixedIngredients,
          updated_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      if (updateError) {
        console.log(`${progress} ❌ DB Error: ${updateError.message}`);
        errorCount++;
        continue;
      }

      console.log(`${progress} ✅ Fixed!`);
      successCount++;

    } catch (err) {
      console.log(`${progress} ❌ Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      errorCount++;
    }

    // Wait between requests
    await delay(1000); // Shorter delay since we're using gpt-4o-mini
  }

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FIX COMPLETE');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📋 Total: ${records?.length || 0}`);
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