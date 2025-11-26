# 🎯 CSV Conversion Modes - Commercial Naming

## 📋 Conversion Mode Options

After analyzing the approaches, here are professional naming options:

---

## **Option Set 1: Clarity-Focused** ⭐ (RECOMMENDED)

### **🎯 Guided Conversion**
- **What it is**: Template-Based + Wizard (Approach 1 + 5)
- **Tagline**: "Choose your format, preview, and convert with confidence"
- **User sees**: Step-by-step wizard with templates
- **Best for**: Users who want control and visibility
- **Icon**: 🎯 or 🧭

### **🤖 Smart Conversion**
- **What it is**: AI-Powered Analysis (Approach 2)
- **Tagline**: "AI analyzes your data and creates optimal training examples"
- **User sees**: "Analyzing your data..." → Automatic conversion
- **Best for**: Users who want the best quality with less effort
- **Icon**: 🤖 or ✨

---

## **Option Set 2: Tier-Based**

### **📝 Standard Conversion**
- Template-based with wizard
- Free, manual configuration
- Preview included

### **⚡ Premium Conversion**
- AI-powered analysis
- Automatic pattern detection
- Multi-turn generation
- (Could be paid tier)

---

## **Option Set 3: Use-Case Focused**

### **🎨 Custom Conversion**
- Choose templates and customize
- Full control over prompts
- Preview before converting

### **🧠 Intelligent Conversion**
- AI understands your data
- Automatically generates best format
- No configuration needed

---

## **Option Set 4: Simplicity-First**

### **🔧 Manual Mode**
- You choose the template
- Configure columns
- Preview and adjust

### **🚀 Auto Mode**
- AI does the work
- Analyzes and converts
- One-click solution

---

## **Option Set 5: Professional**

### **📊 Template Studio**
- Professional templates
- Column mapping
- Real-time preview

### **🎯 AI Optimizer**
- Machine learning analysis
- Context-aware conversion
- Maximum quality

---

## **Option Set 6: Power User**

### **⚙️ Expert Mode**
- Full customization
- Template selection
- Advanced options

### **✨ Magic Mode**
- AI-powered
- Automatic optimization
- Zero configuration

---

## 🎯 **FINAL RECOMMENDATION**

Based on user psychology and clarity, I recommend:

### **Tier 1: Guided Conversion** 🎯
**Alternative names**:
- "Template Wizard"
- "Step-by-Step Conversion"
- "Guided Builder"
- "Custom Builder"

**Why "Guided Conversion"**:
✅ Clear what it does
✅ Professional but approachable
✅ Implies help without complexity
✅ Works for all skill levels

**Description for UI**:
> "Choose a template, configure your preferences, and preview before converting. Perfect for structured data and when you know your use case."

**Badge**: "Recommended" or "Most Popular"

---

### **Tier 2: Smart Conversion** 🤖
**Alternative names**:
- "AI Assistant"
- "Auto-Convert"
- "Intelligent Builder"
- "AI Optimizer"

**Why "Smart Conversion"**:
✅ Implies AI without being technical
✅ Suggests better results
✅ Appeals to users wanting automation
✅ Premium feel without saying "premium"

**Description for UI**:
> "AI analyzes your CSV structure and automatically creates optimized training examples. Best for complex data or when you want the highest quality."

**Badge**: "AI-Powered" or "Premium Quality"

---

## 🎨 UI Presentation

### In the Upload Modal:

```
┌─────────────────────────────────────────────────┐
│  Choose Conversion Method                       │
├─────────────────────────────────────────────────┤
│                                                 │
│  🎯 Guided Conversion          [Recommended]   │
│  ─────────────────────────────────────────────  │
│  Choose templates, configure options, and       │
│  preview examples before converting.            │
│                                                 │
│  ✓ Step-by-step wizard                          │
│  ✓ Multiple templates                           │
│  ✓ Real-time preview                            │
│  ✓ Full control                                 │
│                                                 │
│  [Select Guided Conversion]                     │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  🤖 Smart Conversion          [AI-Powered]      │
│  ─────────────────────────────────────────────  │
│  AI analyzes your data and automatically        │
│  generates optimal training examples.           │
│                                                 │
│  ✓ AI-powered analysis                          │
│  ✓ Automatic optimization                       │
│  ✓ Multi-turn conversations                     │
│  ✓ Best quality results                         │
│                                                 │
│  [Select Smart Conversion]                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📝 Implementation Names in Code

### Backend Service Names:

```typescript
// Service structure
export class CsvConversionService {
  
  // Guided Conversion (Template-based)
  async convertWithGuided(
    file: Express.Multer.File,
    options: GuidedConversionOptions
  ): Promise<ConversionResult> {
    // Template-based logic
  }
  
  // Smart Conversion (AI-powered)
  async convertWithSmart(
    file: Express.Multer.File,
    options: SmartConversionOptions
  ): Promise<ConversionResult> {
    // AI-powered logic
  }
}
```

### DTO Names:

```typescript
export enum ConversionMode {
  GUIDED = 'guided',
  SMART = 'smart'
}

export class ConvertCsvDto {
  @ApiProperty({ enum: ConversionMode })
  mode: ConversionMode;
  
  // Guided mode options
  @ApiPropertyOptional()
  template?: 'qa' | 'info_extraction' | 'classification' | 'custom';
  
  // Smart mode options
  @ApiPropertyOptional()
  aiProvider?: 'openai' | 'ollama';
}
```

### Frontend Component Names:

```typescript
// Components
- GuidedConversionWizard.tsx
- SmartConversionPanel.tsx
- ConversionModeSelector.tsx

// Hooks
- useGuidedConversion.ts
- useSmartConversion.ts
```

---

## 🎯 Alternative Naming Schemes (If you want different)

### Option A: Action-Oriented
- **"Build Your Own"** (Guided)
- **"Auto-Generate"** (Smart)

### Option B: Outcome-Focused
- **"Precision Convert"** (Guided)
- **"Quality Convert"** (Smart)

### Option C: Simple & Direct
- **"Template Mode"** (Guided)
- **"AI Mode"** (Smart)

### Option D: Experience-Based
- **"Assisted Conversion"** (Guided)
- **"Instant Conversion"** (Smart)

---

## 💼 Marketing Copy

### For Documentation:

**Guided Conversion**
> Take control of your CSV conversion with our step-by-step wizard. Choose from professional templates, map your columns, and preview examples before converting. Perfect for structured data and specific use cases.

**Smart Conversion**
> Let AI do the heavy lifting. Our intelligent system analyzes your CSV structure, understands your data patterns, and automatically generates high-quality training examples with multi-turn conversations. Get professional results in seconds.

---

## 🎨 Visual Branding

### Guided Conversion
- **Color**: Blue (#3B82F6) - Trust, Control
- **Icon**: 🎯 Target or 🧭 Compass
- **Style**: Structured, Professional

### Smart Conversion
- **Color**: Purple (#8B5CF6) - Premium, AI
- **Icon**: 🤖 Robot or ✨ Sparkles
- **Style**: Modern, Intelligent

---

## 📊 Comparison Table for Users

| Feature | Guided Conversion 🎯 | Smart Conversion 🤖 |
|---------|---------------------|---------------------|
| **Control** | Full control | Automatic |
| **Speed** | 2-3 minutes | 30 seconds |
| **Quality** | Good-Excellent | Excellent |
| **Customization** | High | Medium |
| **Preview** | Yes, step-by-step | Yes, final result |
| **Best For** | Structured data, specific formats | Complex data, maximum quality |
| **Cost** | Free | LLM costs (if using API) |

---

## 🎯 FINAL CHOICE

**Primary Recommendation**: 

✅ **Guided Conversion** (Template-based + Wizard)
✅ **Smart Conversion** (AI-powered)

**Why these names**:
1. ✅ Clear and descriptive
2. ✅ Professional but accessible
3. ✅ Differentiates without confusing
4. ✅ Scales well (can add more modes later)
5. ✅ Works in marketing and code
6. ✅ Non-technical users understand immediately

---

**Do you like "Guided" and "Smart"? Or would you prefer a different naming scheme from the alternatives above?**
