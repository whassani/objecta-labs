# Tool Edit Functionality and Enhanced HTTP Headers

## Summary
Added the ability to edit tools/actions and improved HTTP API compatibility with better default headers.

## Changes Made

### 1. Fixed ExecuteToolDto Validation Issue
**File:** `backend/src/modules/tools/dto/execute-tool.dto.ts`

**Problem:** The DTO required a `toolId` field in the request body, but the tool ID was being passed via URL parameter, causing validation errors.

**Solution:** Removed the redundant `toolId` field from the DTO since it's obtained from the URL path parameter.

```typescript
// Before
export class ExecuteToolDto {
  @IsString()
  toolId: string;  // ❌ Not needed
  
  @IsOptional()
  input?: any;
}

// After
export class ExecuteToolDto {
  @IsOptional()
  input?: any;  // ✅ Only optional fields needed
  
  @IsOptional()
  context?: any;
}
```

### 2. Enhanced HTTP API Default Headers
**File:** `backend/src/modules/tools/built-in/http-api.tool.ts`

**Problem:** APIs were rejecting requests due to the default axios User-Agent header.

**Solution:** Added comprehensive default headers that mimic browser requests:

```typescript
const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (compatible; AIAgent/1.0; +https://ai-agent-platform.com)',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};
```

**Benefits:**
- Better API compatibility
- Reduced 403 Forbidden errors
- Custom headers in tool config can still override defaults
- More professional and standards-compliant requests

### 3. Added Tool Edit Functionality
**Files Modified:**
- `frontend/src/components/tools/CreateToolModal.tsx`
- `frontend/src/app/(dashboard)/dashboard/tools/page.tsx`

**Features Added:**
- Reused `CreateToolModal` for both create and edit operations
- Added `tool` prop to modal - when provided, it switches to edit mode
- Form pre-populates with existing tool data when editing
- Dynamic title: "Create New Tool" vs "Edit Tool"
- Dynamic submit button: "Create Tool" vs "Update Tool"
- Proper state management with `useEffect` to reset form when modal opens

**Implementation Highlights:**

```typescript
// Modal accepts optional tool prop for editing
interface CreateToolModalProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
  tool?: any // If provided, we're editing instead of creating
}

// Smart initial data based on mode
const getInitialFormData = () => {
  if (tool) {
    // Pre-populate with existing tool data
    return { ...tool, config: tool.config || defaultConfig }
  }
  // Default empty form for create mode
  return defaultFormData
}

// Dual mutation support
const createMutation = useMutation({ ... })
const updateMutation = useMutation({ ... })

const handleSubmit = (e) => {
  if (isEditMode) {
    updateMutation.mutate(formData)
  } else {
    createMutation.mutate(formData)
  }
}
```

**UI Changes:**
- Edit button (pencil icon) now functional on tools page
- Clicking edit opens the same modal with tool data pre-filled
- All 3 steps (Basic Info, Configuration, Settings) work in edit mode
- Success toast shows appropriate message based on mode

### 4. State Management Improvements
- Added `editingTool` state alongside existing `testingTool` state
- Proper cleanup when modals close
- Form resets to correct initial state when switching between tools

## Testing

### Backend Builds Successfully
```bash
✓ Backend TypeScript compilation successful
✓ No build errors
```

### Frontend Builds Successfully
```bash
✓ Next.js production build successful
✓ All pages compiled without errors
✓ Tool edit functionality added to dashboard/tools page
```

## Usage

### Testing a Tool
1. Navigate to Tools page
2. Click the beaker icon to test
3. No longer get "toolId must be a string" error
4. Can now test tools with or without parameters

### Editing a Tool
1. Navigate to Tools page
2. Click the pencil icon on any tool
3. Modal opens with all current settings pre-filled
4. Make changes across any of the 3 steps
5. Click "Update Tool" to save changes

### HTTP API Tools with Custom Headers
If an API still requires specific headers, add them in the tool configuration:

```json
{
  "url": "https://api.example.com/endpoint",
  "method": "GET",
  "headers": {
    "User-Agent": "CustomAgent/1.0",
    "X-Custom-Header": "value"
  }
}
```

Custom headers will override the defaults while keeping other default headers intact.

## Benefits

1. **Better User Experience**: Users can now edit tools without recreating them
2. **Improved API Compatibility**: More APIs will work out of the box
3. **Validation Fix**: No more confusing validation errors when testing tools
4. **Code Reusability**: Single modal component handles both create and edit
5. **Professional HTTP Requests**: Default headers make requests look legitimate

## Update: Fixed Field Validation Issue

### Problem
When updating tools, the backend was rejecting requests with:
- `property toolType should not exist`
- `property actionType should not exist`
- `property agentId should not exist`

### Root Cause
The `UpdateToolDto` only allows specific fields to be updated. Fields like `toolType`, `actionType`, and `agentId` are immutable after creation to maintain data integrity.

### Solution
**File:** `frontend/src/components/tools/CreateToolModal.tsx`

1. **Excluded immutable fields from update payload:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  if (isEditMode) {
    // Exclude fields that shouldn't be changed
    const { toolType, actionType, agentId, ...updateData } = formData
    updateMutation.mutate(updateData)
  } else {
    createMutation.mutate(formData)
  }
}
```

2. **Disabled immutable fields in edit mode:**
```typescript
<select
  value={formData.toolType}
  disabled={isEditMode}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  {/* options */}
</select>
{isEditMode && (
  <p className="text-xs text-gray-500">
    Tool type cannot be changed after creation
  </p>
)}
```

### Updatable Fields
According to `UpdateToolDto`, only these fields can be updated:
- ✅ `name` - Tool name
- ✅ `description` - Tool description
- ✅ `config` - Configuration (API URL, method, auth, etc.)
- ✅ `schema` - Input/output schema
- ✅ `permissions` - Permission array
- ✅ `requiresApproval` - Approval requirement
- ✅ `rateLimit` - Rate limiting
- ✅ `isEnabled` - Enable/disable status

### Immutable Fields
These cannot be changed after creation:
- ❌ `toolType` - Type of tool (http-api, calculator, etc.)
- ❌ `actionType` - Action classification (read, write, update, delete)
- ❌ `agentId` - Associated agent ID
- ❌ `organizationId` - Organization ownership

## Update: Fixed Premature Form Submission and Step Navigation

### Problem 1: Can't Access Settings Step
Users couldn't navigate to step 3 (Settings) when creating or editing tools. Clicking "Next" on step 2 would immediately submit the form.

### Problem 2: HTML5 Validation Blocking Navigation
HTML5 form validation with `required` attributes was preventing the "Next" button from working properly.

### Root Causes
1. HTML5 `required` attributes on input fields were triggering browser validation
2. Form submission was being triggered immediately after step state changed to 3
3. The form's `onSubmit` handler was firing due to React state updates

### Solutions Implemented
**File:** `frontend/src/components/tools/CreateToolModal.tsx`

#### 1. Removed Required Attributes
```typescript
// Changed from:
<input type="url" required ... />

// To:
<input type="text" ... />
```

Removed `required` from:
- Tool name input
- Description textarea
- API URL input (also changed from `type="url"` to `type="text"`)

#### 2. Added Submission Gate with State Flag
```typescript
const [canSubmit, setCanSubmit] = useState(false)

// Prevent submission when navigating
const handleNext = () => {
  setCanSubmit(false) // Block submission
  setStep(step + 1)
}

// Enable submission only on step 3 with delay
useEffect(() => {
  if (step === 3) {
    const timer = setTimeout(() => {
      setCanSubmit(true)
    }, 100)
    return () => clearTimeout(timer)
  } else {
    setCanSubmit(false)
  }
}, [step])

// Check both step and canSubmit flag
const handleSubmit = (e: React.FormEvent) => {
  if (step !== 3 || !canSubmit) {
    return
  }
  // ... submit logic
}
```

#### 3. Changed Submit Button Type
```typescript
// Changed from type="submit" to type="button"
<button
  type="button"
  onClick={handleSubmit}
  disabled={!canSubmit || isPending}
>
  {isEditMode ? 'Update Tool' : 'Create Tool'}
</button>
```

### Result
✅ All 3 steps are now accessible and navigable
✅ Step 1: Basic Info → Step 2: Configuration → Step 3: Settings
✅ "Next" button properly advances through steps
✅ Form only submits when explicitly clicking the final button on step 3
✅ 100ms delay prevents accidental immediate submission
✅ Form no longer auto-submits on Enter key or state changes
✅ HTML5 validation doesn't block navigation

## Next Steps

Consider adding:
- Bulk edit for multiple tools
- Tool versioning/history
- Tool templates/presets
- Advanced header configuration UI
- Request/response preview in test modal
