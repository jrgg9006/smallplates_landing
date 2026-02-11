# Small Plates - Instrucciones para Generar Recetas en InDesign

## Requisitos Previos

- Node.js instalado en tu Mac
- InDesign con tu template abierto
- Acceso a internet (para bajar datos de Supabase)

---

## PASO 1: Configurar el Group ID

Antes de bajar las recetas, necesitas saber el `GROUP_ID` del grupo que quieres exportar.

1. Abre el archivo `scripts/indesign/fetch-recipes.js`
2. Busca la linea 28, donde dice:
   ```js
   const GROUP_ID = 'da1ff076-b5a4-4a07-8296-3dbedea67f48';
   ```
3. Si necesitas otro grupo, reemplaza ese ID por el correcto
   - Puedes encontrar el Group ID en la URL del dashboard de operations: `operations/groups/{GROUP_ID}`
4. Guarda el archivo

---

## PASO 2: Bajar las Recetas de Supabase

1. Abre **Terminal** en tu Mac (Cmd + Espacio, escribe "Terminal", Enter)
2. Navega al proyecto:
   ```
   cd /Users/macbook/Desktop/smallplates_landing
   ```
3. Ejecuta el script:
   ```
   node scripts/indesign/fetch-recipes.js
   ```
4. Espera a que termine. Veras algo como:
   ```
   Se encontraron 72 recetas
   Estado de imagenes:
      65 con imagen print-ready (4x upscaled)
      5 solo con imagen original (sin upscale)
      2 sin ninguna imagen
   Procesando imagenes...
   ```
5. Cuando termine, el script genera:
   - **JSON**: `scripts/indesign/output/recipes.{GROUP_ID}.json`
   - **Imagenes**: `scripts/indesign/output/images/{GROUP_ID}/` (una imagen por receta)

> **Ojo:** Si ves recetas listadas como "SIN IMAGEN PRINT-READY", significa que esas usaron la imagen original (menor resolucion). Puedes subir la imagen nuevamente en Operations para que se genere la version upscaled.

---

## PASO 3: Preparar el Template en InDesign

1. Abre **InDesign**
2. Abre tu archivo de template (el `.indd` con el diseno de recetas)

### 3a. Parent Page (Master Page)

Tu Parent Page debe tener los text frames con los placeholders y el frame de imagen. Los placeholders deben contener **exactamente** estos textos (incluyendo los `<<` y `>>`):

| Placeholder | Se reemplaza por |
|---|---|
| `<<recipe_name>>` | Nombre de la receta |
| `<<guest_name>>` | Nombre del invitado |
| `<<comments>>` | Comentarios/dedicatoria |
| `<<ingredients>>` | Lista de ingredientes |
| `<<instructions>>` | Instrucciones de preparacion |

El frame de imagen debe tener el Script Label `{{IMAGE}}`:
1. Selecciona el frame de imagen en el Parent Page
2. Ve a: **Window > Utilities > Script Label**
3. Escribe exactamente: `{{IMAGE}}`
4. Click fuera del campo para confirmar

### 3b. Crear el Spread Template (con Override)

El script no puede modificar items del Parent Page directamente. Necesitas crear un spread con los items "overrideados":

1. Crea una nueva dupla de paginas (spread)
2. Asignale tu Parent Page como template
3. **Override cada elemento**: haz **Cmd + Shift + Click** en cada text frame y en el frame de imagen, uno por uno
   - Esto "desbloquea" cada elemento para que el script pueda editarlo
   - **IMPORTANTE: Hazlo en orden de arriba hacia abajo, izquierda a derecha.** El orden correcto es:
     1. guest_name
     2. recipe_name (titulo)
     3. comments
     4. ingredients
     5. instructions
     6. frame de imagen (pagina derecha)
     7. footer (pagina derecha)
   - Si no se hace en este orden, los frames pueden desalinearse al duplicar el spread
4. Navega a ese spread y asegurate de que sea el que esta **visible/activo** en tu pantalla
5. El script usara ESE spread como base para duplicar

---

## PASO 4: Ejecutar el Script en InDesign

1. En InDesign, ve a: **Window > Utilities > Scripts** (se abre el panel de Scripts)
2. En el panel de Scripts, haz click derecho en **"User"**
3. Selecciona **"Reveal in Finder"** - se abre una carpeta en Finder
4. Copia el archivo `create-recipes.jsx` a esa carpeta
   - El archivo esta en: `scripts/indesign/create-recipes.jsx`
   - Solo necesitas hacer esto la primera vez (o cuando actualices el script)
5. De vuelta en InDesign, en el panel Scripts, deberia aparecer `create-recipes.jsx` bajo "User"
   - Si no aparece, haz click derecho y "Refresh"
6. **Asegurate de estar viendo el spread template** (navega a el si no lo estas viendo)
7. Haz **doble click** en `create-recipes.jsx` en el panel de Scripts

---

## PASO 5: Seleccionar el JSON

1. Se abre un dialogo de archivo pidiendo el JSON
2. Navega a: `Desktop > smallplates_landing > scripts > indesign > output`
3. Selecciona el archivo `recipes.{GROUP_ID}.json`
4. Click en **"Open"**

---

## PASO 6: Confirmar y Esperar

1. Aparece un dialogo: "Se crearan X spreads. Y tienen imagen. Continuar?"
2. Click en **"OK"**
3. Aparece una barra de progreso mostrando cada receta que se va procesando
4. **No toques nada** mientras corre - dejalo trabajar
5. Cuando termine, te pregunta: "Eliminar template original?"
   - **Si** = borra el spread template (el primero), dejando solo las recetas generadas
   - **No** = conserva el template al inicio del documento

---

## PASO 7: Revisar el Resultado

1. Revisa el mensaje final. Si dice **"RECETAS CON OVERFLOW"**, esas recetas tienen texto que no cabe en los text frames
2. Para las recetas con overflow:
   - Navega a ese spread
   - Ajusta el tamano del texto manualmente
   - O edita el texto en la base de datos (version print-ready) y vuelve a correr el proceso
3. Revisa que las imagenes se vean bien en cada spread
4. Guarda tu documento InDesign

---

## Preguntas Frecuentes

### Cambie el diseno pero mantuve los paragraph styles, funciona?
**Si.** El script no toca los paragraph styles. Solo hace find/replace del texto dentro de los frames existentes, respetando todo el formato que ya tengas. Puedes cambiar fuentes, tamanos, colores, layout, posicion de frames, etc.

### Que pasa si agrego o quito recetas despues?
Vuelve a correr todo el proceso desde el Paso 2. El script siempre genera todo desde cero.

### Puedo correr el script varias veces?
Si, pero cada vez que lo corras se **agregan** nuevos spreads al documento. Si quieres empezar limpio, usa Cmd+Z para deshacer o abre el template original de nuevo.

### Una receta no tiene imagen, que pasa?
El frame con label `{{IMAGE}}` se queda vacio. Puedes colocar la imagen manualmente despues.

### Como cambio el orden de las recetas?
El JSON viene ordenado alfabeticamente por `recipe_name`. Si quieres otro orden, puedes editar el JSON manualmente antes de correr el script en InDesign.

### Donde esta el backup del script anterior?
En `scripts/indesign/backups/`
