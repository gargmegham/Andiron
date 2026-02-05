from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
SAMPLE_FX_PATH = DATA_DIR / "sample_fx.json"

FRANKFURTER_BASE_URL = "https://api.frankfurter.dev"
HTTP_TIMEOUT_SECONDS = 10.0

BASE_CURRENCY = "EUR"
QUOTE_CURRENCY = "USD"

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "21600"))
