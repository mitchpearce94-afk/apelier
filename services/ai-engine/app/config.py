"""
Configuration — environment variables and Supabase client factory.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    storage_bucket: str = "photos"
    max_concurrent_images: int = 4
    web_res_max_px: int = 2048
    thumb_max_px: int = 400
    jpeg_quality: int = 88
    thumb_quality: int = 80

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


def get_supabase():
    """Returns a Supabase client using the service role key (bypasses RLS)."""
    from supabase import create_client
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)
