-- Add source_path column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS source_path TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_source_path ON documents(source_path);

-- Migrate existing data: extract path from metadata if available
UPDATE documents
SET source_path = metadata->>'path'
WHERE source_path IS NULL 
  AND metadata ? 'path';

-- Add comment
COMMENT ON COLUMN documents.source_path IS 'Full path from source system (e.g., docs/api/README.md)';
