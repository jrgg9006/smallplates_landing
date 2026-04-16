Prompt para Claude Code — Auditoría completa del flujo de submission de recetas
Contexto y urgencia
Tenemos un bug crítico en producción: un guest no puede subir su receta. Es la segunda vez que ocurre con la misma persona, y se trata de la mamá de la novia — un caso de altísima sensibilidad para el negocio.
Guest afectada:

Name: Regina
Last name: Morones
guest_id: c98380bf-f7cd-41d9-9636-187a34346c86
user_id: fb21d616-0b50-456e-bd37-a24accab1524

Error visible en el cliente (screenshot adjunto por Ricardo):

new row violates row-level security policy for table "guest_recipes"

El error aparece al momento de presionar "Add my creation" en el último paso del flujo de submission. El contenido de la receta sí se renderizó correctamente en pantalla (se ve el paso "6. ENJOY!"), pero el INSERT a Supabase falla por RLS.

Objetivo
Hacer una auditoría completa y exhaustiva del flujo de submission de recetas por guests. El objetivo NO es arreglar nada todavía. Es:

Identificar exactamente por qué falló la receta de Regina.
Mapear todos los escenarios posibles en los que una receta de guest puede fallar al insertarse (no solo este caso).
Producir un reporte estructurado que Ricardo pueda analizar con Claude (en otra conversación) para decidir los next steps.

No escribas código. No apliques migraciones. No hagas cambios. Solo reporta.

Alcance de la auditoría
1. Mapeo del flujo completo de guest recipe submission
Traza, archivo por archivo, el camino completo que recorre una receta desde que el guest llega al flujo hasta que se persiste en Supabase:

Entry point: ¿Cómo llega el guest al formulario? (magic link, URL pattern, slug del book, etc.) ¿Qué parámetros trae la URL?
Autenticación: ¿Cómo se autentica el guest? ¿Usa Supabase Auth? ¿Es una sesión anónima? ¿Hay un JWT? ¿Dónde se establece la sesión?
Estado de la sesión durante el flujo: ¿Se renueva el token en algún punto? ¿Hay riesgo de que la sesión expire a mitad del flujo (especialmente si el guest tarda escribiendo la receta)?
Payload del INSERT: ¿Qué campos se envían exactamente al hacer el INSERT en guest_recipes? ¿De dónde viene cada valor (especialmente user_id, guest_id, book_id)?
Cliente Supabase usado: ¿Se usa el cliente autenticado del browser? ¿Hay alguna ruta que use el service role? ¿Hay edge functions o API routes intermedias?

Documenta rutas de archivos concretas, nombres de componentes, nombres de funciones, y las líneas relevantes.
2. Inventario de RLS policies en guest_recipes
Entrega los comandos SQL que Ricardo debe correr manualmente en Supabase para que tú puedas analizar los resultados. Ricardo correrá los queries y te pegará el output. Para cada query, explica qué estás buscando y qué sospechas.
Queries a incluir (mínimo):
sql-- 1. Todas las RLS policies activas en guest_recipes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'guest_recipes';

-- 2. Confirmar que RLS está habilitado
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'guest_recipes';

-- 3. Schema completo de guest_recipes (columnas, tipos, constraints, defaults)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'guest_recipes'
ORDER BY ordinal_position;

-- 4. Foreign keys y constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'guest_recipes'::regclass;
3. Diagnóstico específico del caso de Regina
Queries SQL que Ricardo correrá:
sql-- 5. ¿Existe Regina en la tabla de guests? ¿Qué datos tiene?
SELECT * FROM guests WHERE id = 'c98380bf-f7cd-41d9-9636-187a34346c86';

-- 6. ¿Existe el user_id asociado en auth.users?
SELECT id, email, created_at, last_sign_in_at, email_confirmed_at
FROM auth.users
WHERE id = 'fb21d616-0b50-456e-bd37-a24accab1524';

-- 7. ¿Cuál es el book_id al que pertenece Regina y cuál es su status?
-- (ajusta el nombre de la tabla/columna según tu schema real)
SELECT g.id AS guest_id, g.book_id, g.user_id, g.email, g.name, g.last_name,
       b.status AS book_status, b.title AS book_title
FROM guests g
LEFT JOIN books b ON b.id = g.book_id
WHERE g.id = 'c98380bf-f7cd-41d9-9636-187a34346c86';

-- 8. ¿Regina tiene ya alguna receta insertada (aunque sea parcial)?
SELECT id, created_at, status, user_id, guest_id, book_id, recipe_name
FROM guest_recipes
WHERE guest_id = 'c98380bf-f7cd-41d9-9636-187a34346c86'
   OR user_id = 'fb21d616-0b50-456e-bd37-a24accab1524'
ORDER BY created_at DESC;

-- 9. ¿Hay un link entre auth.users.id y guests.user_id?
-- Valida que el user_id de Regina en la tabla guests coincide con el user_id esperado
SELECT id, user_id, book_id, email FROM guests
WHERE user_id = 'fb21d616-0b50-456e-bd37-a24accab1524';
Ajusta los nombres de tablas y columnas si en el schema real son distintos (lee el código antes de generar los queries).
4. Enumeración exhaustiva de modos de falla
Produce una tabla/lista con todos los escenarios en los que el submission de un guest puede fallar. Para cada uno, documenta:

Escenario (descripción corta)
Causa raíz (qué mecanismo técnico lo provoca)
Síntoma visible (qué ve el guest)
Cómo detectarlo (query SQL, log, o señal en el código)
Severidad (crítico / alto / medio / bajo)

Categorías mínimas a cubrir:
A. Problemas de autenticación / sesión

Sesión expirada mientras el guest llena el form
Magic link ya usado / ya expirado
JWT corrupto o malformado
Guest abrió el link en un browser distinto al que recibió el email
Guest en modo incógnito / cookies bloqueadas
Múltiples tabs abiertas con sesiones distintas
Re-autenticación que genera un user_id nuevo distinto al que está en guests.user_id

B. Problemas de RLS policies

Policy pide que auth.uid() = user_id pero el payload envía un user_id distinto
Policy pide join con guests pero Regina tiene un mismatch entre guests.user_id y auth.uid()
Policy no cubre el caso del guest (solo cubre al owner/couple)
Policy tiene condición sobre book.status y el libro está en un status que bloquea inserts
Policy con WITH CHECK distinto a USING que causa rechazo en INSERT pero no en SELECT

C. Problemas de integridad / constraints

FK a book_id que ya no existe (libro cerrado/archivado)
UNIQUE constraint que bloquea reintento (ej. un intento parcial previo dejó un registro)
NOT NULL en un campo que el cliente no está enviando
Check constraint sobre algún campo (ej. longitud de texto, formato)

D. Problemas de payload / cliente

Campo obligatorio enviado como null o undefined
Tipos incorrectos (ej. guest_id como string vacío en lugar de UUID)
Payload demasiado grande (algún campo excede límite)
Encoding issues (caracteres especiales, emojis que no fueron limpiados upstream)

E. Problemas de estado del libro / guest

Libro ya cerrado y no acepta más recetas
Guest ya envió el máximo de recetas permitido
Guest fue removido/desactivado

F. Problemas de red / timing

Request timeout en conexiones lentas
Retry del cliente que crea duplicados

5. Hipótesis priorizada para el caso de Regina
Dado lo que veas en el código (antes de tener los resultados SQL), ordena de más a menos probable qué está causando el error de Regina específicamente. Justifica cada hipótesis con referencia al código que leíste.
Considera con atención el hecho de que es la segunda vez que le pasa a ella. Esto sugiere algo persistente en su estado, no un glitch transitorio — muy probablemente un mismatch entre auth.uid() de su sesión actual y el user_id que está registrado en su fila de guests, o bien que ya existe un registro parcial suyo que está disparando un conflicto.

Formato del reporte final
Entrega el reporte en este orden, como documento markdown:

Resumen ejecutivo (5 líneas máximo): qué encontraste, qué sospechas, qué necesitas para confirmar.
Mapa del flujo de submission (archivo por archivo, con rutas concretas).
SQL queries para Ricardo (bloque separado, listo para copiar-pegar en Supabase SQL Editor, con explicación de qué buscar en cada resultado).
Inventario de modos de falla (tabla estructurada).
Hipótesis priorizada sobre Regina (lista numerada con justificación).
Preguntas abiertas que no pudiste responder leyendo el código y que necesitan el output de los queries o información de Ricardo.


Reglas importantes

No hagas cambios en el código ni en la base de datos. Solo lee y reporta.
Si necesitas información de Supabase, dale a Ricardo el SQL exacto para correrlo manualmente y explica qué buscas. Él te pegará los resultados.
Sé exhaustivo pero legible. Ricardo va a leer esto con Claude en otra conversación para decidir next steps. Piensa en claridad de diagnóstico, no en velocidad de parche.
Si algo en el código te parece frágil o mal diseñado (no solo el bug actual), anótalo en una sección aparte de "observaciones arquitecturales" al final. No es el foco pero puede informar decisiones futuras.


Cuando termines la auditoría, entrega el reporte completo sin pedir confirmación intermedia.


Resultados de las qeuries echas por RG:

[
  {
    "conname": "guest_recipes_book_review_status_check",
    "pg_get_constraintdef": "CHECK ((book_review_status = ANY (ARRAY['pending'::text, 'approved'::text, 'needs_revision'::text])))"
  },
  {
    "conname": "guest_recipes_confidence_score_check",
    "pg_get_constraintdef": "CHECK (((confidence_score >= 0) AND (confidence_score <= 100)))"
  },
  {
    "conname": "guest_recipes_group_id_fkey",
    "pg_get_constraintdef": "FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE"
  },
  {
    "conname": "guest_recipes_guest_id_fkey",
    "pg_get_constraintdef": "FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE"
  },
  {
    "conname": "guest_recipes_pkey",
    "pg_get_constraintdef": "PRIMARY KEY (id)"
  },
  {
    "conname": "guest_recipes_source_check",
    "pg_get_constraintdef": "CHECK ((source = ANY (ARRAY['manual'::text, 'collection'::text])))"
  },
  {
    "conname": "guest_recipes_submission_status_check",
    "pg_get_constraintdef": "CHECK ((submission_status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'rejected'::text])))"
  },
  {
    "conname": "guest_recipes_upload_method_check",
    "pg_get_constraintdef": "CHECK (((upload_method)::text = ANY ((ARRAY['text'::character varying, 'audio'::character varying, 'image'::character varying])::text[])))"
  },
  {
    "conname": "guest_recipes_user_id_fkey",
    "pg_get_constraintdef": "FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE"
  },
  {
    "conname": "image_upscale_status_check",
    "pg_get_constraintdef": "CHECK (((image_upscale_status IS NULL) OR ((image_upscale_status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'ready'::character varying, 'error'::character varying, 'not_needed'::character varying])::text[]))))"
  },
  {
    "conname": "valid_dish_category",
    "pg_get_constraintdef": "CHECK (((dish_category IS NULL) OR ((dish_category)::text = ANY ((ARRAY['Starters & Snacks'::character varying, 'Soups & Salads'::character varying, 'Mains'::character varying, 'Sides'::character varying, 'Desserts'::character varying, 'Drinks & Others'::character varying])::text[]))))"
  }
]


