"""
Processing API routes — trigger and monitor gallery processing.
v3.0: Adds per-photo restyling via Modal GPU.
"""
import logging
import os
import httpx
from threading import Thread
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional

from app.pipeline.orchestrator import run_pipeline
from app.storage.db import get_gallery_photos, get_gallery, get_style_profile, update_photo
from app.config import get_supabase, get_settings

router = APIRouter()
log = logging.getLogger(__name__)

MODAL_BASE_URL = os.environ.get("MODAL_BASE_URL", "")


def _modal_endpoint(function_name: str) -> str:
    """Build Modal endpoint URL for a given function."""
    if not MODAL_BASE_URL:
        return ""
    parts = MODAL_BASE_URL.rsplit("--", 1)
    if len(parts) == 2:
        return f"{parts[0]}--apelier-gpu-{function_name.replace('_', '-')}.modal.run"
    return f"{MODAL_BASE_URL}/{function_name}"


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


class RestyleRequest(BaseModel):
    photo_ids: list[str]
    style_profile_id: str
    gallery_id: str


class RestyleResponse(BaseModel):
    status: str
    message: str
    total: int
    completed: int


@router.post("/gallery", response_model=ProcessResponse)
async def process_gallery(request: ProcessRequest, background_tasks: BackgroundTasks):
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

    # Count only unprocessed photos (no edited_key yet)
    unprocessed = [p for p in photos if not p.get("edited_key")]
    total = len(photos)

    if not unprocessed:
        return ProcessResponse(
            job_id="", status="completed",
            message="All photos already processed", total_images=total,
        )

    sb = get_supabase()

    # Check for existing processing job for this gallery — reuse it instead of creating a new one
    existing_jobs = sb.select(
        "processing_jobs", "*",
        {"gallery_id": f"eq.{request.gallery_id}"},
        order="created_at.desc",
    )

    job_row = None
    if existing_jobs:
        # Reuse the most recent job — reset it for re-processing
        existing = existing_jobs[0]
        sb.update("processing_jobs", {
            "total_images": total,
            "processed_images": total - len(unprocessed),
            "status": "queued",
            "current_phase": "queued",
            "completed_at": None,
            "error_log": None,
        }, {"id": f"eq.{existing['id']}"})
        job_row = existing
        log.info(f"Reusing existing processing job {existing['id']} for gallery {request.gallery_id}")
    else:
        # Create new processing job
        job_row = sb.insert("processing_jobs", {
            "gallery_id": request.gallery_id,
            "photographer_id": gallery["photographer_id"],
            "style_profile_id": request.style_profile_id,
            "total_images": total,
            "processed_images": 0,
            "status": "queued",
            "current_phase": "queued",
        })

    if not job_row:
        return ProcessResponse(
            job_id="", status="error",
            message="Failed to create processing job", total_images=0,
        )

    job_id = job_row["id"]

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


# ── NEW: Restyle individual photos with a different style ─────────

@router.post("/restyle", response_model=RestyleResponse)
async def restyle_photos(request: RestyleRequest):
    """Re-process specific photos with a different style profile via Modal GPU."""

    if not MODAL_BASE_URL:
        return RestyleResponse(
            status="error", message="GPU not configured. Set MODAL_BASE_URL.", total=0, completed=0,
        )

    # Validate style profile exists and has a neural model
    profile = get_style_profile(request.style_profile_id)
    if not profile:
        return RestyleResponse(
            status="error", message="Style profile not found.", total=0, completed=0,
        )

    if profile.get("status") != "ready":
        return RestyleResponse(
            status="error", message="Style profile is not ready yet.", total=0, completed=0,
        )

    model_filename = profile.get("model_filename") or profile.get("model_key", "").split("/")[-1]
    if not model_filename:
        return RestyleResponse(
            status="error",
            message="This style has no trained neural model. Create a new style with before/after pairs.",
            total=0, completed=0,
        )

    # Validate gallery
    gallery = get_gallery(request.gallery_id)
    if not gallery:
        return RestyleResponse(
            status="error", message="Gallery not found.", total=0, completed=0,
        )

    photographer_id = gallery["photographer_id"]

    # Get the requested photos
    sb = get_supabase()
    all_photos = get_gallery_photos(request.gallery_id)
    photo_map = {p["id"]: p for p in all_photos}

    target_photos = []
    for pid in request.photo_ids:
        photo = photo_map.get(pid)
        if photo and photo.get("original_key"):
            target_photos.append(photo)

    if not target_photos:
        return RestyleResponse(
            status="error", message="No valid photos found with originals.", total=0, completed=0,
        )

    total = len(target_photos)

    # Run restyling in background thread
    def restyle_in_thread():
        try:
            _run_restyle(target_photos, model_filename, photographer_id, request.gallery_id, request.style_profile_id)
        except Exception as e:
            log.error(f"Restyle thread error: {e}")

    thread = Thread(target=restyle_in_thread, daemon=True)
    thread.start()

    return RestyleResponse(
        status="processing",
        message=f"Restyling {total} photo{'s' if total != 1 else ''} with \"{profile.get('name', 'style')}\".",
        total=total, completed=0,
    )


def _run_restyle(photos: list[dict], model_filename: str, photographer_id: str, gallery_id: str, style_profile_id: str):
    """Restyle photos via Modal GPU — apply style, then regenerate outputs."""
    from app.pipeline.phase5_output import generate_outputs, get_output_keys
    from app.pipeline.phase4_composition import fix_composition
    from app.pipeline.orchestrator import decode_image
    from app.storage.supabase_storage import download_photo, upload_photo

    s = get_settings()
    apply_url = _modal_endpoint("apply_style_batch")

    # Build batch for Modal
    batch_items = []
    for photo in photos:
        # Use a temp edited key — Modal writes the styled image here
        temp_edited_key = photo["original_key"].replace("uploads/", "restyle/")
        batch_items.append({
            "image_key": photo["original_key"],
            "output_key": temp_edited_key,
        })
        photo["_temp_edited_key"] = temp_edited_key

    log.info(f"Restyle: sending {len(batch_items)} photos to Modal GPU, model={model_filename}")

    try:
        resp = httpx.post(apply_url, json={
            "images": batch_items,
            "model_filename": model_filename,
            "supabase_url": s.supabase_url,
            "supabase_key": s.supabase_service_role_key,
            "bucket": s.storage_bucket,
            "jpeg_quality": 95,
        }, timeout=600)

        result = resp.json()
        if result.get("status") == "error":
            log.error(f"Restyle Modal batch failed: {result.get('message')}")
            return
    except Exception as e:
        log.error(f"Restyle Modal call failed: {e}")
        return

    # Now download each restyled image, run composition + output generation, upload finals
    completed = 0
    for photo in photos:
        try:
            temp_key = photo["_temp_edited_key"]
            raw = download_photo(temp_key)
            if not raw:
                log.warning(f"Restyle: could not download styled image for {photo['id']}")
                continue

            img = decode_image(raw)
            del raw
            if img is None:
                continue

            # Phase 4: Composition
            img, comp_meta = fix_composition(img, face_boxes=photo.get("face_data", []), auto_crop=True)

            # Phase 5: Output generation
            outputs = generate_outputs(img)
            keys = get_output_keys(photographer_id, gallery_id, photo.get("filename", "unknown"))

            edited_ok = upload_photo(keys["edited_key"], outputs["full_res"])
            web_ok = upload_photo(keys["web_key"], outputs["web_res"])
            thumb_ok = upload_photo(keys["thumb_key"], outputs["thumbnail"])

            if edited_ok and web_ok and thumb_ok:
                update_photo(
                    photo["id"],
                    edited_key=keys["edited_key"],
                    web_key=keys["web_key"],
                    thumb_key=keys["thumb_key"],
                    width=outputs["full_width"],
                    height=outputs["full_height"],
                    status="edited",
                    ai_edits={
                        "style_applied": True,
                        "style_method": "neural_lut",
                        "style_profile_id": style_profile_id,
                        "restyled": True,
                        "composition": comp_meta,
                        "pipeline_version": "3.0-gpu-restyle",
                    },
                )
                completed += 1
                log.info(f"Restyle: completed {photo['id']}")
            else:
                log.warning(f"Restyle: upload failed for {photo['id']}")

        except Exception as e:
            log.error(f"Restyle failed for {photo['id']}: {e}")

    log.info(f"Restyle complete: {completed}/{len(photos)}")


@router.post("/single/{photo_id}")
async def process_single_photo(photo_id: str, prompt: Optional[str] = None):
    return {
        "photo_id": photo_id,
        "status": "not_available",
        "prompt": prompt,
        "message": "Single photo re-processing requires GPU models. Architecture ready.",
    }


@router.get("/status/{job_id}")
async def get_processing_status(job_id: str):
    try:
        sb = get_supabase()
        job = sb.select_single("processing_jobs", "*", {"id": f"eq.{job_id}"})
        if not job:
            return {"error": "Job not found"}

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
