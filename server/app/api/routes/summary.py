from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query, status

from app.models.fx import SummaryResponse
from app.services.fx_service import FxDataError, build_summary

router = APIRouter(tags=["summary"])


@router.get("/summary", response_model=SummaryResponse)
def summary(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    breakdown: Literal["day", "none"] = Query("day"),
) -> SummaryResponse:
    try:
        return build_summary(
            start_date=start_date,
            end_date=end_date,
            breakdown=breakdown,
        )
    except FxDataError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid date format. Use YYYY-MM-DD.",
        ) from exc
