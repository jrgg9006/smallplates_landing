"""Posts the final report back to Next.js."""
from __future__ import annotations

import os

import httpx

from .models import CompleteCallback


async def send_callback(callback_base_url: str, review_id: str, payload: CompleteCallback) -> None:
    """POST callback_base_url/{review_id}/complete with the report.

    Auth via the shared bearer secret.
    """
    secret = os.environ["RAILWAY_AGENT_SECRET"]
    url = f"{callback_base_url.rstrip('/')}/{review_id}/complete"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            url,
            json=payload.model_dump(exclude_none=True),
            headers={
                "Authorization": f"Bearer {secret}",
                "Content-Type": "application/json",
            },
        )
        response.raise_for_status()
