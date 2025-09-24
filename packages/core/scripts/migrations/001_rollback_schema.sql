-- Migration 001: Create rollback capabilities schema
-- This script creates the PostgreSQL schema for rollback persistence

-- Create schema for rollback data
CREATE SCHEMA IF NOT EXISTS memento_rollback;

-- Set search path
SET search_path TO memento_rollback, public;

-- Create rollback_points table
CREATE TABLE IF NOT EXISTS rollback_points (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Add constraints
    CONSTRAINT chk_name_not_empty CHECK (LENGTH(name) > 0),
    CONSTRAINT chk_valid_expiry CHECK (expires_at IS NULL OR expires_at > timestamp)
);

-- Create operations table
CREATE TABLE IF NOT EXISTS rollback_operations (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL,
    target_rollback_point_id UUID NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    strategy TEXT NOT NULL,
    log_entries JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraint
    FOREIGN KEY (target_rollback_point_id) REFERENCES rollback_points(id) ON DELETE CASCADE,

    -- Add constraints
    CONSTRAINT chk_valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_valid_type CHECK (type IN ('full', 'partial', 'time_based')),
    CONSTRAINT chk_completed_at_valid CHECK (completed_at IS NULL OR completed_at >= started_at)
);

-- Create snapshots table
CREATE TABLE IF NOT EXISTS rollback_snapshots (
    id UUID PRIMARY KEY,
    rollback_point_id UUID NOT NULL,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
    checksum TEXT,
    compression_type TEXT DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraint
    FOREIGN KEY (rollback_point_id) REFERENCES rollback_points(id) ON DELETE CASCADE,

    -- Add constraints
    CONSTRAINT chk_valid_snapshot_type CHECK (type IN ('entity', 'relationship', 'session_state', 'file_system', 'custom')),
    CONSTRAINT chk_valid_compression CHECK (compression_type IN ('none', 'gzip', 'lz4'))
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS rollback_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_unit TEXT,
    tags JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Add constraints
    CONSTRAINT chk_metric_name_not_empty CHECK (LENGTH(metric_name) > 0)
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS rollback_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rollback_point_id UUID,
    operation_id UUID,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    user_id TEXT,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign key constraints (allow NULL for system events)
    FOREIGN KEY (rollback_point_id) REFERENCES rollback_points(id) ON DELETE SET NULL,
    FOREIGN KEY (operation_id) REFERENCES rollback_operations(id) ON DELETE SET NULL,

    -- Add constraints
    CONSTRAINT chk_event_type_not_empty CHECK (LENGTH(event_type) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rollback_points_session_id
    ON rollback_points(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rollback_points_expires_at
    ON rollback_points(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rollback_points_timestamp
    ON rollback_points(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_operations_status
    ON rollback_operations(status);

CREATE INDEX IF NOT EXISTS idx_operations_target_rollback_point_id
    ON rollback_operations(target_rollback_point_id);

CREATE INDEX IF NOT EXISTS idx_operations_started_at
    ON rollback_operations(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_snapshots_rollback_point_id
    ON rollback_snapshots(rollback_point_id);

CREATE INDEX IF NOT EXISTS idx_snapshots_type
    ON rollback_snapshots(type);

CREATE INDEX IF NOT EXISTS idx_snapshots_size_bytes
    ON rollback_snapshots(size_bytes);

CREATE INDEX IF NOT EXISTS idx_metrics_metric_name
    ON rollback_metrics(metric_name);

CREATE INDEX IF NOT EXISTS idx_metrics_recorded_at
    ON rollback_metrics(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_rollback_point_id
    ON rollback_audit_log(rollback_point_id) WHERE rollback_point_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_operation_id
    ON rollback_audit_log(operation_id) WHERE operation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_log_event_type
    ON rollback_audit_log(event_type);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
    ON rollback_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_session_id
    ON rollback_audit_log(session_id) WHERE session_id IS NOT NULL;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_rollback_points_session_timestamp
    ON rollback_points(session_id, timestamp DESC) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_operations_status_started_at
    ON rollback_operations(status, started_at DESC);

-- Create partitioned table for high-volume audit logs (if needed)
-- This can be uncommented for high-volume deployments
/*
CREATE TABLE rollback_audit_log_partitioned (
    LIKE rollback_audit_log INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions (example)
CREATE TABLE rollback_audit_log_y2025m01 PARTITION OF rollback_audit_log_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
*/

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rollback_points_updated_at
    BEFORE UPDATE ON rollback_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rollback_operations_updated_at
    BEFORE UPDATE ON rollback_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for cleanup of expired rollback points
CREATE OR REPLACE FUNCTION cleanup_expired_rollback_points()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM rollback_points
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log cleanup activity
    INSERT INTO rollback_audit_log (event_type, event_data)
    VALUES ('cleanup_expired_points', jsonb_build_object('deleted_count', deleted_count));

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function for cleanup of old completed operations
CREATE OR REPLACE FUNCTION cleanup_old_operations(retention_hours INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_time TIMESTAMPTZ;
BEGIN
    cutoff_time := NOW() - (retention_hours || ' hours')::INTERVAL;

    DELETE FROM rollback_operations
    WHERE (status = 'completed' OR status = 'failed')
    AND completed_at < cutoff_time;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log cleanup activity
    INSERT INTO rollback_audit_log (event_type, event_data)
    VALUES ('cleanup_old_operations', jsonb_build_object(
        'deleted_count', deleted_count,
        'retention_hours', retention_hours
    ));

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get rollback statistics
CREATE OR REPLACE FUNCTION get_rollback_statistics()
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_rollback_points', COUNT(*),
        'active_operations', SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END),
        'successful_operations', SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END),
        'failed_operations', SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END),
        'total_snapshot_size_mb', ROUND(SUM(size_bytes)::DECIMAL / 1024 / 1024, 2),
        'oldest_point', MIN(timestamp),
        'newest_point', MAX(timestamp)
    ) INTO stats
    FROM rollback_points rp
    LEFT JOIN rollback_operations ro ON rp.id = ro.target_rollback_point_id
    LEFT JOIN rollback_snapshots rs ON rp.id = rs.rollback_point_id;

    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your user/role setup)
-- GRANT USAGE ON SCHEMA memento_rollback TO rollback_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA memento_rollback TO rollback_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA memento_rollback TO rollback_user;

-- Insert initial migration record
INSERT INTO rollback_audit_log (event_type, event_data)
VALUES ('schema_migration', jsonb_build_object(
    'migration_version', '001',
    'migration_name', 'rollback_schema',
    'migration_description', 'Initial rollback capabilities schema'
));

COMMIT;