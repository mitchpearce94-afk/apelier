"""
Database helpers — update processing_jobs, photos, galleries in Supabase.
"""
import logging
from typing import Optional
from datetime import datetime, timezone
from app.config import get_supabase

log = logging.getLogger(__name__)


# ── Processing Jobs ──────────────────────────────────────────

def update_processing_job(job_id: str, **fields):
    """Update a processing_jobs record."""
    try:
        sb = get_supabase()
        sb.table("processing_jobs").update(fields).eq("id", job_id).execute()
    except Exception as e:
        log.error(f"Failed to update processing_job {job_id}: {e}")


def set_job_phase(job_id: str, phase: str, processed: Optional[int] = None):
    """Update current phase and optionally processed count."""
    fields = {"current_phase": phase, "status": "processing"}
    if processed is not None:
        fields["processed_images"] = processed
    update_processing_job(job_id, **fields)


def complete_job(job_id: str, total: int):
    """Mark a processing job as completed."""
    update_processing_job(
        job_id,
        status="completed",
        processed_images=total,
        current_phase="complete",
        completed_at=datetime.now(timezone.utc).isoformat(),
    )


def fail_job(job_id: str, error: str):
    """Mark a processing job as failed."""
    update_processing_job(
        job_id,
        status="failed",
        error_log=error,
        completed_at=datetime.now(timezone.utc).isoformat(),
    )


# ── Photos ───────────────────────────────────────────────────

def get_gallery_photos(gallery_id: str) -> list[dict]:
    """Fetch all photos for a gallery, ordered by sort_order."""
    try:
        sb = get_supabase()
        resp = (
            sb.table("photos")
            .select("*")
            .eq("gallery_id", gallery_id)
            .order("sort_order")
            .execute()
        )
        return resp.data or []
    except Exception as e:
        log.error(f"Failed to fetch photos for gallery {gallery_id}: {e}")
        return []


def update_photo(photo_id: str, **fields):
    """Update a photo record."""
    try:
        sb = get_supabase()
        sb.table("photos").update(fields).eq("id", photo_id).execute()
    except Exception as e:
        log.error(f"Failed to update photo {photo_id}: {e}")


def bulk_update_photos(photo_ids: list[str], **fields):
    """Update multiple photo records at once."""
    try:
        sb = get_supabase()
        sb.table("photos").update(fields).in_("id", photo_ids).execute()
    except Exception as e:
        log.error(f"Failed to bulk update photos: {e}")


# ── Jobs (shooting jobs, not processing) ─────────────────────

def update_job_status(job_id: str, status: str):
    """Update the shooting job's status (e.g. editing → ready_for_review)."""
    try:
        sb = get_supabase()
        sb.table("jobs").update({"status": status}).eq("id", job_id).execute()
    except Exception as e:
        log.error(f"Failed to update job {job_id} status: {e}")


def get_gallery(gallery_id: str) -> Optional[dict]:
    """Fetch gallery details."""
    try:
        sb = get_supabase()
        resp = sb.table("galleries").select("*, job:jobs(id, status)").eq("id", gallery_id).single().execute()
        return resp.data
    except Exception as e:
        log.error(f"Failed to fetch gallery {gallery_id}: {e}")
        return None


def update_gallery(gallery_id: str, **fields):
    """Update gallery record."""
    try:
        sb = get_supabase()
        sb.table("galleries").update(fields).eq("id", gallery_id).execute()
    except Exception as e:
        log.error(f"Failed to update gallery {gallery_id}: {e}")


# ── Style Profiles ───────────────────────────────────────────

def get_style_profile(profile_id: str) -> Optional[dict]:
    """Fetch a style profile by ID."""
    try:
        sb = get_supabase()
        resp = sb.table("style_profiles").select("*").eq("id", profile_id).single().execute()
        return resp.data
    except Exception as e:
        log.error(f"Failed to fetch style profile {profile_id}: {e}")
        return None


def update_style_profile(profile_id: str, **fields):
    """Update a style profile record."""
    try:
        sb = get_supabase()
        sb.table("style_profiles").update(fields).eq("id", profile_id).execute()
    except Exception as e:
        log.error(f"Failed to update style profile {profile_id}: {e}")
