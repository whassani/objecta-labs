-- Fine-Tuning System Database Schema
-- This migration creates tables for managing fine-tuning datasets, jobs, and models

-- Table: fine_tuning_datasets
-- Stores uploaded training datasets
CREATE TABLE IF NOT EXISTS fine_tuning_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    format VARCHAR(50) NOT NULL DEFAULT 'jsonl', -- jsonl, csv, json
    
    -- Dataset Statistics
    total_examples INTEGER NOT NULL DEFAULT 0,
    validated BOOLEAN DEFAULT FALSE,
    validation_errors JSONB,
    
    -- Metadata
    source VARCHAR(100), -- 'upload', 'conversations', 'api'
    source_filters JSONB, -- filters used if imported from conversations
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Table: fine_tuning_jobs
-- Tracks fine-tuning job configurations and status
CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES fine_tuning_datasets(id) ON DELETE RESTRICT,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Model Configuration
    base_model VARCHAR(100) NOT NULL, -- 'gpt-3.5-turbo', 'gpt-4', etc.
    provider VARCHAR(50) NOT NULL DEFAULT 'openai', -- 'openai', 'anthropic', 'local'
    provider_job_id VARCHAR(255), -- ID from the provider (e.g., OpenAI job ID)
    
    -- Hyperparameters
    hyperparameters JSONB NOT NULL DEFAULT '{}',
    -- Example: { "n_epochs": 3, "batch_size": 4, "learning_rate_multiplier": 0.1 }
    
    -- Status & Progress
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- Values: 'pending', 'validating', 'queued', 'running', 'succeeded', 'failed', 'cancelled'
    progress_percentage INTEGER DEFAULT 0,
    current_epoch INTEGER,
    total_epochs INTEGER,
    
    -- Results
    trained_tokens BIGINT,
    training_loss DECIMAL(10, 6),
    validation_loss DECIMAL(10, 6),
    result_model_id UUID REFERENCES fine_tuned_models(id),
    
    -- Cost & Billing
    estimated_cost_usd DECIMAL(10, 2),
    actual_cost_usd DECIMAL(10, 2),
    
    -- Error Handling
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: fine_tuned_models
-- Stores information about successfully fine-tuned models
CREATE TABLE IF NOT EXISTS fine_tuned_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Model Details
    base_model VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'openai',
    provider_model_id VARCHAR(255) NOT NULL, -- Provider's model identifier
    
    -- Performance Metrics
    training_accuracy DECIMAL(5, 4),
    validation_accuracy DECIMAL(5, 4),
    final_loss DECIMAL(10, 6),
    
    -- Deployment
    deployed BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,
    deployment_count INTEGER DEFAULT 0, -- Number of agents using this model
    
    -- Usage Statistics
    total_tokens_used BIGINT DEFAULT 0,
    total_requests INTEGER DEFAULT 0,
    average_latency_ms INTEGER,
    
    -- Version Control
    version INTEGER DEFAULT 1,
    parent_model_id UUID REFERENCES fine_tuned_models(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'archived', 'deprecated'
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    archived_at TIMESTAMP
);

-- Table: training_examples
-- Stores individual training examples for datasets
CREATE TABLE IF NOT EXISTS training_examples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES fine_tuning_datasets(id) ON DELETE CASCADE,
    
    -- Example Data
    messages JSONB NOT NULL,
    -- Format: [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]
    
    -- Metadata
    source_conversation_id UUID REFERENCES conversations(id),
    source_message_id UUID REFERENCES messages(id),
    
    -- Quality Metrics
    quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    token_count INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: fine_tuning_events
-- Logs events during fine-tuning process
CREATE TABLE IF NOT EXISTS fine_tuning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES fine_tuning_jobs(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100) NOT NULL, -- 'status_change', 'progress_update', 'error', 'metric_update'
    message TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_datasets_org_workspace ON fine_tuning_datasets(organization_id, workspace_id);
CREATE INDEX idx_datasets_created_by ON fine_tuning_datasets(created_by);
CREATE INDEX idx_datasets_created_at ON fine_tuning_datasets(created_at DESC);

CREATE INDEX idx_jobs_org_workspace ON fine_tuning_jobs(organization_id, workspace_id);
CREATE INDEX idx_jobs_created_by ON fine_tuning_jobs(created_by);
CREATE INDEX idx_jobs_dataset_id ON fine_tuning_jobs(dataset_id);
CREATE INDEX idx_jobs_status ON fine_tuning_jobs(status);
CREATE INDEX idx_jobs_created_at ON fine_tuning_jobs(created_at DESC);

CREATE INDEX idx_models_org_workspace ON fine_tuned_models(organization_id, workspace_id);
CREATE INDEX idx_models_job_id ON fine_tuned_models(job_id);
CREATE INDEX idx_models_deployed ON fine_tuned_models(deployed);
CREATE INDEX idx_models_status ON fine_tuned_models(status);

CREATE INDEX idx_examples_dataset_id ON training_examples(dataset_id);
CREATE INDEX idx_examples_source_conversation ON training_examples(source_conversation_id);

CREATE INDEX idx_events_job_id ON fine_tuning_events(job_id);
CREATE INDEX idx_events_created_at ON fine_tuning_events(created_at DESC);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_fine_tuning_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON fine_tuning_datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_fine_tuning_updated_at();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON fine_tuning_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_fine_tuning_updated_at();

CREATE TRIGGER update_models_updated_at
    BEFORE UPDATE ON fine_tuned_models
    FOR EACH ROW
    EXECUTE FUNCTION update_fine_tuning_updated_at();

-- Comments for documentation
COMMENT ON TABLE fine_tuning_datasets IS 'Stores training datasets for fine-tuning AI models';
COMMENT ON TABLE fine_tuning_jobs IS 'Tracks fine-tuning job configurations and execution status';
COMMENT ON TABLE fine_tuned_models IS 'Catalog of successfully fine-tuned models ready for deployment';
COMMENT ON TABLE training_examples IS 'Individual training examples within datasets';
COMMENT ON TABLE fine_tuning_events IS 'Event log for fine-tuning job execution';
