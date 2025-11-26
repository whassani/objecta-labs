# 🔧 Fix: Credentials Validation Error

## ❌ Error
```
Failed to create: property credentials should not exist
```

## 🔍 Root Cause

The NestJS `ValidationPipe` with `whitelist: true` was stripping the `credentials` property because it didn't have proper validation decorators.

## ✅ Solution

Added `@IsObject()` decorator to the `credentials` field in the DTO:

```typescript
// Before
@ApiProperty()
credentials: any;

// After
@ApiProperty({ type: 'object' })
@IsObject()
credentials: any;
```

## 📝 Changes Made

**File:** `backend/src/modules/knowledge-base/dto/data-source.dto.ts`

1. Added `IsObject` import
2. Added `@IsObject()` decorator to `credentials`
3. Added `@IsObject()` decorator to `config`
4. Updated `@ApiProperty()` to specify `type: 'object'`

## 🧪 Test Again

Now you can create a data source:

1. Go to Knowledge Base → Data Source Sync
2. Click "Add Data Source"
3. Select GitHub
4. Fill in:
   ```
   Name: My Docs
   Token: ghp_your_token
   Owner: username
   Repo: repo-name
   Branch: main
   ```
5. Click "Test Connection" → Should work!
6. Click "Create" → Should work! ✅

## 🔄 Restart Backend

After this fix, restart your backend:

```bash
cd backend
npm run start:dev
```

The validation error should be resolved!
