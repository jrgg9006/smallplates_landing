// scripts/indesign/fetch-recipes.js
// Script para extraer recetas de Supabase y generar JSON para InDesign
// v2 - Con descarga de imágenes

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: No se encontraron las credenciales de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// CONFIGURACIÓN - Cambiar el group_id aquí
// ============================================
const GROUP_ID = 'da1ff076-b5a4-4a07-8296-3dbedea67f48';
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
async function fetchRecipes() {
  console.log('🔄 Conectando a Supabase...');
  console.log(`📚 Buscando recetas del grupo: ${GROUP_ID}`);

  const { data: recipes, error: recipesError } = await supabase
    .from('guest_recipes')
    .select(`
      id,
      recipe_name,
      comments,
      ingredients,
      instructions,
      generated_image_url,
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
    .eq('group_id', GROUP_ID)
    .order('recipe_name');

  if (recipesError) {
    console.error('❌ Error al obtener recetas:', recipesError.message);
    process.exit(1);
  }

  if (!recipes || recipes.length === 0) {
    console.log('⚠️ No se encontraron recetas para este grupo.');
    process.exit(0);
  }

  console.log(`✅ Se encontraron ${recipes.length} recetas`);

  // Contar recetas con versión limpia
  let recipesWithCleanVersion = 0;
  for (const recipe of recipes) {
    const printReady = Array.isArray(recipe.recipe_print_ready)
      ? recipe.recipe_print_ready[0] || null
      : recipe.recipe_print_ready || null;
    if (printReady) recipesWithCleanVersion++;
  }
  if (recipesWithCleanVersion > 0) {
    console.log(`✨ ${recipesWithCleanVersion} recetas tienen versión limpia disponible`);
  }

  // Crear directorios
  const outputDir = path.resolve(__dirname, 'output');
  const imagesDir = path.join(outputDir, 'images', GROUP_ID);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  console.log('');
  console.log('📷 Procesando imágenes...');

  const transformedRecipes = [];

  for (const recipe of recipes) {
    const guest = recipe.guests;
    const guestName = guest?.printed_name || 
                      `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
                      'Anónimo';

    // Manejar recipe_print_ready - puede ser array o objeto único dependiendo de la versión de Supabase
    const printReady = Array.isArray(recipe.recipe_print_ready)
      ? recipe.recipe_print_ready[0] || null
      : recipe.recipe_print_ready || null;

    const transformed = {
      id: recipe.id,
      // Usar versión limpia si existe, sino la original
      recipe_name: printReady?.recipe_name_clean || recipe.recipe_name || '',
      guest_name: guestName,
      comments: recipe.comments || '',
      // Usar versión limpia si existe, sino la original
      ingredients: printReady?.ingredients_clean || recipe.ingredients || '',
      // Usar versión limpia si existe, sino la original
      instructions: printReady?.instructions_clean || recipe.instructions || '',
      generated_image_url: recipe.generated_image_url || null,
      local_image_path: null
    };

    if (recipe.generated_image_url) {
      try {
        const urlParts = recipe.generated_image_url.split('.');
        const extension = urlParts[urlParts.length - 1].split('?')[0] || 'png';
        
        const imageFileName = `${recipe.id}.${extension}`;
        const localImagePath = path.join(imagesDir, imageFileName);
        
        process.stdout.write(`  📷 ${recipe.recipe_name}... `);
        await downloadImage(recipe.generated_image_url, localImagePath);
        
        transformed.local_image_path = `images/${GROUP_ID}/${imageFileName}`;
        console.log('✅');
      } catch (err) {
        console.log(`⚠️ Error: ${err.message}`);
      }
    }

    transformedRecipes.push(transformed);
  }

  // Guardar JSON
  const outputFileName = `recipes.${GROUP_ID}.json`;
  const outputPath = path.join(outputDir, outputFileName);

  fs.writeFileSync(outputPath, JSON.stringify(transformedRecipes, null, 2), 'utf8');

  const imagesDownloaded = transformedRecipes.filter(r => r.local_image_path).length;
  const recipesWithoutImages = transformedRecipes.filter(r => !r.local_image_path).length;

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ ¡Listo! ${transformedRecipes.length} recetas exportadas`);
  console.log(`📷 ${imagesDownloaded} imágenes descargadas`);
  if (recipesWithoutImages > 0) {
    console.log(`⚠️  ${recipesWithoutImages} recetas sin imagen`);
  }
  console.log(`📁 Archivo: ${outputFileName}`);
  console.log(`📂 Ruta: ${outputPath}`);
  console.log('═══════════════════════════════════════════');
}

fetchRecipes().catch(console.error);