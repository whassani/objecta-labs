/**
 * Interface for data parsers
 * Allows pluggable parsers for different formats (CSV, JSON, JSONL, XML, etc.)
 */

export interface ParsedDataRow {
  [key: string]: string | number | boolean;
}

export interface ParsedDataResult {
  rows: ParsedDataRow[];
  columns: string[];
  format: 'flat' | 'nested';
  originalFormat: string;
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
   * Get format name for logging
   */
  getFormatName(): string;
  
  /**
   * Get priority (higher = checked first)
   * Use this to resolve ambiguity (e.g., JSONL vs JSON)
   */
  getPriority(): number;
}
