"""Pydantic models for /qa-book."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


Severity = Literal["critical", "warning", "info"]
FindingSource = Literal["deterministic", "gemini"]
FindingCategory = Literal[
    "missing_recipe",
    "recipe_name_mismatch",
    "ingredients_mismatch",
    "instructions_mismatch",
    "missing_contributor",
    "missing_captain",
    "missing_couple_name",
    "missing_wedding_date",
    "empty_page",
    "text_overflow",
    "placeholder_unreplaced",
    "weird_character",
    "image_pixelated",
    "image_missing",
    "image_recipe_mismatch",
    "image_duplicate",
    "cover_issue",
    "intro_page_issue",
    "recipe_format_issue",
    "page_text_unreadable",
    "other",
]


# ─────────────────────────────────────────────────────────────────────────────
# Request body (from Next.js)
# ─────────────────────────────────────────────────────────────────────────────


class RecipeCtx(BaseModel):
    id: str
    recipe_name: str
    contributor_name: str
    ingredients: str
    instructions: str
    has_print_image: bool
    using_clean_text: bool


class CoupleCtx(BaseModel):
    display_name: str
    print_name: Optional[str] = None
    first_name_a: Optional[str] = None
    first_name_b: Optional[str] = None
    wedding_date: Optional[str] = None  # ISO date


class BookContext(BaseModel):
    group_id: str
    couple: CoupleCtx
    contributors: list[str]
    captains: list[str]
    recipes: list[RecipeCtx]


class QABookRequest(BaseModel):
    review_id: str
    storage_signed_url: str
    book_context: BookContext
    callback_url: str  # base URL — Railway appends /{review_id}/complete


# ─────────────────────────────────────────────────────────────────────────────
# Findings (output of both deterministic + Gemini)
# ─────────────────────────────────────────────────────────────────────────────


class QAFinding(BaseModel):
    source: FindingSource
    severity: Severity
    category: FindingCategory
    page: Optional[int] = Field(None, description="1-based page number; null if cross-document")
    description: str
    suggestion: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0, le=1)
    # For text-mismatch findings: include the diff for human review
    db_value: Optional[str] = None
    pdf_value: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Gemini-side schema (what we ask Gemini to return)
# ─────────────────────────────────────────────────────────────────────────────


class GeminiFinding(BaseModel):
    """Schema we send to Gemini via response_schema."""
    severity: Severity
    category: FindingCategory
    page: Optional[int]
    description: str
    suggestion: Optional[str] = None
    confidence: float = Field(ge=0, le=1)


class GeminiReport(BaseModel):
    findings: list[GeminiFinding]
    overall_notes: str


# ─────────────────────────────────────────────────────────────────────────────
# Callback to Next.js
# ─────────────────────────────────────────────────────────────────────────────


class CompleteCallback(BaseModel):
    status: Literal["complete", "failed"]
    findings: Optional[list[QAFinding]] = None
    human_summary: Optional[str] = None
    critical_count: Optional[int] = None
    warning_count: Optional[int] = None
    info_count: Optional[int] = None
    pdf_page_count: Optional[int] = None
    pdf_size_bytes: Optional[int] = None
    cost_usd: Optional[float] = None
    duration_ms: Optional[int] = None
    gemini_model: Optional[str] = None
    error_message: Optional[str] = None
