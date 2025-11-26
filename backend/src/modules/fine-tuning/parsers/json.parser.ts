import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IDataParser, ParsedDataRow, ParsedDataResult } from './data-parser.interface';

@Injectable()
export class JsonParser implements IDataParser {
  private readonly logger = new Logger(JsonParser.name);

  canParse(input: string | Buffer): boolean {
    try {
      const content = input.toString().trim();
      if (!content) return false;

      // Must start with [ or {
      if (!content.startsWith('[') && !content.startsWith('{')) {
        return false;
      }

      // Try to parse as JSON
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  async parse(input: string | Buffer): Promise<ParsedDataResult> {
    this.logger.log('Parsing JSON data');
    
    const content = input.toString();
    const data = JSON.parse(content);

    let rows: ParsedDataRow[];
    let wasNested = false;

    if (Array.isArray(data)) {
      // Format 1: Array of objects
      rows = data.map(item => this.flattenObject(item));
      wasNested = data.some(item => this.hasNestedStructure(item));
    } else if (typeof data === 'object' && data !== null) {
      // Format 2: Object (check for array properties)
      const arrayKey = this.findArrayProperty(data);
      
      if (arrayKey) {
        // Has array property - extract it
        this.logger.log(`Found array property: ${arrayKey}`);
        rows = data[arrayKey].map((item: any) => this.flattenObject(item));
        wasNested = true;
      } else {
        // Single object - treat as one row
        rows = [this.flattenObject(data)];
        wasNested = this.hasNestedStructure(data);
      }
    } else {
      throw new BadRequestException('JSON must be an array or object');
    }

    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in JSON');
    }

    // Extract all unique columns
    const columns = this.extractColumns(rows);

    return {
      rows,
      columns,
      format: wasNested ? 'nested' : 'flat',
      originalFormat: 'json',
    };
  }

  getFormatName(): string {
    return 'JSON';
  }

  getPriority(): number {
    return 2; // Lower priority than JSONL (to avoid false positives)
  }

  /**
   * Check if object has nested structure
   */
  private hasNestedStructure(obj: any): boolean {
    if (typeof obj !== 'object' || obj === null) return false;
    
    return Object.values(obj).some(value => 
      typeof value === 'object' && 
      value !== null && 
      !Array.isArray(value)
    );
  }

  /**
   * Find first array property in object
   */
  private findArrayProperty(obj: object): string | null {
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        return key;
      }
    }
    return null;
  }

  /**
   * Flatten nested object structure
   * Example: { user: { name: "John" } } → { "user.name": "John" }
   */
  private flattenObject(obj: any, prefix = ''): ParsedDataRow {
    const flattened: ParsedDataRow = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        flattened[newKey] = '';
      } else if (Array.isArray(value)) {
        // Array → convert to comma-separated string
        flattened[newKey] = value.map(v => 
          typeof v === 'object' ? JSON.stringify(v) : String(v)
        ).join(', ');
      } else if (typeof value === 'object') {
        // Nested object → flatten recursively
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        // Primitive value
        flattened[newKey] = value as string | number | boolean;
      }
    }

    return flattened;
  }

  /**
   * Extract all unique columns from rows
   */
  private extractColumns(rows: ParsedDataRow[]): string[] {
    const columnSet = new Set<string>();
    
    rows.forEach(row => {
      Object.keys(row).forEach(key => columnSet.add(key));
    });
    
    return Array.from(columnSet).sort();
  }
}
