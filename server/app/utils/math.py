from __future__ import annotations

from typing import Optional


def safe_pct_change(current: float, previous: float) -> Optional[float]:
    if previous == 0:
        return None
    return ((current - previous) / previous) * 100.0
