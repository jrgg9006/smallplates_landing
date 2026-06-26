// scripts/indesign/fetch-book_v2.js
// Script unificado para extraer TODOS los datos del libro de Supabase.
// v2 (jun 2026): añade la sección "Originals" (M3). Por cada receta con filas
// 'ready' en recipe_annex_images, baja print_url (fallback original_url) a
// image_assets/{group}/annex/ y agrega un bloque annex_images al JSON, por receta.
// CERO-REGRESIÓN: si ninguna receta tiene originals, el JSON es idéntico a fetch-book.js.
// Output: Un solo JSON + carpeta de imágenes
// TO RUN: node scripts/indesign/fetch-book_v2.js <GROUP_ID>

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const QRCode = require('qrcode');

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
// CONFIGURACIÓN - Group ID desde argumento o hardcoded
// Uso: node scripts/indesign/fetch-book_v2.js <GROUP_ID>
// ============================================
const GROUP_ID = process.argv[2] || '79670c62-9aa9-4d75-ad9a-7a72478d6f39';

if (!process.argv[2]) {
  console.log('⚠️  No se pasó GROUP_ID como argumento, usando el hardcoded.');
  console.log('   Uso: node scripts/indesign/fetch-book_v2.js <GROUP_ID>');
  console.log('');
}
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
  console.log('  📖 SMALL PLATES — Book Data Fetcher v2 (Originals)');
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
    .select('couple_first_name, partner_first_name, couple_display_name, wedding_date, couple_image_url, print_couple_name')
    .eq('id', GROUP_ID)
    .single();

  if (groupError) {
    console.error('❌ Error al obtener grupo:', groupError.message);
    process.exit(1);
  }

  const coupleDisplayName = group.print_couple_name || group.couple_display_name ||
    `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

  console.log(`   💑 ${coupleDisplayName}`);
  if (group.couple_image_url) {
    console.log(`   📷 Couple image: yes`);
  } else {
    console.log(`   ⚠️  Couple image: none`);
  }
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

  // ============================================
  // PARTE 4-ANNEX: ORIGINALS LISTOS PARA EL ANEXO (M3)
  // Reason: replica lib/annex/pipeline.ts. Solo filas 'ready'. Si no hay ninguna,
  // el plan queda vacío → ninguna receta lleva annex_images → JSON idéntico a v1.
  // ============================================
  const { data: annexRows } = await supabase
    .from('recipe_annex_images')
    .select('recipe_id, position, print_url, original_url, upscale_status')
    .eq('group_id', GROUP_ID)
    .eq('upscale_status', 'ready');

  const annexByRecipe = new Map();   // recipeId -> [{ local_image_path, position }]
  const annexDownloads = [];          // [{ url, localImagePath }]
  const annexUsable = (annexRows || [])
    .filter(r => r.upscale_status === 'ready' && (r.print_url || r.original_url))
    .sort((a, b) => (a.recipe_id < b.recipe_id ? -1 : a.recipe_id > b.recipe_id ? 1 : a.position - b.position));
  for (const row of annexUsable) {
    const url = row.print_url || row.original_url;
    const localImagePath = `image_assets/${GROUP_ID}/annex/${row.recipe_id}_${row.position}.png`;
    const block = { local_image_path: localImagePath, position: row.position };
    if (annexByRecipe.has(row.recipe_id)) annexByRecipe.get(row.recipe_id).push(block);
    else annexByRecipe.set(row.recipe_id, [block]);
    annexDownloads.push({ url, localImagePath });
  }
  if (annexDownloads.length > 0) {
    console.log(`   📎 ${annexDownloads.length} originals para el anexo (${annexByRecipe.size} recetas)`);
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
  // PARTE 4b: DESCARGAR COUPLE IMAGE
  // ============================================
  let coupleImageLocalPath = null;

  if (group.couple_image_url) {
    console.log('── PASO 4b: Couple image ──');
    try {
      const urlParts = group.couple_image_url.split('.');
      const extension = urlParts[urlParts.length - 1].split('?')[0] || 'jpg';
      const coupleImageFileName = `couple_image.${extension}`;
      const coupleImageDest = path.join(imagesDir, coupleImageFileName);

      process.stdout.write(`   📷 Descargando couple image... `);
      await downloadImage(group.couple_image_url, coupleImageDest);
      coupleImageLocalPath = `image_assets/${GROUP_ID}/${coupleImageFileName}`;
      console.log('✅');
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
    console.log('');
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

    // Reason: omitir la clave cuando la receta no tiene originals, para que el JSON
    // sea idéntico al de v1 en libros sin anexo (cero-regresión).
    const annexImages = annexByRecipe.get(recipe.id);
    if (annexImages) transformed.annex_images = annexImages;

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
  // PARTE 5b: DESCARGAR ORIGINALS DEL ANEXO (M3)
  // Reason: bajan a image_assets/{group}/annex/ con el mismo nombre que el JSON
  // referencia (local_image_path). Solo corre si hay originals 'ready'.
  // ============================================
  if (annexDownloads.length > 0) {
    console.log('');
    console.log('── PASO 5b: Originals (anexo) ──');
    const annexDir = path.join(imagesDir, 'annex');
    if (!fs.existsSync(annexDir)) {
      fs.mkdirSync(annexDir, { recursive: true });
    }
    let annexOk = 0;
    let annexFail = 0;
    for (const dl of annexDownloads) {
      const fileName = path.basename(dl.localImagePath);
      const dest = path.join(annexDir, fileName);
      try {
        process.stdout.write(`   📎 ${fileName}... `);
        await downloadImage(dl.url, dest);
        annexOk++;
        console.log('✅');
      } catch (err) {
        annexFail++;
        console.log(`❌ Error: ${err.message}`);
      }
    }
    console.log(`   📎 ${annexOk} originals descargados${annexFail > 0 ? `, ${annexFail} fallidos` : ''}`);
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

  // Reason: las URLs de los QR se calculan aquí (no en PARTE 6/6b) para que
  // queden persistidas en el JSON. generate-book_v13.jsx las lee y las muestra
  // en el alert final, así puedes verificar a dónde apunta cada QR sin tener
  // que escanear.
  const SITE_URL = process.env.QR_SITE_URL || 'https://smallplatesandcompany.com';
  const qrUrl = `${SITE_URL}/from-the-book?b=${GROUP_ID}&utm_source=book&utm_medium=qr&utm_campaign=from_the_book`;
  const repurchaseUrl = `${SITE_URL}/copy/${GROUP_ID}`;

  const bookData = {
    // Metadata
    group_id: GROUP_ID,
    generated_at: new Date().toISOString(),
    qr_urls: {
      from_the_book: qrUrl,
      repurchase: repurchaseUrl
    },

    // Datos de la pareja (para personalizar pp. 6-9)
    couple: {
      couple_first_name: group.couple_first_name || '',
      partner_first_name: group.partner_first_name || '',
      couple_display_name: coupleDisplayName,
      wedding_date: group.wedding_date || null,
      local_image_path: coupleImageLocalPath
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
  if (annexDownloads.length > 0) {
    console.log(`  📎 Originals (anexo): ${annexDownloads.length} en ${annexByRecipe.size} recetas`);
  }
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

  // ============================================
  // PARTE 6: GENERAR QR CODE PARA "FROM THE BOOK"
  // Razón: la última página del libro lleva un QR que apunta a /from-the-book
  // con el GROUP_ID en query param para tracking por libro. El template de
  // InDesign tiene un placeholder {{QR_IMAGE}} que generate-book_v11.jsx llena
  // automáticamente con esta imagen.
  // ============================================
  console.log('── PASO 6: QR Code (from-the-book) ──');

  // Reason: SITE_URL/qrUrl/repurchaseUrl ya se calcularon arriba (en PARTE 6,
  // antes de bookData) para que vivan en el JSON. Aquí solo los usamos.
  // QR_SITE_URL puede overridear el host para staging si hace falta.
  const qrPath = path.join(imagesDir, `qr.${GROUP_ID}.png`);

  try {
    await QRCode.toFile(qrPath, qrUrl, {
      errorCorrectionLevel: 'H', // 30% redundancia — soporta manchas / desgaste
      width: 1200,                // alta resolución para impresión
      margin: 2,                  // quiet zone — crítico para escaneabilidad
      color: { dark: '#2D2D2D', light: '#FFFFFF' }, // brand charcoal sobre blanco
    });
    console.log(`   ✅ QR generado`);
    console.log(`   🔗 ${qrUrl}`);
    console.log(`   📂 ${qrPath}`);
  } catch (qrErr) {
    console.error(`   ❌ Error al generar QR:`, qrErr.message);
  }

  // ============================================
  // PARTE 6b: GENERAR QR CODE PARA RECOMPRA
  // Razón: el último spread también lleva un QR pequeño en la página izquierda
  // que apunta a /copy/<GROUP_ID> — la página pública de recompra de ESE libro.
  // El GROUP_ID viene del mismo libro que se está generando, así que es
  // matemáticamente imposible que un libro lleve el QR de otra pareja.
  // generate-book_v13.jsx busca {{QR_REPURCHASE}} y coloca este archivo.
  // ============================================
  console.log('');
  console.log('── PASO 6b: QR Code (recompra) ──');

  // Reason: repurchaseUrl ya está calculado (PARTE 6, persistido en el JSON).
  const repurchasePath = path.join(imagesDir, `qr_repurchase.${GROUP_ID}.png`);

  try {
    await QRCode.toFile(repurchasePath, repurchaseUrl, {
      errorCorrectionLevel: 'H',
      width: 1200,
      margin: 2,
      color: { dark: '#2D2D2D', light: '#FFFFFF' },
    });
    console.log(`   ✅ QR de recompra generado`);
    console.log(`   🔗 ${repurchaseUrl}`);
    console.log(`   📂 ${repurchasePath}`);
  } catch (qrErr) {
    console.error(`   ❌ Error al generar QR de recompra:`, qrErr.message);
  }

  console.log('');
  console.log(`  📁 JSON: ${outputPath}`);
  console.log(`  📂 Imágenes: ${imagesDir}`);
  console.log(`  🧾 QR: qr.${GROUP_ID}.png`);
  console.log(`  🧾 QR recompra: qr_repurchase.${GROUP_ID}.png`);
  console.log('');
  console.log('  👉 Siguiente paso: Abrir SmallPlates_MasterTemplate_v1.indd');
  console.log('     y correr generate-book_v17.jsx');
  console.log('');
  console.log('     ⚠️  Antes de mandar el PDF a impresor:');
  console.log('     escanea el QR con tu celular y verifica que abre la URL.');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

fetchBook().catch(console.error);
