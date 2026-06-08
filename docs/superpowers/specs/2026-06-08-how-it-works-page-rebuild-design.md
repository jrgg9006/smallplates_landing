# Spec — Reconstrucción de `/how-it-works` (recorrido estilo Remento)

**Fecha:** 2026-06-08
**Autor:** Ricardo + Claude (brainstorming)
**Estado:** Aprobado para escribir plan de implementación
**Research base:** `docs/brands-research/storyworth-remento-landing-teardown.md` + teardown de `remento.co/how-it-works`

---

## 1. Objetivo

Dar al cliente una página donde quede **completamente claro**: cómo funciona, cuántos pasos son, cómo se ve, qué tan fácil es, cuánto tiempo toma, cuál es su compromiso — para que tome una decisión informada y se imagine en el proceso. Reduce fricción y miedos.

Modelo de referencia: el "How it works" de Remento (recorrido secuencial, cada paso = headline corto + descripción breve + imagen, con un timeline vertical que lo hace sentir corto y entendible). Robamos **estructura y conversión**, NO la voz (Remento usa palabras prohibidas para Margot).

El landing principal ya tiene un "How it works" de 3 pasos. Esta página es el **"learn more"**: el recorrido completo y detallado al que se llega desde un link en ese componente.

## 2. Decisiones tomadas (cerradas)

| Decisión | Resolución |
|---|---|
| Ruta | **Reconstruir** la `/how-it-works` existente (`app/(public)/how-it-works/page.tsx`), no crear ruta nueva. La actual está medio rota (referencia ~12 imágenes inexistentes) y fuera de marca (fuentes Tailwind crudas, grises en vez de tokens, voz fuera de Margot, typos). |
| Idioma | **Inglés** (es la ruta inglesa, enlazada desde el landing inglés). |
| Narrativa | **Plataforma multi-ocasión / free-tier** (motor neutral: boda, aniversario, cumpleaños, "un martes"). Encaja con el modelo de dos capas del teardown. |
| Esqueleto | **Recorrido lineal de 5 pasos.** Las 3 formas de juntar recetas viven DENTRO del paso 2. |
| Pricing | **"Free to start, pagas solo al imprimir."** Anclado en paso 1 y paso 5 + garantía. |
| Voz / estilo | Voz Margot + clases `type-*` (NO Tailwind crudo) + tokens de marca (honey `#D4A854`, warm-white `#FAF7F2`, charcoal `#2D2D2D`, sand `#E8E0D5`). |
| Scope de landing | Solo se toca `components/landing/HowItWorks.tsx` para añadir el link de entrada. **No** replicar a `regalos` / `regalos-usa` / otros (regla: solo el landing nombrado). |

## 3. Punto de entrada (landing)

En `components/landing/HowItWorks.tsx`, **debajo** de los 3 step cards, añadir un link secundario discreto (texto + flecha, no botón ruidoso) que apunte a `/how-it-works`.

- Copy provisional: **"See the whole thing, step by step →"**
- Estilo: tipografía `type-*` (p. ej. un `type-body-small` o link sobrio con la flecha), color charcoal/honey, alineado al centro como el bloque de heading.
- No alterar nada más del componente.

## 4. Estructura de la página (de arriba a abajo)

> Todo el copy es **provisional** y debe pasar por la skill `brand-guidelines` / voz Margot antes de publicarse. Evitar SIEMPRE: cherish, treasure, memories, special, unique, loved ones, celebrate, journey, curated, perfect, amazing.

### 4.0 Header
Mantener el header simple de logo centrado que ya existe (link al home). Minimal.

### 4.1 Hero
- **H1:** `How it works.` (sin signos de exclamación; el actual dice "How it works!").
- **Subhead (motor neutral, voz Margot):** *"Everyone who shows up sends a recipe. We turn them into a hardcover. Here's the whole thing, step by step."*
- Slot opcional para un video corto (1–2 min) **como placeholder a futuro** — NO se construye en v1.

### 4.2 El recorrido — timeline vertical sticky (núcleo)
Riel izquierdo con línea + puntos `STEP 1 … STEP 5`, visual alternando de lado (texto izquierda / imagen derecha, alternado). Patrón disciplinado por paso, calcado de Remento:

`STEP N` (etiqueta `type-eyebrow`) + headline corto (`type-subheading`/`type-heading`) + 2–4 líneas (`type-body-small`) + (a veces) **un micro-CTA de *muestreo*** (no de venta).

| # | Headline (provisional) | Descripción (provisional) | Imagen | Micro-CTA | Mata el miedo |
|---|---|---|---|---|---|
| 1 | Start your book. Free. | Set it up in two minutes — a wedding, an anniversary, a birthday, a regular Tuesday. Nothing to pay to begin. | `add_a_recipe.png` | — | "¿me comprometo sin saber?" |
| 2 | Gather the recipes. Three ways. | You add them yourself, share a link, or invite a few people to collect alongside you. Your people don't need an app or an account — they type it or snap a photo in five minutes. | `collect_iphone_mockup.png` + 3 chips inline, cada uno con una línea: *You add them · Share a link · Invite people* | — (los 3 chips inline ya son el contenido; sin micro-CTA para no duplicar) | "es complicado para mi gente" |
| 3 | We chase the stragglers. You don't. | Reminders go out until the recipes are in. You never have to nag anyone. | ⚠️ **falta asset** (mock de recordatorio/notificación) | — | "¿y si no participan?" (objeción #1) |
| 4 | Every recipe becomes a page. | We make a photo for each recipe and design the page. The messy text message becomes something that belongs on a shelf. | `recipe_example_banana.png` / `recipe_example_salmon.png` | See a recipe page → | "¿se va a ver barato?" |
| 5 | We print it. It ships to your door. | A full-color hardcover, about four weeks start to finish. You only pay when it's ready. | `book_in_hand_whitebackgound.png` | See inside a book → (`/from-the-book`) | "¿qué recibo / cuánto tardo?" |

Notas:
- El micro-CTA "See inside a book →" enlaza a `/from-the-book` (existe).
- "See a recipe page →" puede anclar (scroll) a la sección 4.3 (el wedge).
- Las 3 formas del paso 2 se muestran inline (3 chips con una línea cada uno); no hay micro-CTA separado para ellas.

### 4.3 El wedge — "We make it look good. But how?"
Sección dedicada al diferenciador (equivalente al "No writing required. But how?" de Remento). Mostrar **antes** (un texto/foto crudo tipo WhatsApp) → **después** (página diseñada con su propia foto). Usa `recipe_example_*`.
- Línea ancla (provisional): *"You send the real stuff. We make it a book."*
- ⚠️ Idealmente requiere un par **antes/después** real (el "antes" crudo falta como asset).

### 4.4 El miedo #1, como su propio beat
*"But what if people don't send anything?"* — respuesta corta: recordatorios automáticos + nosotros perseguimos + tú puedes agregar recetas tú mismo. Le damos superficie propia (el teardown insiste en esto para productos colaborativos). Puede ser una banda breve o un mini-FAQ de 1–2 preguntas.

### 4.5 Lo que recibes
El libro físico: tapa dura full-color, ~80 páginas, vive en la cocina. 1–2 fotos reales del libro (`book_in_hand_whitebackgound.png` u otras de la galería existente).

### 4.6 Ancla de precio / compromiso
Free to start · pagas solo cuando está listo · garantía. Ligero; enlaza a pricing. Reusar el framing de Celebrations/Remento ("solo pagas el libro").

### 4.7 CTA de cierre
Un solo botón transaccional: **"Start your book"** (lógica de auth existente: si hay user → `/profile/...`, si no → `/onboarding`). Más "← Back to home".

## 5. Fuera de scope (v1) — mencionar como futuro, NO construir
- Toggle "As a gift / For myself".
- Video del founder / video "still have questions".
- Replicar a otros landings.

## 6. Notas técnicas / implementación
- La página actual son ~570 líneas. La nueva debe quedar **modular y < 300 líneas**: extraer la data de los 5 pasos a un array y un componente `StepRow` (timeline + visual alternado). Mantener `"use client"` por las animaciones framer-motion y el `useAuth`.
- Reusar componentes existentes donde aplique (`Button`, `Carousel`, header, `WhatsAppFAB`).
- Animaciones: respetar el patrón actual del landing `HowItWorks` (clip-path reveal / fade-up con `framer-motion`).
- **No** introducir dependencias nuevas.
- Tras los cambios de TS, correr `npx tsc --noEmit` una sola vez al final (no por cada edit).

### Assets
**Disponibles:** `HowitWorks_images/{collect_iphone_mockup,sucess_iphone_mockup,book_in_hand_whitebackgound,how_step1,how_step2,how_step3}.png`, `how_it_works_profilesection/{add_a_recipe,recipe_example_banana,recipe_example_salmon}.png`.

**Faltan (listar para producir/generar):**
1. Paso 3 — visual de recordatorio/notificación automática.
2. Wedge 4.3 — par "antes" crudo (texto/foto de WhatsApp) que empareje con un `recipe_example_*` como "después".

Si los assets faltantes no están listos al implementar: usar un placeholder on-brand (no cuadro gris) y marcarlo como TODO de asset, sin romper el layout.

## 7. Criterios de éxito
- Un visitante entiende en < 60s: los 5 pasos, que toma ~4 semanas, que empieza gratis y paga solo al final, y qué recibe.
- La objeción "¿y si no participan?" queda explícitamente resuelta.
- Cero violaciones de tipografía (todo `type-*`) y cero palabras prohibidas de Margot.
- Página < 300 líneas, sin imágenes rotas, sin deps nuevas, `tsc` limpio.
