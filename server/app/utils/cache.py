from __future__ import annotations

import json
import logging
from typing import Any, Optional

import redis

from app.core import config

logger = logging.getLogger(__name__)

_redis_client: Optional[redis.Redis] = None


def get_redis_client() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        client = redis.Redis.from_url(config.REDIS_URL, decode_responses=True)
        client.ping()
        _redis_client = client
        return _redis_client
    except redis.RedisError as exc:
        logger.warning("Redis unavailable: %s", exc)
        return None


def get_json(key: str) -> Optional[dict[str, Any]]:
    client = get_redis_client()
    if client is None:
        return None
    try:
        payload = client.get(key)
    except redis.RedisError as exc:
        logger.warning("Redis get failed: %s", exc)
        return None
    if payload is None:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return None


def set_json(key: str, value: dict[str, Any], ttl_seconds: int) -> None:
    client = get_redis_client()
    if client is None:
        return
    try:
        client.setex(key, ttl_seconds, json.dumps(value))
    except redis.RedisError as exc:
        logger.warning("Redis set failed: %s", exc)
