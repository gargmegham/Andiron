from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


class DayRate(BaseModel):
    date: date
    rate: float
    pct_change: Optional[float] = Field(default=None)


class Totals(BaseModel):
    start_rate: float
    end_rate: float
    total_pct_change: Optional[float] = Field(default=None)
    mean_rate: float


class SummaryResponse(BaseModel):
    breakdown: Literal["day", "none"]
    days: Optional[list[DayRate]] = None
    totals: Totals
    source: Literal["network", "local", "cache"]
    cache_status: Literal["hit", "miss"]
