"""
Style Training Worker

Handles the async training of style profiles:
1. Downloads all reference images from Supabase Storage
2. Analyses each to extract colour/tonal statistics
3. Aggregates into a style profile
4. Saves profile weights to the DB
"""
import logging
import traceback
from datetime import datetime, timezone

from app.pipeline.phase1_style import train_style_profile, load_image_from_bytes
from app.storage.supabase_storage import download_photo
from app.storage.db import get_style_profile, update_style_profile

log = logging.getLogger(__name__)


def train_profile(profile_id: str):
    """
    Train a style profile from its reference images.

    Updates the style_profiles record with:
    - status: training → ready (or error)
    - settings: the computed style profile (JSON)
    - training_started_at / training_completed_at timestamps
    """
    log.info(f"Starting style training for profile {profile_id}")

    try:
        # Mark as training
        update_style_profile(
            profile_id,
            status="training",
            training_started_at=datetime.now(timezone.utc).isoformat(),
        )

        # Fetch profile
        profile = get_style_profile(profile_id)
        if not profile:
            log.error(f"Style profile {profile_id} not found")
            return

        ref_keys = profile.get("reference_image_keys", [])
        if not ref_keys:
            update_style_profile(profile_id, status="error")
            log.error("No reference images in profile")
            return

        log.info(f"Loading {len(ref_keys)} reference images")

        # Download and decode all reference images
        reference_images = []
        for key in ref_keys:
            try:
                data = download_photo(key)
                if data:
                    img = load_image_from_bytes(data)
                    if img is not None:
                        reference_images.append(img)
            except Exception as e:
                log.warning(f"Failed to load reference image {key}: {e}")

        if len(reference_images) < 10:
            update_style_profile(profile_id, status="error")
            log.error(f"Only {len(reference_images)} valid reference images — need at least 10")
            return

        log.info(f"Training style from {len(reference_images)} images")

        # Train the profile
        style_data = train_style_profile(reference_images)

        if "error" in style_data:
            update_style_profile(profile_id, status="error")
            return

        # Save the trained profile
        update_style_profile(
            profile_id,
            status="ready",
            settings=style_data,
            training_completed_at=datetime.now(timezone.utc).isoformat(),
        )

        log.info(f"Style profile {profile_id} training complete — ready to use")

    except Exception as e:
        log.error(f"Style training failed: {e}\n{traceback.format_exc()}")
        update_style_profile(profile_id, status="error")
