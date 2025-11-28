-- Create conversation metrics table for token tracking

CREATE TABLE IF NOT EXISTS conversation_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    message_id UUID NOT NULL,
    
    -- Token counts
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    
    -- Context breakdown
    system_tokens INTEGER DEFAULT 0,
    history_tokens INTEGER DEFAULT 0,
    rag_tokens INTEGER DEFAULT 0,
    user_message_tokens INTEGER DEFAULT 0,
    
    -- Metadata
    model VARCHAR(100) NOT NULL,
    cost DECIMAL(10, 6) DEFAULT 0,
    history_messages_count INTEGER DEFAULT 0,
    rag_documents_used INTEGER DEFAULT 0,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_conversation_metrics_conversation ON conversation_metrics(conversation_id);
CREATE INDEX idx_conversation_metrics_message ON conversation_metrics(message_id);
CREATE INDEX idx_conversation_metrics_created_at ON conversation_metrics(created_at);

-- Comments
COMMENT ON TABLE conversation_metrics IS 'Tracks token usage and costs per conversation message';
COMMENT ON COLUMN conversation_metrics.prompt_tokens IS 'Tokens in the prompt (input)';
COMMENT ON COLUMN conversation_metrics.completion_tokens IS 'Tokens in the completion (output)';
COMMENT ON COLUMN conversation_metrics.total_tokens IS 'Total tokens used';
COMMENT ON COLUMN conversation_metrics.cost IS 'Estimated cost in USD';

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 017 completed: Created conversation_metrics table';
END $$;
