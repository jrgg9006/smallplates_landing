"""QA Book review module.

Combines deterministic checks (Python) and visual review (Gemini 2.5 Pro)
to produce a structured QA report for a wedding cookbook PDF.
"""
from .router import router

__all__ = ["router"]
