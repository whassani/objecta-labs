# Stripe Test Account Setup Guide

## Step-by-Step Setup

### 1. Create Stripe Account (5 minutes)

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/register
   - Click "Create account" or "Sign up"

2. **Fill in Account Details**
   - Email address
   - Full name
   - Country (select your country)
   - Password

3. **Verify Email**
   - Check your email for verification link
   - Click to verify

4. **Skip Business Details** (for now)
   - You can skip the business onboarding
   - We're using test mode only

### 2. Get API Keys (2 minutes)

1. **Switch to Test Mode**
   - In the Stripe Dashboard, look for the toggle in the left sidebar
   - Make sure "Test mode" is ON (it should show a test mode badge)

2. **Get Your Keys**
   - Click "Developers" in the left sidebar
   - Click "API keys"
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_`)
     - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

3. **Copy the Keys**
   ```
   Publishable key: pk_test_51Q...
   Secret key: sk_test_51Q...
   ```

### 3. Create Products and Prices (5 minutes)

1. **Go to Products**
   - Click "Products" in the left sidebar (under "Product catalog")
   - Click "+ Add product"

2. **Create Starter Plan**
   - Name: `ObjectaLabs Starter`
   - Description: `5 agents, 10,000 messages/month, 3 users`
   - Pricing model: Standard pricing
   - Price: `$29.00`
   - Billing period: Monthly
   - Click "Save product"
   - **Copy the Price ID** (starts with `price_`)

3. **Create Professional Plan**
   - Click "+ Add product" again
   - Name: `ObjectaLabs Professional`
   - Description: `25 agents, 100,000 messages/month, 10 users`
   - Price: `$99.00`
   - Billing period: Monthly
   - Click "Save product"
   - **Copy the Price ID**

4. **Create Enterprise Plan (Optional)**
   - Name: `ObjectaLabs Enterprise`
   - Description: `Unlimited everything`
   - Price: `$299.00` (or any amount, since it's custom pricing)
   - Billing period: Monthly
   - Click "Save product"
   - **Copy the Price ID**

### 4. Set Up Webhook Endpoint (3 minutes)

1. **Go to Webhooks**
   - Click "Developers" in the left sidebar
   - Click "Webhooks"
   - Click "+ Add endpoint"

2. **For Local Development (using Stripe CLI)**
   - We'll set this up with Stripe CLI below
   - Skip this step for now

3. **For Production (later)**
   - Endpoint URL: `https://api.yourdomain.com/api/v1/billing/webhooks/stripe`
   - Description: "ObjectaLabs Billing Webhooks"
   - Events to send:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `invoice.finalized`

### 5. Install Stripe CLI (5 minutes)

The Stripe CLI allows you to test webhooks locally.

#### macOS
```bash
brew install stripe/stripe-cli/stripe
```

#### Linux
```bash
# Download latest release
wget https://github.com/stripe/stripe-cli/releases/download/v1.19.5/stripe_1.19.5_linux_x86_64.tar.gz

# Extract
tar -xvf stripe_1.19.5_linux_x86_64.tar.gz

# Move to PATH
sudo mv stripe /usr/local/bin/
```

#### Windows
```powershell
# Using Scoop
scoop install stripe

# Or download from:
# https://github.com/stripe/stripe-cli/releases/latest
```

#### Verify Installation
```bash
stripe --version
```

### 6. Login to Stripe CLI
```bash
stripe login
```
- This will open a browser
- Authorize the CLI
- You'll see: "Done! The Stripe CLI is configured"

### 7. Configure Backend Environment

Now let's add the Stripe keys to your backend `.env` file:

```bash
cd backend

# Copy example env if you haven't already
cp .env.example .env

# Edit .env file
nano .env
# or
code .env
```

Add these lines (replace with your actual keys):

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51Q...
STRIPE_PUBLISHABLE_KEY=pk_test_51Q...
STRIPE_WEBHOOK_SECRET=whsec_...  # We'll get this next
STRIPE_STARTER_PRICE_ID=price_...  # From step 3
STRIPE_PROFESSIONAL_PRICE_ID=price_...  # From step 3
STRIPE_ENTERPRISE_PRICE_ID=price_...  # From step 3 (optional)
```

### 8. Get Webhook Secret (for local testing)

Run this command to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3001/api/v1/billing/webhooks/stripe
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_abc123...
```

**Copy the webhook secret** and add it to your `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

### 9. Restart Backend Server

```bash
# Stop the current server (Ctrl+C)

# Restart with new environment variables
npm run start:dev
```

You should see:
```
[BillingService] Stripe initialized successfully
```
(No more warning about missing STRIPE_SECRET_KEY!)

---

## Testing Your Setup

### Test 1: Check Pricing Plans

```bash
curl http://localhost:3001/api/v1/billing/plans | jq '.'
```

You should see all 4 pricing plans with details.

### Test 2: Use Stripe Test Cards

Stripe provides test card numbers:

**Successful Payment:**
```
Card number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Payment Requires Authentication (3D Secure):**
```
Card number: 4000 0025 0000 3155
```

**Declined Card:**
```
Card number: 4000 0000 0000 0002
```

### Test 3: Create a Test Subscription

You'll need to authenticate first to get a JWT token, then:

```bash
# 1. Register a test user (if not already done)
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "organizationName": "Test Org"
  }'

# 2. Login to get JWT token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.access_token')

# 3. Create payment method in Stripe (you'd normally do this via frontend)
# For now, we'll test via Stripe Dashboard

# 4. Check current subscription
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/billing/subscription | jq '.'
```

### Test 4: Monitor Webhooks

In a separate terminal, keep the webhook listener running:

```bash
stripe listen --forward-to localhost:3001/api/v1/billing/webhooks/stripe
```

Then trigger test events:

```bash
# Test subscription created event
stripe trigger customer.subscription.created

# Test payment succeeded event
stripe trigger invoice.payment_succeeded

# Test payment failed event
stripe trigger invoice.payment_failed
```

Watch your backend logs to see the webhook events being processed.

---

## Your Configuration Summary

Once complete, you should have:

```bash
# In backend/.env
STRIPE_SECRET_KEY=sk_test_51Q...
STRIPE_PUBLISHABLE_KEY=pk_test_51Q...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

---

## Troubleshooting

### Error: "STRIPE_SECRET_KEY not configured"
- Check `.env` file exists in `backend/` directory
- Verify key starts with `sk_test_`
- Restart the server after adding keys

### Error: "No such price"
- Verify Price IDs are correct in `.env`
- Check they're from your test mode products
- Price IDs start with `price_`

### Webhooks not working
- Make sure `stripe listen` is running
- Check webhook secret matches in `.env`
- Verify endpoint URL is correct
- Check backend logs for errors

### Can't see test mode products
- Ensure test mode toggle is ON in Stripe Dashboard
- You need separate products for test and live mode

---

## Next Steps

After Stripe is configured:

1. ✅ **Run Database Migration**
   ```bash
   psql -d objecta_labs -f backend/src/migrations/006-create-billing-tables.sql
   ```

2. ✅ **Test Subscription Flow**
   - Create test subscription
   - Verify webhook events
   - Check database records

3. ✅ **Build Frontend Billing UI**
   - Subscription selection
   - Payment method form
   - Subscription management
   - Invoice display

4. ✅ **Move to Week 2**
   - Team collaboration features

---

## Quick Reference

### Test Card Numbers
```
Success: 4242 4242 4242 4242
3D Secure: 4000 0025 0000 3155
Declined: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

### Common Stripe CLI Commands
```bash
# Login
stripe login

# List products
stripe products list

# List prices
stripe prices list

# Forward webhooks to local
stripe listen --forward-to localhost:3001/api/v1/billing/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded

# View logs
stripe logs tail
```

### Useful Links
- Stripe Dashboard: https://dashboard.stripe.com
- Stripe Docs: https://stripe.com/docs
- Test Cards: https://stripe.com/docs/testing
- Webhook Testing: https://stripe.com/docs/webhooks/test
- Stripe CLI: https://stripe.com/docs/stripe-cli

---

**Status**: Ready to configure Stripe! 🚀

Follow the steps above and let me know when you're ready to continue!
