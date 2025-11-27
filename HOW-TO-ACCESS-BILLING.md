# How to Access Billing

## Quick Access

The billing page is now accessible in two ways:

### 1. Via Sidebar Navigation ✅
After the latest update, you can access billing from the left sidebar:
- Look for the **"Billing"** menu item with a credit card icon 💳
- It appears between "Team" and "Notifications"

### 2. Direct URL
Navigate directly to:
```
http://localhost:3000/dashboard/billing
```

## What You'll Find on the Billing Page

The billing page includes:
- **Pricing Plans**: View Free, Starter, Professional, and Enterprise plans
- **Current Subscription**: See your active subscription details
- **Usage**: Monitor your current usage metrics
- **Invoices**: Access billing history (via `/dashboard/billing/invoices`)
- **Upgrade/Downgrade**: Change your subscription plan

## Backend API Endpoints

The billing system uses these endpoints:
- `GET /api/v1/billing/plans` - Get available pricing plans (public)
- `GET /api/v1/billing/subscription` - Get current subscription
- `POST /api/v1/billing/subscription` - Create new subscription
- `PATCH /api/v1/billing/subscription` - Update subscription
- `DELETE /api/v1/billing/subscription` - Cancel subscription
- `GET /api/v1/billing/invoices` - Get billing invoices
- `GET /api/v1/billing/usage` - Get current usage

## Setting Up Stripe (Required for Full Functionality)

To enable billing features, you need to configure Stripe:

### Environment Variables
Add these to your `backend/.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_STARTER_PRICE_ID=price_starter_monthly
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_monthly
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly
```

### Quick Setup Steps

1. **Create a Stripe Account**
   - Go to https://stripe.com
   - Sign up for a test account (free)

2. **Get API Keys**
   - In Stripe Dashboard: Developers → API keys
   - Copy the "Secret key" (starts with `sk_test_`)
   - Copy the "Publishable key" (starts with `pk_test_`)

3. **Create Products & Prices**
   - In Stripe Dashboard: Products → Create product
   - Create three products: Starter, Professional, Enterprise
   - Add monthly pricing to each
   - Copy the Price IDs (start with `price_`)

4. **Set Up Webhooks** (Optional for testing)
   - In Stripe Dashboard: Developers → Webhooks
   - Add endpoint: `http://localhost:3001/api/v1/billing/webhook`
   - Copy the webhook signing secret

5. **Update .env**
   - Add all the keys to `backend/.env`
   - Restart the backend server

## Testing Without Stripe

If you haven't set up Stripe yet, the page will still load but:
- Plans will show hardcoded data
- Subscription operations will return mock responses
- You won't be able to actually process payments

## Other New Sidebar Items

I also added these to the sidebar for easier navigation:
- **Analytics** - View metrics and analytics
- **Team** - Manage team members and invitations
- **Notifications** - View and manage notifications

## Troubleshooting

### Page Doesn't Load
- Check backend is running: `cd backend && npm run start:dev`
- Check frontend is running: `cd frontend && npm run dev`
- Check browser console for errors

### API Errors
- Ensure you're logged in
- Check your user has an `organizationId`
- Verify backend .env is configured

### Stripe Errors
- Verify Stripe keys are valid
- Check Stripe Dashboard for errors
- Ensure Price IDs match your Stripe products

## Related Files

- Frontend: `frontend/src/app/(dashboard)/dashboard/billing/page.tsx`
- Backend: `backend/src/modules/billing/`
- Setup Guide: `STRIPE-SETUP-GUIDE.md`
- Database Schema: `backend/src/migrations/006-create-billing-tables.sql`

## Next Steps

1. Start the application:
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run start:dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. Navigate to billing:
   - Open http://localhost:3000
   - Log in
   - Click "Billing" in the sidebar

3. (Optional) Set up Stripe for full functionality

Need help with Stripe setup? Check `STRIPE-SETUP-GUIDE.md` for detailed instructions.
