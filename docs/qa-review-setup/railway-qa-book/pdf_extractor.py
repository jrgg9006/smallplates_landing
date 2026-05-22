"""PDF text extraction via pdfplumber.

Returns text per page, normalized to Unicode NFC for stable fuzzy matching
against DB strings.
"""
from __future__ import annotations

import io
import unicodedata

import pdfplumber


def extract_text_per_page(pdf_bytes: bytes) -> list[str]:
    """Returns one string per page (1-indexed in human reports, 0-indexed here).

    Empty pages return ''. Text is NFC-normalized.
    """
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        pages_text: list[str] = []
        for page in pdf.pages:
            raw = page.extract_text() or ""
            pages_text.append(unicodedata.normalize("NFC", raw))
        return pages_text


def get_full_text(pages_text: list[str]) -> str:
    """Concatenated text across the whole book — useful for global presence checks."""
    return "\n".join(pages_text)
