from __future__ import annotations

from typing import Any

import httpx

from app.core.config import FRANKFURTER_BASE_URL


def fetch_range(
    client: httpx.Client,
    start_date: str,
    end_date: str,
    base_currency: str,
    quote_currency: str,
) -> dict[str, Any]:
    url = f"{FRANKFURTER_BASE_URL}/{start_date}..{end_date}"
    response = client.get(url, params={"from": base_currency, "to": quote_currency})
    response.raise_for_status()
    return response.json()


def fetch_latest(
    client: httpx.Client,
    base_currency: str,
    quote_currency: str,
) -> dict[str, Any]:
    url = f"{FRANKFURTER_BASE_URL}/latest"
    response = client.get(url, params={"from": base_currency, "to": quote_currency})
    response.raise_for_status()
    return response.json()
