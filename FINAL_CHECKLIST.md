# Final Testing Checklist

## Before Testing (One-Time Setup)

- [ ] Get JWT secret from Supabase Dashboard (Settings → API → JWT Secret)
- [ ] Add `SUPABASE_JWT_SECRET=your_secret_here` to `.env`
- [ ] Add your Stripe test keys to `.env` (you already have these)
- [ ] Install Stripe CLI (you already have this)

## Every Time You Test

### Terminal 1: Backend Server
```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Leave this running.

### Terminal 2: Stripe Webhooks
```powershell
stripe listen --forward-to http://localhost:8000/v1/subscription/webhook
```
Leave this running. Copy the webhook secret to `.env` if you haven't already.

### Terminal 3: Testing Commands
```powershell
# Get JWT token
python .\get_supabase_token.py
# Copy the access_token
```

## Test Flow

1. [ ] Go to http://localhost:8000/docs
2. [ ] Click **Authorize**, paste `Bearer YOUR_TOKEN`
3. [ ] Call `GET /v1/subscription/status` to see current plan
4. [ ] Call `POST /v1/subscription/upgrade` to get checkout URL
5. [ ] Open checkout URL in browser
6. [ ] Pay with test card: `4242 4242 4242 4242`
7. [ ] Check webhook logs show success
8. [ ] Call `GET /v1/subscription/status` again to verify Pro plan
9. [ ] Check Supabase `user_subscriptions` table

## Success Criteria

✅ Checkout session created successfully
✅ Payment completed in Stripe
✅ Webhook received and processed
✅ Database updated with Pro plan
✅ Subscription status API shows Pro features
✅ No errors in backend logs

## Next: Real Payment Test

Once the above works, you're ready to test with a real payment method (still in test mode, no charges).

---

**All code is deployed and ready! Just add the JWT secret and test.** 🚀

