from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserId
from app.schemas import ProfileResponse, ProfileUpdate
from app.services import profiles as profile_service

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(user_id: CurrentUserId) -> ProfileResponse:
    profile = await profile_service.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return ProfileResponse(**profile)


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(user_id: CurrentUserId, data: ProfileUpdate) -> ProfileResponse:
    profile = await profile_service.update_profile(user_id, data.model_dump(exclude_unset=True))
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return ProfileResponse(**profile)
