from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health, summary
from app.core import config

app = FastAPI(title="FastAPI App")

allow_origins = [origin.strip() for origin in config.CORS_ALLOW_ORIGINS.split(",") if origin.strip()]
if "*" in allow_origins:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(summary.router)
