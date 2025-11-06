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
from uuid import UUID

from app.db import get_supabase_client


class SubscriptionService:
    """Service class for managing subscriptions"""
    
    def __init__(self):
        self.supabase = get_supabase_client()
    
    async def get_user_subscription(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's active subscription with plan details.
        
        If user has no subscription, returns default free plan.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Dictionary with subscription and plan data
        """
        try:
            # Query user subscription with plan details (JOIN)
            result = (
                self.supabase.table("user_subscriptions")
                .select("*, subscription_plans(*)")
                .eq("user_id", user_id)
                .eq("status", "active")
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            # No subscription found - return default free plan
            free_plan = await self.get_subscription_plan("free")
            return {
                "user_id": user_id,
                "plan_id": free_plan["id"],
                "status": "active",
                "subscription_plans": free_plan,
            }
            
        except Exception as e:
            print(f"Error getting user subscription: {e}")
            raise
    
    async def get_subscription_plan(self, plan_name: str) -> Optional[Dict[str, Any]]:
        """
        Get subscription plan details by name.
        
        Args:
            plan_name: Name of the plan (e.g., "free", "pro")
            
        Returns:
            Plan details or None if not found
        """
        try:
            result = (
                self.supabase.table("subscription_plans")
                .select("*")
                .eq("name", plan_name)
                .eq("is_active", True)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"Error getting subscription plan: {e}")
            raise
    
    async def get_subscription_plan_by_id(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Get subscription plan details by ID.
        
        Args:
            plan_id: UUID of the plan
            
        Returns:
            Plan details or None if not found
        """
        try:
            result = (
                self.supabase.table("subscription_plans")
                .select("*")
                .eq("id", plan_id)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            return None
            
        except Exception as e:
            print(f"Error getting subscription plan by ID: {e}")
            raise
    
    async def get_user_application_count(self, user_id: str) -> int:
        """
        Count the number of applications a user has created.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Number of applications
        """
        try:
            result = (
                self.supabase.table("applications")
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute()
            )
            
            return result.count or 0
            
        except Exception as e:
            print(f"Error counting user applications: {e}")
            raise
    
    async def can_create_application(self, user_id: str) -> Tuple[bool, Optional[str]]:
        """
        Check if user can create a new application based on their subscription.
        
        Args:
            user_id: UUID of the user
            
        Returns:
            Tuple of (can_create: bool, error_message: Optional[str])
        """
        try:
            # Get user's subscription
            subscription = await self.get_user_subscription(user_id)
            plan = subscription.get("subscription_plans", {})
            features = plan.get("features", {})
            
            # Check if user has unlimited applications
            if features.get("unlimited_applications"):
                return True, None
            
            # Check application limit
            max_applications = features.get("max_applications")
            if max_applications is None:
                # No limit specified, allow creation
                return True, None
            
            # Count current applications
            current_count = await self.get_user_application_count(user_id)
            
            if current_count >= max_applications:
                return False, (
                    f"You've reached your limit of {max_applications} applications. "
                    f"Upgrade to Pro for unlimited applications and automatic tracking."
                )
            
            return True, None
            
        except Exception as e:
            print(f"Error checking application creation permission: {e}")
            # On error, allow creation (fail open to prevent blocking users)
            return True, None
    
    async def check_feature_access(self, user_id: str, feature_name: str) -> bool:
        """
        Check if user has access to a specific feature.
        
        Args:
            user_id: UUID of the user
            feature_name: Name of the feature (e.g., "resume_tailoring", "auto_tracking")
            
        Returns:
            True if user has access, False otherwise
        """
        try:
            # Get user's subscription
            subscription = await self.get_user_subscription(user_id)
            plan = subscription.get("subscription_plans", {})
            features = plan.get("features", {})
            
            # Check if feature is enabled
            return features.get(feature_name, False)
            
        except Exception as e:
            print(f"Error checking feature access: {e}")
            # On error, deny access (fail closed for premium features)
            return False
    
    async def get_all_plans(self) -> list[Dict[str, Any]]:
        """
        Get all active subscription plans.
        
        Returns:
            List of active subscription plans
        """
        try:
            result = (
                self.supabase.table("subscription_plans")
                .select("*")
                .eq("is_active", True)
                .order("price_monthly")
                .execute()
            )
            
            return result.data or []
            
        except Exception as e:
            print(f"Error getting all plans: {e}")
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
        """
        Create or update a user's subscription.
        
        Used by Stripe webhook handler to sync subscription status.
        
        Args:
            user_id: UUID of the user
            plan_id: UUID of the subscription plan
            stripe_customer_id: Stripe Customer ID
            stripe_subscription_id: Stripe Subscription ID
            status: Subscription status
            current_period_start: Billing period start date
            current_period_end: Billing period end date
            
        Returns:
            Created or updated subscription record
        """
        try:
            # Check if subscription exists
            existing = (
                self.supabase.table("user_subscriptions")
                .select("*")
                .eq("user_id", user_id)
                .execute()
            )
            
            subscription_data = {
                "user_id": user_id,
                "plan_id": plan_id,
                "status": status,
                "stripe_customer_id": stripe_customer_id,
                "stripe_subscription_id": stripe_subscription_id,
                "current_period_start": current_period_start,
                "current_period_end": current_period_end,
            }
            
            if existing.data and len(existing.data) > 0:
                # Update existing subscription
                result = (
                    self.supabase.table("user_subscriptions")
                    .update(subscription_data)
                    .eq("user_id", user_id)
                    .execute()
                )
            else:
                # Create new subscription
                result = (
                    self.supabase.table("user_subscriptions")
                    .insert(subscription_data)
                    .execute()
                )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            
            raise Exception("Failed to create or update subscription")
            
        except Exception as e:
            print(f"Error creating/updating subscription: {e}")
            raise


# Singleton instance for easy import
_subscription_service = None

def get_subscription_service() -> SubscriptionService:
    """Get singleton subscription service instance"""
    global _subscription_service
    if _subscription_service is None:
        _subscription_service = SubscriptionService()
    return _subscription_service
