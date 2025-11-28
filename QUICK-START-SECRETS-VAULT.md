# 🚀 Secrets Vault - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Generate Master Key (30 seconds)

```bash
cd backend
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output (looks like: `a1b2c3d4e5f6...`)

---

### Step 2: Add to .env (30 seconds)

Open `backend/.env` and add:

```env
# Secrets Vault Master Key (NEVER commit to git!)
SECRETS_MASTER_KEY=paste-your-generated-key-here
```

**⚠️ CRITICAL**: This key encrypts all your secrets. Keep it safe!

---

### Step 3: Run Migration (2 minutes)

```bash
cd backend
chmod +x run-secrets-migration.sh
./run-secrets-migration.sh
```

**Expected output:**
```
✅ Migration completed successfully!
✅ Secrets Vault is ready!
```

---

### Step 4: Start Backend (1 minute)

```bash
npm run start:dev
```

**Check it's working:**
```bash
curl http://localhost:3001/v1/admin/secrets/health/test-encryption \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### Step 5: Access UI (1 minute)

Open: **http://localhost:3000/admin/secrets**

You should see the Secrets Vault interface!

---

## 🎯 Add Your First Secret

### Via UI (Easiest):

1. Go to http://localhost:3000/admin/secrets
2. Click **"Add Secret"**
3. Fill in:
   - **Key**: `stripe.secret_key`
   - **Value**: `sk_test_51...` (your actual key)
   - **Category**: `stripe`
   - **Description**: `Stripe test secret key`
4. Click **"Save Secret"**
5. ✅ Done! Your secret is now encrypted!

### Via API:

```bash
curl -X POST http://localhost:3001/v1/admin/secrets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "stripe.secret_key",
    "value": "sk_test_51...",
    "category": "stripe",
    "description": "Stripe test secret key"
  }'
```

---

## 🔑 Common Secrets to Add

### Stripe (Get from: https://dashboard.stripe.com/apikeys)

```
Key: stripe.secret_key
Value: sk_live_51... (or sk_test_51... for testing)
Category: stripe

Key: stripe.publishable_key
Value: pk_live_51...
Category: stripe

Key: stripe.webhook_secret
Value: whsec_...
Category: stripe
```

### SMTP (SendGrid example)

```
Key: smtp.password
Value: SG.xxx... (your SendGrid API key)
Category: smtp
```

### OpenAI

```
Key: openai.api_key
Value: sk-...
Category: llm
```

### Anthropic

```
Key: anthropic.api_key
Value: sk-ant-...
Category: llm
```

---

## 👁️ View a Secret (Decrypted)

### Via UI:

1. Go to http://localhost:3000/admin/secrets
2. Find your secret
3. Click the **eye icon** 👁️
4. Value is shown (decrypted)
5. **Access is logged!** Check audit log

### Via API:

```bash
curl http://localhost:3001/v1/admin/secrets/stripe.secret_key \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**
```json
{
  "key": "stripe.secret_key",
  "value": "sk_test_51...",
  "warning": "This value is sensitive. Do not log or expose it."
}
```

---

## 🔄 Use Secret in Your Code

### Method 1: Via Service (Recommended)

```typescript
// In any service
import { SecretsVaultService } from '@/modules/admin/services/secrets-vault.service';

@Injectable()
export class StripeService {
  constructor(private secretsVault: SecretsVaultService) {}

  async initialize() {
    // Get decrypted secret (cached for 5 minutes)
    const apiKey = await this.secretsVault.getSecret(
      'stripe.secret_key',
      'system-id', // or admin ID
    );
    
    this.stripe = new Stripe(apiKey);
  }
}
```

### Method 2: Via ConfigService (Fallback)

```typescript
// For backward compatibility, still use .env
@Injectable()
export class StripeService {
  constructor(
    private config: ConfigService,
    private secretsVault: SecretsVaultService,
  ) {}

  async getApiKey() {
    // Try secrets vault first, fallback to .env
    try {
      return await this.secretsVault.getSecret('stripe.secret_key', 'system');
    } catch {
      return this.config.get('STRIPE_SECRET_KEY');
    }
  }
}
```

---

## 🔐 Security Features

### ✅ What's Protected:

- **AES-256-GCM encryption** - Military-grade
- **Unique IV per secret** - Maximum security
- **Complete audit trail** - Every access logged
- **IP address tracking** - Know who accessed what
- **5-minute cache** - Performance without compromising security
- **Admin-only access** - Role-based permissions

### ✅ What's Logged:

Every time you access a secret:
- Who accessed it (admin ID)
- When they accessed it (timestamp)
- From where (IP address)
- Success or failure
- Action type (read, write, update, delete, rotate)

View logs at: `/v1/admin/secrets/audit/access-log`

---

## 🧪 Test It

### Test 1: Create a test secret

```bash
curl -X POST http://localhost:3001/v1/admin/secrets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test.my_secret",
    "value": "super-secret-value-123",
    "category": "other",
    "description": "Test secret"
  }'
```

### Test 2: Retrieve it

```bash
curl http://localhost:3001/v1/admin/secrets/test.my_secret \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test 3: Check audit log

```bash
curl http://localhost:3001/v1/admin/secrets/audit/access-log \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test 4: Delete it

```bash
curl -X DELETE http://localhost:3001/v1/admin/secrets/test.my_secret \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 🆘 Troubleshooting

### "Invalid SECRETS_MASTER_KEY format"

**Fix**: Generate a new key (64 hex characters)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "Failed to decrypt secret"

**Causes**:
- Master key changed
- Using wrong environment

**Fix**: 
1. Verify SECRETS_MASTER_KEY in .env
2. Use the same key that encrypted the secrets

### UI shows "Failed to load secrets"

**Fix**:
```bash
# Check backend is running
curl http://localhost:3001/v1/admin/secrets \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check database tables exist
psql -d objecta-labs -c "\dt secrets_vault"
```

### Cannot access /admin/secrets page

**Fix**:
1. Ensure you're logged in as admin
2. Check admin role (must be super_admin)
3. Clear browser cache

---

## 📊 What Gets Created

### Database Tables (3):
```sql
secrets_vault              -- Encrypted secrets storage
secrets_access_log         -- Audit trail
secrets_rotation_history   -- Rotation tracking
```

### Backend Files (7):
```
entities/
  - secret-vault.entity.ts
  - secrets-access-log.entity.ts
  - secrets-rotation-history.entity.ts
dto/
  - secrets.dto.ts
services/
  - secrets-vault.service.ts
controllers/
  - secrets.controller.ts
```

### Frontend Files (1):
```
app/(admin)/admin/secrets/page.tsx
```

---

## 🎓 Best Practices

### DO:
- ✅ Use unique master key per environment
- ✅ Store master key in AWS Secrets Manager (production)
- ✅ Rotate secrets every 90 days
- ✅ Review audit logs weekly
- ✅ Delete secrets when no longer needed
- ✅ Use descriptive key names (category.name)
- ✅ Add descriptions to secrets

### DON'T:
- ❌ Never commit SECRETS_MASTER_KEY to git
- ❌ Never share decrypted values in chat/email
- ❌ Never reuse master keys across environments
- ❌ Never log decrypted secret values
- ❌ Never screenshot decrypted secrets

---

## 📚 Documentation

- **Full Documentation**: `SECRETS-VAULT-COMPLETE.md`
- **Strategy Guide**: `CREDENTIALS-MANAGEMENT-STRATEGY.md`
- **API Reference**: Check Swagger at `/api/docs`

---

## ✅ Next Steps

1. **Migrate existing secrets**:
   - Move API keys from .env to vault
   - Update services to use SecretsVaultService
   - Keep .env as fallback

2. **Set up rotation schedule**:
   - Document when each secret should rotate
   - Set calendar reminders
   - Test rotation process

3. **Configure monitoring**:
   - Set up alerts for failed access
   - Monitor audit logs
   - Track secret expiry dates

4. **Train your team**:
   - Show them how to add secrets
   - Explain security importance
   - Review audit logs together

---

## 🎉 You're Done!

In just 5 minutes, you've set up:
- ✅ Encrypted secrets storage
- ✅ Complete audit trail
- ✅ Beautiful management UI
- ✅ Production-ready security

**Your secrets are now secure!** 🔐

Start adding your API keys and sleep better knowing they're encrypted! 😴
