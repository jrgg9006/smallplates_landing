Rediseño del Step 1 — Gift-Giver Onboarding

**Contexto:** Estamos rediseñando el Step 1 del onboarding de gift-givers. El step actual pregunta "When's the big day?" con opciones de rango temporal (6+ months, 3-6 months, etc.). Vamos a reemplazarlo con una pregunta de fecha específica: "¿Cuándo quieres dar el libro?" con un date picker.

**Lo que hay que hacer:**

#### 1. Layout y estructura

El step mantiene la misma estructura visual que el onboarding actual: imagen a la izquierda (sin cambios), contenido a la derecha, progress stepper arriba, botones Back/Continue abajo.

**Contenido del step:**
```
Header (h1, bold, serif — igual que el actual):
"They're lucky to have you."

Subheader (body, medium weight):
"When do you want to give the book?"

Helper text (small, color warm-gray #9A9590):
"Pick the date — we'll count backward from there and make sure everything's ready."
```

#### 2. El Date Picker

Debajo del helper text, colocar un **date picker** que funcione así:

- **Estilo:** Minimalista, editorial. No usar el date picker nativo del browser. Usar un calendar picker custom o una librería como `react-day-picker` estilizada con los colores de la marca:
  - Fondo del calendario: Warm White `#FAF7F2`
  - Día seleccionado: Honey `#D4A854` con texto blanco
  - Hover: Sand `#E8E0D5`
  - Texto del calendario: Soft Charcoal `#2D2D2D`
  - Texto secundario (días fuera del mes): Warm Gray `#9A9590`
  - Bordes: muy sutiles, `#E8E0D5`
  - Font: Inter (el mismo del resto de la UI)
  - Border radius de la fecha seleccionada: full circle (50%)

- **Restricciones del calendario:**
  - Fecha mínima seleccionable: hoy + 14 días (necesitas al menos 12 días de producción + 2 días mínimos de recolección)
  - Fecha máxima seleccionable: hoy + 18 meses
  - Los días anteriores al mínimo aparecen en gris deshabilitado

- **Tamaño:** El calendario debe ocupar el ancho completo del área de contenido (igual que las radio options actuales), max-width ~420px.

#### 3. Contextual hint antes del calendario

Justo arriba del calendario (debajo del helper text), un pequeño bloque de contexto:
```
Texto (small, italic, color warm-gray #9A9590):
"Most people give it at the bridal shower or a family dinner before the wedding."
```

Este texto ayuda a educar sin presionar. Está alineado con "Moving, not pushing."

#### 4. El "momento mágico" — Timeline reveal

**Cuando el usuario selecciona una fecha**, aparece un bloque **debajo del calendario** con una animación suave (fade-in + slide-up, 300ms, ease-out). Este bloque muestra:
```
Contenedor:
- Background: #FAF7F2 (Warm White)
- Border: 1px solid #E8E0D5 (Sand)
- Border-radius: 12px
- Padding: 20px 24px
- Margin-top: 16px

Contenido:

Línea 1 (body, medium weight, Soft Charcoal #2D2D2D):
"Here's your timeline."

Línea 2 (con icono de libro 📖 o un icono SVG minimalista):
"Book closes: [fecha calculada = fecha seleccionada - 12 días]"
- Fecha en formato: "March 1, 2026"
- Font weight: semibold
- Color: Soft Charcoal #2D2D2D

Línea 3 (con icono de paquete 📦 o un icono SVG minimalista):
"Sincerely delivered: [fecha seleccionada]"
- Mismo formato que arriba

Línea 4 (small, color warm-gray #9A9590):
"We need 12 days to design, print, and ship. Everything before that is yours."
```

**Sobre los íconos:** No usar emojis. Usar íconos SVG minimalistas de línea (style: stroke, no fill, 1.5px stroke width, color `#9A9590`). Un ícono de libro abierto para la fecha de cierre, un ícono de caja/paquete para la entrega. Si usan Lucide icons (que ya tienen en el proyecto), usar `BookOpen` y `Package`.

**Si el usuario cambia la fecha después de haber seleccionado una**, el bloque de timeline se actualiza instantáneamente (sin re-animación, solo actualizar los valores).

#### 5. Opción "I don't know yet"

Debajo del bloque del calendario (o debajo del timeline reveal si ya apareció), un link de texto:
```
Texto (small, underline, color warm-gray #9A9590, cursor pointer):
"I don't know yet"
```

**Comportamiento al hacer click:**
- El calendario se oculta (o se deselecciona si ya había fecha)
- El timeline reveal desaparece
- En su lugar aparece un texto simple:
```
"No problem. You can set this anytime from your dashboard."
Color: Warm Gray #9A9590
Style: italic

El botón Continue se habilita
En la base de datos se guarda: gift_date: null, gift_date_undecided: true, book_close_date: null

6. Botón Continue

Deshabilitado por default (igual que ahora)
Se habilita cuando: (a) el usuario selecciona una fecha en el calendario, O (b) el usuario hace click en "I don't know yet"
Al hacer click en Continue, guardar en la base de datos:

Si seleccionaron fecha: gift_date: [fecha seleccionada], gift_date_undecided: false, book_close_date: [fecha - 12 días]
Si dijeron "I don't know yet": gift_date: null, gift_date_undecided: true, book_close_date: null
Ya no guardar wedding_timeline. Ese campo se depreca para nuevos registros.



7. Datos que se guardan
En purchase_intents (si estamos en el flujo pre-pago):

gift_date
gift_date_undecided
book_close_date
timeline → ya no se usa, dejar null para nuevos registros

En groups (si estamos en el flujo post-compra/activación):

gift_date
gift_date_undecided
book_close_date
wedding_timeline → ya no se usa, dejar null para nuevos registros

8. Mobile responsive
En mobile, el calendario debe adaptarse al ancho de pantalla. El layout del onboarding en mobile ya es full-width (sin imagen lateral). El calendario y el timeline reveal deben mantener sus proporciones pero ajustarse al 100% del ancho disponible con padding lateral de 20px.