-- Performance Optimization Indexes
-- Run these to improve query performance across all tool-related tables

-- ==========================================
-- TOOL_EXECUTIONS TABLE OPTIMIZATIONS
-- ==========================================

-- Composite index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_tool_executions_org_date_success 
ON tool_executions(organization_id, created_at DESC, success);

-- Index for time series queries
CREATE INDEX IF NOT EXISTS idx_tool_executions_date_tool 
ON tool_executions(created_at DESC, tool_id, organization_id);

-- Index for error analysis
CREATE INDEX IF NOT EXISTS idx_tool_executions_errors 
ON tool_executions(organization_id, success, error) 
WHERE success = false AND error IS NOT NULL;

-- Index for rate limiting queries (last 60 seconds)
CREATE INDEX IF NOT EXISTS idx_tool_executions_rate_limit 
ON tool_executions(tool_id, organization_id, created_at DESC);

-- Index for execution time percentiles
CREATE INDEX IF NOT EXISTS idx_tool_executions_perf 
ON tool_executions(organization_id, tool_id, execution_time) 
WHERE success = true;

-- Index for test history queries
CREATE INDEX IF NOT EXISTS idx_tool_executions_test_history 
ON tool_executions(tool_id, is_test, created_at DESC);

-- ==========================================
-- AGENT_TOOLS TABLE OPTIMIZATIONS
-- ==========================================

-- Index for active tools by organization
CREATE INDEX IF NOT EXISTS idx_agent_tools_org_enabled 
ON agent_tools(organization_id, is_enabled, updated_at DESC);

-- Index for tool type filtering
CREATE INDEX IF NOT EXISTS idx_agent_tools_type 
ON agent_tools(organization_id, tool_type, is_enabled);

-- Index for agent-specific tools
CREATE INDEX IF NOT EXISTS idx_agent_tools_agent 
ON agent_tools(agent_id, organization_id) 
WHERE agent_id IS NOT NULL;

-- Index for version tracking
CREATE INDEX IF NOT EXISTS idx_agent_tools_version 
ON agent_tools(organization_id, version DESC);

-- ==========================================
-- TOOL_ENVIRONMENTS TABLE OPTIMIZATIONS
-- ==========================================

-- Index for active environment lookup
CREATE INDEX IF NOT EXISTS idx_tool_environments_active 
ON tool_environments(tool_id, organization_id, is_active) 
WHERE is_active = true;

-- ==========================================
-- TOOL_VERSIONS TABLE OPTIMIZATIONS
-- ==========================================

-- Composite index for version history
CREATE INDEX IF NOT EXISTS idx_tool_versions_tool_version 
ON tool_versions(tool_id, organization_id, version DESC);

-- Index for changed_by queries
CREATE INDEX IF NOT EXISTS idx_tool_versions_user 
ON tool_versions(changed_by, created_at DESC);

-- ==========================================
-- ADDITIONAL PERFORMANCE IMPROVEMENTS
-- ==========================================

-- Analyze tables to update statistics
ANALYZE tool_executions;
ANALYZE agent_tools;
ANALYZE tool_environments;
ANALYZE tool_versions;

-- Vacuum to reclaim storage and update statistics
VACUUM ANALYZE tool_executions;
VACUUM ANALYZE agent_tools;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON INDEX idx_tool_executions_org_date_success IS 
'Optimizes analytics queries filtering by org, date range, and success status';

COMMENT ON INDEX idx_tool_executions_date_tool IS 
'Optimizes time series queries grouping by date and tool';

COMMENT ON INDEX idx_tool_executions_errors IS 
'Partial index for error analysis queries (failed executions only)';

COMMENT ON INDEX idx_tool_executions_rate_limit IS 
'Optimizes rate limit checks for recent executions';

COMMENT ON INDEX idx_tool_executions_perf IS 
'Partial index for performance percentile calculations (successful executions only)';

-- ==========================================
-- QUERY PERFORMANCE TIPS
-- ==========================================

/*
1. Always filter by organization_id first (highest cardinality)
2. Use created_at DESC for time-based queries
3. Leverage partial indexes for success/failure filtering
4. Use EXPLAIN ANALYZE to verify index usage
5. Monitor slow queries with pg_stat_statements
6. Consider partitioning tool_executions by date if volume is very high
*/

-- Example query to check index usage:
-- EXPLAIN ANALYZE 
-- SELECT * FROM tool_executions 
-- WHERE organization_id = 'xxx' 
--   AND created_at >= NOW() - INTERVAL '30 days' 
--   AND success = false;
