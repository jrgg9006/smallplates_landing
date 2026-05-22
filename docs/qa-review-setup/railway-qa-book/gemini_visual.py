"""Gemini 2.5 Pro visual review of the PDF.

Uses google-genai (the unified SDK). Uploads PDF to Files API, asks for
structured output via response_schema.
"""
from __future__ import annotations

import asyncio
import json
import os

from google import genai
from google.genai import types as genai_types

from .models import BookContext, GeminiReport, QAFinding


MODEL = "gemini-2.5-pro"
MAX_OUTPUT_TOKENS = 32000


PROMPT_TEMPLATE = """Eres un revisor de calidad para libros de recetas físicos impresos.

Te paso el PDF completo de un libro de recetas para una boda. Tu trabajo es encontrar
problemas VISUALES que harían que el libro NO esté listo para imprimirse.

## Contexto del libro

Pareja: {couple_name}
Recetas esperadas: {recipe_count} recetas de {contributor_count} personas.

Recetas del libro (de la base de datos — esto es lo que DEBE estar en el PDF):
{recipes_summary}

## Qué busco que reportes

Busca específicamente:

1. **Hojas vacías** — páginas completamente en blanco o casi en blanco.
2. **Texto cortado / overflow** — texto que sale del marco visible.
3. **Placeholders sin reemplazar** — strings como "{{NAME}}", "Loading...", "TBD", "lorem ipsum", "undefined", etc.
4. **Caracteres raros** — emojis (🍕, 😀, etc.), símbolos que se ven mal en print, caracteres unicode rotos.
5. **Imágenes pixeladas o borrosas** — fotos que se ven de baja resolución.
6. **Imágenes vacías** — cuadros donde debería haber foto pero está vacío o blanco.
7. **Foto-receta mismatch** — la imagen NO concuerda con la receta (ej. receta es "Lasagna" pero la foto es de tacos).
8. **Foto duplicada** — la misma imagen aparece en múltiples recetas.
9. **Portada con problemas** — falta el nombre de la pareja, falta la fecha, o algo extraño.
10. **Formato de receta roto** — una receta sin título, sin ingredientes, sin instrucciones o sin foto.

## Qué NO me importa (NO lo reportes)

- CMYK vs RGB, color matching, profundidad de color
- Sangrados, márgenes de impresión, bleed
- Kerning fino, viudas, huérfanas, tracking
- DPI de impresión (a menos que sea OBVIAMENTE pixelado)
- Cosas que requieren ojo de print designer
- Decisiones estéticas (a menos que rompan el formato del libro)

## Formato de salida

Devuelve JSON estructurado con un array `findings` y un campo `overall_notes` con observaciones generales.

Cada finding debe llevar:
- `severity`: "critical" (debe corregirse antes de imprimir), "warning" (probablemente debe revisarse), o "info" (FYI).
- `category`: una de las categorías predefinidas en el schema.
- `page`: el número de página (1-indexed) donde está el problema. Si es del libro entero, usa null.
- `description`: descripción clara y específica en español.
- `suggestion`: qué hacer (opcional pero recomendado).
- `confidence`: 0.0–1.0, qué tan seguro estás. Si confidence < 0.7, baja severity a "info".

Sé estricto con confidence. Si dudas si es un problema real, ponlo en info con confidence baja.
Es mejor reportar de más con confidence baja que omitir un problema crítico.

Si todo se ve bien, devuelve `findings: []` y un `overall_notes` positivo.
"""


def _build_prompt(ctx: BookContext) -> str:
    recipes_summary = "\n".join(
        f"  • '{r.recipe_name}' — {r.contributor_name}"
        for r in ctx.recipes[:50]  # truncate for prompt size if huge
    )
    if len(ctx.recipes) > 50:
        recipes_summary += f"\n  ... y {len(ctx.recipes) - 50} más"

    couple_name = ctx.couple.print_name or ctx.couple.display_name

    return PROMPT_TEMPLATE.format(
        couple_name=couple_name,
        recipe_count=len(ctx.recipes),
        contributor_count=len(ctx.contributors),
        recipes_summary=recipes_summary,
    )


def _gemini_to_qa_finding(g_finding) -> QAFinding:
    """Convert Gemini schema finding into our internal QAFinding."""
    # If Gemini confidence is low, demote severity to info
    severity = g_finding.severity
    if g_finding.confidence < 0.7 and severity != "info":
        severity = "info"
    return QAFinding(
        source="gemini",
        severity=severity,
        category=g_finding.category,
        page=g_finding.page,
        description=g_finding.description,
        suggestion=g_finding.suggestion,
        confidence=g_finding.confidence,
    )


async def gemini_visual_review(
    pdf_bytes: bytes,
    ctx: BookContext,
) -> tuple[list[QAFinding], str, float]:
    """Returns (findings, overall_notes, estimated_cost_usd).

    `estimated_cost_usd` is approximate based on token count.
    """
    api_key = os.environ["GEMINI_API_KEY"]
    client = genai.Client(api_key=api_key)

    # Upload PDF to Files API (Gemini 2.5 Pro requires this for >inline limit)
    # Use asyncio.to_thread because google-genai upload is sync
    pdf_file = await asyncio.to_thread(
        client.files.upload,
        file=pdf_bytes,
        config={"mime_type": "application/pdf"},
    )

    try:
        prompt = _build_prompt(ctx)
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=MODEL,
            contents=[prompt, pdf_file],
            config=genai_types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GeminiReport,
                max_output_tokens=MAX_OUTPUT_TOKENS,
                temperature=0.2,  # We want deterministic-ish review, not creative
            ),
        )

        # Parsed structured output
        report: GeminiReport = response.parsed  # type: ignore[assignment]

        # Fallback: if response.parsed is None (rare), try to parse JSON manually
        if report is None and response.text:
            try:
                data = json.loads(response.text)
                report = GeminiReport(**data)
            except Exception:
                report = GeminiReport(findings=[], overall_notes=response.text or "")

        findings = [_gemini_to_qa_finding(f) for f in report.findings]

        # Rough cost estimate: input tokens × price + output tokens × price
        # Gemini 2.5 Pro: $1.25/MTok input ≤200K, $10/MTok output ≤200K
        # PDF tokens ~258/page, so we estimate from usage_metadata when available
        usage = getattr(response, "usage_metadata", None)
        cost_usd = 0.0
        if usage:
            input_tok = getattr(usage, "prompt_token_count", 0) or 0
            output_tok = getattr(usage, "candidates_token_count", 0) or 0
            input_price = 1.25 if input_tok <= 200_000 else 2.50
            output_price = 10.00 if input_tok <= 200_000 else 15.00
            cost_usd = (input_tok / 1_000_000) * input_price + (output_tok / 1_000_000) * output_price

        return findings, report.overall_notes, round(cost_usd, 4)

    finally:
        # Clean up uploaded file (Gemini keeps for 48h anyway, but we delete proactively)
        try:
            await asyncio.to_thread(client.files.delete, name=pdf_file.name)
        except Exception:
            pass  # Best-effort cleanup
