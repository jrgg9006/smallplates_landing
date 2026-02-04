/**
 * Admin Impersonation Script
 *
 * Genera un magic link para entrar como cualquier usuario.
 * El link expira en 1 hora y es de un solo uso.
 *
 * Uso:
 *   npx tsx scripts/admin-login-as-user.ts                    # Lista todos los usuarios
 *   npx tsx scripts/admin-login-as-user.ts cliente@email.com  # Genera link para ese usuario
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error listando usuarios:', error.message)
    return
  }

  console.log('\n📋 Usuarios disponibles:\n')
  console.log('─'.repeat(70))
  data?.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email || 'Sin email'}`)
    console.log(`   Nombre: ${user.full_name || 'Sin nombre'}`)
    console.log(`   ID: ${user.id}`)
    console.log('')
  })
  console.log('─'.repeat(70))
  console.log('\n💡 Para generar un link, ejecuta:')
  console.log('   npx tsx scripts/admin-login-as-user.ts EMAIL_DEL_USUARIO\n')
}

async function generateMagicLink(email: string) {
  console.log(`\n🔐 Generando magic link para: ${email}\n`)

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  })

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  const link = data.properties?.action_link

  if (!link) {
    console.error('❌ No se pudo generar el link')
    return
  }

  console.log('✅ Link generado exitosamente!\n')
  console.log('─'.repeat(70))
  console.log('\n🔗 LINK (copia y pega en tu navegador):\n')
  console.log(link)
  console.log('\n─'.repeat(70))
  console.log('\n⚠️  Notas importantes:')
  console.log('   • El link expira en 1 hora')
  console.log('   • Solo se puede usar 1 vez')
  console.log('   • Cierra sesión cuando termines\n')
}

// Main
const email = process.argv[2]

if (email) {
  generateMagicLink(email)
} else {
  listUsers()
}
