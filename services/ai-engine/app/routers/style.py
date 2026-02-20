"""
Style training router — supports both:
1. Before/after pair training (GPU neural LUT method via Modal)
2. Reference-only training (CPU histogram method — legacy)
"""

from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
import asyncio
import logging

from app.config import settings, supabase
from app.modal.client import ModalClient

router = APIRouter()
logger = logging.getLogger("apelier.style")


class TrainStyleRequest(BaseModel):
    photographer_id: str
    style_profile_id: str
    reference_keys: Optional[list[str]] = None
    pairs: Optional[list[dict]] = None
    epochs: int = 200


class CreateStyleRequest(BaseModel):
    photographer_id: str
    name: str
    description: Optional[str] = None
    reference_image_keys: list[str]
    settings: Optional[dict] = None
    preset_file_key: Optional[str] = None


# Routes use relative paths — main.py adds prefix="/api/style"

@router.post("/train")
async def train_style(req: TrainStyleRequest, background_tasks: BackgroundTasks):
    """Start style model training."""
    if req.pairs and len(req.pairs) >= 5:
        logger.info(f"Starting GPU style training: {len(req.pairs)} pairs")
        supabase.update("style_profiles", req.style_profile_id, {
            "training_status": "training",
            "training_method": "neural_lut",
        })
        background_tasks.add_task(
            _train_neural_style_sync,
            req.photographer_id,
            req.style_profile_id,
            req.pairs,
            req.epochs,
        )
        return {"status": "training", "message": f"Neural LUT training started with {len(req.pairs)} pairs"}

    elif req.reference_keys and len(req.reference_keys) >= 5:
        logger.info(f"Starting CPU style training: {len(req.reference_keys)} references")
        supabase.update("style_profiles", req.style_profile_id, {
            "training_status": "training",
            "training_method": "histogram",
        })
        background_tasks.add_task(
            _train_histogram_style_sync,
            req.photographer_id,
            req.style_profile_id,
            req.reference_keys,
        )
        return {"status": "training", "message": f"Histogram training started with {len(req.reference_keys)} references"}

    else:
        return {"status": "error", "message": "Need at least 5 before/after pairs or 5 reference images"}


@router.post("/create")
async def create_style(req: CreateStyleRequest):
    """Create a new style profile and start training."""
    try:
        # Create style profile record
        profile = supabase.insert("style_profiles", {
            "photographer_id": req.photographer_id,
            "name": req.name,
            "description": req.description or "",
            "reference_image_keys": req.reference_image_keys,
            "settings": req.settings or {},
            "status": "training",
        })

        if not profile:
            return {"status": "error", "message": "Failed to create style profile"}

        profile_id = profile["id"]

        # Start training in background
        from threading import Thread

        def train_bg():
            asyncio.run(_train_histogram_style(
                req.photographer_id, profile_id, req.reference_image_keys
            ))

        thread = Thread(target=train_bg, daemon=True)
        thread.start()

        return {
            "status": "training",
            "id": profile_id,
            "message": f"Style profile created and training started with {len(req.reference_image_keys)} images",
        }
    except Exception as e:
        logger.error(f"Create style failed: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/status/{style_profile_id}")
async def get_training_status(style_profile_id: str):
    """Check training status for a style profile."""
    profile = supabase.select_single("style_profiles", filters={"id": style_profile_id})
    if not profile:
        return {"status": "error", "message": "Style profile not found"}
    return {
        "status": profile.get("training_status") or profile.get("status", "unknown"),
        "training_method": profile.get("training_method"),
        "model_key": profile.get("model_key") or profile.get("model_weights_key"),
    }


@router.post("/{style_profile_id}/retrain")
async def retrain_style(style_profile_id: str):
    """Re-train an existing style profile."""
    profile = supabase.select_single("style_profiles", filters={"id": style_profile_id})
    if not profile:
        return {"status": "error", "message": "Style profile not found"}

    supabase.update("style_profiles", style_profile_id, {
        "status": "training",
    })

    ref_keys = profile.get("reference_image_keys", [])
    photographer_id = profile["photographer_id"]

    from threading import Thread
    def retrain_bg():
        asyncio.run(_train_histogram_style(photographer_id, style_profile_id, ref_keys))

    thread = Thread(target=retrain_bg, daemon=True)
    thread.start()

    return {"status": "training", "message": "Retraining started"}


# ─── Background Training Tasks ───────────────────────────────


def _train_neural_style_sync(photographer_id, style_profile_id, pairs, epochs):
    """Synchronous wrapper for background task."""
    asyncio.run(_train_neural_style(photographer_id, style_profile_id, pairs, epochs))


def _train_histogram_style_sync(photographer_id, style_profile_id, reference_keys):
    """Synchronous wrapper for background task."""
    asyncio.run(_train_histogram_style(photographer_id, style_profile_id, reference_keys))


async def _train_neural_style(
    photographer_id: str,
    style_profile_id: str,
    pairs: list[dict],
    epochs: int,
):
    """Background task: train neural LUT model via Modal GPU."""
    modal_client = ModalClient()
    try:
        result = await modal_client.train_style(
            photographer_id=photographer_id,
            style_profile_id=style_profile_id,
            pairs=pairs,
            epochs=epochs,
        )
        if result.get("status") == "success":
            supabase.update("style_profiles", style_profile_id, {
                "status": "ready",
                "model_key": result["model_key"],
                "model_weights_key": result["model_key"],
            })
            logger.info(f"Neural style training complete: {result['model_key']}")
        else:
            supabase.update("style_profiles", style_profile_id, {
                "status": "error",
            })
            logger.error(f"Neural style training failed: {result.get('message')}")
    except Exception as e:
        supabase.update("style_profiles", style_profile_id, {
            "status": "error",
        })
        logger.error(f"Neural style training error: {e}")
    finally:
        await modal_client.close()


async def _train_histogram_style(
    photographer_id: str,
    style_profile_id: str,
    reference_keys: list[str],
):
    """Background task: train histogram-based style (CPU method)."""
    try:
        from app.workers.style_trainer import train_style_profile
        await train_style_profile(photographer_id, style_profile_id, reference_keys)
        supabase.update("style_profiles", style_profile_id, {
            "status": "ready",
        })
    except Exception as e:
        supabase.update("style_profiles", style_profile_id, {
            "status": "error",
        })
        logger.error(f"Histogram style training error: {e}")
