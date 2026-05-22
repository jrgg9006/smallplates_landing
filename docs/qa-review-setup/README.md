# QA Review — guía de setup

Sigue estos pasos en orden. La feature **no funciona hasta que termines los 4 pasos**.

---

## Paso 1 — SQL en Supabase

Abre el SQL Editor de Supabase Dashboard y corre los bloques de [`sql.md`](./sql.md)
en orden:

1. Crear tabla `book_qa_reviews`
2. Habilitar RLS + policy de admin
3. Crear bucket de Storage `qa-temp`

Verifica con las queries del final de `sql.md`.

---

## Paso 2 — Variables de entorno

### En Vercel (proyecto Next.js)

| Var | Valor |
|---|---|
| `RAILWAY_AGENT_SECRET` | random hex de 64 chars (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SITE_URL` | tu URL pública (ej. `https://smallplatesandcompany.com`). Ya debería existir. |

Después del cambio, `vercel env pull` localmente para sincronizar `.env.local`.

### En Railway (microservicio)

| Var | Valor |
|---|---|
| `RAILWAY_AGENT_SECRET` | **EL MISMO** que en Vercel |
| `GEMINI_API_KEY` | de [Google AI Studio](https://aistudio.google.com/) |
| `NEXT_PUBLIC_SUPABASE_URL` | ya debería existir |
| `SUPABASE_SERVICE_ROLE_KEY` | ya debería existir |
| `NEXTJS_CALLBACK_URL` | `https://smallplatesandcompany.com/api/v1/admin/qa-review` |

---

## Paso 3 — Agregar el endpoint a Railway

Copia toda la carpeta `railway-qa-book/` (excluyendo `README.md`) al repo del
microservicio que ya corre en Railway:

```bash
# En el repo de Railway
mkdir -p qa_book
cp <este-repo>/docs/qa-review-setup/railway-qa-book/*.py qa_book/
```

Luego:

1. Edita `main.py` (o el archivo donde está la `app = FastAPI()`) para registrar el router:
   ```python
   from qa_book import router as qa_book_router
   app.include_router(qa_book_router)
   ```

2. Agrega las deps a `requirements.txt`:
   ```
   pdfplumber>=0.11
   google-genai>=0.5
   rapidfuzz>=3.0
   httpx>=0.27
   ```

3. Commitea y deploya en Railway. Verifica que arranca sin errores en los logs.

4. Smoke test:
   ```bash
   curl -i -X POST https://smallplatesweb-production-f5e1.up.railway.app/qa-book
   # → 401 (sin auth, correcto)

   curl -i -X POST https://smallplatesweb-production-f5e1.up.railway.app/qa-book \
     -H "Authorization: Bearer $RAILWAY_AGENT_SECRET"
   # → 422 (sin body, correcto — significa que el router está vivo)
   ```

---

## Paso 4 — Test end-to-end

1. Loguéate como admin en `https://smallplatesandcompany.com/admin`
2. Click en la card **🔍 QA Review**
3. Selecciona un libro reciente
4. Sube un PDF chico de prueba (puede ser cualquier PDF; el reporte va a ser malo
   pero confirma que el flujo funciona end-to-end)
5. Espera ~30-90 segundos a que aparezca el reporte
6. Verifica en Supabase Storage que `qa-temp/{group_id}/{review_id}.pdf` ya no existe
7. Verifica en la DB que `book_qa_reviews` tiene una fila con `status='complete'`

Si todo eso funciona, prueba con un PDF real del próximo libro a imprimir y revisa
si los findings son razonables.

---

## Troubleshooting

| Síntoma | Probable causa |
|---|---|
| Frontend dice "Railway did not respond within 10s" | Railway no está corriendo o el endpoint no existe. Revisa los logs del deploy. |
| Frontend dice "railway_error: HTTP 401" | El `RAILWAY_AGENT_SECRET` no coincide entre Vercel y Railway. |
| Status se queda en `processing` para siempre | Railway recibió el job pero no logra hacer el callback. Revisa que `NEXTJS_CALLBACK_URL` en Railway esté bien y que el callback HTTP no esté bloqueado. |
| Reporte siempre dice "página X no encontrada" para todas las recetas | El PDF tiene texto convertido a curvas (outlines). pdfplumber no puede extraerlo. Ricardo: en InDesign, en el export NO marques "Convert to outlines" para text frames. |
| `cost_usd` siempre $0 | `usage_metadata` no está siendo regresado por google-genai. No crítico — sólo afecta tracking. |

---

## Archivos generados (referencia)

```
docs/qa-review-setup/
├── README.md                              ← este archivo
├── sql.md                                 ← SQL para Supabase
└── railway-qa-book/                       ← copiar a Railway repo
    ├── README.md
    ├── __init__.py
    ├── router.py
    ├── models.py
    ├── pdf_extractor.py
    ├── deterministic_checks.py
    ├── gemini_visual.py
    ├── report_builder.py
    └── callback.py

# En Next.js (este repo)
lib/qa-review/
├── types.ts
├── railway-client.ts
└── book-context.ts

app/api/v1/admin/qa-review/
├── route.ts                                  ← GET list
├── upload/route.ts                           ← POST signed URL
├── start/route.ts                            ← POST dispatch Railway
└── [reviewId]/
    ├── route.ts                              ← GET / DELETE
    ├── complete/route.ts                     ← Railway callback
    └── retry/route.ts                        ← POST retry

app/(admin)/admin/qa-review/
├── page.tsx
└── components/
    ├── BookSelector.tsx
    ├── PdfUploader.tsx
    ├── ReviewProgress.tsx
    └── ReviewReport.tsx
```
