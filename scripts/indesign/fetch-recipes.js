// scripts/indesign/fetch-recipes.js
// Script para extraer recetas de Supabase y generar JSON para InDesign

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
const GROUP_ID = '2001e7f6-0204-4d4e-8b23-19f22d7f9739';
// ============================================

async function fetchRecipes() {
  console.log('🔄 Conectando a Supabase...');
  console.log(`📚 Buscando recetas del grupo: ${GROUP_ID}`);

  // Obtener recetas con información del guest
  const { data: recipes, error: recipesError } = await supabase
    .from('guest_recipes')
    .select(`
      recipe_name,
      comments,
      ingredients,
      instructions,
      guest_id,
      guests (
        first_name,
        last_name,
        printed_name
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

  // Transformar datos para InDesign
  const transformedRecipes = recipes.map((recipe, index) => {
    // Lógica: usar printed_name si existe, sino concatenar first_name + last_name
    const guest = recipe.guests;
    const guestName = guest?.printed_name || 
                      `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() ||
                      'Anónimo';

    return {
      recipe_name: recipe.recipe_name || '',
      guest_name: guestName,
      comments: recipe.comments || '',
      ingredients: recipe.ingredients || '',
      instructions: recipe.instructions || ''
    };
  });

  // Guardar JSON con group_id en el nombre
  const outputDir = path.resolve(__dirname, 'output');
  const outputFileName = `recipes.${GROUP_ID}.json`;
  const outputPath = path.join(outputDir, outputFileName);

  // Crear carpeta output si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(transformedRecipes, null, 2), 'utf8');

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ ¡Listo! ${transformedRecipes.length} recetas exportadas`);
  console.log(`📁 Archivo: ${outputFileName}`);
  console.log(`📂 Ruta: ${outputPath}`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Próximo paso: Usar este JSON en InDesign');
}

// Ejecutar
fetchRecipes().catch(console.error);