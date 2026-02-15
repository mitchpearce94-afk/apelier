"""
Processing API routes — trigger and monitor gallery processing.
"""
import logging
from threading import Thread
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from app.pipeline.orchestrator import run_pipeline
from app.storage.db import get_gallery_photos, get_gallery
from app.config import get_supabase

router = APIRouter()
log = logging.getLogger(__name__)


class ProcessRequest(BaseModel):
    gallery_id: str
    style_profile_id: Optional[str] = None
    settings: Optional[dict] = None
    included_images: Optional[int] = None


class ProcessResponse(BaseModel):
    job_id: str
    status: str
    message: str
    total_images: int


@router.post("/gallery", response_model=ProcessResponse)
async def process_gallery(request: ProcessRequest, background_tasks: BackgroundTasks):
    """
    Trigger AI processing for an entire gallery.

    Creates a processing_jobs record and starts the pipeline in the background.
    """
    gallery = get_gallery(request.gallery_id)
    if not gallery:
        return ProcessResponse(
            job_id="", status="error",
            message=f"Gallery {request.gallery_id} not found", total_images=0,
        )

    photos = get_gallery_photos(request.gallery_id)
    if not photos:
        return ProcessResponse(
            job_id="", status="error",
            message="No photos found in gallery. Upload photos first.", total_images=0,
        )

    total = len(photos)

    # Create processing job record
    sb = get_supabase()
    result = (
        sb.table("processing_jobs")
        .insert({
            "gallery_id": request.gallery_id,
            "photographer_id": gallery["photographer_id"],
            "style_profile_id": request.style_profile_id,
            "total_images": total,
            "processed_images": 0,
            "status": "queued",
            "current_phase": "queued",
        })
        .execute()
    )

    if not result.data:
        return ProcessResponse(
            job_id="", status="error",
            message="Failed to create processing job", total_images=0,
        )

    job_id = result.data[0]["id"]

    # Run pipeline in background thread
    def run_in_thread():
        try:
            run_pipeline(
                processing_job_id=job_id,
                gallery_id=request.gallery_id,
                style_profile_id=request.style_profile_id,
                settings_override=request.settings,
                included_images=request.included_images,
            )
        except Exception as e:
            log.error(f"Pipeline thread error: {e}")

    thread = Thread(target=run_in_thread, daemon=True)
    thread.start()

    return ProcessResponse(
        job_id=job_id, status="queued",
        message=f"Processing queued for {total} photos", total_images=total,
    )


@router.post("/single/{photo_id}")
async def process_single_photo(photo_id: str, prompt: Optional[str] = None):
    """Process or re-process a single photo, optionally with a prompt edit."""
    return {
        "photo_id": photo_id,
        "status": "not_available",
        "prompt": prompt,
        "message": "Single photo re-processing requires GPU models (Phase 2/3). Architecture ready — plug in when GPU infra is live.",
    }


@router.get("/status/{job_id}")
async def get_processing_status(job_id: str):
    """Get the real-time status of a processing job."""
    try:
        sb = get_supabase()
        result = (
            sb.table("processing_jobs")
            .select("*")
            .eq("id", job_id)
            .single()
            .execute()
        )

        if not result.data:
            return {"error": "Job not found"}

        job = result.data
        return {
            "job_id": job["id"],
            "status": job["status"],
            "current_phase": job.get("current_phase"),
            "processed_images": job.get("processed_images", 0),
            "total_images": job.get("total_images", 0),
            "progress": round(
                (job.get("processed_images", 0) / max(1, job.get("total_images", 1))) * 100, 1
            ),
            "error_log": job.get("error_log"),
            "started_at": job.get("started_at"),
            "completed_at": job.get("completed_at"),
        }
    except Exception as e:
        log.error(f"Failed to get job status: {e}")
        return {"error": str(e)}
