import os
import json
import logging
import time
from datetime import datetime, date
from typing import Optional, Any, Callable, Awaitable
from dotenv import load_dotenv

logger = logging.getLogger("agrosmart.cache")

# Custom JSON Encoder for caching complex documents (datetimes, ObjectIds, etc.)
class SafeCacheJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if hasattr(obj, "__str__"):
            return str(obj)
        return super().default(obj)

class CacheService:
    def __init__(self):
        self.redis_client = None
        self.is_connected = False
        self.hits = 0
        self.misses = 0
        self.errors = 0
        self.last_error_log = 0.0

    async def initialize(self):
        """Initialize Redis connection asynchronously with timeouts and pooling."""
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            logger.info("REDIS_URL not configured. Cache will operate in passthrough mode (direct database).")
            self.is_connected = False
            return

        try:
            import redis.asyncio as aioredis
            self.redis_client = aioredis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                max_connections=50
            )
            # Test ping
            await self.redis_client.ping()
            self.is_connected = True
            logger.info(f"Connected to Redis cache at {redis_url}")
        except Exception as e:
            self.is_connected = False
            self.redis_client = None
            logger.warning(f"Could not connect to Redis ({e}). Operating in passthrough mode (MongoDB fallback).")

    async def close(self):
        if self.redis_client:
            try:
                await self.redis_client.close()
            except Exception:
                pass
            self.is_connected = False

    def _format_key(self, namespace: str, key: str) -> str:
        return f"agrosmart:{namespace}:{key}"

    async def get(self, namespace: str, key: str) -> Optional[Any]:
        if not self.is_connected or not self.redis_client:
            self.misses += 1
            return None

        cache_key = self._format_key(namespace, key)
        try:
            val = await self.redis_client.get(cache_key)
            if val is not None:
                self.hits += 1
                return json.loads(val)
            self.misses += 1
            return None
        except Exception as e:
            self._handle_redis_error(e)
            self.misses += 1
            return None

    async def set(self, namespace: str, key: str, value: Any, ttl_seconds: int = 300) -> bool:
        if not self.is_connected or not self.redis_client:
            return False

        cache_key = self._format_key(namespace, key)
        try:
            serialized = json.dumps(value, cls=SafeCacheJSONEncoder)
            await self.redis_client.set(cache_key, serialized, ex=ttl_seconds)
            return True
        except Exception as e:
            self._handle_redis_error(e)
            return False

    async def delete(self, namespace: str, key: str) -> bool:
        if not self.is_connected or not self.redis_client:
            return False

        cache_key = self._format_key(namespace, key)
        try:
            await self.redis_client.delete(cache_key)
            return True
        except Exception as e:
            self._handle_redis_error(e)
            return False

    async def delete_namespace(self, namespace: str) -> int:
        """Invalidate all keys under a given namespace/table."""
        if not self.is_connected or not self.redis_client:
            return 0

        pattern = f"agrosmart:{namespace}:*"
        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            self._handle_redis_error(e)
            return 0

    async def get_or_set(
        self,
        namespace: str,
        key: str,
        fetcher: Callable[[], Awaitable[Any]],
        ttl_seconds: int = 300
    ) -> Any:
        """
        Cache-aside pattern: Check Redis first. On cache miss or Redis failure,
        invoke async fetcher, cache the result, and return it.
        """
        cached = await self.get(namespace, key)
        if cached is not None:
            return cached

        # Fetch from underlying source (DB / external API)
        data = await fetcher()

        # Cache result asynchronously if not None
        if data is not None:
            await self.set(namespace, key, data, ttl_seconds)

        return data

    def _handle_redis_error(self, e: Exception):
        self.errors += 1
        now = time.time()
        # Rate-limit error logging to once every 30 seconds
        if now - self.last_error_log > 30:
            logger.warning(f"Redis cache operation failed ({e}). Falling back to primary database.")
            self.last_error_log = now

    def get_stats(self) -> dict:
        total = self.hits + self.misses
        hit_ratio = round((self.hits / total * 100), 2) if total > 0 else 0.0
        return {
            "is_connected": self.is_connected,
            "hits": self.hits,
            "misses": self.misses,
            "total_requests": total,
            "hit_ratio_pct": hit_ratio,
            "errors": self.errors
        }

# Global singleton instance
cache_service = CacheService()
