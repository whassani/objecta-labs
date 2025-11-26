# CSV to Supervised Fine-Tuning Format - Refactor Proposal

## 🎯 Current State Analysis

### What Works Now
✅ Basic CSV parsing with quoted values
✅ Two format detection:
  1. **Training format**: Columns named `system`, `user`, `assistant`
  2. **Data format**: Any columns → generates basic Q&A

### Current Limitations
❌ Only generates one Q&A pattern per row
❌ Limited context understanding
❌ No column type detection (categorical, numerical, text)
❌ No smart prompt generation based on data
❌ No multi-turn conversation generation
❌ No template customization
❌ No preview before conversion

---

## 🚀 Proposed Approaches

### **Approach 1: Template-Based Conversion (Recommended) ⭐**

**Concept**: Provide multiple conversion templates that users can choose or customize.

#### Templates:

##### 1. **Q&A Template** (Default)
```
User: What is [column1]?
Assistant: [column1] is [value]. It has [column2]: [value], [column3]: [value]
```

##### 2. **Information Extraction Template**
```
User: Extract information about [first_column_value]
Assistant: Here's what I found:
- [column1]: [value]
- [column2]: [value]
...
```

##### 3. **Comparison Template**
```
User: Compare [column1] and [column2]
Assistant: [column1] has a value of [value1], while [column2] has [value2]
```

##### 4. **Classification Template**
```
User: Classify this: [data_summary]
Assistant: Based on the data, this is classified as [category_column_value]
```

##### 5. **Custom Template** (User-defined)
```
User: {{user_prompt}}
Assistant: {{assistant_response}}
```

#### Implementation:
```typescript
interface ConversionTemplate {
  name: string;
  description: string;
  userPromptPattern: string;  // Can use {{column_name}} placeholders
  assistantPattern: string;
  systemMessage?: string;
  multiTurn?: boolean;  // Generate multiple Q&As per row
}
```

---

### **Approach 2: AI-Powered Smart Conversion** 🤖

**Concept**: Use LLM to analyze CSV structure and generate appropriate training data.

#### Process:
1. **Analyze CSV**: Send first 5-10 rows to LLM
2. **Understand Schema**: LLM identifies:
   - Column types (text, number, category, date)
   - Relationships between columns
   - Potential use cases
3. **Generate Patterns**: LLM suggests conversion strategies
4. **Create Training Data**: Apply patterns to all rows

#### Example:
```
CSV: name, age, occupation, salary, city
↓
LLM Analysis: "This appears to be personnel data"
↓
Generated Patterns:
- "Tell me about [name]" → Full profile
- "What does [name] do?" → occupation details
- "Where does [name] live?" → city + context
- "Compare [name1] and [name2]" → comparative analysis
```

#### Implementation:
```typescript
async analyzeAndConvert(csvPath: string, llmService: LLMService) {
  const sampleRows = await this.getSampleRows(csvPath, 5);
  const analysis = await llmService.analyze({
    prompt: `Analyze this CSV data and suggest training patterns: ${sampleRows}`
  });
  return this.applyPatterns(csvPath, analysis.patterns);
}
```

---

### **Approach 3: Column Type Detection + Rule-Based Generation** 🎯

**Concept**: Detect column types and apply smart rules for each type.

#### Column Types:
- **ID/Key**: Skip or use as reference
- **Categorical**: Use for classification tasks
- **Numerical**: Use for comparison, calculation
- **Text**: Use for summarization, Q&A
- **Date/Time**: Use for temporal queries
- **Boolean**: Use for yes/no questions

#### Rules:
```typescript
const conversionRules = {
  categorical: [
    "What category is [key]?" → "[key] belongs to category [value]",
    "List all items in [category]" → "Items: [list]"
  ],
  numerical: [
    "What is the [column] of [key]?" → "The [column] is [value]",
    "Compare [key1] and [key2] by [column]" → "[key1]: [val1], [key2]: [val2]"
  ],
  text: [
    "Summarize [key]" → "[text_content]",
    "What is [key] about?" → "[text_summary]"
  ]
};
```

---

### **Approach 4: Multi-Turn Conversation Generation** 💬

**Concept**: Generate multiple related Q&As from a single row to create richer training data.

#### Example Row:
```csv
name,age,occupation,skills,experience
John Doe,30,Software Engineer,"Python,React,AWS",5 years
```

#### Generated Conversations:
```json
[
  {
    "messages": [
      {"role": "user", "content": "Who is John Doe?"},
      {"role": "assistant", "content": "John Doe is a 30-year-old Software Engineer."}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "What skills does John Doe have?"},
      {"role": "assistant", "content": "John Doe is skilled in Python, React, and AWS."}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "How much experience does John Doe have?"},
      {"role": "assistant", "content": "John Doe has 5 years of experience."}
    ]
  },
  {
    "messages": [
      {"role": "user", "content": "Tell me everything about John Doe"},
      {"role": "assistant", "content": "John Doe is a 30-year-old Software Engineer with 5 years of experience. He is skilled in Python, React, and AWS."}
    ]
  }
]
```

---

### **Approach 5: Interactive Conversion Wizard** 🧙

**Concept**: Step-by-step UI wizard for converting CSV with preview.

#### Steps:
1. **Upload CSV** → Preview first 10 rows
2. **Detect Format** → Show detected columns and types
3. **Choose Strategy**:
   - Template-based
   - AI-powered
   - Rule-based
   - Custom
4. **Configure**:
   - Select key columns
   - Set system message
   - Choose prompt patterns
5. **Preview** → Show 5 example conversions
6. **Adjust** → Fine-tune if needed
7. **Convert** → Generate full JSONL file

---

## 📊 Comparison Matrix

| Approach | Complexity | Quality | Speed | Customization | Cost |
|----------|-----------|---------|-------|---------------|------|
| **Template-Based** ⭐ | Low | Good | Fast | High | Free |
| **AI-Powered** | Medium | Excellent | Medium | Medium | LLM calls |
| **Rule-Based** | Medium | Good | Fast | Medium | Free |
| **Multi-Turn** | Low | Very Good | Fast | Medium | Free |
| **Interactive Wizard** | High | Excellent | Slow | Highest | Free |

---

## 🎯 Recommended Implementation Plan

### **Phase 1: Enhanced Template System** (Quick Win)

#### 1.1 Create Template Service
```typescript
// backend/src/modules/fine-tuning/csv-converter.service.ts

export class CsvConverterService {
  private templates: Map<string, ConversionTemplate>;

  constructor() {
    this.registerDefaultTemplates();
  }

  private registerDefaultTemplates() {
    this.templates.set('qa', {
      name: 'Q&A Format',
      description: 'Simple question-answer pairs',
      userPromptPattern: 'What is {{key_column}}?',
      assistantPattern: '{{key_column}} has the following properties: {{all_columns}}',
      systemMessage: 'You are a helpful assistant that provides information.'
    });

    this.templates.set('info_extraction', {
      name: 'Information Extraction',
      description: 'Extract structured information',
      userPromptPattern: 'Extract information about {{key_column}}',
      assistantPattern: 'Here is the information:\\n{{formatted_data}}',
      systemMessage: 'You extract and present information clearly.'
    });

    this.templates.set('classification', {
      name: 'Classification',
      description: 'Classification tasks',
      userPromptPattern: 'Classify this: {{data_summary}}',
      assistantPattern: 'Classification: {{target_column}}',
      systemMessage: 'You are a classification assistant.'
    });
  }

  async convertWithTemplate(
    csvPath: string,
    templateName: string,
    options: ConversionOptions
  ): Promise<string> {
    const template = this.templates.get(templateName);
    // Implementation...
  }
}
```

#### 1.2 Add Column Analysis
```typescript
interface ColumnAnalysis {
  name: string;
  type: 'categorical' | 'numerical' | 'text' | 'date' | 'boolean';
  uniqueValues: number;
  samples: string[];
  isKey: boolean;  // Likely primary identifier
}

private analyzeColumns(rows: string[][]): ColumnAnalysis[] {
  // Analyze each column to determine type
  // Detect potential key columns (low cardinality, unique values)
  // Sample values for preview
}
```

#### 1.3 Update DTO
```typescript
// backend/src/modules/fine-tuning/dto/dataset.dto.ts

export class CreateDatasetDto {
  // Existing fields...

  @ApiPropertyOptional({ description: 'Conversion template for CSV', enum: ['qa', 'info_extraction', 'classification', 'custom'] })
  @IsOptional()
  conversionTemplate?: string;

  @ApiPropertyOptional({ description: 'Key column name for CSV conversion' })
  @IsOptional()
  keyColumn?: string;

  @ApiPropertyOptional({ description: 'Target column for classification' })
  @IsOptional()
  targetColumn?: string;

  @ApiPropertyOptional({ description: 'Generate multi-turn conversations' })
  @IsOptional()
  @IsBoolean()
  multiTurn?: boolean;

  @ApiPropertyOptional({ description: 'Custom user prompt pattern' })
  @IsOptional()
  customUserPrompt?: string;

  @ApiPropertyOptional({ description: 'Custom assistant response pattern' })
  @IsOptional()
  customAssistantResponse?: string;
}
```

### **Phase 2: Add Preview Endpoint**

```typescript
// backend/src/modules/fine-tuning/fine-tuning.controller.ts

@Post('datasets/preview-conversion')
async previewConversion(
  @Body() previewDto: PreviewConversionDto,
  @UploadedFile() file: Express.Multer.File,
) {
  // Analyze CSV
  const analysis = await this.csvConverter.analyzeFile(file);
  
  // Generate preview (first 5 examples)
  const preview = await this.csvConverter.generatePreview(
    file,
    previewDto.template,
    previewDto.options
  );
  
  return {
    analysis,
    preview,
    estimatedExamples: analysis.totalRows,
  };
}
```

### **Phase 3: UI Integration**

#### 3.1 CSV Upload Flow
```typescript
// frontend/src/components/fine-tuning/CsvConversionWizard.tsx

export function CsvConversionWizard() {
  const [step, setStep] = useState<'upload' | 'analyze' | 'configure' | 'preview'>('upload');
  const [csvData, setCsvData] = useState(null);
  const [template, setTemplate] = useState('qa');
  const [preview, setPreview] = useState([]);

  // Step 1: Upload
  const handleUpload = async (file) => {
    const analysis = await api.previewConversion(file, { template: 'qa' });
    setCsvData(analysis);
    setStep('analyze');
  };

  // Step 2: Analyze & Configure
  const renderConfiguration = () => (
    <div>
      <Select label="Conversion Template" value={template} onChange={setTemplate}>
        <option value="qa">Q&A Format</option>
        <option value="info_extraction">Information Extraction</option>
        <option value="classification">Classification</option>
        <option value="custom">Custom</option>
      </Select>
      
      <Select label="Key Column" options={csvData.columns} />
      
      <Checkbox label="Generate multi-turn conversations" />
      
      <Button onClick={generatePreview}>Preview Conversion</Button>
    </div>
  );

  // Step 3: Preview
  const renderPreview = () => (
    <div>
      <h3>Preview (5 examples)</h3>
      {preview.map((example, i) => (
        <ConversationPreview key={i} example={example} />
      ))}
      <Button onClick={confirmConversion}>Convert All Rows</Button>
    </div>
  );
}
```

---

## 🔧 Implementation Priorities

### **Priority 1: Template System** (1-2 days)
- ✅ Create `CsvConverterService`
- ✅ Implement 3-4 default templates
- ✅ Add column type detection
- ✅ Refactor existing `convertCsvToJsonl` to use templates

### **Priority 2: Preview Functionality** (1 day)
- ✅ Add preview endpoint
- ✅ Generate sample conversions
- ✅ Return analysis data

### **Priority 3: UI Wizard** (2-3 days)
- ✅ Create conversion wizard component
- ✅ Step-by-step flow
- ✅ Real-time preview
- ✅ Configuration options

### **Priority 4: Advanced Features** (Optional)
- ⏳ Multi-turn generation
- ⏳ AI-powered analysis
- ⏳ Custom template builder
- ⏳ Batch processing with progress

---

## 📝 Example Use Cases

### Use Case 1: Product Catalog
**CSV**: `product_id, name, category, price, description`

**Template**: Information Extraction
```json
{
  "messages": [
    {"role": "user", "content": "Tell me about product XYZ-123"},
    {"role": "assistant", "content": "XYZ-123 is a Widget in the Electronics category, priced at $49.99. Description: High-quality widget with..."}
  ]
}
```

### Use Case 2: Customer Support
**CSV**: `ticket_id, issue, category, resolution, satisfaction`

**Template**: Classification
```json
{
  "messages": [
    {"role": "user", "content": "Classify this issue: Cannot login to account"},
    {"role": "assistant", "content": "This is an Authentication issue. Typical resolution: Reset password."}
  ]
}
```

### Use Case 3: Knowledge Base
**CSV**: `topic, question, answer, category`

**Template**: Direct Mapping (Already supervised!)
```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful knowledge base assistant."},
    {"role": "user", "content": "{{question}}"},
    {"role": "assistant", "content": "{{answer}}"}
  ]
}
```

---

## 🎯 Decision Recommendation

**Go with Approach 1 (Template-Based) + Approach 5 (Wizard) hybrid:**

### Why?
1. ✅ **Fast to implement** (1-2 weeks)
2. ✅ **High user control** and customization
3. ✅ **No external costs** (no LLM calls needed)
4. ✅ **Flexible** - covers 80% of use cases
5. ✅ **Extensible** - can add AI later if needed
6. ✅ **Preview before commit** - avoid mistakes

### Quick Wins:
- Start with 3 templates (Q&A, Info Extraction, Classification)
- Add column detection
- Create preview endpoint
- Simple UI with template selector

### Future Enhancements:
- Add more templates based on user feedback
- AI-powered template suggestion
- Custom template builder
- Multi-turn generation

---

## 📚 Files to Create/Modify

### New Files:
1. `backend/src/modules/fine-tuning/csv-converter.service.ts` - Template engine
2. `backend/src/modules/fine-tuning/dto/conversion.dto.ts` - DTOs
3. `frontend/src/components/fine-tuning/CsvConversionWizard.tsx` - UI wizard
4. `CSV-CONVERSION-IMPLEMENTATION-GUIDE.md` - Implementation guide

### Modified Files:
1. `backend/src/modules/fine-tuning/fine-tuning-datasets.service.ts` - Use new converter
2. `backend/src/modules/fine-tuning/fine-tuning.controller.ts` - Add preview endpoint
3. `backend/src/modules/fine-tuning/dto/dataset.dto.ts` - Add conversion options
4. `frontend/src/app/(dashboard)/dashboard/fine-tuning/datasets/new/page.tsx` - Integrate wizard

---

**Ready to implement? I can start with Priority 1 (Template System) right away!**
