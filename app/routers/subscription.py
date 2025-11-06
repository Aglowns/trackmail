"""
Subscription Router

API endpoints for subscription management:
- Get current subscription status
- List available plans
- Placeholder upgrade endpoint
- Placeholder Stripe webhook endpoint
"""

from typing import Dict, Any

from fastapi import APIRouter, HTTPException, status

from app.deps import CurrentUserId
from app.services.subscription import get_subscription_service


router = APIRouter(prefix="/subscription", tags=["Subscription"])


@router.get("/status")
async def get_subscription_status(user_id: CurrentUserId) -> Dict[str, Any]:
    """Return the current user's subscription status and usage."""
    service = get_subscription_service()

    try:
        subscription = await service.get_user_subscription(user_id)
        plan = subscription.get("subscription_plans", {})
        features = plan.get("features", {})
        applications_count = await service.get_user_application_count(user_id)

        return {
            "subscription": {
                "plan_name": plan.get("display_name", "Free"),
                "plan_id": plan.get("id"),
                "status": subscription.get("status", "active"),
                "current_period_start": subscription.get("current_period_start"),
                "current_period_end": subscription.get("current_period_end"),
                "cancel_at_period_end": subscription.get("cancel_at_period_end", False),
            },
            "features": features,
            "usage": {
                "applications_count": applications_count,
                "applications_limit": features.get("max_applications"),
            },
        }

    except Exception as exc:
        print(f"Error getting subscription status: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch subscription status",
        )


@router.get("/plans")
async def list_subscription_plans() -> Dict[str, Any]:
    """Return all active subscription plans."""
    service = get_subscription_service()

    try:
        plans = await service.get_all_plans()
        return {"plans": plans}

    except Exception as exc:
        print(f"Error listing subscription plans: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch subscription plans",
        )


@router.post("/upgrade")
async def create_upgrade_checkout(
    user_id: CurrentUserId,
    plan_name: str = "pro",
    billing_period: str = "monthly",
) -> Dict[str, Any]:
    """Placeholder endpoint for Stripe checkout session creation."""
    service = get_subscription_service()

    try:
        plan = await service.get_subscription_plan(plan_name)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan '{plan_name}' not found",
            )

        price = plan.get("price_monthly") if billing_period == "monthly" else plan.get("price_yearly")

        return {
            "message": "Stripe integration coming in Phase 6",
            "plan": plan.get("display_name"),
            "price": price,
            "billing_period": billing_period,
        }

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error creating upgrade checkout: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session",
        )


@router.post("/webhook")
async def stripe_webhook_handler() -> Dict[str, str]:
    """Placeholder for Stripe webhook processing."""
    return {"status": "webhook_received"}
