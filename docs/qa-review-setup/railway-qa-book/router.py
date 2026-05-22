"""FastAPI router for POST /qa-book.

Returns 202 Accepted immediately; processing happens in the background.
"""
from __future__ import annotations

import asyncio
import logging
import os
import time

import httpx
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException

from .callback import send_callback
from .deterministic_checks import run_deterministic_checks
from .gemini_visual import MODEL, gemini_visual_review
from .models import CompleteCallback, QABookRequest
from .pdf_extractor import extract_text_per_page
from .report_builder import build_human_summary, count_by_severity, merge_findings


logger = logging.getLogger(__name__)
router = APIRouter()


def _check_auth(authorization: str | None) -> None:
    expected = f"Bearer {os.environ['RAILWAY_AGENT_SECRET']}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="invalid_or_missing_bearer")


@router.post("/qa-book", status_code=202)
async def qa_book(
    req: QABookRequest,
    background_tasks: BackgroundTasks,
    authorization: str | None = Header(default=None),
) -> dict:
    _check_auth(authorization)

    # Fire-and-forget background processing
    background_tasks.add_task(_process_book, req)
    return {"accepted": True, "review_id": req.review_id}


async def _download_pdf(signed_url: str) -> bytes:
    async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
        response = await client.get(signed_url)
        response.raise_for_status()
        return response.content


async def _process_book(req: QABookRequest) -> None:
    start = time.perf_counter()
    try:
        logger.info("[qa-book] %s: downloading PDF", req.review_id)
        pdf_bytes = await _download_pdf(req.storage_signed_url)
        pdf_size = len(pdf_bytes)

        logger.info("[qa-book] %s: extracting text", req.review_id)
        pages_text = await asyncio.to_thread(extract_text_per_page, pdf_bytes)
        page_count = len(pages_text)

        logger.info("[qa-book] %s: deterministic checks", req.review_id)
        det_findings = run_deterministic_checks(req.book_context, pages_text)

        logger.info("[qa-book] %s: gemini visual review", req.review_id)
        gemini_findings, gemini_overall, cost_usd = await gemini_visual_review(
            pdf_bytes, req.book_context
        )

        all_findings = merge_findings(det_findings, gemini_findings)
        counts = count_by_severity(all_findings)
        summary = build_human_summary(all_findings, req.book_context, gemini_overall)

        elapsed_ms = int((time.perf_counter() - start) * 1000)

        await send_callback(
            req.callback_url,
            req.review_id,
            CompleteCallback(
                status="complete",
                findings=all_findings,
                human_summary=summary,
                critical_count=counts["critical"],
                warning_count=counts["warning"],
                info_count=counts["info"],
                pdf_page_count=page_count,
                pdf_size_bytes=pdf_size,
                cost_usd=cost_usd,
                duration_ms=elapsed_ms,
                gemini_model=MODEL,
            ),
        )
        logger.info(
            "[qa-book] %s: complete (%d findings, $%.4f, %dms)",
            req.review_id, len(all_findings), cost_usd, elapsed_ms,
        )

    except Exception as exc:
        logger.exception("[qa-book] %s: failed", req.review_id)
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        try:
            await send_callback(
                req.callback_url,
                req.review_id,
                CompleteCallback(
                    status="failed",
                    error_message=f"{type(exc).__name__}: {str(exc)[:500]}",
                    duration_ms=elapsed_ms,
                    gemini_model=MODEL,
                ),
            )
        except Exception:
            logger.exception("[qa-book] %s: callback ALSO failed", req.review_id)
