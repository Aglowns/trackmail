"""
Subscription Router

API endpoints for subscription management:
- Get current subscription status
- List available plans
- Create Stripe checkout session for upgrades
- Handle Stripe webhook events
"""

from typing import Dict, Any

from fastapi import APIRouter, HTTPException, Request, status, Header
from fastapi.responses import Response

from app.deps import CurrentUserId
from app.services.subscription import get_subscription_service
from app.services.payment import get_payment_service
from app.config import settings


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
    """
    Create a Stripe checkout session for subscription upgrade.
    
    Args:
        user_id: Automatically extracted from JWT token
        plan_name: Plan name (default: "pro")
        billing_period: "monthly" or "yearly" (default: "monthly")
        
    Returns:
        Checkout session URL and metadata
    """
    subscription_service = get_subscription_service()
    payment_service = get_payment_service()

    try:
        # Get plan details
        plan = await subscription_service.get_subscription_plan(plan_name)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan '{plan_name}' not found",
            )

        # Create Stripe checkout session
        checkout = await payment_service.create_checkout_session(
            user_id=user_id,
            plan_id=plan.get("id"),
            billing_period=billing_period,
        )

        return checkout

    except HTTPException:
        raise
    except Exception as exc:
        print(f"Error creating upgrade checkout: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session",
        )


@router.post("/webhook")
async def stripe_webhook_handler(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
) -> Response:
    """
    Handle Stripe webhook events.
    
    This endpoint processes Stripe webhook events for subscription lifecycle:
    - customer.subscription.created
    - customer.subscription.updated
    - customer.subscription.deleted
    - checkout.session.completed
    
    Args:
        request: FastAPI request object containing webhook payload
        stripe_signature: Stripe signature header for verification
        
    Returns:
        HTTP 200 response if successful
    """
    try:
        import stripe
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe module not installed. Please install with: pip install stripe>=7.0.0"
        )
    
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Stripe webhook secret not configured"
        )
    
    if not stripe_signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Stripe signature header"
        )
    
    try:
        # Get raw request body
        body = await request.body()
        
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload=body,
            sig_header=stripe_signature,
            secret=settings.stripe_webhook_secret
        )
        
        # Process the event
        payment_service = get_payment_service()
        result = await payment_service.handle_webhook_event(event)
        
        print(f"Successfully processed Stripe webhook: {event.type}")
        
        return Response(
            content='{"status": "success"}',
            status_code=200,
            media_type="application/json"
        )
        
    except ValueError as e:
        # Invalid payload
        print(f"Invalid Stripe webhook payload: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid payload"
        )
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"Invalid Stripe signature: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid signature"
        )
    except Exception as exc:
        print(f"Error processing Stripe webhook: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )
