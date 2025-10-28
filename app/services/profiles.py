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


async def create_default_profile(user_id: str) -> dict:
    """Create a default profile for new users"""
    supabase = get_supabase_client()
    
    # Get user email from auth.users table
    auth_user = supabase.auth.get_user()
    user_email = auth_user.user.email if auth_user.user else "user@example.com"
    
    profile_data = {
        "id": user_id,
        "email": user_email,
        "full_name": "",
        "profession": "",
        "phone": "",
        "notification_email": user_email,
        "job_preferences": {
            "preferred_roles": "",
            "preferred_locations": "",
            "salary_range": ""
        },
        "goals": "",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("profiles").insert(profile_data).execute()
    
    if not result.data:
        raise Exception("Failed to create default profile")
    
    return result.data[0]


async def create_profile_with_data(user_id: str, profile_data: dict) -> dict:
    """Create a profile with provided data from signup"""
    supabase = get_supabase_client()
    
    # Get user email from auth.users table
    auth_user = supabase.auth.get_user()
    user_email = auth_user.user.email if auth_user.user else "user@example.com"
    
    # Prepare profile data with provided information
    full_profile_data = {
        "id": user_id,
        "email": user_email,
        "full_name": profile_data.get("full_name", ""),
        "profession": profile_data.get("profession", ""),
        "phone": profile_data.get("phone", ""),
        "notification_email": user_email,
        "job_preferences": {
            "preferred_roles": profile_data.get("job_preferences", {}).get("preferred_roles", ""),
            "preferred_locations": profile_data.get("job_preferences", {}).get("preferred_locations", ""),
            "salary_range": profile_data.get("job_preferences", {}).get("salary_range", "")
        },
        "goals": profile_data.get("goals", ""),
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    result = supabase.table("profiles").insert(full_profile_data).execute()
    
    if not result.data:
        raise Exception("Failed to create profile with signup data")
    
    return result.data[0]
