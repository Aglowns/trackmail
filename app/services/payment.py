"""
Payment Service

Handles Stripe payment processing including:
- Creating checkout sessions for subscriptions
- Processing webhook events
- Syncing subscription status from Stripe
"""

import os
from typing import Dict, Any, Optional, TYPE_CHECKING
from datetime import datetime

if TYPE_CHECKING:
    import stripe

try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    stripe = None  # type: ignore
    print("WARNING: Stripe module not installed - install with: pip install stripe>=7.0.0")

from fastapi import HTTPException, status

from app.config import settings
from app.services.subscription import get_subscription_service


# Initialize Stripe
if STRIPE_AVAILABLE and settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key
elif not STRIPE_AVAILABLE:
    print("WARNING: Stripe module not installed - payment features will be disabled")
elif not settings.stripe_secret_key:
    print("WARNING: STRIPE_SECRET_KEY not set - payment features will be disabled")


class PaymentService:
    """Service for handling Stripe payment operations."""
    
    def __init__(self):
        self.subscription_service = get_subscription_service()
    
    async def create_checkout_session(
        self,
        user_id: str,
        plan_id: str,
        billing_period: str = "monthly"
    ) -> Dict[str, Any]:
        """
        Create a Stripe checkout session for subscription upgrade.
        
        Args:
            user_id: User ID from Supabase Auth
            plan_id: Subscription plan ID (UUID)
            billing_period: "monthly" or "yearly"
            
        Returns:
            Checkout session URL and metadata
            
        Raises:
            HTTPException: If Stripe is not configured or plan not found
        """
        if not STRIPE_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Stripe module not installed. Please install with: pip install stripe>=7.0.0"
            )
        
        if not settings.stripe_secret_key:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Payment processing is not configured. Please contact support."
            )
        
        # Get plan details
        plan = await self.subscription_service.get_subscription_plan_by_id(plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Plan not found: {plan_id}"
            )
        
        # Determine price based on billing period
        if billing_period == "monthly":
            price = plan.get("price_monthly", 0)
            price_id = plan.get("stripe_price_id_monthly")  # Optional: Store Stripe Price IDs in DB
        else:
            price = plan.get("price_yearly", 0)
            price_id = plan.get("stripe_price_id_yearly")  # Optional: Store Stripe Price IDs in DB
        
        if price <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid plan price"
            )
        
        try:
            # Create Stripe checkout session
            # Note: If you have Stripe Price IDs stored in your database, use them instead
            # For now, we'll create a one-time payment that can be converted to subscription
            
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {
                                "name": plan.get("display_name", "Pro Plan"),
                                "description": plan.get("description", ""),
                            },
                            "unit_amount": int(price * 100),  # Convert to cents
                            "recurring": {
                                "interval": "month" if billing_period == "monthly" else "year"
                            } if billing_period in ["monthly", "yearly"] else None,
                        },
                        "quantity": 1,
                    }
                ] if not price_id else [
                    {
                        "price": price_id,
                        "quantity": 1,
                    }
                ],
                mode="subscription" if billing_period in ["monthly", "yearly"] else "payment",
                success_url=f"{os.getenv('FRONTEND_URL', 'https://jobmail-frontend.vercel.app')}/subscription?success=true&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{os.getenv('FRONTEND_URL', 'https://jobmail-frontend.vercel.app')}/subscription?canceled=true",
                client_reference_id=user_id,
                metadata={
                    "user_id": user_id,
                    "plan_id": plan_id,
                    "billing_period": billing_period,
                },
            )
            
            return {
                "checkout_url": checkout_session.url,
                "session_id": checkout_session.id,
                "plan": plan.get("display_name"),
                "price": price,
                "billing_period": billing_period,
            }
            
        except stripe.error.StripeError as e:
            print(f"Stripe error creating checkout session: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create checkout session: {str(e)}"
            )
    
    async def handle_webhook_event(self, event: Any) -> Dict[str, Any]:
        """
        Process a Stripe webhook event.
        
        Args:
            event: Stripe event object
            
        Returns:
            Processing result
        """
        event_type = event.type
        event_data = event.data.object
        
        print(f"Processing Stripe webhook event: {event_type}")
        
        try:
            if event_type == "customer.subscription.created":
                await self._handle_subscription_created(event_data)
            elif event_type == "customer.subscription.updated":
                await self._handle_subscription_updated(event_data)
            elif event_type == "customer.subscription.deleted":
                await self._handle_subscription_deleted(event_data)
            elif event_type == "checkout.session.completed":
                await self._handle_checkout_completed(event_data)
            else:
                print(f"Unhandled webhook event type: {event_type}")
            
            return {"status": "processed", "event_type": event_type}
            
        except Exception as e:
            print(f"Error processing webhook event {event_type}: {e}")
            raise
    
    async def _handle_checkout_completed(self, session: Dict[str, Any]):
        """Handle checkout.session.completed event."""
        user_id = session.get("metadata", {}).get("user_id") or session.get("client_reference_id")
        plan_id = session.get("metadata", {}).get("plan_id")
        
        if not user_id or not plan_id:
            print(f"Missing user_id or plan_id in checkout session: {session.id}")
            return
        
        # Get subscription from Stripe
        subscription_id = session.get("subscription")
        if subscription_id:
            subscription = stripe.Subscription.retrieve(subscription_id)
            await self.update_subscription_from_stripe(subscription)
    
    async def _handle_subscription_created(self, subscription: Dict[str, Any]):
        """Handle customer.subscription.created event."""
        await self.update_subscription_from_stripe(subscription)
    
    async def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        """Handle customer.subscription.updated event."""
        await self.update_subscription_from_stripe(subscription)
    
    async def _handle_subscription_deleted(self, subscription: Dict[str, Any]):
        """Handle customer.subscription.deleted event."""
        customer_id = subscription.get("customer")
        user_id = await self._get_user_id_from_customer(customer_id)
        
        if user_id:
            # Mark subscription as cancelled in database
            # Get current subscription to find plan_id
            current_sub = await self.subscription_service.get_user_subscription(user_id)
            if current_sub and current_sub.get("plan_id"):
                # Update to free plan (or keep same plan but mark as cancelled)
                free_plan = await self.subscription_service.get_subscription_plan("free")
                if free_plan:
                    await self.subscription_service.create_or_update_subscription(
                        user_id=user_id,
                        plan_id=free_plan.get("id"),
                        status="cancelled",
                    )
    
    async def update_subscription_from_stripe(
        self,
        stripe_subscription: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Sync subscription status from Stripe to database.
        
        Args:
            stripe_subscription: Stripe subscription object
            
        Returns:
            Updated subscription record
        """
        customer_id = stripe_subscription.get("customer")
        user_id = await self._get_user_id_from_customer(customer_id)
        
        if not user_id:
            print(f"Could not find user_id for Stripe customer: {customer_id}")
            return {}
        
        # Extract subscription details
        subscription_id = stripe_subscription.get("id")
        subscription_status = stripe_subscription.get("status")
        
        # Convert timestamps to ISO format strings
        period_start_ts = stripe_subscription.get("current_period_start", 0)
        period_end_ts = stripe_subscription.get("current_period_end", 0)
        current_period_start = datetime.fromtimestamp(period_start_ts).isoformat() if period_start_ts else None
        current_period_end = datetime.fromtimestamp(period_end_ts).isoformat() if period_end_ts else None
        
        # Get plan from metadata or default to pro
        plan_name = "pro"  # Default
        metadata = stripe_subscription.get("metadata", {})
        if metadata.get("plan_name"):
            plan_name = metadata.get("plan_name")
        
        # Get plan ID
        plan = await self.subscription_service.get_subscription_plan(plan_name)
        if not plan:
            print(f"Plan not found: {plan_name}")
            return {}
        
        plan_id = plan.get("id")
        
        # Update or create subscription in database
        try:
            result = await self.subscription_service.create_or_update_subscription(
                user_id=user_id,
                plan_id=plan_id,
                stripe_subscription_id=subscription_id,
                stripe_customer_id=customer_id,
                status=subscription_status,
                current_period_start=current_period_start,
                current_period_end=current_period_end,
            )
            
            return result
            
        except Exception as e:
            print(f"Error updating subscription from Stripe: {e}")
            raise
    
    async def _get_user_id_from_customer(self, customer_id: str) -> Optional[str]:
        """
        Get user_id from Stripe customer ID.
        
        This assumes you store the Stripe customer ID in user_subscriptions table.
        Alternatively, you could store it in a user metadata table.
        
        Args:
            customer_id: Stripe customer ID
            
        Returns:
            User ID or None
        """
        try:
            # Query user_subscriptions table for this Stripe customer ID
            result = (
                self.subscription_service.supabase.table("user_subscriptions")
                .select("user_id")
                .eq("stripe_customer_id", customer_id)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0].get("user_id")
            
            # If not found, try to get from Stripe customer metadata
            customer = stripe.Customer.retrieve(customer_id)
            user_id = customer.get("metadata", {}).get("user_id")
            
            return user_id
            
        except Exception as e:
            print(f"Error getting user_id from customer {customer_id}: {e}")
            return None


# Singleton instance
_payment_service: Optional[PaymentService] = None


def get_payment_service() -> PaymentService:
    """Get or create the payment service instance."""
    global _payment_service
    if _payment_service is None:
        _payment_service = PaymentService()
    return _payment_service

