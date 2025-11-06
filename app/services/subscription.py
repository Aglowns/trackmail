"""
Subscription Service

Business logic for managing user subscriptions and feature access.

This service handles:
- Checking subscription status and features
- Enforcing application limits
- Managing plan upgrades
- Feature access control
"""

from typing import Optional, Dict, Any, Tuple

from app.db import get_supabase_client


class SubscriptionService:
    """Service class for managing subscriptions"""

    def __init__(self) -> None:
        self.supabase = get_supabase_client()

    async def get_user_subscription(self, user_id: str) -> Dict[str, Any]:
        """Get user's active subscription with plan details."""
        try:
            result = (
                self.supabase.table("user_subscriptions")
                .select("*, subscription_plans(*)")
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )

            if result.data and len(result.data) > 0:
                subscription = result.data[0]
                # Handle Supabase join structure - subscription_plans might be a dict or list
                plan = subscription.get("subscription_plans")
                if isinstance(plan, list) and len(plan) > 0:
                    # If it's a list (shouldn't happen for one-to-one, but handle it)
                    subscription["subscription_plans"] = plan[0]
                elif plan is None:
                    # If plan is missing, fetch it separately
                    plan_id = subscription.get("plan_id")
                    if plan_id:
                        fetched_plan = await self.get_subscription_plan_by_id(plan_id)
                        if fetched_plan:
                            subscription["subscription_plans"] = fetched_plan
                        else:
                            # Fallback to free plan if plan not found
                            free_plan = await self.get_subscription_plan("free")
                            subscription["subscription_plans"] = free_plan
                    else:
                        # No plan_id, use free plan
                        free_plan = await self.get_subscription_plan("free")
                        subscription["subscription_plans"] = free_plan
                return subscription

            # No subscription found - return free plan default
            free_plan = await self.get_subscription_plan("free")
            if not free_plan:
                raise Exception("Free plan not found in database - database migration may not have run")
            
            return {
                "user_id": user_id,
                "plan_id": free_plan["id"],
                "status": "active",
                "subscription_plans": free_plan,
            }

        except Exception as exc:
            print(f"Error getting user subscription: {exc}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise

    async def get_subscription_plan(self, plan_name: str) -> Optional[Dict[str, Any]]:
        """Get subscription plan details by name."""
        try:
            result = (
                self.supabase.table("subscription_plans")
                .select("*")
                .eq("name", plan_name)
                .eq("is_active", True)
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as exc:
            print(f"Error getting subscription plan: {exc}")
            raise

    async def get_subscription_plan_by_id(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Get subscription plan details by ID."""
        try:
            result = (
                self.supabase.table("subscription_plans")
                .select("*")
                .eq("id", plan_id)
                .execute()
            )

            return result.data[0] if result.data else None

        except Exception as exc:
            print(f"Error getting subscription plan by ID: {exc}")
            raise

    async def get_user_application_count(self, user_id: str) -> int:
        """Count the number of applications a user has created."""
        try:
            result = (
                self.supabase.table("applications")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute()
            )

            return result.count or 0

        except Exception as exc:
            print(f"Error counting user applications: {exc}")
            raise

    async def can_create_application(self, user_id: str) -> Tuple[bool, Optional[str]]:
        """Check whether the user can create another application."""
        try:
            subscription = await self.get_user_subscription(user_id)
            
            # Safely extract plan data
            plan = subscription.get("subscription_plans")
            if not plan:
                # If no plan found, default to free plan limits
                plan = await self.get_subscription_plan("free")
                if not plan:
                    # If free plan doesn't exist, fail securely (deny access)
                    return False, "Subscription system error - please contact support"
            
            # Handle case where plan might be a dict already
            if isinstance(plan, dict):
                features = plan.get("features", {})
            else:
                # If it's not a dict, something went wrong
                print(f"Warning: plan is not a dict: {type(plan)}")
                # Default to free plan limits
                free_plan = await self.get_subscription_plan("free")
                features = free_plan.get("features", {}) if free_plan else {}

            # Check for unlimited applications
            if features.get("unlimited_applications"):
                return True, None

            # Get max applications limit
            max_applications = features.get("max_applications")
            if max_applications is None:
                # If max_applications is None and not unlimited, default to 25 (free tier)
                max_applications = 25

            # Get current application count
            current_count = await self.get_user_application_count(user_id)

            # Check if limit is exceeded
            if current_count >= max_applications:
                return False, (
                    f"You've reached your limit of {max_applications} applications. "
                    "Upgrade to Pro for unlimited applications and automatic tracking."
                )

            return True, None

        except Exception as exc:
            # CRITICAL: Don't bypass limits on errors - fail securely
            print(f"Error checking application creation permission: {exc}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            # Return False to deny access on errors (fail-secure)
            return False, f"Unable to verify subscription limits. Please try again or contact support. Error: {str(exc)}"

    async def check_feature_access(self, user_id: str, feature_name: str) -> bool:
        """Return True if the user has access to the given feature."""
        try:
            subscription = await self.get_user_subscription(user_id)
            
            # Safely extract plan data
            plan = subscription.get("subscription_plans")
            if not plan:
                # If no plan found, default to free plan (no features)
                plan = await self.get_subscription_plan("free")
                if not plan:
                    return False
            
            # Handle case where plan might be a dict already
            if isinstance(plan, dict):
                features = plan.get("features", {})
            else:
                # If it's not a dict, something went wrong - deny access
                print(f"Warning: plan is not a dict in check_feature_access: {type(plan)}")
                return False
            
            return bool(features.get(feature_name, False))

        except Exception as exc:
            print(f"Error checking feature access: {exc}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            # Fail-secure: deny feature access on errors
            return False

    async def get_all_plans(self) -> list[Dict[str, Any]]:
        """Return all active subscription plans."""
        try:
            result = (
                self.supabase.table("subscription_plans")
                .select("*")
                .eq("is_active", True)
                .order("price_monthly")
                .execute()
            )

            return result.data or []

        except Exception as exc:
            print(f"Error getting all plans: {exc}")
            raise

    async def create_or_update_subscription(
        self,
        user_id: str,
        plan_id: str,
        stripe_customer_id: Optional[str] = None,
        stripe_subscription_id: Optional[str] = None,
        status: str = "active",
        current_period_start: Optional[str] = None,
        current_period_end: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create or update the user's subscription record."""
        try:
            existing = (
                self.supabase.table("user_subscriptions")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )

            payload = {
                "user_id": user_id,
                "plan_id": plan_id,
                "status": status,
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
                "current_period_start": current_period_start,
                "current_period_end": current_period_end,
            }

            if existing.data:
                result = (
                    self.supabase.table("user_subscriptions")
                    .update(payload)
                    .eq("user_id", user_id)
                    .execute()
                )
            else:
                result = (
                    self.supabase.table("user_subscriptions")
                    .insert(payload)
                    .execute()
                )

            if result.data:
                return result.data[0]

            raise Exception("Failed to create or update subscription")

        except Exception as exc:
            print(f"Error creating/updating subscription: {exc}")
            raise


_subscription_service: Optional[SubscriptionService] = None


def get_subscription_service() -> SubscriptionService:
    """Return a singleton instance of SubscriptionService."""
    global _subscription_service
    if _subscription_service is None:
        _subscription_service = SubscriptionService()
    return _subscription_service
