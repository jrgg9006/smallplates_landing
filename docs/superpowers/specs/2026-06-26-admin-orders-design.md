# Admin Orders — Design Spec

Date: 2026-06-26
Status: Approved (pending spec review)
Scope: read-only

## Problem

Ni Ricardo ni el equipo tienen visibilidad de las ventas: no saben si vendieron,
cuánto, a quién, ni cómo se debe imprimir la portada de cada libro. Toda esa
información existe en la base de datos pero no hay ninguna pantalla que la muestre.

## Goal

Una sección `/admin/orders` (read-only) que responda, de un vistazo:
- ¿Cuánto se ha vendido? (órdenes, libros, ingreso)
- ¿Quién compró y cuándo?
- ¿A dónde se envía?
- ¿Cómo se imprime la portada? (la **frase** y el **nombre** que eligió el usuario)

## Data sources

Fuente de verdad por orden = tabla `orders`. Único join: `groups` (por `group_id`)
para traer la frase de portada, que NO vive en `orders`.

**De `orders`:** `id`, `created_at`, `email`, `amount_total` (centavos),
`book_quantity`, `shipping_address` (JSONB), `couple_name`, `status`,
`order_type`, `group_id`, `discount_amount`, `stripe_payment_intent`.

**De `groups` (join):** `print_cover_line`, `print_couple_name`, `name`.

**Forma de `orders.shipping_address` (JSONB)** — snapshot que escribe el flujo de
book-close en `lib/stripe/post-payment-setup.ts`:
`{ recipient_name, street_address, apartment_unit, city, state, postal_code, country, phone_number }`

**Moneda:** todos los checkouts cobran en USD (`currency: "usd"`). Mostrar `$X.XX USD`.

**Resolución de campos derivados:**
- Nombre de impresión = `groups.print_couple_name` → `orders.couple_name` → `groups.name`
- Frase de portada = `groups.print_cover_line` → fallback `"RECIPES FROM THE PEOPLE WHO LOVE"`
- Monto = `amount_total / 100`

## Architecture

Mismo patrón que `admin/users` (RLS en `orders` obliga a leer con service-role):

1. **`lib/supabase/admin-orders.ts`** → `getAllOrdersAdmin()`. Admin client
   (service-role). Query a `orders` + join `groups`, ordenado por `created_at` desc.
   Devuelve un tipo normalizado `AdminOrderRow` (campos ya resueltos: nombre de
   impresión, frase, monto en dólares, dirección parseada).

2. **`app/api/v1/admin/orders/route.ts`** (GET) → `requireAdminAuth()` →
   `getAllOrdersAdmin()` → JSON. Espejo exacto de `app/api/v1/admin/users/route.ts`.

3. **`app/(admin)/admin/orders/page.tsx`** (client) → fetch a la API, render.

4. **`app/(admin)/admin/page.tsx`** → reemplazar el card placeholder
   "📦 Orders — Coming soon" por un `Link href="/admin/orders"`.

Todos los archivos < 300 líneas. Si la página crece, extraer el panel de detalle a
un componente en `components/` (admin).

## UI

### Resumen (arriba)
Tres números, calculados sobre órdenes con status de venta real
(`paid, processing, in_production, shipped, delivered`):
- Órdenes pagadas (conteo)
- Libros vendidos (suma de `book_quantity`)
- Ingreso total (suma de `amount_total` ÷ 100)

### Tabla
Columnas: Fecha · Cliente (email) · Nombre impresión · Cantidad · Monto · Status · Ciudad/País.
- Default: filtro a status de venta real. `refunded`/`error` visibles al cambiar el filtro.
- Búsqueda por email o nombre de impresión.
- Click en fila → panel de detalle (slide-over).

### Panel de detalle = "ficha de producción"
Lo crítico para imprimir y enviar, formateado claro:
- **Bloque de portada** (estilo ficha de impresión): frase de portada arriba +
  nombre para impresión abajo.
- **Cantidad de libros.**
- **Dirección de envío completa:** recipient, calle, depto, ciudad, estado, CP, país, teléfono.
- **Meta:** monto pagado, fecha, tipo de orden, status, payment intent (referencia Stripe).

## Visual direction (hermoso · minimalista · efectivo)

Es UI interna de admin → Tailwind crudo permitido (excepción del sistema
tipográfico en CLAUDE.md). Pero debe sentirse on-brand y elegante, no una tabla
genérica. Paleta de marca: Honey `#D4A854`, Warm White `#FAF7F2`, Soft Charcoal
`#2D2D2D`, Sand `#E8E0D5`.

- **Lienzo:** fondo warm white, mucho aire, ancho contenido (no full-bleed denso).
- **Resumen:** tres stats tranquilos — número grande en charcoal con `tabular-nums`,
  label en uppercase pequeño con tracking y tono apagado, fina regla honey de acento.
- **Tabla:** sin bordes pesados; hairlines (`border-b border-sand/60`), hover con
  tinte sand sutil, alineación de montos/cantidades con `tabular-nums` a la derecha.
  Status como dot/pill discreto (verde=delivered/shipped, honey=processing/in_production,
  neutro=paid, rojo=refunded/error).
- **Detalle:** slide-over desde la derecha, fondo warm white, secciones separadas por
  espacio (no cajas ruidosas). El bloque de portada se compone como una mini-portada:
  frase en uppercase pequeña con tracking + nombre en serif grande centrado — que
  evoque el libro real, no un campo de formulario.
- **Estados:** loading discreto, empty state amable ("Aún no hay órdenes."),
  números siempre legibles.

## Out of scope (v1)

- Editar status / operar cumplimiento.
- Export/CSV.
- Paginación (volumen actual ~10/mes; render directo). Añadir si crece.

## Files

| Archivo | Acción |
|---|---|
| `lib/supabase/admin-orders.ts` | nuevo — query + tipo `AdminOrderRow` |
| `app/api/v1/admin/orders/route.ts` | nuevo — GET con `requireAdminAuth` |
| `app/(admin)/admin/orders/page.tsx` | nuevo — tabla + resumen + detalle |
| `app/(admin)/admin/page.tsx` | editar — activar card de Orders |
