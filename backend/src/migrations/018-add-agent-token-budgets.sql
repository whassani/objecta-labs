-- Add token budget fields to agents table

-- Add context token limits
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_context_tokens INTEGER DEFAULT 6000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_history_tokens INTEGER DEFAULT 3000;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS max_rag_tokens INTEGER DEFAULT 1500;

-- Add conversation summarization settings
ALTER TABLE agents ADD COLUMN IF NOT EXISTS enable_summarization BOOLEAN DEFAULT false;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS summarize_threshold INTEGER DEFAULT 10;

-- Comments
COMMENT ON COLUMN agents.max_context_tokens IS 'Maximum total tokens for context (system + history + RAG + user message)';
COMMENT ON COLUMN agents.max_history_tokens IS 'Maximum tokens allocated for conversation history';
COMMENT ON COLUMN agents.max_rag_tokens IS 'Maximum tokens allocated for RAG document context';
COMMENT ON COLUMN agents.enable_summarization IS 'Enable automatic conversation summarization when history gets long';
COMMENT ON COLUMN agents.summarize_threshold IS 'Number of messages before triggering summarization';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 018 completed: Added token budget fields to agents';
END $$;
