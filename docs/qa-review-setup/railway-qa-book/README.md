# Railway `/qa-book` endpoint — files to add to the Python repo

Estos archivos van en el repo del microservicio que ya corre en Railway
(`https://smallplatesweb-production-f5e1.up.railway.app`).

## Estructura sugerida

```
<railway-repo>/
├── qa_book/                     ← carpeta nueva (copiar archivos de aquí)
│   ├── __init__.py
│   ├── router.py                ← FastAPI router con POST /qa-book
│   ├── models.py                ← Pydantic models (request/response/findings)
│   ├── pdf_extractor.py         ← pdfplumber wrapper
│   ├── deterministic_checks.py  ← cross-check vs book_context
│   ├── gemini_visual.py         ← Gemini Files API + structured output
│   ├── report_builder.py        ← merge findings + human summary
│   └── callback.py              ← POST a Next.js cuando termina
├── main.py                      ← agregar `app.include_router(qa_book.router.router)`
└── requirements.txt             ← agregar deps de abajo
```

## Dependencias nuevas en `requirements.txt`

```
pdfplumber>=0.11
google-genai>=0.5
rapidfuzz>=3.0
httpx>=0.27
```

`pydantic`, `fastapi`, y `python-multipart` ya están (los usa el resto del microservicio).

## Variables de entorno en Railway

| Var | Para qué |
|---|---|
| `RAILWAY_AGENT_SECRET` | Bearer token compartido con Next.js. Cualquier valor random hex de 64 chars. |
| `GEMINI_API_KEY` | API key de Google AI Studio. |
| `NEXT_PUBLIC_SUPABASE_URL` | Para descargar el PDF de Storage. Ya existe si el microservicio actual lo usa. |
| `SUPABASE_SERVICE_ROLE_KEY` | Para descargar el PDF de Storage. Ya existe si el microservicio actual lo usa. |
| `NEXTJS_CALLBACK_URL` | `https://smallplatesandcompany.com/api/v1/admin/qa-review` (sin trailing slash). |

## Flujo

1. Next.js → `POST /qa-book` con bearer auth, body = `QABookRequest`.
2. Endpoint responde **202 Accepted** inmediato con `{job_id, accepted: true}`.
3. Procesa en background (`asyncio.create_task`):
   1. Descarga PDF desde el signed URL de Supabase.
   2. Extrae texto por página con pdfplumber.
   3. Corre `deterministic_checks` contra `book_context`.
   4. Sube PDF a Gemini Files API + corre `gemini_visual_review`.
   5. Combina ambos en `QAReport`.
   6. `POST` callback a Next.js con bearer auth.

## Smoke test

```bash
# Health check (debe devolver 401 sin token, 200 con token)
curl -i -X POST https://<railway-url>/qa-book

# Con token de prueba
curl -i -X POST https://<railway-url>/qa-book \
  -H "Authorization: Bearer $RAILWAY_AGENT_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"review_id":"00000000-0000-0000-0000-000000000000","storage_signed_url":"https://invalid","book_context":{},"callback_url":"https://example.com"}'
# Esperado: 202 Accepted (luego falla async porque la URL es inválida → llama callback con failed)
```
