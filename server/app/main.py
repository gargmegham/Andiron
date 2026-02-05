from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import health, summary

app = FastAPI(title="FastAPI App")

app.include_router(health.router)
app.include_router(summary.router)
