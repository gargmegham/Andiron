from __future__ import annotations

import logging

import socket

import httpx
from fastapi import APIRouter, status

from app.clients import frankfurter
from app.core import config
from app.utils.cache import get_json, set_json

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/network")
def health_network() -> dict[str, str | dict[str, str]]:
    details: dict[str, str] = {}
    try:
        details["dns"] = socket.gethostbyname("api.frankfurter.dev")
    except OSError as exc:
        details["dns_error"] = str(exc)
    try:
        with httpx.Client(timeout=config.HTTP_TIMEOUT_SECONDS) as client:
            frankfurter.fetch_latest(
                client,
                base_currency=config.BASE_CURRENCY,
                quote_currency=config.QUOTE_CURRENCY,
            )
        return {"status": "ok", "details": details}
    except httpx.HTTPError as exc:
        logger.warning("Network health check failed: %s", exc)
        return {
            "status": "degraded",
            "error": "upstream_unreachable",
            "details": {**details, "error": str(exc)},
        }


@router.get("/health/cache")
def health_cache() -> dict[str, str]:
    key = "health:cache"
    try:
        set_json(key, {"status": "ok"}, 30)
        payload = get_json(key)
        if payload is None:
            return {"status": "degraded", "error": "cache_unavailable"}
        return {"status": "ok"}
    except Exception as exc:  # pragma: no cover - safety net
        logger.warning("Cache health check failed: %s", exc)
        return {"status": "degraded", "error": "cache_unreachable"}
