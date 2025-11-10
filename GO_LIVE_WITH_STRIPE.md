# Stripe Go-Live Checklist

Use this guide when you are ready to accept real payments with JobMail.

---

## 1. Confirm You Are in Live Mode
- Open https://dashboard.stripe.com
- Check the account switcher (top left) shows your business name
- If you see “Switch to sandbox,” you are already in live mode

## 2. Create Live Products and Prices
- Navigate: Products → + Add product
- Create `JobMail Pro`
  - Price #1: $2.99, recurring, monthly
  - Price #2: $29.99, recurring, yearly
- Note the new live price IDs (`price_...`)

## 3. Gather Live API Keys
- Developers → API keys (ensure live mode)
- Copy `pk_live_...` (publishable key)
- Copy `sk_live_...` (secret key)
- Store securely; never commit these to git

## 4. Configure Live Webhook
- Developers → Webhooks → + Add endpoint
- Endpoint URL: `https://jobmail-api.onrender.com/v1/subscription/webhook`
- Subscribe to events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the live signing secret (`whsec_...`)

## 5. Update Backend Environment (Render)
- Open the Render dashboard → Backend service → Environment
- Set the following env vars to live values:
  - `STRIPE_SECRET_KEY=sk_live_...`
  - `STRIPE_PUBLISHABLE_KEY=pk_live_...`
  - `STRIPE_WEBHOOK_SECRET=whsec_live_...`
- If you use env vars for price IDs, update them too
- Redeploy or restart the service

## 6. Update Price IDs in Supabase (if stored in DB)
```sql
SELECT plan_id, stripe_price_id_monthly, stripe_price_id_yearly
FROM subscription_plans
WHERE plan_id = 'pro';
```
- Replace any test IDs with the new live price IDs:
```sql
UPDATE subscription_plans
SET stripe_price_id_monthly = 'price_live_monthly',
    stripe_price_id_yearly  = 'price_live_yearly'
WHERE plan_id = 'pro';
```

## 7. Update Frontend Environment (Vercel)
- In Vercel project settings → Environment variables
- Set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
- Trigger a new deployment

## 8. Disable Test Webhooks / Keys
- Archive or delete test webhook endpoints
- Rotate/remove unused test secrets from Render and other hosts

## 9. Perform a Live Smoke Test
- Use your production site → Start Pro upgrade flow
- Pay with a real credit card (charges will be real)
- Confirm:
  - Stripe dashboard records the payment
  - Backend logs show webhook processed successfully
  - Supabase `user_subscriptions` status becomes `active`

## 10. Compliance & Housekeeping
- Ensure Terms of Service, Privacy Policy, and Refund Policy are published
- Monitor the Stripe dashboard for disputes or alerts
- Back up all live environment variables securely

---

### Quick Reference Checklist
- [ ] Live product & prices created
- [ ] Live API keys recorded
- [ ] Live webhook configured
- [ ] Render env updated
- [ ] Supabase price IDs updated (if applicable)
- [ ] Vercel env updated
- [ ] Test payment completed
- [ ] Policies live and up to date

Keep this document handy whenever you need to reconfigure or audit your Stripe production setup.
