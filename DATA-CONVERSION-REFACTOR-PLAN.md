# 🔄 Data Conversion Refactor - CSV + JSON Support

## 🎯 Goal

Make the conversion system work with **both CSV and JSON** by mutualizing the core logic.

---

## 💡 Key Insight

**Current Problem:**
- CSV conversion logic is separate
- JSON data would need duplicate code
- No unified interface

**Solution:**
- Parse CSV/JSON → **Normalized Data Structure**
- Apply conversion templates on normalized data
- Output JSONL for fine-tuning

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│              Input Formats                          │
├─────────────────────────────────────────────────────┤
│  CSV File        JSON File        JSON Array        │
└──────┬───────────────┬──────────────┬───────────────┘
       │               │              │
       ▼               ▼              ▼
┌─────────────────────────────────────────────────────┐
│           Format Parsers (New Layer)                │
├─────────────────────────────────────────────────────┤
│  CsvParser  →  Normalized Row Structure             │
│  JsonParser →  Normalized Row Structure             │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│        Normalized Data Structure                    │
├─────────────────────────────────────────────────────┤
│  [                                                  │
│    { column1: value1, column2: value2, ... },      │
│    { column1: value3, column2: value4, ... }       │
│  ]                                                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│      Unified Conversion Engine (Existing)           │
├─────────────────────────────────────────────────────┤
│  • Column Analysis                                  │
│  • Template Application                             │
│  • Multi-turn Generation                            │
│  • Guided/Smart Conversion                          │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              JSONL Output                           │
│  (Fine-tuning format)                               │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Supported JSON Formats

### Format 1: Array of Objects (Most Common)
```json
[
  {
    "name": "iPhone 15",
    "category": "Electronics",
    "price": 999,
    "description": "Latest smartphone"
  },
  {
    "name": "MacBook Pro",
    "category": "Electronics", 
    "price": 2499,
    "description": "Professional laptop"
  }
]
```

### Format 2: Object with Array Property
```json
{
  "products": [
    { "name": "iPhone", "price": 999 },
    { "name": "MacBook", "price": 2499 }
  ]
}
```

### Format 3: Nested Objects (Flatten)
```json
[
  {
    "user": {
      "name": "John",
      "age": 30
    },
    "occupation": "Engineer",
    "location": {
      "city": "NYC",
      "country": "USA"
    }
  }
]
```
→ Flattens to: `{ "user.name": "John", "user.age": 30, "occupation": "Engineer", "location.city": "NYC", ... }`

### Format 4: JSONL (Already Supported)
```jsonl
{"name": "iPhone", "price": 999}
{"name": "MacBook", "price": 2499}
```

---

## 🔧 Implementation Plan

### Step 1: Create Format Parser Interface

```typescript
// backend/src/modules/fine-tuning/parsers/data-parser.interface.ts

export interface ParsedDataRow {
  [key: string]: string | number | boolean;
}

export interface ParsedDataResult {
  rows: ParsedDataRow[];
  columns: string[];
  format: 'flat' | 'nested';
}

export interface IDataParser {
  /**
   * Parse input data into normalized structure
   */
  parse(input: string | Buffer): Promise<ParsedDataResult>;
  
  /**
   * Detect if this parser can handle the input
   */
  canParse(input: string | Buffer): boolean;
  
  /**
   * Get format name
   */
  getFormatName(): string;
}
```

### Step 2: Implement Parsers

```typescript
// backend/src/modules/fine-tuning/parsers/csv.parser.ts
export class CsvParser implements IDataParser {
  canParse(input: string | Buffer): boolean {
    // Check if starts with CSV-like structure
    const content = input.toString();
    const firstLine = content.split('\n')[0];
    return firstLine.includes(',') && !firstLine.startsWith('{');
  }
  
  async parse(input: string | Buffer): Promise<ParsedDataResult> {
    // Existing CSV parsing logic
  }
  
  getFormatName(): string {
    return 'CSV';
  }
}

// backend/src/modules/fine-tuning/parsers/json.parser.ts
export class JsonParser implements IDataParser {
  canParse(input: string | Buffer): boolean {
    try {
      const content = input.toString().trim();
      return content.startsWith('[') || content.startsWith('{');
    } catch {
      return false;
    }
  }
  
  async parse(input: string | Buffer): Promise<ParsedDataResult> {
    const content = input.toString();
    const data = JSON.parse(content);
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return this.parseArray(data);
    } else if (typeof data === 'object') {
      return this.parseObject(data);
    }
    
    throw new Error('Unsupported JSON structure');
  }
  
  private parseArray(data: any[]): ParsedDataResult {
    const rows = data.map(item => this.flattenObject(item));
    const columns = this.extractColumns(rows);
    
    return {
      rows,
      columns,
      format: 'flat',
    };
  }
  
  private parseObject(data: object): ParsedDataResult {
    // Find array property
    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
    
    if (arrayKey) {
      return this.parseArray(data[arrayKey]);
    }
    
    // Single object → treat as single row
    return {
      rows: [this.flattenObject(data)],
      columns: Object.keys(data),
      format: 'flat',
    };
  }
  
  private flattenObject(obj: any, prefix = ''): ParsedDataRow {
    const flattened: ParsedDataRow = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Nested object → flatten recursively
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        // Array → convert to comma-separated string
        flattened[newKey] = value.join(', ');
      } else {
        // Primitive value
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }
  
  private extractColumns(rows: ParsedDataRow[]): string[] {
    const columnSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key));
    });
    return Array.from(columnSet);
  }
  
  getFormatName(): string {
    return 'JSON';
  }
}

// backend/src/modules/fine-tuning/parsers/jsonl.parser.ts
export class JsonlParser implements IDataParser {
  canParse(input: string | Buffer): boolean {
    const content = input.toString().trim();
    const lines = content.split('\n');
    
    // Check if each line is valid JSON
    return lines.every(line => {
      if (!line.trim()) return true;
      try {
        JSON.parse(line);
        return true;
      } catch {
        return false;
      }
    });
  }
  
  async parse(input: string | Buffer): Promise<ParsedDataResult> {
    const content = input.toString();
    const lines = content.split('\n').filter(line => line.trim());
    
    const rows = lines.map(line => {
      const obj = JSON.parse(line);
      return this.flattenObject(obj);
    });
    
    const columns = this.extractColumns(rows);
    
    return {
      rows,
      columns,
      format: 'flat',
    };
  }
  
  // Same flatten logic as JsonParser
  
  getFormatName(): string {
    return 'JSONL';
  }
}
```

### Step 3: Update DataConversionService

```typescript
// Rename: csv-conversion.service.ts → data-conversion.service.ts

export class DataConversionService {
  private readonly parsers: IDataParser[];
  
  constructor(private readonly llmService: LLMService) {
    this.initializeTemplates();
    
    // Register parsers in order of priority
    this.parsers = [
      new JsonlParser(),
      new JsonParser(),
      new CsvParser(),
    ];
  }
  
  /**
   * Auto-detect format and parse
   */
  private async parseData(filePath: string): Promise<ParsedDataResult> {
    const content = fs.readFileSync(filePath);
    
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        this.logger.log(`Detected format: ${parser.getFormatName()}`);
        return await parser.parse(content);
      }
    }
    
    throw new BadRequestException('Unsupported data format');
  }
  
  /**
   * Analyze data structure (works for CSV and JSON now!)
   */
  async analyzeData(filePath: string): Promise<DataAnalysis> {
    const parsed = await this.parseData(filePath);
    
    // Rest of analysis logic stays the same
    const columns = parsed.columns.map(colName => {
      const values = parsed.rows.map(row => String(row[colName] || ''));
      return this.analyzeColumn(colName, values);
    });
    
    return {
      totalRows: parsed.rows.length,
      totalColumns: parsed.columns.length,
      columns,
      suggestedKeyColumn: this.suggestKeyColumn(columns),
      suggestedTargetColumn: this.suggestTargetColumn(columns),
      suggestedTemplate: this.suggestTemplate(columns),
      dataPreview: parsed.rows.slice(0, 5),
      detectedFormat: parsed.format,
    };
  }
  
  /**
   * Guided conversion (now works with CSV and JSON!)
   */
  async convertWithGuided(
    filePath: string,
    options: GuidedConversionOptions,
  ): Promise<ConversionResult> {
    // Parse data (auto-detects format)
    const parsed = await this.parseData(filePath);
    
    // Rest stays the same - works on normalized rows!
    const examples: any[] = [];
    
    for (const row of parsed.rows) {
      if (options.multiTurn) {
        examples.push(...this.generateMultiTurnExamples(row, options, template));
      } else {
        examples.push(this.generateSingleExample(row, options, template));
      }
    }
    
    // Write JSONL output
    const outputPath = filePath.replace(/\.(csv|json|jsonl)$/i, '_converted.jsonl');
    const jsonlContent = examples.map(ex => JSON.stringify(ex)).join('\n');
    fs.writeFileSync(outputPath, jsonlContent);
    
    return {
      outputPath,
      totalExamples: examples.length,
      format: 'jsonl',
      preview: examples.slice(0, 5),
    };
  }
  
  // convertWithSmart() - same changes, works on normalized data
  // All other methods stay the same!
}
```

### Step 4: Update DTOs

```typescript
// backend/src/modules/fine-tuning/dto/conversion.dto.ts

export enum DataFormat {
  CSV = 'csv',
  JSON = 'json',
  JSONL = 'jsonl',
  AUTO = 'auto', // Auto-detect
}

export class AnalyzeDataDto {
  @ApiProperty({ description: 'File to analyze' })
  file: Express.Multer.File;
  
  @ApiPropertyOptional({ 
    enum: DataFormat,
    description: 'Data format (auto-detected if not specified)',
    default: DataFormat.AUTO
  })
  format?: DataFormat;
}

export class DataAnalysisResponseDto {
  @ApiProperty({ description: 'Total number of rows' })
  totalRows: number;

  @ApiProperty({ description: 'Total number of columns' })
  totalColumns: number;

  @ApiProperty({ description: 'Detected format' })
  detectedFormat: string;
  
  // ... rest stays the same
}
```

---

## 📊 Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| **Formats Supported** | CSV only | CSV, JSON, JSONL |
| **Auto-detection** | ❌ | ✅ |
| **Nested JSON** | ❌ | ✅ Flattens automatically |
| **Code Reuse** | Low | High (90% shared) |
| **Parser Interface** | ❌ | ✅ Extensible |
| **Future Formats** | Hard to add | Easy (add parser) |

---

## 🎯 Benefits

### 1. **Unified API**
Users don't need to know the format:
```typescript
// Same method works for CSV, JSON, JSONL!
await dataConversionService.analyzeData('mydata.json');
await dataConversionService.analyzeData('mydata.csv');
await dataConversionService.analyzeData('mydata.jsonl');
```

### 2. **Code Reuse**
- 90% of conversion logic is shared
- Only parsing differs
- Easy to add new formats

### 3. **Better UX**
- Users can upload CSV or JSON
- Automatic format detection
- Consistent experience

### 4. **Extensibility**
Adding XML support? Just create `XmlParser` implementing `IDataParser`!

---

## 📝 Migration Plan

### Phase 1: Add Parsers (1 day)
1. Create parser interface
2. Implement CsvParser (extract from existing)
3. Implement JsonParser (new)
4. Implement JsonlParser (new)

### Phase 2: Refactor Service (0.5 day)
1. Rename to DataConversionService
2. Add parseData() method
3. Update analyzeData() to use parsers
4. Update conversion methods to use parsers

### Phase 3: Update API (0.5 day)
1. Update DTOs
2. Update controller endpoints
3. Update documentation

### Phase 4: Testing (0.5 day)
1. Test CSV (ensure backward compatibility)
2. Test JSON (array format)
3. Test JSON (object format)
4. Test JSONL
5. Test nested JSON

**Total Time: 2-3 days**

---

## 🧪 Test Cases

### Test 1: CSV (Existing)
```csv
name,price,category
iPhone,999,Electronics
```
✅ Should work as before

### Test 2: JSON Array
```json
[
  {"name": "iPhone", "price": 999, "category": "Electronics"}
]
```
✅ Should convert to same JSONL as CSV

### Test 3: JSON Object with Array
```json
{
  "products": [
    {"name": "iPhone", "price": 999}
  ]
}
```
✅ Should extract array and convert

### Test 4: Nested JSON
```json
[
  {
    "product": {
      "name": "iPhone",
      "specs": {"ram": "8GB", "storage": "256GB"}
    },
    "price": 999
  }
]
```
✅ Should flatten to:
```json
{
  "product.name": "iPhone",
  "product.specs.ram": "8GB",
  "product.specs.storage": "256GB",
  "price": 999
}
```

### Test 5: JSONL
```jsonl
{"name": "iPhone", "price": 999}
{"name": "MacBook", "price": 2499}
```
✅ Should parse line by line

---

## 🚀 Implementation Priority

**Option A: Full Refactor (Recommended)**
- Cleaner architecture
- Better long-term maintainability
- Takes 2-3 days

**Option B: Quick Add-on**
- Keep CSV service as-is
- Add separate JSON support
- Faster (1 day) but duplicates code

**I recommend Option A** - do it right once, benefit forever!

---

## 💡 Naming

**Service Name Options:**
1. ✅ `DataConversionService` (Recommended)
2. `UniversalConversionService`
3. `FormatConversionService`
4. `TrainingDataConverter`

**File Names:**
- `data-conversion.service.ts`
- `parsers/data-parser.interface.ts`
- `parsers/csv.parser.ts`
- `parsers/json.parser.ts`
- `parsers/jsonl.parser.ts`

---

## 🎯 Summary

**Current State:**
- CSV conversion works
- JSON not supported

**After Refactor:**
- ✅ CSV, JSON, JSONL all supported
- ✅ Auto-format detection
- ✅ Nested JSON flattening
- ✅ 90% code reuse
- ✅ Easy to extend
- ✅ Same Guided/Smart modes for all formats

**Impact:**
Users can now upload **any tabular data format** and convert it to fine-tuning data!

---

**Ready to implement? Shall I proceed with the full refactor (Option A)?**
