# 📚 Cómo Funciona la Subida de Recetas con Imágenes en SmallPlates

## 🎯 Resumen General
Cuando un usuario sube una receta con imagen en SmallPlates, ocurre un proceso fascinante que involucra múltiples pasos y tecnologías. Esta guía te explicará todo de forma simple y clara.

## 🧩 Conceptos Básicos

### ¿Qué es un Helper?
Un **helper** es como un asistente especializado. Imagínalo como un empleado experto que sabe hacer UNA cosa muy bien. Por ejemplo:
- Un helper sabe cómo subir archivos a Supabase
- Otro helper sabe cómo procesar imágenes
- Otro helper sabe cómo generar prompts

**Archivo principal**: `/lib/supabase/` (aquí viven todos nuestros helpers)

### ¿Qué es una Función?
Una **función** es como una receta de cocina: tiene pasos específicos para lograr algo. Por ejemplo:
- `addRecipeWithFiles()` = "Receta para agregar una receta con fotos"
- `processRecipeImage()` = "Receta para extraer texto de una imagen"

### ¿Qué es un Handler?
Un **handler** es como un coordinador que recibe peticiones y decide qué hacer. Vive en las rutas API:
- **Ubicación**: `/app/api/v1/`
- **Ejemplo**: `process-image/route.ts` maneja cuando alguien quiere procesar una imagen

## 📍 Los 4 Puntos de Entrada para Subir Recetas

### 1. **AddRecipeModal** (Usuario Autenticado)
- **Ubicación**: `/components/profile/recipes/AddRecipeModal.tsx`
- **¿Cuándo se usa?**: Cuando un usuario registrado quiere agregar una receta desde su perfil
- **¿Qué hace?**: Muestra un modal con opciones de texto o imagen

### 2. **RecipeJourneyWrapper** (Invitados)
- **Ubicación**: `/components/recipe-journey/RecipeJourneyWrapper.tsx`
- **¿Cuándo se usa?**: Cuando un invitado sube una receta mediante link de colección
- **¿Qué hace?**: Guía paso a paso al invitado

### 3. **CollectionForm** (Página Pública)
- **Ubicación**: `/app/(public)/collect/[token]/CollectionForm.tsx`
- **¿Cuándo se usa?**: Cuando alguien accede con un link público
- **¿Qué hace?**: Permite buscar su nombre y agregar receta

### 4. **Grupos/Cookbooks**
- **Ubicación**: Varios componentes en `/components/profile/guests/`
- **¿Cuándo se usa?**: Para eventos especiales o libros de cocina
- **¿Qué hace?**: Agrupa recetas por tema/evento

## 🔄 El Flujo Completo: Paso a Paso

### Paso 1: Usuario Selecciona Imagen
```
Usuario → Hace clic en "Subir Imagen" → Se abre selector de archivos
```

### Paso 2: Validación en Frontend
```javascript
// En RecipeImageUpload.tsx
- Verifica el tamaño (máximo 10MB)
- Verifica el tipo (imágenes o PDF)
- Muestra vista previa
```

### Paso 3: Staging (Área Temporal)
```javascript
// Función: uploadFilesToStagingWithClient()
// Ubicación: /lib/supabase/storage.ts
```
- Las imágenes se suben primero a una carpeta temporal
- ¿Por qué? Para evitar archivos huérfanos si algo falla

### Paso 4: Crear Registro de Receta
```javascript
// Función: addRecipeWithFiles()
// Ubicación: /lib/supabase/recipes.ts
```
- Se crea la receta con texto placeholder ("Ver imágenes subidas")
- Se obtiene el ID de la receta

### Paso 5: Mover Archivos a Ubicación Final
```javascript
// Función: moveFilesToFinalLocationWithClient()
// Estructura final: /user_id/guest_id/recipe_id/archivo.jpg
```
- Los archivos se organizan jerárquicamente
- Se actualiza la receta con las URLs finales

### Paso 6: Procesamiento de Imagen (NUEVO)
```javascript
// Función: processRecipeImage()
// Ubicación: /lib/supabase/imageProcessing.ts
```
1. Envía la URL de imagen al microservicio en Railway
2. El agente analiza la imagen y extrae:
   - Título de la receta
   - Ingredientes
   - Instrucciones
3. Actualiza la receta con los datos extraídos

### Paso 7: Generación de Prompt (Opcional)
```javascript
// Endpoint: /api/v1/midjourney/generate-prompt
```
- Si hay texto extraído, genera un prompt para Midjourney
- Guarda el prompt en la tabla `midjourney_prompts`

## 🗂️ Estructura de Archivos Importantes

```
smallplates_landing/
├── lib/supabase/
│   ├── recipes.ts          # Funciones principales para recetas
│   ├── storage.ts          # Manejo de archivos
│   ├── imageProcessing.ts  # Procesamiento de imágenes (NUEVO)
│   └── collection.ts       # Funciones para invitados
│
├── app/api/v1/
│   └── midjourney/
│       ├── generate-prompt/   # Genera prompts de texto
│       └── process-image/     # Procesa imágenes (NUEVO)
│
└── components/
    ├── profile/recipes/
    │   ├── AddRecipeModal.tsx     # Modal principal
    │   └── RecipeImageUpload.tsx  # Componente de carga
    │
    └── recipe-journey/
        └── ImageUploadStep.tsx    # Paso de imagen para invitados
```

## 🔧 ¿Por Qué lo Hicimos Así?

### 1. **Separación de Responsabilidades**
- Cada helper hace UNA cosa bien
- Fácil de mantener y debuggear
- Reutilizable en diferentes partes

### 2. **Sistema de Staging**
- Evita archivos huérfanos
- Permite cancelar sin dejar basura
- Organización limpia

### 3. **Microservicios para IA**
- El procesamiento pesado ocurre fuera de Next.js
- No bloquea la aplicación principal
- Escalable independientemente

### 4. **Actualizaciones Progresivas**
- Primero guarda con placeholders
- Luego actualiza con datos reales
- Usuario ve progreso inmediato

## 🛤️ Flujos Potenciales

### Flujo Exitoso:
1. ✅ Usuario sube imagen
2. ✅ Se guarda en staging
3. ✅ Se crea receta
4. ✅ Se mueve archivo
5. ✅ Se extrae texto
6. ✅ Se actualiza receta
7. ✅ Se genera prompt

### Flujo con Error en OCR:
1. ✅ Usuario sube imagen
2. ✅ Se guarda en staging
3. ✅ Se crea receta
4. ✅ Se mueve archivo
5. ❌ Falla extracción
6. ⚠️ Mantiene placeholder
7. ✅ Usuario puede editar manualmente

### Flujo con Cancelación:
1. ✅ Usuario sube imagen
2. ✅ Se guarda en staging
3. ❌ Usuario cancela
4. 🧹 Se limpia staging
5. ✅ No hay basura

## 💡 Tips para Entender Mejor

1. **Sigue el Flujo**: Empieza en el componente UI y sigue las llamadas
2. **Lee los Logs**: Agregamos muchos `console.log` informativos
3. **Busca Patterns**: El patrón staging→final se repite
4. **Piensa en Errores**: Cada paso considera qué puede fallar

## 🎨 Diagrama Visual del Proceso

```
[Usuario] → [Frontend/UI] → [Helper de Subida]
                                ↓
                          [Staging Temporal]
                                ↓
                          [Crear Receta DB]
                                ↓
                          [Mover a Final]
                                ↓
                     [Microservicio Railway]
                                ↓
                         [Extraer Datos]
                                ↓
                        [Actualizar Receta]
                                ↓
                        [Generar Prompt]
```

## 🚀 Beneficios del Sistema Actual

1. **Confiabilidad**: Si algo falla, no perdemos datos
2. **Velocidad**: Usuario ve progreso inmediato
3. **Escalabilidad**: Microservicios pueden crecer independiente
4. **Flexibilidad**: Fácil agregar nuevos procesadores
5. **Organización**: Archivos bien estructurados
6. **UX Mejorada**: Extracción automática ahorra tiempo

## ❓ Preguntas Frecuentes

**¿Por qué no procesamos la imagen inmediatamente?**
- Para dar feedback rápido al usuario
- El OCR puede tardar varios segundos
- Mejor crear la receta y actualizar después

**¿Qué pasa si Railway está caído?**
- La receta se guarda con placeholders
- Usuario puede editar manualmente
- Sistema sigue funcionando

**¿Por qué staging y no directo a final?**
- Evita archivos huérfanos si falla la creación
- Permite organizar con IDs correctos
- Facilita limpieza en cancelaciones

## 📝 Notas Finales

Este sistema está diseñado para ser:
- **Robusto**: Maneja errores gracefully
- **Eficiente**: Optimizado para UX
- **Mantenible**: Código organizado y claro
- **Extensible**: Fácil agregar features

Cada decisión fue tomada pensando en la experiencia del usuario y la facilidad de mantenimiento a largo plazo.