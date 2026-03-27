Contexto del proyecto
Estamos en Small Plates & Co., una plataforma Next.js 14 + TypeScript + Tailwind + Supabase. Vendemos libros de recetas colaborativos para bodas.
Estado actual del onboarding:

Existe un flujo de onboarding en app/(auth)/onboarding/page.tsx y app/(auth)/onboarding-gift/page.tsx
El último step tiene un componente CheckoutSummary en components/onboarding/CheckoutSummary.tsx
Actualmente el botón dice "Reserve Your Book" y solo guarda el email en Supabase — no cobra nada
El producto actualmente usa productTiers de lib/data/productTiers con tiers fijos ($149, $279, $449)
Existe un completeOnboarding() function en el context que guarda en purchase_intents

Objetivo: Reemplazar el flujo de "Reserve Your Book" con un checkout real de Stripe que cobre, cree la cuenta automáticamente, y envíe confirmación por email.

Variables de entorno necesarias
Agrega estas variables al .env.local (te las daré por separado):
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

Lógica de productos y precios
Ya NO usamos los tiers fijos ($149/$279/$449). El nuevo modelo es:

Primer libro: $169 USD (siempre, no negociable)
Libros adicionales: $119 USD cada uno (el cliente puede agregar de 0 a 5 libros extra)
Máximo: 6 libros en total (1 principal + 5 adicionales)

El step de selección de producto en el onboarding debe reemplazarse o modificarse para reflejar este nuevo modelo: un selector de cantidad, no tres tiers fijos.
Lógica de shipping por cantidad y destino:
DESTINO USA:
  1 libro     → $15
  2-3 libros  → $20
  4-6 libros  → $28

DESTINO MÉXICO:
  1 libro     → $35
  2-3 libros  → $45
  4-6 libros  → $60
El país de destino se determina cuando el cliente ingresa su dirección en Stripe Checkout. Sin embargo, para poder mostrarle el costo de envío estimado antes de ir a Stripe, necesitamos preguntarle su país en el onboarding (USA o México). Esta selección determina qué shipping_rate_data pasamos al crear la Checkout Session.

Fase 1 — Modificar el onboarding (antes de Stripe)
1A. Nuevo step de selección de producto
Reemplaza el ProductSelectionStep actual. En lugar de tres cards de tiers, muestra:

Un resumen del producto: "The Book — $169"
Un selector de cantidad de libros adicionales: +0 / +1 / +2 / +3 / +4 / +5 (botones o stepper)
Un resumen dinámico que calcule el total en tiempo real:

$169 + (adicionales × $119)


Un selector de país de envío: United States o México (dropdown o dos botones)
Texto debajo: "Shipping calculated based on destination"

Guarda en el onboarding context:
typescript{
  bookQuantity: number, // 1 a 6 (1 es el base, los demás son adicionales)
  shippingCountry: 'US' | 'MX',
  totalBooks: number,
  subtotal: number
}
1B. Modificar el último step (CheckoutSummary)
El último step ya no pide "Reserve Your Book". Ahora:

Muestra el resumen del pedido con el nuevo pricing (libros + shipping estimado)
Pide el email del cliente
El botón dice "Pay Now" o "Complete Purchase"
Al hacer click, llama a un API route /api/stripe/create-checkout-session y redirige a Stripe Checkout


Fase 2 — API Routes de Stripe
2A. Crear /app/api/stripe/create-checkout-session/route.ts
Este endpoint recibe del frontend:
typescript{
  email: string,
  bookQuantity: number,        // total de libros (1-6)
  shippingCountry: 'US' | 'MX',
  coupleNames?: { ... },       // para metadata
  onboardingData?: { ... }     // toda la data del onboarding para metadata
}
Y crea una Stripe Checkout Session con:
typescript// Line items dinámicos
const lineItems = []

// Siempre: 1 libro base a $169
lineItems.push({
  price_data: {
    currency: 'usd',
    product_data: { name: 'The Book' },
    unit_amount: 16900,
  },
  quantity: 1,
})

// Si hay adicionales
const additionalBooks = bookQuantity - 1
if (additionalBooks > 0) {
  lineItems.push({
    price_data: {
      currency: 'usd',
      product_data: { name: 'Additional Book' },
      unit_amount: 11900,
    },
    quantity: additionalBooks,
  })
}

// Shipping rate basado en cantidad y país
const shippingAmount = calculateShipping(bookQuantity, shippingCountry)
// donde calculateShipping implementa la tabla de precios de arriba

// Crear session
const session = await stripe.checkout.sessions.create({
  mode: 'payment',
  customer_email: email,
  line_items: lineItems,
  shipping_address_collection: {
    allowed_countries: ['US', 'MX'],
  },
  shipping_options: [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: { amount: shippingAmount * 100, currency: 'usd' },
        display_name: 'Standard Shipping',
        delivery_estimate: {
          minimum: { unit: 'business_day', value: 7 },
          maximum: { unit: 'business_day', value: 14 },
        },
      },
    },
  ],
  metadata: {
    email,
    bookQuantity: String(bookQuantity),
    shippingCountry,
    // Incluir toda la data relevante del onboarding aquí
    coupleName: `${coupleNames?.brideFirstName} & ${coupleNames?.partnerFirstName}`,
    onboardingData: JSON.stringify(onboardingData),
  },
  success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/onboarding?cancelled=true`,
})

return NextResponse.json({ url: session.url })
2B. Crear /app/api/stripe/webhook/route.ts
Este es el webhook que Stripe llama cuando el pago se completa. Aquí vive toda la lógica post-pago.
typescript// Verificar firma de Stripe
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)

if (event.type === 'checkout.session.completed') {
  const session = event.data.object
  
  // 1. Extraer datos
  const email = session.customer_email
  const metadata = session.metadata
  const shippingAddress = session.shipping_details
  
  // 2. Crear usuario en Supabase Auth
  // Usar supabaseAdmin (service role key) para crear el usuario
  const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    email_confirm: true,  // confirmar email automáticamente
    password: generateSecurePassword(), // password temporal
  })
  
  // 3. Crear registro en tabla 'orders' (ver Fase 3)
  await supabaseAdmin.from('orders').insert({
    user_id: authUser.user.id,
    email: email,
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    amount_total: session.amount_total,
    book_quantity: parseInt(metadata.bookQuantity),
    shipping_country: metadata.shippingCountry,
    shipping_address: shippingAddress,
    couple_name: metadata.coupleName,
    onboarding_data: JSON.parse(metadata.onboardingData),
    status: 'paid',
  })
  
  // 4. Enviar magic link / password reset para que el cliente cree su contraseña
  await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  })
  // O alternativamente enviar invitación:
  // supabaseAdmin.auth.admin.inviteUserByEmail(email)
  
  // Nota: Stripe envía automáticamente el receipt al email del cliente
  // si está habilitado en el dashboard de Stripe
}

Fase 3 — Cambios en Supabase
Ejecuta este SQL manualmente en Supabase:
sql-- Tabla de órdenes
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT,
  amount_total INTEGER, -- en centavos
  book_quantity INTEGER NOT NULL DEFAULT 1,
  shipping_country TEXT NOT NULL DEFAULT 'US',
  shipping_address JSONB,
  couple_name TEXT,
  onboarding_data JSONB,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'in_production', 'shipped', 'delivered', 'refunded'))
);

-- RLS: solo el usuario dueño puede ver su orden
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admins (service role) pueden hacer todo
-- (el service role key bypasea RLS automáticamente)

Fase 4 — Página de éxito
Crea /app/onboarding/success/page.tsx:

Recibe el session_id del query param
Llama a un API route /api/stripe/get-session para verificar que el pago fue exitoso
Muestra la pantalla de éxito existente (la que ya existe con el checkmark dorado)
Agrega mensaje: "Check your email — we sent you a link to access your dashboard."
No mostrar contraseña ni nada sensible


Fase 5 — Configurar Stripe Dashboard
Instrúyeme para hacer esto manualmente:

Habilitar receipts automáticos: Stripe Dashboard → Settings → Email → "Successful payments" → Enable
Configurar webhook endpoint: Stripe Dashboard → Developers → Webhooks → Add endpoint → URL: https://smallplatesandcompany.com/api/stripe/webhook → Eventos: checkout.session.completed
Copiar el Webhook Secret (whsec_...) al .env.local


Consideraciones técnicas importantes

Service Role Key de Supabase: Para crear usuarios desde el webhook necesitas SUPABASE_SERVICE_ROLE_KEY en .env.local (nunca en el frontend). Crea un cliente admin separado:

typescript// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

El webhook debe verificar la firma de Stripe antes de procesar cualquier cosa — esto es crítico para seguridad.
El webhook route debe usar raw body — en Next.js App Router esto requiere deshabilitar el body parser:

typescriptexport const config = { api: { bodyParser: false } }
// O en App Router: leer el body con request.text() no request.json()

Idempotencia: El webhook puede llegar más de una vez. Usa stripe_session_id como clave única en la tabla orders para no duplicar registros.
Manejo de errores: Si la creación del usuario en Supabase falla después del pago, loguea el error pero no falles el webhook (Stripe lo reintentaría). Mejor guardar el error en la tabla orders y resolverlo manualmente.


Definition of Done

 El selector de cantidad en el onboarding funciona y actualiza el total en tiempo real
 El botón "Pay Now" redirige correctamente a Stripe Checkout
 Stripe Checkout muestra los line items correctos (libro base + adicionales + shipping)
 Stripe Checkout pide dirección de envío
 Al completar el pago, el webhook crea el usuario en Supabase Auth
 El usuario recibe email de Stripe con el receipt
 El usuario recibe email de Supabase con magic link para acceder al dashboard
 La orden queda registrada en la tabla orders con todos los datos del onboarding
 La página de éxito se muestra correctamente después del pago
 El flujo funciona en test mode con la tarjeta 4242 4242 4242 4242


Avísame antes de ejecutar cualquier SQL en Supabase — lo haré yo manualmente.