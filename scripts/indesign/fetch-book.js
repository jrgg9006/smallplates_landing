// scripts/indesign/fetch-book.js
// Script unificado para extraer TODOS los datos del libro de Supabase
// Combina: fetch-recipes.js + fetch-book-data.js
// Output: Un solo JSON + carpeta de imágenes
// TO RUN: node scripts/indesign/fetch-book.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: No se encontraron las credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// CONFIGURACIÓN - Cambiar el group_id aquí
// ============================================
const GROUP_ID = '2001e7f6-0204-4d4e-8b23-19f22d7f9739';
// ============================================

// ============================================
// CONFIGURACIÓN - Directorio de salida
// ============================================
const CUSTOM_OUTPUT_BASE = '/Users/macbook/Desktop/SmallPlates_Books/02_Interior';
// ============================================

// ============================================
// FUNCIÓN PARA DESCARGAR IMAGEN
// ============================================
async function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlink(destPath, () => {});
        downloadImage(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================
async function fetchBook() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  📖 SMALL PLATES — Book Data Fetcher (Unified)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`🔄 Conectando a Supabase...`);
  console.log(`📚 Grupo: ${GROUP_ID}`);
  console.log('');

  // ============================================
  // PARTE 1: DATOS DEL GRUPO (pareja)
  // ============================================
  console.log('── PASO 1: Datos de la pareja ──');
  
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('couple_first_name, partner_first_name, couple_display_name, wedding_date')
    .eq('id', GROUP_ID)
    .single();

  if (groupError) {
    console.error('❌ Error al obtener grupo:', groupError.message);
    process.exit(1);
  }

  const coupleDisplayName = group.couple_display_name ||
    `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

  console.log(`   💑 ${coupleDisplayName}`);
  console.log('');

  // ============================================
  // PARTE 2: CONTRIBUTORS — se deriva de las recetas más adelante
  // (después de PARTE 4, para incluir a cualquier persona con receta
  // en el libro, ya sea guest, capitán u owner)
  // ============================================

  // ============================================
  // PARTE 3: OWNERS + CAPTAINS
  // ============================================
  console.log('── PASO 3: Owners & Captains ──');

  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('role, profiles!group_members_profile_id_fkey (full_name, email)')
    .eq('group_id', GROUP_ID)
    .in('role', ['owner', 'member']);

  if (membersError) {
    console.error('❌ Error al obtener members:', membersError.message);
    process.exit(1);
  }

  const ownerList = members
    .filter(m => m.role === 'owner')
    .map(m => m.profiles?.full_name || m.profiles?.email || 'Sin nombre');

  const captainList = members
    .filter(m => m.role === 'member')
    .map(m => m.profiles?.full_name || m.profiles?.email || 'Sin nombre');

  console.log(`   👑 ${ownerList.length} owners`);
  console.log(`   🎖️  ${captainList.length} captains`);
  console.log('');

  // ============================================
  // PARTE 4: RECETAS + IMÁGENES
  // ============================================
  console.log('── PASO 4: Recetas ──');

  // Get active recipe IDs from group_recipes (source of truth for group membership)
  const { data: activeGroupRecipes, error: grError } = await supabase
    .from('group_recipes')
    .select('recipe_id')
    .eq('group_id', GROUP_ID)
    .is('removed_at', null);

  if (grError) {
    console.error('❌ Error al obtener group_recipes:', grError.message);
    process.exit(1);
  }

  const activeRecipeIds = (activeGroupRecipes || []).map(gr => gr.recipe_id);

  if (activeRecipeIds.length === 0) {
    console.log('⚠️ No se encontraron recetas activas para este grupo.');
    process.exit(0);
  }

  const { data: recipes, error: recipesError } = await supabase
    .from('guest_recipes')
    .select(`
      id,
      recipe_name,
      comments,
      ingredients,
      instructions,
      generated_image_url,
      generated_image_url_print,
      image_upscale_status,
      guest_id,
      guests (
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
    .in('id', activeRecipeIds)
    .is('deleted_at', null)
    .order('recipe_name');

  if (recipesError) {
    console.error('❌ Error al obtener recetas:', recipesError.message);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log('⚠️ No se encontraron recetas para este grupo.');
    process.exit(0);
  }

  console.log(`   🍽️  ${recipes.length} recetas encontradas`);

  // Contar versiones limpias
  let recipesWithCleanVersion = 0;
  for (const recipe of recipes) {
    const printReady = Array.isArray(recipe.recipe_print_ready)
      ? recipe.recipe_print_ready[0] || null
      : recipe.recipe_print_ready || null;
    if (printReady) recipesWithCleanVersion++;
  }
  if (recipesWithCleanVersion > 0) {
    console.log(`   ✨ ${recipesWithCleanVersion} con versión limpia`);
  }

  // Crear directorios
  const outputBaseDir = CUSTOM_OUTPUT_BASE || path.resolve(__dirname, 'output');
  const dataDir = path.join(outputBaseDir, 'data');
  const imagesDir = path.join(outputBaseDir, 'image_assets', GROUP_ID);
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // ============================================
  // PARTE 5: DESCARGAR IMÁGENES
  // ============================================
  console.log('');
  console.log('── PASO 5: Descargando imágenes ──');

  const transformedRecipes = [];
  let downloadedPrint = 0;
  let downloadedOriginal = 0;
  let downloadFailed = 0;
  const recipesWithOriginalFallback = [];

  for (const recipe of recipes) {
    const guest = recipe.guests;
    const guestName = guest?.printed_name || 
                      `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
                      'Anónimo';

    const printReady = Array.isArray(recipe.recipe_print_ready)
      ? recipe.recipe_print_ready[0] || null
      : recipe.recipe_print_ready || null;

    const transformed = {
      id: recipe.id,
      recipe_name: printReady?.recipe_name_clean || recipe.recipe_name || '',
      guest_name: guestName,
      comments: recipe.comments || '',
      ingredients: printReady?.ingredients_clean || recipe.ingredients || '',
      instructions: printReady?.instructions_clean || recipe.instructions || '',
      local_image_path: null,
      image_source: null
    };

    // Priorizar print-ready, fallback a original
    const imageUrlToUse = recipe.generated_image_url_print || recipe.generated_image_url;
    const imageSource = recipe.generated_image_url_print ? 'print' : 'original';

    if (imageUrlToUse) {
      try {
        const urlParts = imageUrlToUse.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'png';
        
        const imageFileName = `${recipe.id}.${extension}`;
        const localImagePath = path.join(imagesDir, imageFileName);
        
        const sourceLabel = imageSource === 'print' ? '🖨️' : '⚠️';
        process.stdout.write(`   ${sourceLabel} ${recipe.recipe_name}... `);
        
        await downloadImage(imageUrlToUse, localImagePath);
        
        transformed.local_image_path = `image_assets/${GROUP_ID}/${imageFileName}`;
        transformed.image_source = imageSource;
        
        if (imageSource === 'print') {
          downloadedPrint++;
          console.log('✅ (print-ready)');
        } else {
          downloadedOriginal++;
          recipesWithOriginalFallback.push(recipe.recipe_name);
          console.log('⚠️ (original)');
        }
      } catch (err) {
        downloadFailed++;
        console.log(`❌ Error: ${err.message}`);
      }
    }

    transformedRecipes.push(transformed);
  }

  // ============================================
  // PARTE 2b: CONTRIBUTORS (derivados de las recetas del libro)
  // Cualquier persona con receta es contributor, sin importar
  // si también es capitán u owner
  // ============================================
  console.log('');
  console.log('── PASO 2: Contributors (desde recetas) ──');

  // Deduplicate by normalized name (trim whitespace, collapse multiple spaces)
  const contributorSet = new Set();
  const contributorList = [];
  for (const recipe of transformedRecipes) {
    const name = (recipe.guest_name || '').replace(/\s+/g, ' ').trim();
    if (name && !contributorSet.has(name)) {
      contributorSet.add(name);
      contributorList.push(name);
    }
  }
  contributorList.sort((a, b) => a.localeCompare(b));

  console.log(`   👥 ${contributorList.length} contributors`);
  console.log('');

  // ============================================
  // PARTE 6: GENERAR JSON UNIFICADO
  // ============================================
  const bookData = {
    // Metadata
    group_id: GROUP_ID,
    generated_at: new Date().toISOString(),
    
    // Datos de la pareja (para personalizar pp. 6-9)
    couple: {
      couple_first_name: group.couple_first_name || '',
      partner_first_name: group.partner_first_name || '',
      couple_display_name: coupleDisplayName,
      wedding_date: group.wedding_date || null
    },

    // Contributors (para p. 8 count + p. 56 lista)
    contributors: {
      count: contributorList.length,
      list: contributorList
    },

    // Captains (para p. 57 special thanks)
    captains: {
      count: captainList.length,
      list: captainList
    },

    // Owners
    owners: {
      count: ownerList.length,
      list: ownerList
    },

    // Recetas (para la zona dinámica)
    recipes: transformedRecipes
  };

  // Guardar JSON — nombre legible con nombres de los novios
  const coupleName = `${(group.couple_first_name || '').trim()}y${(group.partner_first_name || '').trim()}`
    .replace(/\s+/g, '');
  const outputFileName = `book.${coupleName}.json`;
  const outputPath = path.join(dataDir, outputFileName);
  fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2), 'utf8');

  // ============================================
  // RESUMEN FINAL
  // ============================================
  const recipesWithoutImages = transformedRecipes.filter(r => !r.local_image_path).length;

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅ ¡LIBRO LISTO PARA GENERAR!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  💑 Pareja: ${bookData.couple.couple_display_name}`);
  console.log(`  👥 Contributors: ${bookData.contributors.count}`);
  console.log(`  🎖️  Captains: ${bookData.captains.count}`);
  console.log(`  🍽️  Recetas: ${bookData.recipes.length}`);
  console.log('');
  console.log('  📷 Imágenes:');
  console.log(`     🖨️  ${downloadedPrint} print-ready`);
  if (downloadedOriginal > 0) {
    console.log(`     ⚠️  ${downloadedOriginal} originales (sin upscale)`);
  }
  if (downloadFailed > 0) {
    console.log(`     ❌ ${downloadFailed} fallidas`);
  }
  if (recipesWithoutImages > 0) {
    console.log(`     ⛔ ${recipesWithoutImages} sin imagen`);
  }
  
  if (recipesWithOriginalFallback.length > 0) {
    console.log('');
    console.log('  ⚠️  Sin imagen print-ready (usaron original):');
    for (const name of recipesWithOriginalFallback) {
      console.log(`     • ${name}`);
    }
  }

  // Contributor names para verificación
  console.log('');
  console.log(`  📋 Contributors (${contributorList.length}):`);
  for (const name of contributorList) {
    console.log(`     ${name}`);
  }

  if (captainList.length > 0) {
    console.log('');
    console.log(`  🎖️  Captains (${captainList.length}):`);
    for (const name of captainList) {
      console.log(`     ${name}`);
    }
  }

  console.log('');
  console.log(`  📁 JSON: ${outputPath}`);
  console.log(`  📂 Imágenes: ${imagesDir}`);
  console.log('');
  console.log('  👉 Siguiente paso: Abrir SmallPlates_MasterTemplate_v1.indd');
  console.log('     y correr generate-book.jsx');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

fetchBook().catch(console.error);