# Claude Code Prompt — /copy/[bookId] — Order a Copy Page

## Context
Small Plates & Co. — Next.js 14, TypeScript, Tailwind, Supabase, Stripe.

Alguien que cerró un libro quiere compartir un link para que otra persona pueda comprar una copia del mismo libro ya cerrado. Esta es esa página de destino.

---

## Antes de escribir una sola línea de código, lee esto:

1. **Lee el componente de Stripe Embedded Checkout** que ya existe en el proyecto — el que se usa en el onboarding/checkout original. Entiende exactamente cómo se crea el PaymentIntent, cómo se pasa el `clientSecret` al componente de Stripe, y cómo se maneja el callback de éxito. Esta nueva página debe usar **exactamente el mismo patrón**.

2. **Lee la página de confirmación del libro cerrado** (`/dashboard/[bookId]/closed` o equivalente). Identifica cómo está estructurado el layout, qué componentes de UI reutiliza, y qué CSS variables / clases de Tailwind usa para los labels uppercase honey, los cards blancos con border, y la tipografía serif. Esta nueva página debe verse idéntica en estilo.

3. **Lee el `CloseLayout.tsx`** o el layout wrapper que creamos para el close flow. Si hay un componente de step indicator, un back button, o un page wrapper reutilizable, úsalo aquí también.

4. **Lee el server action o API route que creamos** para `createExtraCopiesPaymentIntent`. La lógica del nuevo server action para esta página es casi idéntica — solo cambia quién lo llama y el contexto.

5. **Busca en el proyecto** si ya existe un componente de formulario de dirección (`ShippingForm` o similar) del `StepShipping.tsx` que creamos. Si existe, extráelo a un componente compartido y úsalo aquí también en lugar de duplicar código.

---

## Lo que hay que construir

### Nueva ruta: `app/copy/[bookId]/page.tsx`

Página pública — **no requiere autenticación**. Cualquier persona con el link puede acceder.

### Nueva ruta: `app/copy/[bookId]/success/page.tsx`

Página de confirmación post-pago.

### Nuevo server action: `actions/createCopyOrderPaymentIntent.ts`

Crea el PaymentIntent de Stripe para esta compra.

---

## Lógica de negocio

### Restricciones
- El libro debe existir y tener `status = 'closed'` — si no, mostrar un mensaje simple: *"This link is no longer available."* con el logo de Small Plates arriba. Sin redirect, sin error 404.
- Máximo 6 copias por orden en esta página.
- No requiere cuenta ni login.
- Solo se pide email — para recibo y tracking.

### Pricing
- Cada copia: $119
- Shipping: $15 fijo (único, no por copia — misma lógica flat rate que el resto del producto)
- Total = (qty × 119) + 15
- El PaymentIntent se crea en el servidor por el total en centavos: `(qty × 11900) + 1500`

### Stripe
- Usar **exactamente el mismo patrón** de Stripe Embedded Checkout que ya existe en el proyecto.
- Crear un nuevo server action `createCopyOrderPaymentIntent` que recibe `{ bookId, qty, email }` y devuelve `{ clientSecret }`.
- En el PaymentIntent, incluir metadata:
  ```
  { bookId, type: 'copy_order', qty, email }
  ```
- Description: `"Small Plates — ${qty} copy order for book ${bookId}"`
- Después del pago exitoso, guardar en Supabase (ver más abajo).

### Supabase — nueva tabla `copy_orders`
Antes de crear la tabla, **mostrar el SQL al usuario y esperar confirmación explícita**. No ejecutar automáticamente.

```sql
CREATE TABLE IF NOT EXISTS copy_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID REFERENCES books(id) NOT NULL,
  email TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 1 AND qty <= 6),
  shipping_address JSONB NOT NULL,
  stripe_payment_intent_id TEXT,
  amount_total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Después del pago exitoso de Stripe, insertar un registro en `copy_orders` con status `'paid'`.

---

## Estructura de la página (`/copy/[bookId]`)

La página tiene **dos estados internos** manejados con `useState`:

- `step: 'order' | 'payment'`

### Estado `order` — lo que el usuario ve primero

Layout: misma estructura que las páginas del close flow — fondo `#F5F3EF`, max-width 640px, centrado, padding generoso. Sin navbar del dashboard. Solo el logo de Small Plates arriba (mismo componente de logo que ya existe, o si no existe, texto simple con la misma fuente).

**Contenido en orden:**

1. **Eyebrow** — mismo estilo que los labels honey uppercase del resto del proyecto:
   ```
   A COPY IS AVAILABLE
   ```

2. **Título serif** (mismo tamaño que los títulos de las otras páginas del close flow):
   ```
   {book.title}
   ```

3. **Meta line** (muted, 14px):
   ```
   {book.recipe_count} recipes · Closed {formatted date}
   ```

4. **Book info card** — white card, 0.5px border, border-radius consistente con el resto:
   - Mostrar título del libro, número de recetas, número de contribuidores
   - Si el libro tiene foto (`book.cover_photo_url`), mostrarla. Si no, un placeholder del color charcoal con la spine honey (igual que hicimos en el close flow).

5. **Sección de precio** — label uppercase muted + card blanco:
   - "One copy — $119"
   - "Shipping — $15" con nota: "Flat rate to US, Mexico & Europe"
   - Pill "ships free" NO aplica aquí — aquí el shipping sí se cobra ($15). Mostrar el total claramente.

6. **Selector de cantidad** — mismo estilo de stepper que `StepExtras.tsx`:
   - Mínimo 1, máximo 6
   - Debajo del stepper: total dinámico en 14px muted: `"Total: $X ({N} {copy/copies} + shipping)"`

7. **Campo de email**:
   - Label: "Your email"
   - Input: mismo estilo que los inputs del close flow
   - Note debajo: "Receipt and tracking details will be sent here."

8. **CTA button** (mismo pill dark button que el resto):
   - Texto dinámico: `"Order — $X →"` donde X es el total
   - Al hacer clic: validar que email no esté vacío, luego cambiar step a `'payment'`

9. **Caption** debajo del botón:
   ```
   $15 flat shipping to US, Mexico & Europe.
   Questions? team@smallplatesandcompany.com (link mailto)
   ```

---

### Estado `payment` — checkout

Layout: mismo, max-width reducido a 520px.

**Contenido:**

1. **Headline serif**: `"Almost done."`
2. **Sub**: `"Enter your shipping address and payment details."`

3. **Order recap card** (mismo estilo que en `StepPayment.tsx`):
   - `{N} {copy/copies}` / `${ N × 119 }`
   - `Shipping` / `$15`
   - Divider
   - `Total` / `${ total }` (bold)

4. **Formulario de dirección** — si extrajiste `ShippingForm` a componente compartido, úsalo aquí. Si no, replicar los mismos campos con los mismos estilos:
   - Recipient name
   - Street address
   - Apt / Suite (optional)
   - City / State / ZIP (row)
   - Phone (optional)

5. **Stripe Embedded Checkout** — mismo componente/patrón que ya existe. El `clientSecret` se obtiene llamando al server action `createCopyOrderPaymentIntent` con `{ bookId, qty, email }`. Llamar al server action **cuando el usuario llega a este step**, no antes.

6. **Back link**: `"← Back"` en ghost link que vuelve al step `'order'`

7. **Stripe badge**: igual que en `StepPayment.tsx`

---

## Página de confirmación (`/copy/[bookId]/success`)

Recibe `payment_intent` como query param (Stripe lo agrega automáticamente al return_url).

En el server:
1. Verificar el PaymentIntent con Stripe
2. Si status es `'succeeded'`, mostrar confirmación
3. Actualizar el `copy_order` en Supabase a status `'paid'`

**Contenido** (mismo estilo que la página de confirmación del libro cerrado):

- Eyebrow honey uppercase: `"ORDER CONFIRMED"`
- Título serif: `"Your copy is on its way."`
- Sub muted: `"We'll email you tracking details when it ships. Arrives in approximately 3 weeks."`
- Card de detalles con filas:
  - `BOOK` / `{book.title}`
  - `COPIES` / `{qty} {copy/copies}`
  - `TOTAL PAID` / `${total}`
  - `SHIPS TO` / dirección resumida
- Footer: `"A receipt is on its way to your inbox. Questions? team@smallplatesandcompany.com"`

---

## Lo que NO hacer

- No crear una navbar del dashboard en esta página — solo el logo
- No redirigir a login si el usuario no está autenticado — es una página pública
- No duplicar código de Stripe — usa el patrón existente
- No duplicar estilos — usa las mismas clases Tailwind y CSS variables que ya existen
- No crear componentes nuevos si ya existe uno que sirve
- No ejecutar migraciones de Supabase sin confirmación explícita del usuario
- No agregar animaciones que no existan ya en el proyecto
- No tocar ningún otro archivo que no sea parte de esta feature

---

## Archivos a crear (solo estos)

```
app/
  copy/
    [bookId]/
      page.tsx              ← página principal (order + payment steps)
      success/
        page.tsx            ← confirmación post-pago

actions/
  createCopyOrderPaymentIntent.ts   ← server action Stripe
```

Y si el `ShippingForm` no está extraído como componente compartido:
```
components/close/ShippingForm.tsx   ← extraer de StepShipping.tsx (modificación mínima)
```

---

## Plan esperado antes de codear

Antes de escribir código, mostrar:
1. Qué archivos vas a crear
2. Qué archivos vas a modificar (si alguno)
3. El SQL de la nueva tabla `copy_orders`
4. Cómo vas a reutilizar el patrón de Stripe existente (qué archivo leerás como referencia)

Esperar confirmación antes de proceder.