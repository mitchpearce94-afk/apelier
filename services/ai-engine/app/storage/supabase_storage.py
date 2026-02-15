"""
Supabase Storage helpers — download originals, upload processed outputs.
"""
import io
import logging
from typing import Optional
from app.config import get_supabase, get_settings

log = logging.getLogger(__name__)


def download_photo(storage_key: str) -> Optional[bytes]:
    """Download a photo from Supabase Storage by its key."""
    try:
        sb = get_supabase()
        bucket = get_settings().storage_bucket
        data = sb.storage.from_(bucket).download(storage_key)
        return data
    except Exception as e:
        log.error(f"Failed to download {storage_key}: {e}")
        return None


def upload_photo(storage_key: str, data: bytes, content_type: str = "image/jpeg") -> Optional[str]:
    """Upload a processed photo to Supabase Storage. Returns the key on success."""
    try:
        sb = get_supabase()
        bucket = get_settings().storage_bucket
        sb.storage.from_(bucket).upload(
            storage_key,
            data,
            file_options={"content-type": content_type, "cache-control": "3600", "upsert": "true"},
        )
        return storage_key
    except Exception as e:
        log.error(f"Failed to upload {storage_key}: {e}")
        return None


def get_public_url(storage_key: str) -> str:
    """Get a public URL for a storage key."""
    sb = get_supabase()
    bucket = get_settings().storage_bucket
    return sb.storage.from_(bucket).get_public_url(storage_key)
