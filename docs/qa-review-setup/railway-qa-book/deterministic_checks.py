"""Deterministic cross-check between book_context (DB) and the extracted PDF text.

These checks NEVER hallucinate. They use string similarity (rapidfuzz) for fuzzy
matching to handle minor formatting differences ("2 tbsp" vs "2 tablespoons").
"""
from __future__ import annotations

import unicodedata

from rapidfuzz import fuzz

from .models import BookContext, QAFinding


# ─────────────────────────────────────────────────────────────────────────────
# Tunable thresholds
# ─────────────────────────────────────────────────────────────────────────────

NAME_MATCH_THRESHOLD = 90  # ≥ this => OK; below => warning with diff
INGREDIENTS_MATCH_THRESHOLD = 90
INSTRUCTIONS_MATCH_THRESHOLD = 90
RECIPE_PRESENCE_THRESHOLD = 85  # for "is this recipe even in the PDF?"


def _normalize(s: str) -> str:
    """NFC + lowercase + collapse whitespace."""
    s = unicodedata.normalize("NFC", s or "")
    s = " ".join(s.split())
    return s.lower()


def _name_in_text(name: str, full_text: str, threshold: int = RECIPE_PRESENCE_THRESHOLD) -> bool:
    """True if `name` appears in `full_text` (partial fuzzy match)."""
    name_n = _normalize(name)
    text_n = _normalize(full_text)
    if not name_n or not text_n:
        return False
    # partial_ratio = best match of name as substring of full_text
    return fuzz.partial_ratio(name_n, text_n) >= threshold


def _best_page_for(name: str, pages_text: list[str]) -> int | None:
    """Returns 1-indexed page number with the highest match for `name`, or None."""
    name_n = _normalize(name)
    if not name_n:
        return None
    best_idx, best_score = None, 0
    for idx, page in enumerate(pages_text):
        score = fuzz.partial_ratio(name_n, _normalize(page))
        if score > best_score:
            best_score, best_idx = score, idx
    return (best_idx + 1) if best_idx is not None else None


# ─────────────────────────────────────────────────────────────────────────────
# Main entry
# ─────────────────────────────────────────────────────────────────────────────


def run_deterministic_checks(
    ctx: BookContext,
    pages_text: list[str],
) -> list[QAFinding]:
    findings: list[QAFinding] = []
    full_text = "\n".join(pages_text)

    # ─── Couple name ────────────────────────────────────────────────────────
    couple_name = ctx.couple.print_name or ctx.couple.display_name
    if couple_name and not _name_in_text(couple_name, full_text, threshold=80):
        findings.append(QAFinding(
            source="deterministic",
            severity="critical",
            category="missing_couple_name",
            page=None,
            description=f"No se encontró el nombre de la pareja ('{couple_name}') en el PDF.",
            suggestion="Verifica que la portada y/o página de intro tengan el nombre correcto.",
            db_value=couple_name,
        ))

    # ─── Wedding date ───────────────────────────────────────────────────────
    if ctx.couple.wedding_date:
        # Match either "2026-05-21" or common rendered forms (just check the year+month at least)
        date_str = ctx.couple.wedding_date
        year = date_str.split("-")[0] if "-" in date_str else date_str
        if year and year not in full_text:
            findings.append(QAFinding(
                source="deterministic",
                severity="info",
                category="missing_wedding_date",
                page=None,
                description=f"No se encontró el año de la boda ({year}) en el PDF. "
                            "Si la fecha aparece en otro formato (ej. 'Mayo 21'), ignora este aviso.",
                db_value=date_str,
            ))

    # ─── Contributors ───────────────────────────────────────────────────────
    for name in ctx.contributors:
        if not _name_in_text(name, full_text, threshold=85):
            findings.append(QAFinding(
                source="deterministic",
                severity="critical",
                category="missing_contributor",
                page=None,
                description=f"Contributor '{name}' no aparece en el PDF.",
                suggestion="Verifica la página de contributors al final del libro.",
                db_value=name,
            ))

    # ─── Captains ───────────────────────────────────────────────────────────
    for name in ctx.captains:
        if not _name_in_text(name, full_text, threshold=85):
            findings.append(QAFinding(
                source="deterministic",
                severity="critical",
                category="missing_captain",
                page=None,
                description=f"Captain '{name}' no aparece en el PDF.",
                suggestion="Verifica la página de capitanes / agradecimientos.",
                db_value=name,
            ))

    # ─── Recipes: presence + content match ──────────────────────────────────
    for recipe in ctx.recipes:
        # Presence check
        recipe_page = _best_page_for(recipe.recipe_name, pages_text)
        if recipe_page is None or fuzz.partial_ratio(
            _normalize(recipe.recipe_name),
            _normalize(pages_text[recipe_page - 1]) if recipe_page else "",
        ) < RECIPE_PRESENCE_THRESHOLD:
            findings.append(QAFinding(
                source="deterministic",
                severity="critical",
                category="missing_recipe",
                page=recipe_page,
                description=f"Receta '{recipe.recipe_name}' (de {recipe.contributor_name}) "
                            "no encontrada con suficiente confianza en el PDF.",
                suggestion="Verifica si la receta está en el libro y con el nombre correcto.",
                db_value=recipe.recipe_name,
            ))
            continue  # No tiene caso comparar ingredientes/instrucciones si no la encontramos

        page_text = pages_text[recipe_page - 1]
        page_text_n = _normalize(page_text)

        # Name match
        name_score = fuzz.partial_ratio(_normalize(recipe.recipe_name), page_text_n)
        if name_score < NAME_MATCH_THRESHOLD:
            findings.append(QAFinding(
                source="deterministic",
                severity="warning",
                category="recipe_name_mismatch",
                page=recipe_page,
                description=f"Nombre de receta posiblemente diferente al esperado "
                            f"(similarity {name_score}%, threshold {NAME_MATCH_THRESHOLD}%).",
                suggestion="Compara el nombre en DB vs. el del PDF. Posible discrepancia.",
                db_value=recipe.recipe_name,
                pdf_value=page_text[:200],
                confidence=name_score / 100,
            ))

        # Ingredients match
        ing_score = fuzz.token_set_ratio(_normalize(recipe.ingredients), page_text_n)
        if ing_score < INGREDIENTS_MATCH_THRESHOLD:
            findings.append(QAFinding(
                source="deterministic",
                severity="warning",
                category="ingredients_mismatch",
                page=recipe_page,
                description=f"Ingredientes con similitud {ing_score}% vs. DB. "
                            "Posible diferencia (puede ser solo formato).",
                suggestion="Revisa visualmente si todos los ingredientes están y están bien escritos.",
                db_value=recipe.ingredients[:500],
                pdf_value=page_text[:500],
                confidence=ing_score / 100,
            ))

        # Instructions match
        inst_score = fuzz.token_set_ratio(_normalize(recipe.instructions), page_text_n)
        if inst_score < INSTRUCTIONS_MATCH_THRESHOLD:
            findings.append(QAFinding(
                source="deterministic",
                severity="warning",
                category="instructions_mismatch",
                page=recipe_page,
                description=f"Instrucciones con similitud {inst_score}% vs. DB.",
                suggestion="Revisa si las instrucciones del PDF coinciden con la versión limpia.",
                db_value=recipe.instructions[:500],
                pdf_value=page_text[:500],
                confidence=inst_score / 100,
            ))

        # Was the recipe using clean text? If not, flag it as info.
        if not recipe.using_clean_text:
            findings.append(QAFinding(
                source="deterministic",
                severity="info",
                category="other",
                page=recipe_page,
                description=f"Receta '{recipe.recipe_name}' está usando el texto ORIGINAL "
                            "(no la versión limpia de recipe_print_ready).",
                suggestion="Si esperabas la versión limpia, revisa por qué no se generó.",
            ))

    # ─── Pages with very little extractable text (text-as-outlines?) ────────
    for idx, page in enumerate(pages_text, start=1):
        if 0 < len(page.strip()) < 30:
            findings.append(QAFinding(
                source="deterministic",
                severity="info",
                category="page_text_unreadable",
                page=idx,
                description=f"Página {idx} tiene muy poco texto extraíble ({len(page.strip())} chars). "
                            "Puede ser una página de imagen o tener texto convertido a curvas.",
            ))

    return findings
