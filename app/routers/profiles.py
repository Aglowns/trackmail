from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserId
from app.schemas import ProfileResponse, ProfileUpdate, ProfileCreate
from app.services import profiles as profile_service

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(user_id: CurrentUserId) -> ProfileResponse:
    profile = await profile_service.get_profile(user_id)
    if not profile:
        # Create a default profile for new users
        profile = await profile_service.create_default_profile(user_id)
    return ProfileResponse(**profile)


@router.post("/me", response_model=ProfileResponse)
async def create_my_profile(user_id: CurrentUserId, data: ProfileCreate) -> ProfileResponse:
    """Create a new profile with signup data"""
    profile = await profile_service.create_profile_with_data(user_id, data.model_dump(exclude_unset=True))
    return ProfileResponse(**profile)


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(user_id: CurrentUserId, data: ProfileUpdate) -> ProfileResponse:
    profile = await profile_service.update_profile(user_id, data.model_dump(exclude_unset=True))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return ProfileResponse(**profile)
