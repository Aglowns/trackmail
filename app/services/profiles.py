from __future__ import annotations

from typing import Optional
from datetime import datetime

from app.db import get_supabase_client


async def get_profile(user_id: str) -> Optional[dict]:
    supabase = get_supabase_client()
    result = (
        supabase.table("profiles")
        .select("id, email, full_name, profession, phone, notification_email, job_preferences, created_at, updated_at")
        .eq("id", user_id)
        .single()
        .execute()
    )
    return result.data


async def update_profile(user_id: str, data: dict) -> Optional[dict]:
    supabase = get_supabase_client()
    payload = {key: value for key, value in data.items() if value is not None}
    payload["updated_at"] = datetime.utcnow().isoformat()

    result = (
        supabase.table("profiles")
        .update(payload)
        .eq("id", user_id)
        .select("id, email, full_name, profession, phone, notification_email, job_preferences, created_at, updated_at")
        .single()
        .execute()
    )

    if not result.data:
        return None

    return result.data
