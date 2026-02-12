// scripts/indesign/fetch-book-data.js
// Script para extraer datos del libro de Supabase y generar JSON para InDesign
// Extrae: info de pareja, lista de contributors, lista de captains
// TO RUN: node scripts/indesign/fetch-book-data.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') });

// Configuración de Supabase
// Reason: service_role key bypasses RLS, needed to read group_members + profiles
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
const GROUP_ID = 'a3698398-3667-4d47-a3e7-16a8e880ef47';
// ============================================

async function fetchBookData() {
  console.log('🔄 Conectando a Supabase...');
  console.log(`📖 Buscando datos del libro para grupo: ${GROUP_ID}`);
  console.log('');

  // ============================================
  // 1. INFO DEL GRUPO (pareja)
  // ============================================
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .select('couple_first_name, partner_first_name, couple_display_name, wedding_date')
    .eq('id', GROUP_ID)
    .single();

  if (groupError) {
    console.error('❌ Error al obtener grupo:', groupError.message);
    process.exit(1);
  }

  console.log(`💑 Pareja: ${group.couple_display_name || `${group.couple_first_name} & ${group.partner_first_name}`}`);

  // ============================================
  // 2. CONTRIBUTORS (guests con al menos 1 receta)
  // ============================================
  const { data: contributors, error: contributorsError } = await supabase
    .from('guests')
    .select('first_name, last_name, printed_name')
    .eq('group_id', GROUP_ID)
    .eq('is_archived', false)
    .gt('recipes_received', 0)
    .order('first_name');

  if (contributorsError) {
    console.error('❌ Error al obtener contributors:', contributorsError.message);
    process.exit(1);
  }

  const contributorList = contributors.map(g => ({
    name: g.printed_name || `${g.first_name || ''} ${g.last_name || ''}`.trim() || 'Anónimo'
  }));

  console.log(`👥 Contributors: ${contributorList.length} guests con recetas`);

  // ============================================
  // 3. OWNERS + CAPTAINS (group_members)
  // ============================================
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
    .map(m => ({
      name: m.profiles?.full_name || m.profiles?.email || 'Sin nombre'
    }));

  const captainList = members
    .filter(m => m.role === 'member')
    .map(m => ({
      name: m.profiles?.full_name || m.profiles?.email || 'Sin nombre'
    }));

  console.log(`👑 Owners: ${ownerList.length}`);
  console.log(`🎖️  Captains: ${captainList.length}`);

  // ============================================
  // GENERAR JSON
  // ============================================
  // Reason: couple_display_name can be empty, fallback to "first & partner"
  const coupleDisplayName = group.couple_display_name ||
    `${group.couple_first_name || ''} & ${group.partner_first_name || ''}`.trim();

  const bookData = {
    group_id: GROUP_ID,
    couple: {
      couple_first_name: group.couple_first_name || '',
      partner_first_name: group.partner_first_name || '',
      couple_display_name: coupleDisplayName,
      wedding_date: group.wedding_date || null
    },
    contributors: {
      count: contributorList.length,
      list: contributorList
    },
    owners: {
      count: ownerList.length,
      list: ownerList
    },
    captains: {
      count: captainList.length,
      list: captainList
    }
  };

  // Guardar JSON
  const outputDir = path.resolve(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFileName = `book-data.${GROUP_ID}.json`;
  const outputPath = path.join(outputDir, outputFileName);

  fs.writeFileSync(outputPath, JSON.stringify(bookData, null, 2), 'utf8');

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ ¡Listo! Datos del libro exportados');
  console.log('');
  console.log(`   💑 Pareja: ${bookData.couple.couple_display_name}`);
  console.log(`   👥 Contributors: ${bookData.contributors.count}`);
  console.log(`   👑 Owners: ${bookData.owners.count}`);
  console.log(`   🎖️  Captains: ${bookData.captains.count}`);
  console.log('');

  if (contributorList.length > 0) {
    console.log(`   Contributors (${contributorList.length}):`);
    for (const contributor of contributorList) {
      console.log(`     ${contributor.name}`);
    }
    console.log('');
  }

  if (ownerList.length > 0) {
    console.log('   Owners:');
    for (const owner of ownerList) {
      console.log(`     ${owner.name}`);
    }
    console.log('');
  }

  if (captainList.length > 0) {
    console.log('   Special Thanks (Captains):');
    for (const captain of captainList) {
      console.log(`     ${captain.name}`);
    }
    console.log('');
  }

  console.log(`📁 Archivo: ${outputFileName}`);
  console.log(`📂 Ruta: ${outputPath}`);
  console.log('═══════════════════════════════════════════════════════════');
}

fetchBookData().catch(console.error);
