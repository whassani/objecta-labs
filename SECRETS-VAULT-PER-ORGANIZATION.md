# 🔐 Secrets Vault - Per-Organization Support

## 🎯 Overview

The Secrets Vault now supports **TWO types of secrets**:

1. **Platform Secrets** (Admin-only) - Used by the platform itself
2. **Organization Secrets** (Customer-managed) - Each customer manages their own credentials

---

## 🏢 Two-Tier Secret System

### Platform Secrets (Admin-Managed)
- **Purpose**: Credentials the platform uses to operate
- **Access**: Admin panel only (`/admin/secrets`)
- **Examples**:
  - Platform Stripe keys (for billing all customers)
  - Platform SMTP credentials (for system emails)
  - Platform LLM keys (if providing shared service)
- **Who manages**: Super admins
- **Storage**: `organization_id = NULL`, `is_platform_secret = true`

### Organization Secrets (Customer-Managed)
- **Purpose**: Each customer's own API keys and credentials
- **Access**: Customer dashboard (`/dashboard/settings/credentials`)
- **Examples**:
  - Customer's own OpenAI API key
  - Customer's own SMTP credentials
  - Customer's own OAuth secrets
- **Who manages**: Organization users
- **Storage**: `organization_id = <customer-org-id>`, `is_platform_secret = false`

---

## 📊 Database Schema

### Updated Schema:

```sql
CREATE TABLE secrets_vault (
  id UUID PRIMARY KEY,
  key VARCHAR(200) NOT NULL,
  encrypted_value TEXT NOT NULL,
  iv VARCHAR(32) NOT NULL,
  auth_tag VARCHAR(32) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  environment VARCHAR(20) DEFAULT 'production',
  
  -- NEW: Organization support
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  is_platform_secret BOOLEAN DEFAULT false,
  
  last_rotated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES platform_users(id),
  updated_by UUID REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint allows same key for different orgs
  CONSTRAINT unique_platform_secret UNIQUE(key, organization_id, is_platform_secret)
);
```

### Key Changes:
- ✅ `organization_id` - Links secret to specific organization (NULL for platform)
- ✅ `is_platform_secret` - Distinguishes platform vs customer secrets
- ✅ Unique constraint - Same key can exist for different organizations

---

## 🎨 User Interfaces

### 1. Admin Panel (`/admin/secrets`)
**For**: Super admins
**Shows**: Platform secrets only
**Features**:
- Add/view/delete platform secrets
- Manage Stripe, SMTP, LLM keys for the platform
- Complete audit trail

### 2. Customer Dashboard (`/dashboard/settings/credentials`)
**For**: Organization users
**Shows**: Their organization's secrets only
**Features**:
- Add their own API keys
- Quick presets (OpenAI, Anthropic, SMTP)
- View/delete their credentials
- Secure encryption notice

---

## 🚀 Usage Examples

### Example 1: Customer Uses Their Own OpenAI Key

**Customer adds their key:**
1. User goes to `/dashboard/settings/credentials`
2. Clicks "Add Credential"
3. Selects "OpenAI API Key" preset
4. Enters their `sk-...` key
5. Saves (encrypted with their org ID)

**Platform uses customer's key:**
```typescript
// In your agent service
@Injectable()
export class AgentService {
  constructor(private secretsVault: SecretsVaultService) {}

  async executeAgent(agentId: string, organizationId: string) {
    // Get customer's OpenAI key (or fall back to platform key)
    const apiKey = await this.getOpenAIKey(organizationId);
    
    const openai = new OpenAI({ apiKey });
    // Use customer's key to make API calls
  }

  private async getOpenAIKey(organizationId: string): Promise<string> {
    try {
      // Try to get customer's own key first
      return await this.secretsVault.getSecret(
        'openai.api_key',
        'system',
        organizationId, // Customer's org ID
      );
    } catch {
      // Fall back to platform key if customer hasn't set their own
      return await this.secretsVault.getSecret(
        'openai.api_key',
        'system',
        null, // Platform secret
      );
    }
  }
}
```

---

### Example 2: Customer Uses Their Own SMTP

**Customer adds SMTP:**
```
Key: smtp.password
Value: SG.customer-key-here
Category: smtp
Organization: customer-org-uuid
```

**Platform sends email with customer's SMTP:**
```typescript
@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, body: string, organizationId: string) {
    // Get customer's SMTP password
    const smtpPassword = await this.secretsVault.getSecret(
      'smtp.password',
      'system',
      organizationId,
    );

    // Use customer's SMTP credentials
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      auth: {
        user: 'apikey',
        pass: smtpPassword, // Customer's key
      },
    });

    await transporter.sendMail({ to, subject, html: body });
  }
}
```

---

## 📋 API Endpoints

### Get Organization Secrets

```bash
# Get all secrets for a specific organization
GET /v1/admin/secrets?organizationId=<org-uuid>&scope=organization

# Get specific secret for organization
GET /v1/admin/secrets/openai.api_key?organizationId=<org-uuid>
```

### Create Organization Secret

```bash
POST /v1/admin/secrets
{
  "key": "openai.api_key",
  "value": "sk-...",
  "category": "llm",
  "description": "Customer's OpenAI API key",
  "organizationId": "customer-org-uuid",
  "isPlatformSecret": false
}
```

### Query Parameters

| Parameter | Values | Description |
|-----------|--------|-------------|
| `scope` | `platform`, `organization`, `all` | Filter by secret type |
| `organizationId` | UUID | Filter by organization |
| `category` | `stripe`, `smtp`, `llm`, etc. | Filter by category |

---

## 🔒 Security Model

### Access Control:

**Platform Secrets** (`is_platform_secret = true`):
- ✅ Super admins can read/write
- ❌ Organization users **cannot** access
- ❌ Even if they know the key name

**Organization Secrets** (`organization_id = <uuid>`):
- ✅ Users in that organization can read/write
- ✅ Super admins can view (for support)
- ❌ Users from other organizations **cannot** access

### Isolation:

```typescript
// Customer A's OpenAI key
{
  key: 'openai.api_key',
  organizationId: 'org-a-uuid',
  isPlatformSecret: false,
  value: 'sk-customer-a-key' // encrypted
}

// Customer B's OpenAI key (same key name, different org)
{
  key: 'openai.api_key',
  organizationId: 'org-b-uuid',
  isPlatformSecret: false,
  value: 'sk-customer-b-key' // encrypted
}

// Platform OpenAI key
{
  key: 'openai.api_key',
  organizationId: null,
  isPlatformSecret: true,
  value: 'sk-platform-key' // encrypted
}
```

All three can coexist! They're isolated by `organization_id`.

---

## 💡 Use Cases

### Use Case 1: BYOK (Bring Your Own Key) for LLMs

**Problem**: You want customers to use their own OpenAI/Anthropic keys

**Solution**:
1. Customer adds their key at `/dashboard/settings/credentials`
2. Platform checks if customer has their own key
3. If yes, use customer's key
4. If no, use platform key (and track usage for billing)

**Benefits**:
- ✅ Customer controls their LLM costs
- ✅ Customer owns their API usage
- ✅ You don't need to proxy all LLM calls
- ✅ Customers can use their own rate limits

---

### Use Case 2: White-Label Email

**Problem**: Enterprise customers want emails sent from their own domain

**Solution**:
1. Customer adds their SMTP credentials
2. Platform uses customer's SMTP when sending emails
3. Emails come from customer's domain

**Benefits**:
- ✅ Brand consistency
- ✅ Customer controls email deliverability
- ✅ You don't need multiple SMTP accounts

---

### Use Case 3: Custom Integrations

**Problem**: Customers want to integrate with their own services

**Solution**:
1. Customer stores OAuth tokens, API keys
2. Platform uses customer's credentials for integrations
3. Each customer connects their own accounts

**Benefits**:
- ✅ Customer data stays in their accounts
- ✅ You don't need to manage integrations
- ✅ Customers control access

---

## 🎯 Migration Guide

### Existing Platform Secrets

If you already have platform secrets, update them:

```sql
-- Mark existing secrets as platform secrets
UPDATE secrets_vault 
SET 
  is_platform_secret = true,
  organization_id = NULL
WHERE organization_id IS NULL;
```

### Adding Customer Secrets

Customers can now add via UI or API:

**Via UI:**
- Navigate to `/dashboard/settings/credentials`
- Click "Add Credential"
- Select preset or enter custom
- Save (automatically tagged with their org ID)

**Via API:**
```typescript
await api.post('/v1/admin/secrets', {
  key: 'openai.api_key',
  value: 'sk-customer-key',
  category: 'llm',
  organizationId: currentUser.organizationId,
  isPlatformSecret: false,
});
```

---

## 🔧 Code Integration Patterns

### Pattern 1: Try Customer Key, Fall Back to Platform

```typescript
async getAPIKey(organizationId: string): Promise<string> {
  try {
    // Try customer's key first
    return await this.secrets.getSecret(
      'openai.api_key',
      'system',
      organizationId,
    );
  } catch {
    // Fall back to platform key
    return await this.secrets.getSecret(
      'openai.api_key',
      'system',
      null, // Platform
    );
  }
}
```

### Pattern 2: Require Customer Key

```typescript
async getAPIKey(organizationId: string): Promise<string> {
  // Always use customer's key, error if not set
  return await this.secrets.getSecret(
    'openai.api_key',
    'system',
    organizationId,
  );
}
```

### Pattern 3: Let Customer Choose

```typescript
// Add setting in organization_settings table
const useOwnKey = await this.settings.get(
  organizationId,
  'llm.use_own_api_key',
  false,
);

if (useOwnKey) {
  return await this.secrets.getSecret('openai.api_key', 'system', organizationId);
} else {
  return await this.secrets.getSecret('openai.api_key', 'system', null);
}
```

---

## 📊 Monitoring & Analytics

### Track Key Usage:

```typescript
// Log which key was used
await this.analytics.track({
  event: 'llm_api_call',
  organizationId,
  usedOwnKey: organizationId !== null,
  provider: 'openai',
  cost: calculatedCost,
});
```

### Benefits:
- See how many customers use their own keys
- Track cost savings
- Identify power users
- Plan pricing tiers

---

## ✅ Testing

### Test 1: Create Organization Secret

```bash
# As a user
curl -X POST http://localhost:3001/v1/admin/secrets \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "openai.api_key",
    "value": "sk-test-customer-key",
    "category": "llm",
    "organizationId": "org-uuid",
    "isPlatformSecret": false
  }'
```

### Test 2: Retrieve Organization Secret

```bash
curl http://localhost:3001/v1/admin/secrets/openai.api_key?organizationId=org-uuid \
  -H "Authorization: Bearer USER_TOKEN"
```

### Test 3: Verify Isolation

```bash
# User A cannot access User B's secrets
curl http://localhost:3001/v1/admin/secrets/openai.api_key?organizationId=org-b-uuid \
  -H "Authorization: Bearer USER_A_TOKEN"

# Should return 403 Forbidden or 404 Not Found
```

---

## 🎉 Summary

### What Changed:

**Before**:
- ❌ Only platform secrets
- ❌ All customers shared same keys
- ❌ No customer-managed credentials

**After**:
- ✅ Platform secrets (admin-managed)
- ✅ Organization secrets (customer-managed)
- ✅ Complete isolation between customers
- ✅ Same key name for different orgs
- ✅ Customer UI at `/dashboard/settings/credentials`
- ✅ Admin UI at `/admin/secrets`

### Benefits:

**For You (Platform)**:
- ✅ Reduce API costs (customers use their keys)
- ✅ Reduce liability (customers own their keys)
- ✅ Enable BYOK pricing tiers
- ✅ Support enterprise customers

**For Customers**:
- ✅ Use their own API keys
- ✅ Control their costs
- ✅ Own their usage data
- ✅ Meet compliance requirements (keys never leave their control)

---

## 🚀 Next Steps

1. **Run the updated migration** (includes org support)
2. **Test with a customer account**
3. **Add UI link** in customer settings menu
4. **Update services** to check for customer keys first
5. **Document** for your customers (how to add their keys)
6. **Marketing**: Offer BYOK as a feature/tier

---

**Your customers can now manage their own credentials securely! 🔐**
