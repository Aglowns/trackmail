-- Manually Upgrade aglonoqp@gmail.com to Pro Plan
-- User ID: 0a6623f5-24f3-4194-bf9b-8002da0571ea
-- Stripe Subscription: sub_1QKyVDC0sg0ZRk3BHLWp6ea
-- Stripe Customer: cus_TOXVx0QDPUoCfQ

-- Insert or update user subscription to Pro plan
INSERT INTO user_subscriptions (
    user_id,
    plan_id,
    status,
    stripe_subscription_id,
    stripe_customer_id,
    current_period_start,
    current_period_end
)
SELECT
    '0a6623f5-24f3-4194-bf9b-8002da0571ea'::uuid,
    sp.id,
    'active',
    'sub_1QKyVDC0sg0ZRk3BHLWp6ea',
    'cus_TOXVx0QDPUoCfQ',
    NOW(),
    NOW() + INTERVAL '1 month'
FROM subscription_plans sp
WHERE sp.name = 'pro'
ON CONFLICT (user_id)
DO UPDATE SET
    plan_id = EXCLUDED.plan_id,
    status = 'active',
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = NOW();

-- Verify the upgrade
SELECT
    us.user_id,
    us.status,
    us.stripe_subscription_id,
    us.stripe_customer_id,
    sp.name,
    sp.display_name,
    us.current_period_start,
    us.current_period_end
FROM user_subscriptions us
JOIN subscription_plans sp ON us.plan_id = sp.id
WHERE us.user_id = '0a6623f5-24f3-4194-bf9b-8002da0571ea'::uuid;

