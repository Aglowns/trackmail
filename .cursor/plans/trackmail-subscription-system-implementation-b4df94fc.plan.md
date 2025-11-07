<!-- b4df94fc-ef2e-4ab8-b77f-d75f25d2a5f0 4c96d478-180d-48ee-a24b-0f3cc29ad8c4 -->
# TrackMail Subscription System Implementation Plan

## Overview

This plan implements a two-tier subscription system (Free/Pro) with application limits, automatic email tracking for paid users, and Stripe payment integration.

## Phase 1: Database Schema & Foundation

### 1.1 Create Subscription Migration

**File:** `db/migrations/0002_subscriptions.sql`

Create tables:

- `subscription_plans`: Store plan definitions (free, pro) with features JSONB
- `user_subscriptions`: Track user subscriptions with Stripe integration fields
- Seed data: Free plan (25 apps, manual tracking) and Pro plan (unlimited, auto-tracking, all features)

Key features JSONB structure:

```json
{
  "max_applications": 25,
  "auto_tracking": false,
  "unlimited_applications": false,
  "advanced_analytics": false,
  "export_data": false
}
```

Add RLS policies for subscription tables.

### 1.2 Create Subscription Service

**File:** `app/services/subscription.py` (NEW)

Functions to implement:

- `get_user_subscription(user_id)` - Get active subscription or default to free
- `get_user_application_count(user_id)` - Count current applications
- `can_create_application(user_id)` - Check if user can create (returns bool, error_message)
- `check_feature_access(user_id, feature_name)` - Check if user has feature access
- `get_subscription_plan(plan_id)` - Get plan details

### 1.3 Create Subscription Router

**File:** `app/routers/subscription.py` (NEW)

Endpoints:

- `GET /subscription/status` - Get user's current subscription and features
- `GET /subscription/plans` - List all available plans (public)
- `POST /subscription/upgrade` - Create Stripe checkout session
- `POST /subscription/webhook` - Handle Stripe webhook events

## Phase 2: Application Limit Enforcement

### 2.1 Update Application Service

**File:** `app/services/applications.py` (MODIFY)

Modify `create_application()` function:

- Add subscription check before creating
- Call `can_create_application(user_id)` from subscription service
- Raise HTTPException with 403 status if limit exceeded
- Include upgrade details in error response:
  ```python
  {
    "error": "limit_exceeded",
    "message": "You've reached your limit of 25 applications...",
    "upgrade_required": True,
    "upgrade_url": "/subscription/upgrade"
  }
  ```


### 2.2 Update Application Router

**File:** `app/routers/applications.py` (MODIFY)

Modify `POST /applications` endpoint:

- Catch limit exceeded errors
- Return proper error response with upgrade information
- Keep existing functionality intact

## Phase 3: Feature Gating Middleware

### 3.1 Update Dependencies

**File:** `app/deps.py` (MODIFY)

Add feature gating dependency:

```python
async def require_feature(feature_name: str):
    """Dependency that requires a specific subscription feature"""
    async def feature_checker(current_user_id: CurrentUserId):
        has_access = await subscription_service.check_feature_access(
            current_user_id, feature_name
        )
        if not has_access:
            raise HTTPException(
                403, 
                detail={
                    "error": "feature_unavailable",
                    "message": f"Upgrade to Pro to access {feature_name}",
                    "upgrade_required": True
                }
            )
        return current_user_id
    return feature_checker
```

Apply to:

- Advanced analytics (require "advanced_analytics")
- Export endpoints (require "export_data")

## Phase 4: Gmail Add-on Updates

### 4.1 Subscription Status Check

**File:** `gmail-addon/API.gs` (MODIFY)

Add function:

```javascript
function checkSubscriptionStatus() {
  const response = makeAuthenticatedRequest('/subscription/status', {
    method: 'get'
  });
  return response;
}
```

### 4.2 Automatic Tracking Implementation

**File:** `gmail-addon/Code.gs` (MODIFY)

Modify `onGmailMessageOpen()`:

- Check subscription status
- If `auto_tracking_enabled === true`, call `attemptAutoTracking()`
- If successful, show auto-tracking success card
- If not job-related, show normal tracking card
- If free tier, show manual tracking card

Add new function `attemptAutoTracking(messageId, accessToken)`:

- Fetch email data
- Quick check if job-related (skip if not)
- Use advanced AI parsing
- Call `ingestEmail()` automatically
- Return result with success/error status

### 4.3 Upgrade Prompts

**File:** `gmail-addon/UI.gs` (MODIFY)

Add functions:

- `buildUpgradeCard(errorDetails)` - Show upgrade prompt when limit reached
- `buildAutoTrackingSuccessCard(result)` - Show success for auto-tracked apps

Update `trackApplicationAction()`:

- Check for limit_exceeded error
- Show upgrade card if limit reached

## Phase 5: Payment Integration (Stripe)

### 5.1 Stripe Setup

**Dependencies:** Add `stripe>=7.0.0` to `requirements.txt`

**Environment Variables:**

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 5.2 Payment Service

**File:** `app/services/payment.py` (NEW)

Functions:

- `create_checkout_session(user_id, plan_id, price_id)` - Create Stripe checkout
- `handle_webhook_event(event)` - Process Stripe webhooks
- `update_subscription_from_stripe(stripe_subscription_id)` - Sync subscription status

### 5.3 Webhook Handler

**File:** `app/routers/subscription.py` (MODIFY)

Add webhook endpoint:

- Verify Stripe signature
- Handle events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Update `user_subscriptions` table accordingly

## Phase 6: Frontend Updates (Reference)

### 6.1 Subscription Page

**File:** `trackmail-frontend/pages/subscription.tsx` (NEW)

Components needed:

- Plan comparison table
- Current plan status display
- Usage indicator (X/25 applications)
- Upgrade button (Stripe checkout)
- Success/cancel redirect handling

### 6.2 Application Limit Indicator

**File:** `trackmail-frontend/components/LimitIndicator.tsx` (NEW)

Show:

- Progress bar (current/max applications)
- Warning when near limit (20/25)
- Upgrade prompt when limit reached

### 6.3 Upgrade Modal

**File:** `trackmail-frontend/components/UpgradeModal.tsx` (NEW)

Modal shown when:

- Limit reached
- Feature access denied
- Manual trigger from UI

## Implementation Order

1. **Database Migration** - Create subscription tables and seed data
2. **Subscription Service** - Core subscription logic
3. **Application Limits** - Enforce limits in application creation
4. **Feature Gating** - Middleware for premium features
5. **Gmail Add-on** - Auto-tracking and upgrade prompts
6. **Payment Integration** - Stripe checkout and webhooks
7. **Frontend** - UI components (can be done in parallel)

## Testing Checklist

- [x] Free user can create up to 25 applications
- [x] Free user gets upgrade prompt at limit
- [x] Paid user has unlimited applications
- [x] Free user sees manual tracking in Gmail
- [x] Paid user gets automatic tracking in Gmail
- [ ] Stripe checkout creates subscription (ready to test with real payment)
- [ ] Webhook updates subscription status (ready to test with real payment)
- [x] Feature gating works for all premium features

### To-dos

- [x] Create database migration 0007_subscriptions.sql with subscription_plans and user_subscriptions tables, seed free/pro plans
- [x] Create app/services/subscription.py with get_user_subscription, can_create_application, check_feature_access functions
- [x] Create app/routers/subscription.py with GET /subscription/status, GET /subscription/plans, POST /subscription/upgrade endpoints
- [x] Modify app/services/applications.py create_application() to check subscription limits and raise 403 with upgrade prompt
- [x] Update app/routers/applications.py to handle limit exceeded errors and return upgrade information
- [x] Add require_feature() dependency to app/deps.py and apply to analytics and export endpoints
- [x] Add checkSubscriptionStatus() function to gmail-addon/API.gs to query backend subscription status
- [x] Modify onGmailMessageOpen() in gmail-addon/Code.gs to auto-track for paid users, add attemptAutoTracking() function
- [x] Add buildUpgradeCard() and buildAutoTrackingSuccessCard() to gmail-addon/UI.gs, update trackApplicationAction() to handle limits
- [x] Create app/services/payment.py with Stripe checkout session creation, add webhook handler to subscription router
- [x] Add stripe>=7.0.0 to requirements.txt for payment processing

## Status: Phase 5 Complete - Ready for Testing

All code for the subscription system has been implemented. The system is ready for real payment testing once:
1. SUPABASE_JWT_SECRET is added to .env
2. Backend server is restarted
3. User performs a test checkout with Stripe test card