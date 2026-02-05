from __future__ import annotations

import logging
from datetime import date
from typing import Literal, Optional

import httpx

from app.clients import frankfurter
from app.core import config
from app.models.fx import DayRate, SummaryResponse, Totals
from app.utils.cache import get_json, set_json
from app.utils.io import read_json
from app.utils.math import safe_pct_change

logger = logging.getLogger(__name__)


class FxDataError(RuntimeError):
    pass


def _parse_rates(payload: dict, quote_currency: str) -> dict[date, float]:
    rates = payload.get("rates", {})
    parsed: dict[date, float] = {}
    for date_str, day_rates in rates.items():
        rate = day_rates.get(quote_currency)
        if rate is None:
            continue
        parsed[date.fromisoformat(date_str)] = float(rate)
    return parsed


def _load_local_rates(
    start_date: str,
    end_date: str,
    quote_currency: str,
) -> dict[date, float]:
    payload = read_json(config.SAMPLE_FX_PATH)
    rates = _parse_rates(payload, quote_currency)
    start = date.fromisoformat(start_date)
    end = date.fromisoformat(end_date)
    return {
        day: rate for day, rate in rates.items() if start <= day <= end
    }


def _fetch_rates_network(
    start_date: str,
    end_date: str,
    base_currency: str,
    quote_currency: str,
) -> dict[date, float]:
    with httpx.Client(timeout=config.HTTP_TIMEOUT_SECONDS) as client:
        payload = frankfurter.fetch_range(
            client,
            start_date=start_date,
            end_date=end_date,
            base_currency=base_currency,
            quote_currency=quote_currency,
        )
        # Optional warm call to latest endpoint for robustness.
        try:
            frankfurter.fetch_latest(
                client,
                base_currency=base_currency,
                quote_currency=quote_currency,
            )
        except httpx.HTTPError:
            logger.debug("Latest endpoint fetch failed; continuing with range data.")
        return _parse_rates(payload, quote_currency)


def _cache_key(start_date: str, end_date: str, breakdown: str) -> str:
    return f"fx:summary:{start_date}:{end_date}:{breakdown}"


def build_summary(
    start_date: str,
    end_date: str,
    breakdown: Literal["day", "none"],
    base_currency: str = config.BASE_CURRENCY,
    quote_currency: str = config.QUOTE_CURRENCY,
) -> SummaryResponse:
    cache_key = _cache_key(start_date, end_date, breakdown)
    cached = get_json(cache_key)
    if cached is not None:
        return SummaryResponse.model_validate(
            {**cached, "source": "cache", "cache_status": "hit"}
        )

    source: Literal["network", "local"] = "network"
    try:
        rates_by_day = _fetch_rates_network(
            start_date=start_date,
            end_date=end_date,
            base_currency=base_currency,
            quote_currency=quote_currency,
        )
    except httpx.HTTPError as exc:
        logger.warning("Network fetch failed, using local data: %s", exc)
        rates_by_day = _load_local_rates(
            start_date=start_date,
            end_date=end_date,
            quote_currency=quote_currency,
        )
        source = "local"

    if not rates_by_day:
        raise FxDataError("No FX data available for the requested range.")

    ordered_days = sorted(rates_by_day.keys())
    rates = [rates_by_day[day] for day in ordered_days]

    days: Optional[list[DayRate]] = None
    if breakdown == "day":
        days = []
        previous_rate: Optional[float] = None
        for day in ordered_days:
            rate = rates_by_day[day]
            pct_change = None
            if previous_rate is not None:
                pct_change = safe_pct_change(rate, previous_rate)
            days.append(DayRate(date=day, rate=rate, pct_change=pct_change))
            previous_rate = rate

    start_rate = rates[0]
    end_rate = rates[-1]
    total_pct_change = safe_pct_change(end_rate, start_rate)
    mean_rate = sum(rates) / len(rates)

    totals = Totals(
        start_rate=start_rate,
        end_rate=end_rate,
        total_pct_change=total_pct_change,
        mean_rate=mean_rate,
    )

    response = SummaryResponse(
        breakdown=breakdown,
        days=days,
        totals=totals,
        source=source,
        cache_status="miss",
    )
    set_json(cache_key, response.model_dump(mode="json", exclude_none=True), config.CACHE_TTL_SECONDS)
    return response
