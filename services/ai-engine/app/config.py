"""
Configuration — environment variables and lightweight Supabase client via httpx.
No heavy SDK dependencies — just REST API calls.
"""
import httpx
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    storage_bucket: str = "photos"
    max_concurrent_images: int = 4
    web_res_max_px: int = 2048
    thumb_max_px: int = 400
    jpeg_quality: int = 95
    web_quality: int = 92
    thumb_quality: int = 80

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


class SupabaseClient:
    """Lightweight Supabase client using httpx — no SDK needed."""

    def __init__(self):
        s = get_settings()
        self.base_url = s.supabase_url
        self.api_key = s.supabase_service_role_key
        self.headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def _rest_url(self, table: str) -> str:
        return f"{self.base_url}/rest/v1/{table}"

    def _storage_url(self, path: str = "") -> str:
        return f"{self.base_url}/storage/v1{path}"

    @staticmethod
    def _sanitize(obj):
        """Convert numpy types and other non-JSON-serializable values to native Python."""
        import numpy as np
        if isinstance(obj, dict):
            return {k: SupabaseClient._sanitize(v) for k, v in obj.items()}
        if isinstance(obj, (list, tuple)):
            return [SupabaseClient._sanitize(v) for v in obj]
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        return obj

    # ── Filter Normalisation ──

    @staticmethod
    def _normalise_filters(filters: dict) -> dict:
        """
        Convert simple key-value filters to PostgREST format.
        {"gallery_id": "some-uuid"} -> {"gallery_id": "eq.some-uuid"}
        {"is_culled": False} -> {"is_culled": "eq.false"}
        {"status": "eq.ready"} -> {"status": "eq.ready"}  (already formatted)
        """
        normalised = {}
        for key, val in filters.items():
            str_val = str(val)
            if any(str_val.startswith(op) for op in ("eq.", "neq.", "gt.", "gte.", "lt.", "lte.", "in.", "is.", "like.", "ilike.", "not.")):
                normalised[key] = str_val
            else:
                if isinstance(val, bool):
                    normalised[key] = f"eq.{str(val).lower()}"
                elif val is None:
                    normalised[key] = "is.null"
                else:
                    normalised[key] = f"eq.{val}"
        return normalised

    # ── Table Operations ──

    def select(self, table: str, filters: dict | None = None, columns: str = "*", order: str | None = None) -> list[dict]:
        """Select rows. Filters can be simple {"col": "val"} or PostgREST {"col": "eq.val"}."""
        params = {"select": columns}
        if filters:
            params.update(self._normalise_filters(filters))
        if order:
            params["order"] = order
        r = httpx.get(self._rest_url(table), headers=self.headers, params=params, timeout=30)
        r.raise_for_status()
        return r.json()

    def select_single(self, table: str, filters: dict | None = None, columns: str = "*") -> Optional[dict]:
        """Select a single row. Returns None if not found."""
        headers = {**self.headers, "Accept": "application/vnd.pgrst.object+json"}
        params = {"select": columns}
        if filters:
            params.update(self._normalise_filters(filters))
        r = httpx.get(self._rest_url(table), headers=headers, params=params, timeout=30)
        if r.status_code == 406:
            return None
        r.raise_for_status()
        return r.json()

    def insert(self, table: str, data: dict) -> Optional[dict]:
        r = httpx.post(self._rest_url(table), headers=self.headers, json=data, timeout=30)
        r.raise_for_status()
        rows = r.json()
        return rows[0] if rows else None

    def update(self, table: str, id_or_filters, data: dict = None) -> Optional[dict]:
        """
        Update rows. Supports two calling conventions:
          update("photos", "uuid-string", {"status": "edited"})
          update("photos", {"gallery_id": "eq.xxx"}, {"status": "edited"})
        """
        if isinstance(id_or_filters, str):
            # Convention: update(table, id, data)
            filters = {"id": f"eq.{id_or_filters}"}
            update_data = data or {}
        elif data is not None:
            # Convention: update(table, filters_or_data, data_or_filters)
            if any(str(v).startswith(("eq.", "in.", "gt.", "lt.", "neq.", "gte.", "lte.")) for v in id_or_filters.values()):
                filters = id_or_filters
                update_data = data
            else:
                update_data = id_or_filters
                filters = data
        else:
            raise ValueError("update() requires (table, id, data) or (table, filters, data)")

        params = self._normalise_filters(filters) if filters else {}
        clean = self._sanitize(update_data)
        r = httpx.patch(self._rest_url(table), headers=self.headers, json=clean, params=params, timeout=30)
        r.raise_for_status()
        rows = r.json()
        return rows[0] if rows else None

    def update_many(self, table: str, data: dict, in_filter: tuple[str, list[str]]) -> bool:
        col, ids = in_filter
        params = {col: f"in.({','.join(ids)})"}
        r = httpx.patch(self._rest_url(table), headers=self.headers, json=data, params=params, timeout=30)
        r.raise_for_status()
        return True

    # ── Storage Operations ──

    def storage_download(self, bucket: str, path: str) -> Optional[bytes]:
        url = self._storage_url(f"/object/{bucket}/{path}")
        headers = {"apikey": self.api_key, "Authorization": f"Bearer {self.api_key}"}
        r = httpx.get(url, headers=headers, timeout=60, follow_redirects=True)
        if r.status_code != 200:
            return None
        return r.content

    def storage_upload(self, bucket: str, path: str, data: bytes, content_type: str = "image/jpeg") -> bool:
        url = self._storage_url(f"/object/{bucket}/{path}")
        headers = {
            "apikey": self.api_key,
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": content_type,
            "x-upsert": "true",
        }
        r = httpx.put(url, headers=headers, content=data, timeout=120)
        return r.status_code in (200, 201)


# ── Module-level singletons ──

_client: Optional[SupabaseClient] = None


def get_supabase() -> SupabaseClient:
    global _client
    if _client is None:
        _client = SupabaseClient()
    return _client


# Lazy proxies so `from app.config import settings, supabase` works
# without triggering construction at import time
class _LazySettings:
    _instance = None
    def __getattr__(self, name):
        if _LazySettings._instance is None:
            _LazySettings._instance = get_settings()
        return getattr(_LazySettings._instance, name)

class _LazySupa:
    def __getattr__(self, name):
        return getattr(get_supabase(), name)


settings = _LazySettings()
supabase = _LazySupa()
