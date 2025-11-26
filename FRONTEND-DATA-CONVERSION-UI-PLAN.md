# Frontend Data Conversion UI - Implementation Plan

## 🎯 Overview

Building a complete wizard UI for data conversion with 6 steps:
1. **Upload** - Drag & drop file upload
2. **Analysis** - Show detected format and column analysis
3. **Configure** - Choose mode (Guided/Smart) and options
4. **Preview** - See 5 example conversions
5. **Convert** - Process and create dataset
6. **Complete** - Success message with next actions

---

## 📁 Component Structure

```
frontend/src/components/fine-tuning/data-conversion/
├── types.ts                    ✅ Created
├── useDataConversion.ts        ✅ Created
├── StepUpload.tsx             ✅ Created
├── StepAnalysis.tsx           ✅ Created
├── StepConfigure.tsx          ⏳ To create
├── StepPreview.tsx            ⏳ To create
├── StepConvert.tsx            ⏳ To create
├── StepComplete.tsx           ⏳ To create
├── DataConversionWizard.tsx   ⏳ To create (main)
└── index.ts                   ⏳ To create
```

---

## ✅ Already Completed

### 1. **types.ts** (70 lines)
- All TypeScript interfaces
- Conversion modes, templates, analysis types
- Wizard step types

### 2. **useDataConversion.ts** (150 lines)
- Custom hook for API calls
- `analyzeData()` - POST /analyze-data
- `previewConversion()` - POST /preview-conversion
- `convertData()` - POST /convert-data
- `getTemplates()` - GET /conversion-templates
- `getSupportedFormats()` - GET /supported-formats

### 3. **StepUpload.tsx** (120 lines)
- Drag & drop file upload (react-dropzone)
- File type validation (CSV, JSON, JSONL)
- Auto-analyze on upload
- Loading states and error handling
- Format info display

### 4. **StepAnalysis.tsx** (160 lines)
- Summary cards (format, rows, columns, structure)
- AI suggestions display (key column, target column, template)
- Column analysis table with types and tags
- Data preview table (first 5 rows)
- Continue button

---

## ⏳ Remaining Components

### 5. **StepConfigure.tsx** (~200 lines)

**Purpose**: Configure conversion options

**UI Elements**:

```typescript
// Mode Selection
○ Guided Conversion 🎯 (Recommended)
  - Choose template
  - Configure options
  - Full control
  
○ Smart Conversion 🤖 (AI-Powered)
  - AI analyzes automatically
  - No configuration needed
  - Premium quality

// Guided Mode Options:
- Template selector (Q&A, Info Extraction, Classification, Custom)
- Key column dropdown (from analysis)
- Target column dropdown (optional)
- System message textarea
- ☑ Multi-turn generation checkbox
- Custom prompts (if Custom template selected)

// Smart Mode Options:
- AI Provider: ○ OpenAI  ○ Ollama
- Max examples per row: slider (1-5)
- ☑ Multi-turn generation checkbox

// Preview Button
[Preview Conversion →]
```

**Key Features**:
- Dynamic form based on selected mode
- Pre-fill with AI suggestions
- Template preview
- Validation before preview

---

### 6. **StepPreview.tsx** (~180 lines)

**Purpose**: Show example conversions before committing

**UI Elements**:

```typescript
// Estimate Banner
┌─────────────────────────────────────────┐
│ 📊 Estimated: 300 training examples     │
│ From 100 rows with multi-turn enabled   │
└─────────────────────────────────────────┘

// Example Cards (5 examples)
Example 1 of 5:
┌─────────────────────────────────────────┐
│ 💬 System                               │
│ You are a helpful assistant...          │
│                                         │
│ 👤 User                                 │
│ What is iPhone 15?                      │
│                                         │
│ 🤖 Assistant                            │
│ iPhone 15 is a smartphone priced at..  │
└─────────────────────────────────────────┘

// Navigation
[← Back to Configuration]  [Convert All →]
```

**Key Features**:
- Scrollable example list
- Syntax highlighting for messages
- Estimated total display
- Edit option (go back to configure)
- Loading state during preview generation

---

### 7. **StepConvert.tsx** (~120 lines)

**Purpose**: Show conversion progress

**UI Elements**:

```typescript
// Dataset Info
Dataset Name:    [text input]
Description:     [textarea]

// Progress (during conversion)
┌─────────────────────────────────────────┐
│ Converting your data...                 │
│ ████████████████░░░░░░░░ 65%           │
│ Processing 65/100 rows                  │
└─────────────────────────────────────────┘

// OR Loading Spinner
```

**Key Features**:
- Name and description inputs
- Progress indicator (if available)
- Error handling
- Auto-advance to complete on success

---

### 8. **StepComplete.tsx** (~100 lines)

**Purpose**: Show success and next actions

**UI Elements**:

```typescript
// Success Message
✅ Dataset Created Successfully!

Dataset: Customer Training Data
Examples: 300
Format: JSONL
Size: 150 KB

// Quick Actions
┌─────────────────────┐  ┌─────────────────────┐
│ View Dataset        │  │ Start Fine-Tuning   │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│ Convert Another     │  │ Go to Datasets      │
└─────────────────────┘  └─────────────────────┘
```

**Key Features**:
- Success animation
- Dataset summary
- Action buttons with routing
- Reset wizard option

---

### 9. **DataConversionWizard.tsx** (~250 lines)

**Purpose**: Main wizard component that orchestrates all steps

**Structure**:

```typescript
export function DataConversionWizard() {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [options, setOptions] = useState<ConversionOptions>(...);
  const [preview, setPreview] = useState<ConversionPreview | null>(null);
  const [dataset, setDataset] = useState(null);

  // Hooks
  const { analyzeData, previewConversion, convertData, ... } = useDataConversion();

  // Render based on step
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Step Content */}
      {currentStep === 'upload' && <StepUpload ... />}
      {currentStep === 'analyze' && <StepAnalysis ... />}
      {currentStep === 'configure' && <StepConfigure ... />}
      {currentStep === 'preview' && <StepPreview ... />}
      {currentStep === 'convert' && <StepConvert ... />}
      {currentStep === 'complete' && <StepComplete ... />}
    </div>
  );
}
```

**Key Features**:
- Step progression management
- State management across steps
- Progress indicator
- Back button support
- Error recovery

---

### 10. **index.ts** (~10 lines)

```typescript
export { DataConversionWizard } from './DataConversionWizard';
export * from './types';
```

---

## 🎨 UI/UX Features

### Visual Design
- ✅ **Step-by-step wizard** - Clear progression
- ✅ **Progress bar** - Visual feedback
- ✅ **Card layouts** - Clean organization
- ✅ **Color coding** - Type indicators (blue=text, green=number, etc.)
- ✅ **Icons** - Visual cues (🎯 Guided, 🤖 Smart, etc.)
- ✅ **Tooltips** - Help text on hover
- ✅ **Responsive** - Works on all screen sizes

### Interactions
- ✅ **Drag & drop** - Easy file upload
- ✅ **Live preview** - See before converting
- ✅ **Auto-suggestions** - AI recommendations
- ✅ **Validation** - Prevent errors
- ✅ **Loading states** - Feedback during operations
- ✅ **Error messages** - Clear error communication

---

## 📦 Dependencies Needed

```json
{
  "dependencies": {
    "react-dropzone": "^14.2.3",  // File upload
    "react-hook-form": "^7.48.2",  // Form handling (optional)
    "framer-motion": "^10.16.4"    // Animations (optional)
  }
}
```

Install:
```bash
npm install react-dropzone
```

---

## 🔗 Integration

### Add to Fine-Tuning Page

```typescript
// frontend/src/app/(dashboard)/dashboard/fine-tuning/datasets/new/page.tsx

import { DataConversionWizard } from '@/components/fine-tuning/data-conversion';

export default function NewDatasetPage() {
  return (
    <div className="container mx-auto py-8">
      <DataConversionWizard />
    </div>
  );
}
```

### Or Add as Modal

```typescript
// In any page
<Modal open={showWizard} onClose={() => setShowWizard(false)}>
  <DataConversionWizard />
</Modal>
```

---

## 🧪 Testing Checklist

### Manual Testing
- [ ] Upload CSV file
- [ ] Upload JSON array
- [ ] Upload nested JSON
- [ ] Upload JSONL
- [ ] See analysis results
- [ ] Configure Guided mode
- [ ] Configure Smart mode
- [ ] Preview examples
- [ ] Convert and create dataset
- [ ] Navigate to created dataset
- [ ] Handle errors gracefully

### Edge Cases
- [ ] Very large files (>10MB)
- [ ] Invalid file formats
- [ ] Empty files
- [ ] Files with special characters
- [ ] Network errors
- [ ] API timeouts

---

## 📊 Estimated Effort

| Component | Lines | Time | Status |
|-----------|-------|------|--------|
| types.ts | 70 | ✅ | Done |
| useDataConversion.ts | 150 | ✅ | Done |
| StepUpload.tsx | 120 | ✅ | Done |
| StepAnalysis.tsx | 160 | ✅ | Done |
| StepConfigure.tsx | 200 | ⏳ | Remaining |
| StepPreview.tsx | 180 | ⏳ | Remaining |
| StepConvert.tsx | 120 | ⏳ | Remaining |
| StepComplete.tsx | 100 | ⏳ | Remaining |
| DataConversionWizard.tsx | 250 | ⏳ | Remaining |
| **Total** | **~1,350 lines** | **4-6 hours** | **30% Complete** |

---

## 🎯 Quick Implementation Guide

### Option A: Complete the Remaining Components
I can create all remaining components (StepConfigure through DataConversionWizard)

### Option B: Create a Simplified Version
Build a single-page form without wizard steps for faster implementation

### Option C: Create the Main Wizard + Placeholders
Build DataConversionWizard with TODO placeholders for missing steps

---

## 📝 Next Actions

**What would you like me to do?**

1. **Complete all remaining components** (Steps 5-10)
   - Full wizard implementation
   - ~900 more lines
   - Production-ready

2. **Create simplified single-page version**
   - No wizard steps
   - ~300 lines
   - Faster to build

3. **Create main wizard skeleton**
   - DataConversionWizard with all steps
   - Placeholders for incomplete steps
   - Can fill in later

4. **Something else?**

---

**Current Status**: 
- ✅ Core infrastructure complete (API hooks, types)
- ✅ Upload and Analysis steps complete
- ⏳ Configuration, Preview, Convert, Complete steps remaining
- 📦 Ready to continue with full implementation

Which option would you prefer?
