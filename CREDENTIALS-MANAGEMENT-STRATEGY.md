# 🔐 Credentials & Provider Management Strategy

## 🎯 The Challenge

You need to manage sensitive credentials like:
- Stripe API keys
- SMTP passwords
- OpenAI API keys
- Ollama endpoints
- Database passwords
- JWT secrets
- Encryption keys

## 🤔 Three Approaches

### ❌ **Approach 1: Store in System Settings (NOT RECOMMENDED)**
**Pros**: Easy to manage via UI
**Cons**: 
- Security risk (credentials in database)
- Hard to rotate
- Not suitable for secrets
- Violates security best practices

### ⚠️ **Approach 2: Hybrid (PARTIALLY RECOMMENDED)**
**Non-sensitive configs in settings, secrets in environment variables**

**Use System Settings for**:
- SMTP host, port (public info)
- Stripe webhook URLs (public)
- Default model names
- Feature toggles
- Rate limits

**Use Environment Variables for**:
- SMTP password
- Stripe secret keys
- API keys
- Database passwords
- JWT secrets

### ✅ **Approach 3: Secrets Management System (BEST PRACTICE)**
**Full-featured secrets management with encryption**

---

## 🏆 Recommended Solution: Hybrid + Secrets Vault

I recommend a **three-tier approach**:

### Tier 1: Public Configuration (System Settings)
✅ Already implemented in your config system
- Non-sensitive settings
- Feature flags
- Public URLs
- Default values

### Tier 2: Environment Variables (.env)
✅ For deployment-specific configs
- Database connection
- JWT secret
- Redis connection
- Base URLs

### Tier 3: Encrypted Secrets Vault (NEW)
✅ For sensitive provider credentials
- API keys (Stripe, OpenAI)
- SMTP passwords
- OAuth secrets
- Encryption keys

---

## 🔨 Implementation Plan

### Option A: Quick Setup (Use .env for now)

**Best for**: Getting started quickly, single server deployment

```env
# .env file (NEVER commit this!)

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxx...
SMTP_FROM=noreply@yourapp.com

# LLM Providers
OPENAI_API_KEY=sk-...
OLLAMA_BASE_URL=http://localhost:11434
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Security
JWT_SECRET=your-secret-here
ENCRYPTION_KEY=your-32-byte-key-here
```

**Then access via ConfigService**:
```typescript
constructor(private configService: ConfigService) {}

getStripeKey() {
  return this.configService.get('STRIPE_SECRET_KEY');
}
```

---

### Option B: Encrypted Secrets Vault (Recommended)

**Best for**: Production, multiple environments, team collaboration

#### Step 1: Create Secrets Vault Table

```sql
CREATE TABLE secrets_vault (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  encrypted_value TEXT NOT NULL,
  description TEXT,
  category VARCHAR(50), -- stripe, email, llm, database
  environment VARCHAR(20) DEFAULT 'production', -- production, staging, dev
  last_rotated_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_by UUID REFERENCES platform_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_secrets_category ON secrets_vault(category);
CREATE INDEX idx_secrets_env ON secrets_vault(environment);
```

#### Step 2: Create Secrets Service

```typescript
// backend/src/modules/admin/services/secrets-vault.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SecretsVaultService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor() {
    // Master key from environment (NEVER store in database)
    this.masterKey = Buffer.from(
      process.env.SECRETS_MASTER_KEY || 'your-32-byte-key-here-change-in-production',
      'hex'
    );
  }

  // Encrypt a secret
  encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  // Decrypt a secret
  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.masterKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Store a secret
  async setSecret(key: string, value: string, category: string): Promise<void> {
    const { encrypted, iv, tag } = this.encrypt(value);
    
    // Store: encrypted||iv||tag as single field
    const encryptedValue = `${encrypted}||${iv}||${tag}`;
    
    await this.secretsRepository.upsert({
      key,
      encrypted_value: encryptedValue,
      category,
    });
  }

  // Retrieve a secret
  async getSecret(key: string): Promise<string | null> {
    const secret = await this.secretsRepository.findOne({ where: { key } });
    if (!secret) return null;

    const [encrypted, iv, tag] = secret.encrypted_value.split('||');
    return this.decrypt(encrypted, iv, tag);
  }
}
```

#### Step 3: Create Secrets Management UI

```tsx
// frontend/src/app/(admin)/admin/secrets/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff, Plus } from 'lucide-react';

export default function SecretsPage() {
  const [secrets, setSecrets] = useState([]);
  const [showValues, setShowValues] = useState({});

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <Shield className="h-8 w-8 text-blue-600" />
        Secrets Vault
      </h1>

      <div className="grid gap-4 mt-6">
        {/* Stripe Section */}
        <Card>
          <CardHeader>
            <CardTitle>Stripe Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SecretInput 
              label="Secret Key"
              secretKey="stripe.secret_key"
              placeholder="sk_live_..."
            />
            <SecretInput 
              label="Publishable Key"
              secretKey="stripe.publishable_key"
              placeholder="pk_live_..."
            />
            <SecretInput 
              label="Webhook Secret"
              secretKey="stripe.webhook_secret"
              placeholder="whsec_..."
            />
          </CardContent>
        </Card>

        {/* SMTP Section */}
        <Card>
          <CardHeader>
            <CardTitle>SMTP Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Host" value="smtp.sendgrid.net" />
            <Input label="Port" value="587" type="number" />
            <Input label="Username" value="apikey" />
            <SecretInput 
              label="Password"
              secretKey="smtp.password"
              placeholder="SG.xxx..."
            />
          </CardContent>
        </Card>

        {/* LLM Providers Section */}
        <Card>
          <CardHeader>
            <CardTitle>LLM Provider Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SecretInput 
              label="OpenAI API Key"
              secretKey="openai.api_key"
              placeholder="sk-..."
            />
            <SecretInput 
              label="Anthropic API Key"
              secretKey="anthropic.api_key"
              placeholder="sk-ant-..."
            />
            <Input 
              label="Ollama URL"
              value="http://localhost:11434"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Reusable component for secret inputs
function SecretInput({ label, secretKey, placeholder }) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await api.post('/v1/admin/secrets', {
      key: secretKey,
      value,
      category: secretKey.split('.')[0],
    });
    setSaved(true);
    setValue(''); // Clear after save for security
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <Button 
          variant="outline" 
          onClick={() => setShow(!show)}
        >
          {show ? <EyeOff /> : <Eye />}
        </Button>
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>
      {saved && <p className="text-green-600 text-sm">✓ Saved securely</p>}
    </div>
  );
}
```

---

## 🔑 Best Practices

### 1. Never Commit Secrets to Git

```bash
# .gitignore (already should have this)
.env
.env.local
.env.*.local
*.key
*.pem
```

### 2. Use Different Keys per Environment

```
Development:   STRIPE_SECRET_KEY=sk_test_...
Staging:       STRIPE_SECRET_KEY=sk_test_...
Production:    STRIPE_SECRET_KEY=sk_live_...
```

### 3. Rotate Secrets Regularly

```typescript
// Add expiry tracking
async rotateSecret(key: string) {
  const newValue = await generateNewSecret();
  await this.setSecret(key, newValue, 'rotation');
  
  // Log rotation
  await this.auditLog.create({
    action: 'secret_rotated',
    key,
    rotated_at: new Date(),
  });
}
```

### 4. Limit Access

```typescript
// Only super admins can view/edit secrets
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('v1/admin/secrets')
export class SecretsController {
  // ...
}
```

### 5. Audit All Access

```typescript
async getSecret(key: string, adminId: string) {
  await this.auditLog.create({
    action: 'secret_accessed',
    key,
    accessed_by: adminId,
    ip_address: req.ip,
  });
  
  return this.secretsVault.getSecret(key);
}
```

---

## 🚀 Quick Start (Recommended for Now)

### Step 1: Use .env for Immediate Needs

Create `backend/.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_51...
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...

# SMTP (SendGrid example)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxx
SMTP_FROM=noreply@yourapp.com

# OpenAI
OPENAI_API_KEY=sk-...

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 2: Access in Your Services

```typescript
// Already works with your current setup
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StripeService {
  constructor(private config: ConfigService) {
    const apiKey = this.config.get('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(apiKey);
  }
}
```

### Step 3: Later, Migrate to Secrets Vault

When ready for production:
1. Run the secrets vault migration
2. Move secrets from .env to vault via UI
3. Update services to use SecretsVaultService

---

## 📋 Configuration Checklist

### Stripe Setup
- [ ] Get keys from https://dashboard.stripe.com/apikeys
- [ ] Add to .env: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`
- [ ] Set up webhook endpoint in Stripe dashboard
- [ ] Add webhook secret to .env: `STRIPE_WEBHOOK_SECRET`
- [ ] Test with Stripe CLI: `stripe listen --forward-to localhost:3001/v1/billing/webhook`

### SMTP Setup (SendGrid example)
- [ ] Create account at https://sendgrid.com
- [ ] Create API key
- [ ] Add to .env: `SMTP_PASSWORD=SG.xxx`
- [ ] Set `SMTP_HOST=smtp.sendgrid.net`, `SMTP_PORT=587`
- [ ] Verify sender email in SendGrid
- [ ] Test: Send a test email

### OpenAI Setup
- [ ] Get API key from https://platform.openai.com/api-keys
- [ ] Add to .env: `OPENAI_API_KEY=sk-...`
- [ ] Set organization if needed: `OPENAI_ORG_ID`
- [ ] Test: Make a test completion

### Ollama Setup
- [ ] Install Ollama: `curl https://ollama.ai/install.sh | sh`
- [ ] Pull model: `ollama pull llama2`
- [ ] Verify running: `curl http://localhost:11434/api/tags`
- [ ] Add to .env: `OLLAMA_BASE_URL=http://localhost:11434`

---

## 🎯 My Recommendation

**For Now (Quick Start)**:
1. ✅ Use `.env` file for all secrets
2. ✅ Use System Settings for non-sensitive configs (already implemented)
3. ✅ Keep `.env` in `.gitignore`

**For Production (Later)**:
1. ✅ Implement Secrets Vault (I can build this)
2. ✅ Migrate secrets from .env to vault
3. ✅ Add secrets rotation
4. ✅ Add access auditing

---

## 🤔 Which Approach Do You Want?

1. **Quick (.env only)** - Set up in 5 minutes
2. **Basic Secrets Vault** - Build encrypted vault (2-3 hours)
3. **Full Secrets Management** - Complete system with rotation, auditing, UI (1 day)

Let me know and I'll implement it! 🚀
