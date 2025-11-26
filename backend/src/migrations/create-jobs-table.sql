-- Create jobs table for background job management

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    data JSONB,
    result JSONB,
    error JSONB,
    progress JSONB,
    queue_name VARCHAR(100) NOT NULL,
    bull_job_id VARCHAR(255),
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_bull_job_id ON jobs(bull_job_id);

-- Create composite indexes for common queries
CREATE INDEX idx_jobs_org_status ON jobs(organization_id, status);
CREATE INDEX idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_type_status ON jobs(type, status);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at_trigger
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- Add comments
COMMENT ON TABLE jobs IS 'Background job queue and execution tracking';
COMMENT ON COLUMN jobs.type IS 'Job type: data-conversion, fine-tuning, workflow-execution, etc.';
COMMENT ON COLUMN jobs.status IS 'Job status: pending, active, completed, failed, cancelled';
COMMENT ON COLUMN jobs.data IS 'Job input data and parameters';
COMMENT ON COLUMN jobs.result IS 'Job output and result data';
COMMENT ON COLUMN jobs.error IS 'Error details if job failed';
COMMENT ON COLUMN jobs.progress IS 'Current job progress information';
COMMENT ON COLUMN jobs.bull_job_id IS 'Bull queue job ID for correlation';
