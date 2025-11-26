import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { IDataParser, ParsedDataRow, ParsedDataResult } from './data-parser.interface';

@Injectable()
export class JsonlParser implements IDataParser {
  private readonly logger = new Logger(JsonlParser.name);

  canParse(input: string | Buffer): boolean {
    try {
      const content = input.toString().trim();
      if (!content) return false;

      const lines = content.split('\n').filter(line => line.trim());
      
      // Need at least one line
      if (lines.length === 0) return false;

      // Each non-empty line must be valid JSON
      // Check first 5 lines for performance
      const samplesToCheck = Math.min(5, lines.length);
      for (let i = 0; i < samplesToCheck; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Must be JSON object (not array)
        if (!line.startsWith('{')) return false;
        
        try {
          JSON.parse(line);
        } catch {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  async parse(input: string | Buffer): Promise<ParsedDataResult> {
    this.logger.log('Parsing JSONL data');
    
    const content = input.toString();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      throw new BadRequestException('JSONL file is empty');
    }

    const rows: ParsedDataRow[] = [];
    let wasNested = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const obj = JSON.parse(line);
        
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
          throw new Error('Each JSONL line must be a JSON object');
        }

        const flattened = this.flattenObject(obj);
        rows.push(flattened);
        
        if (this.hasNestedStructure(obj)) {
          wasNested = true;
        }
      } catch (error) {
        throw new BadRequestException(`Invalid JSON on line ${i + 1}: ${error.message}`);
      }
    }

    if (rows.length === 0) {
      throw new BadRequestException('No valid data rows found in JSONL');
    }

    // Extract all unique columns
    const columns = this.extractColumns(rows);

    return {
      rows,
      columns,
      format: wasNested ? 'nested' : 'flat',
      originalFormat: 'jsonl',
    };
  }

  getFormatName(): string {
    return 'JSONL';
  }

  getPriority(): number {
    return 3; // Highest priority (most specific format)
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
   * Flatten nested object structure
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
