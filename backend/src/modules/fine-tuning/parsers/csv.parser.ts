import { Injectable, Logger } from '@nestjs/common';
import { IDataParser, ParsedDataRow, ParsedDataResult } from './data-parser.interface';

@Injectable()
export class CsvParser implements IDataParser {
  private readonly logger = new Logger(CsvParser.name);

  canParse(input: string | Buffer): boolean {
    try {
      const content = input.toString().trim();
      if (!content) return false;

      // Get first line
      const firstLine = content.split('\n')[0];
      
      // Should have commas and not start with JSON markers
      return (
        firstLine.includes(',') &&
        !firstLine.startsWith('{') &&
        !firstLine.startsWith('[')
      );
    } catch {
      return false;
    }
  }

  async parse(input: string | Buffer): Promise<ParsedDataResult> {
    this.logger.log('Parsing CSV data');
    
    const content = input.toString();
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row');
    }

    // Parse header
    const headers = this.parseCSVLine(lines[0]);
    
    // Parse data rows
    const rows: ParsedDataRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: ParsedDataRow = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim() || '';
        row[header] = this.inferType(value);
      });
      
      rows.push(row);
    }

    return {
      rows,
      columns: headers,
      format: 'flat',
      originalFormat: 'csv',
    };
  }

  getFormatName(): string {
    return 'CSV';
  }

  getPriority(): number {
    return 1; // Lower priority than JSONL/JSON
  }

  /**
   * Parse a CSV line handling quoted values
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last value
    result.push(current.trim());

    return result;
  }

  /**
   * Infer type from string value
   */
  private inferType(value: string): string | number | boolean {
    if (value === '') return '';
    
    // Boolean
    if (['true', 'false'].includes(value.toLowerCase())) {
      return value.toLowerCase() === 'true';
    }
    
    // Number
    if (!isNaN(Number(value)) && value !== '') {
      return Number(value);
    }
    
    // String
    return value;
  }
}
