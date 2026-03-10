# Small Plates — Landing Page Redesign Plan
## "From Generic Cookbook to The Wedding Gift That Stays"

---

# Executive Summary

**Objetivo:** Transformar la landing page de "libro de cocina colaborativo genérico" a "el regalo de bodas que no termina en un armario" — materializando la nueva identidad de marca (Margot Cole) en cada pixel y palabra.

**Approach:** Renovación total. Mantenemos la arquitectura técnica de componentes donde tiene sentido, pero reescribimos todo el copy, reestructuramos el flujo narrativo, y realineamos la identidad visual.

**Audience Primario:** La novia (como receiver y como creator)
**Audience Secundario:** La organizadora (bridesmaid, hermana, amiga)

**Voz:** Margot Cole — la amiga cool en quien confías, que sabe lo que es bueno y te lo dice sin explicarse demasiado.

---

# Part 1: Narrative Flow

## Flujo Actual (Problemático)

```
Banner → Hero (genérico) → Features (cómo funciona el libro) → TextSection → 
WellWhatIf (miedos) → BooksPrinted (galería) → FoodPerfect → WhatsIncluded → 
HowItWorks → ShareBanner → MemorableExperience → FAQ → Footer
```

**Problemas:**
- No hay contexto de bodas en ningún lugar
- El hook inicial es tibio ("where food becomes the reason to gather")
- Los features vienen antes del "por qué debería importarme"
- El flujo emocional está invertido (features antes que diferenciación)
- Muchas secciones redundantes o sin propósito claro

---

## Flujo Propuesto

```
1. BANNER (navegación + credibilidad)
   ↓
2. HERO (hook + contexto de bodas + CTA primario)
   ↓
3. THE PROBLEM (el regalo forgettable — enemigo cultural)
   ↓
4. THE SOLUTION (qué es Small Plates — diferenciación)
   ↓
5. HOW IT WORKS (3 pasos simples — eliminar fricción)
   ↓
6. PROOF (libros reales, recetas reales — credibilidad)
   ↓
7. FOR GIFT GIVERS (sección para organizadoras — CTA secundario)
   ↓
8. EMOTIONAL CLOSE ("Still at the table" — el cierre)
   ↓
9. FAQ (resolver dudas finales)
   ↓
10. FOOTER (con brand line)
```

**Lógica narrativa:**
1. Captura atención (hook)
2. Crea tensión (el problema que resolvemos)
3. Presenta la solución (nosotros)
4. Elimina fricción (es fácil)
5. Demuestra que es real (proof)
6. Incluye a organizadoras (expansión de audience)
7. Cierra emocionalmente (el "por qué" profundo)
8. Resuelve objeciones (FAQ)

---

# Part 2: Component-by-Component Plan

## 2.1 BANNER
**Archivo:** `components/landing/Banner.tsx`

**Estado actual:** Logo + navegación + botones Login/Create your Book

**Decisión:** ✅ MANTENER estructura, MODIFICAR detalles

**Cambios específicos:**
- [ ] Cambiar "Create your Book" → "Start Your Book"
- [ ] Verificar que el logo sea la versión correcta (con & Co.)
- [ ] Considerar agregar un mensaje sutil de contexto: "Wedding Recipe Books" cerca del logo (opcional, debatir)

**Alineación Margot:** La navegación debe ser limpia, sin ruido. Margot no necesita que le expliquen dónde hacer clic.

---

## 2.2 HERO
**Archivo:** `components/landing/Hero.tsx`

**Estado actual:**
```
Headline: "Where food becomes the reason to gather"
Subhead: "A book made from the plates your friends actually cook."
CTA: "Create Your Cookbook"
Secondary: "Preview the book"
```

**Decisión:** ✅ MANTENER componente, REESCRIBIR todo el copy

**Copy propuesto:**

```
Headline: "Recipes from the people who love you."

Subhead: "A wedding cookbook made by your guests. 
         Not a keepsake — a kitchen book."

CTA primario: "Start Your Book"
CTA secundario: "See How It Works" (scroll a sección)
```

**Imagen:**
- Reemplazar imagen actual por: lifestyle de pareja/manos cocinando juntos, golden hour, warm tones
- Alternativa: El libro abierto en una cocina real, con luz natural
- Dirección AI: "Editorial lifestyle photography, couple cooking together in warm kitchen, golden hour light through window, hands preparing food, shallow depth of field, Kinfolk magazine aesthetic, warm color grading --ar 16:9"

**Cambios técnicos:**
- [ ] Reescribir headline
- [ ] Reescribir subhead
- [ ] Cambiar texto del CTA
- [ ] Cambiar "Preview the book" por "See How It Works" (o mantener preview si el modal es bueno)
- [ ] Reemplazar imagen de fondo
- [ ] Ajustar overlay para asegurar legibilidad

**Alineación Margot:** "Recipes from the people who love you" es exactamente cómo Margot describiría esto — claro, cálido, sin explicarse de más. El subhead ancla el contexto (wedding) y la diferenciación (not a keepsake).

---

## 2.3 THE PROBLEM (Nueva Sección)
**Archivo:** CREAR `components/landing/TheProblem.tsx`

**Estado actual:** No existe

**Decisión:** 🆕 CREAR nueva sección

**Propósito:** Establecer el enemigo cultural — el regalo de bodas forgettable. Crear tensión antes de presentar la solución.

**Copy propuesto:**

```
[Sección con fondo Warm White, texto centrado]

Headline: "Wedding gifts have a problem."

Body: 
"Another blender. Another towel set. Another thing 
that ends up in a closet — or returned.

Not because people don't care.
Because caring is hard to fit in a box."

[Pausa visual — línea o espacio]

"What if the gift wasn't a thing?
What if it was the people?"
```

**Diseño:**
- Fondo: Warm White (#FAF7F2)
- Texto: Soft Charcoal (#2D2D2D)
- Tipografía: Minion Pro para headlines, Inter para body
- Mucho espacio en blanco — dejar que el texto respire
- Sin imágenes — el texto es el protagonista

**Alineación Margot:** Margot no necesita gritar que los registries son aburridos. Lo dice con un "another blender" y una ceja levantada. La pregunta final ("What if it was the people?") es su transición elegante.

---

## 2.4 THE SOLUTION (Reemplaza TextSection/WellWhatIf)
**Archivos a reemplazar/consolidar:** 
- `components/landing/TextSection.tsx`
- `components/landing/WellWhatIf.tsx`

**Decisión:** 🔄 ELIMINAR ambas, CREAR nueva sección

**Propósito:** Presentar Small Plates como la respuesta a "the problem". Explicar qué es sin ser un feature dump.

**Copy propuesto:**

```
[Split layout: texto a la izquierda, imagen a la derecha]

Eyebrow: "THIS IS SMALL PLATES"

Headline: "A cookbook made by everyone who showed up."

Body:
"Every guest contributes a recipe. 
Every recipe becomes a page. 
Every page is a reason to cook together.

It's not a gift you display.
It's a gift you use — stained, 
and opened on random Tuesday nights for years."

CTA: "Start Your Book →"
```

**Imagen:**
- El libro físico, abierto, en una cocina real
- Se ven recetas con nombres de personas
- Luz natural, algo de desorden controlado (una taza, ingredientes)
- Dirección AI: "Cookbook open on marble kitchen counter, natural light, warm tones, recipe page visible with handwriting, coffee cup nearby, lived-in kitchen, editorial food photography style"

**Alineación Margot:** "Everyone who showed up" — esa frase tiene peso. Margot sabe que en una boda, mostrar presencia importa. "Stained" — ella no pretende que las cosas se queden perfectas. Las cosas buenas se usan.

---

## 2.5 HOW IT WORKS
**Archivo:** `components/landing/HowItWorks.tsx`

**Estado actual:** 3 pasos con imágenes y descripciones genéricas
- Headline: "How connection happens"
- Steps: Create → Invite → Order (aproximadamente)

**Decisión:** ✅ MANTENER componente, REESCRIBIR copy

**Copy propuesto:**

```
Headline: "Here's how it happens."
Subhead: "Simpler than you think."

Step 1:
"You invite."
"Share a link with your guests. We'll remind them — you don't have to chase anyone."

Step 2:
"They send recipes."
"Their favorites. Their stories. Takes 5 minutes."

Step 3:
"We make the book."
"Designed. Printed. Hardcover. Delivered."
```

**Imagen direction para cada step:**
1. Ilustración o foto de invitación/link siendo compartido
2. Persona (manos) escribiendo una receta o tomando foto de comida
3. El libro terminado, hermoso, siendo entregado/abierto

**Cambios técnicos:**
- [ ] Reescribir headline
- [ ] Reescribir cada step title y description
- [ ] Mantener o mejorar imágenes

**Alineación Margot:** Margot explica las cosas en tres oraciones o menos. "You invite. They send. We make." Eso es todo. La claridad es respeto por el tiempo de la otra persona.

---

## 2.6 PROOF (Evolución de BooksPrinted)
**Archivo:** `components/landing/BooksPrinted.tsx`

**Estado actual:** Carrusel de recetas con modal de preview

**Decisión:** ✅ MANTENER componente, MODIFICAR encuadre

**Copy propuesto:**

```
Headline: "Real recipes. Real people. Real books."
Subhead: "Every page has a name. Every name has a story."

[Mantener carrusel de recetas]

Nota al pie o CTA: "Preview a full book →"
```

**Cambios:**
- [ ] Reescribir headline y subhead
- [ ] El carrusel puede quedarse — funciona bien como proof
- [ ] Asegurar que las recetas muestren NOMBRES de personas prominentemente (el "who" importa)

**Alineación Margot:** El proof no necesita explicación. Solo mostrar que es real. "Real recipes. Real people." — Margot deja que las cosas hablen por sí mismas.

---

## 2.7 FOR GIFT GIVERS (Nueva Sección)
**Archivo:** CREAR `components/landing/ForGiftGivers.tsx`

**Estado actual:** No existe una sección dedicada a organizadoras

**Decisión:** 🆕 CREAR nueva sección

**Propósito:** Capturar al audience secundario (bridesmaids, hermanas, amigas) con mensaje específico y CTA dedicado.

**Copy propuesto:**

```
[Sección con fondo sutil diferente — Sand (#E8E0D5)]

Headline: "Giving this as a gift?"

Body:
"You're about to give the best wedding gift anyone's ever received.

Here's the deal:
1. You start the book.
2. You invite the guests.
3. They send recipes (we remind them, don't worry).
4. We print it. Bride cries. You win.

No design skills needed. We handle the hard part."

CTA: "Start a Book for Someone →"
```

**Diseño:**
- Fondo: Sand (#E8E0D5) para diferenciar visualmente
- Layout: Puede ser más "card-like" o destacado
- Posible icono o ilustración de regalo/sorpresa

**Alineación Margot:** Margot habla diferente cuando está en "modo organizar". Es más práctica, más "let me tell you how this works". "Bride cries. You win." — eso es Margot con un guiño.

---

## 2.8 EMOTIONAL CLOSE (Nueva Sección)
**Archivo:** CREAR `components/landing/EmotionalClose.tsx`

**Estado actual:** MemorableExperience intenta hacer esto pero no conecta con bodas

**Decisión:** 🔄 REEMPLAZAR MemorableExperience con nueva sección

**Propósito:** Cerrar con emoción. Aquí es donde sale el "inside" — la parte emotional del "cool on the outside, emotional on the inside".

**Copy propuesto:**

```
[Sección con fondo oscuro — Soft Charcoal o imagen con overlay]
[Texto centrado, mucho espacio]

"Ten years from now,
you'll open this book on a random Tuesday.

You'll see a name.
You'll remember a face.
You'll cook something that tastes like being loved.

That's what you're giving them.
Not a gift.
A kitchen full of people."

[Pausa]

"Still at the table."

[CTA final: "Start Your Book →"]
```

**Diseño:**
- Este es el momento editorial
- Tipografía grande, Minion Pro
- Mucho espacio
- Podría tener imagen de fondo sutil (cocina en soft focus, luz cálida)
- El "Still at the table" funciona casi como un logo/firma

**Alineación Margot:** Este es el momento donde Margot baja la guardia. No es cool aquí — es real. Pero llega a la emoción porque se la ganó con todo lo anterior. "A kitchen full of people" — eso es poesía que Margot diría con un nudo en la garganta que no deja ver.

---

## 2.9 FAQ
**Archivo:** `components/landing/FAQ.tsx`

**Estado actual:** 4 preguntas genéricas sobre el libro

**Decisión:** ✅ MANTENER componente, REESCRIBIR preguntas para contexto de bodas

**Preguntas propuestas:**

```
Q: "What if some guests don't cook?"
A: "Perfect. They can send a takeout order they'd die for. A sandwich they get every time. It's not about being a chef — it's about being in the book."

Q: "How long does it take?"
A: "Guests need about 5 minutes to submit. The whole process — from invites to printed book — takes 4-6 weeks."

Q: "What if people forget to send recipes?"
A: "We send up to 3 reminders per guest. Most books end up with 30-50+ recipes. People want to be part of this."

Q: "Is this just for the bride?"
A: "It's for their kitchen. Their meals. Their life. If they eat, it's for both of them."

Q: "What makes this different from a regular cookbook?"
A: "Every page has a name. Every recipe comes from someone who was there. It's not instructions — it's presence."
```

**Alineación Margot:** Las respuestas son directas, no defensivas. "Perfect." como primera palabra cuando alguien dice que no cocina — eso es Margot no dejando que la gente se descalifique.

---

## 2.10 FOOTER
**Archivo:** `components/landing/Footer.tsx`

**Estado actual:** Links, logo, info básica

**Decisión:** ✅ MANTENER, MODIFICAR copy del tagline

**Cambios:**
- [ ] Agregar brand line: "Small Plates — Still at the table."
- [ ] Revisar que el copy descriptivo esté alineado con nuevo messaging
- [ ] Asegurar que colores estén en la nueva paleta

---

## SECCIONES A ELIMINAR

| Componente | Razón |
|------------|-------|
| `TextSection.tsx` | Reemplazado por "The Solution" |
| `WellWhatIf.tsx` | El concepto de fears se integra mejor en "The Problem". El "Relax, it's just a plate" no pasa el Margot test. |
| `FoodPerfect.tsx` | "Food isn't supposed to be perfect" no conecta con el mensaje de bodas. Es filler. |
| `WhatsIncluded.tsx` | Ya está marcado como `hidden`. Los proof points se integran en otras secciones. |
| `ShareBanner.tsx` | Evaluar si tiene propósito. Si es genérico, eliminar. |
| `MemorableExperience.tsx` | Reemplazado por "Emotional Close" |

---

# Part 3: Visual Direction

## Paleta de Colores

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Honey** | #D4A854 | CTAs, botones, acentos, momentos de energía |
| **Warm White** | #FAF7F2 | Fondo principal, espacios de respiro |
| **Soft Charcoal** | #2D2D2D | Texto principal, logo |
| **Sand** | #E8E0D5 | Fondos secundarios, cards |
| **Terracotta** | #C4856C | Acento cálido secundario |
| **Warm Gray** | #9A9590 | Texto secundario, captions |

## Tipografía

- **Headlines:** Minion Pro (serif) — elegante, editorial
- **Body:** Inter (sans-serif) — legible, moderna
- **Tamaños:** Generosos, con mucho espacio entre líneas

## Fotografía / Imágenes

**Dirección general:**
- Golden hour, luz cálida
- Personas en movimiento (no posando a cámara)
- Manos, no caras (evita uncanny valley de AI)
- Comida real, imperfecta
- El libro como objeto vivido, no pristino

**Referencias de mood:**
- Kinfolk (ediciones tempranas, cálidas)
- Bon Appétit (era human, fun)
- Documentary wedding photography
- Mediterranean lifestyle

**Prompts base para AI:**

Para lifestyle:
```
"Editorial food photography, friends around dinner table, golden hour sunlight, warm color grading, candid moment, hands reaching for shared plates, Mediterranean villa aesthetic, film grain texture, shallow depth of field --ar 16:9 --style raw"
```

Para producto:
```
"Hardcover cookbook on marble kitchen counter, natural window light, warm tones, coffee cup nearby, fresh herbs in background, lived-in kitchen, editorial still life, Kinfolk magazine style --ar 4:5"
```

Para manos/detalles:
```
"Close-up hands turning cookbook pages, warm kitchen light, shallow depth of field, wedding ring visible, recipe page with handwritten notes, intimate moment, film photography aesthetic --ar 3:2"
```

---

# Part 4: CTAs

## CTA Primario
**Texto:** "Start Your Book"
**Color:** Honey (#D4A854) con texto blanco o Soft Charcoal
**Ubicaciones:** Hero, después de The Solution, Emotional Close

## CTA Secundario  
**Texto:** "Start a Book for Someone"
**Ubicación:** For Gift Givers section
**Estilo:** Outlined o variante menos prominente

## CTAs de Navegación
- "See How It Works" → scroll a sección
- "Preview a Book" → modal existente

---

# Part 5: Priorización de Implementación

## Fase 1: Core (Impacto Máximo)
1. **Hero** — Primera impresión, define todo
2. **The Problem** — Establece tensión (nueva)
3. **The Solution** — Presenta el producto (nueva, reemplaza otras)
4. **Emotional Close** — El cierre que convierte (nueva)

## Fase 2: Soporte
5. **How It Works** — Elimina fricción (rewrite)
6. **Proof/BooksPrinted** — Credibilidad (rewrite menor)
7. **For Gift Givers** — Captura segundo audience (nueva)

## Fase 3: Pulido
8. **FAQ** — Resuelve objeciones (rewrite)
9. **Banner** — Ajustes menores
10. **Footer** — Alineación final

## Cleanup
- Eliminar componentes deprecated
- Limpiar imports en page.tsx
- Verificar responsive en todo

---

# Part 6: Métricas de Éxito

## El Margot Test (Cualitativo)
Cada pieza de copy debe pasar:
> "¿Margot diría esto con una sonrisa de quien sabe que tiene razón?"

Si suena a greeting card → reescribir
Si suena a corporate → reescribir
Si suena a trying too hard → reescribir

## El Gut Check (Cuantitativo esperado)
- Tiempo en página: debería aumentar (narrativa más engaging)
- Scroll depth: debería mejorar (flujo más lógico)
- Click en CTA primario: debería aumentar (más claro, más compelling)
- Bounce rate: debería bajar (hook más fuerte)

---

# Aprobación

**Fecha de creación:** [Hoy]
**Versión:** 1.0

## Decisiones Finales:

### ✅ Book Preview Modal
**Decisión:** Mantener como elemento secundario.
- Ubicación: En sección Proof (BooksPrinted) 
- Trigger: Link "Preview a full book →" después del carrusel
- No es protagonista del flujo, pero está disponible para quien quiera profundizar

### ✅ Testimonios
**Decisión:** No incluir por ahora.
- El carrusel de recetas reales con nombres reales funciona como social proof implícito
- Margot no inventa — cuando haya testimonios reales, los agregamos
- El proof visual ("esto existe, estas son personas reales") es más auténtico que quotes genéricos

### ✅ Pricing
**Decisión:** Contextualizado, no protagonista. Incluir en dos lugares:

**En "For Gift Givers":**
```
"One gift from the group. 
Split among bridesmaids or family, it's less than most registry items — 
and infinitely more meaningful.

Books start at $120."
```

**En FAQ:**
```
Q: "How much does it cost?"
A: "Books start at $120 for up to 60 recipes. Most groups split the cost — 
meaning each person pays less than a typical wedding gift for something 
that actually matters."
```

**Lógica:** El precio ($100-150) es competitivo. El framing de "split among group" lo hace accesible ($15-25 por persona). La landing vende la idea primero; el precio viene cuando ya entienden el valor.

### ✅ Imágenes
**Decisión:** AI con dirección específica (prompts incluidos arriba).
- Foco en lifestyle sin rostros (manos, comida, libro)
- Golden hour, warm tones, Kinfolk aesthetic
- Se actualizará con assets reales cuando estén disponibles

---

# Documento Aprobado

**Status:** LISTO PARA IMPLEMENTACIÓN

**Orden de ejecución:**
1. Fase 1 (Core): Hero → The Problem → The Solution → Emotional Close
2. Fase 2 (Soporte): How It Works → Proof → For Gift Givers
3. Fase 3 (Pulido): FAQ → Banner → Footer → Cleanup

---

*Blueprint aprobado. Procedemos sección por sección.*