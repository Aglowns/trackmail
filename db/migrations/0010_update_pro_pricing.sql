-- Update Pro plan pricing to new accessible rate

UPDATE subscription_plans
SET
    price_monthly = 2.99,
    price_yearly = 29.99,
    updated_at = NOW()
WHERE name = 'pro';

