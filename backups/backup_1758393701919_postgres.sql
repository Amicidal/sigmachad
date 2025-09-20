-- PostgreSQL schema snapshot created by Memento Backup Service
-- Created: 2025-09-20T18:41:41.942Z

-- Schema for table: changes
CREATE TABLE IF NOT EXISTS "changes" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "change_type" character varying(20) NOT NULL,
  "entity_type" character varying(50) NOT NULL,
  "entity_id" character varying(255) NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "author" character varying(255),
  "commit_hash" character varying(255),
  "diff" text,
  "previous_state" jsonb,
  "new_state" jsonb,
  "session_id" uuid,
  "spec_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: changes captured in backup_1758393701919_postgres.json

-- Schema for table: coverage_history
CREATE TABLE IF NOT EXISTS "coverage_history" (
  "entity_id" uuid NOT NULL,
  "lines_covered" integer NOT NULL,
  "lines_total" integer NOT NULL,
  "percentage" double precision NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now()
);

-- Data for table: coverage_history captured in backup_1758393701919_postgres.json

-- Schema for table: documents
CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "type" character varying(50) NOT NULL,
  "content" jsonb,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: documents captured in backup_1758393701919_postgres.json

-- Schema for table: flaky_test_analyses
CREATE TABLE IF NOT EXISTS "flaky_test_analyses" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "test_id" character varying(255) NOT NULL,
  "test_name" character varying(255) NOT NULL,
  "failure_count" integer DEFAULT 0,
  "flaky_score" numeric(6, 2) DEFAULT 0,
  "total_runs" integer DEFAULT 0,
  "failure_rate" numeric(6, 4) DEFAULT 0,
  "success_rate" numeric(6, 4) DEFAULT 0,
  "recent_failures" integer DEFAULT 0,
  "patterns" jsonb,
  "recommendations" jsonb,
  "analyzed_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: flaky_test_analyses captured in backup_1758393701919_postgres.json

-- Schema for table: maintenance_backups
CREATE TABLE IF NOT EXISTS "maintenance_backups" (
  "id" text NOT NULL,
  "type" text NOT NULL,
  "recorded_at" timestamp with time zone NOT NULL,
  "size_bytes" bigint DEFAULT 0,
  "checksum" text,
  "status" text NOT NULL,
  "components" jsonb NOT NULL,
  "storage_provider" text,
  "destination" text,
  "labels" text[] DEFAULT ARRAY[]::text[],
  "metadata" jsonb NOT NULL,
  "error" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: maintenance_backups captured in backup_1758393701919_postgres.json

-- Schema for table: performance_metric_snapshots
CREATE TABLE IF NOT EXISTS "performance_metric_snapshots" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "test_id" text NOT NULL,
  "target_id" text,
  "metric_id" text NOT NULL,
  "scenario" text,
  "environment" text,
  "severity" text,
  "trend" text,
  "unit" text,
  "baseline_value" double precision,
  "current_value" double precision,
  "delta" double precision,
  "percent_change" double precision,
  "sample_size" integer,
  "risk_score" double precision,
  "run_id" text,
  "detected_at" timestamp with time zone,
  "resolved_at" timestamp with time zone,
  "metadata" jsonb,
  "metrics_history" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: performance_metric_snapshots captured in backup_1758393701919_postgres.json

-- Schema for table: performance_metrics
CREATE TABLE IF NOT EXISTS "performance_metrics" (
  "entity_id" uuid NOT NULL,
  "metric_type" character varying(64) NOT NULL,
  "value" double precision NOT NULL,
  "timestamp" timestamp with time zone DEFAULT now()
);

-- Data for table: performance_metrics captured in backup_1758393701919_postgres.json

-- Schema for table: scm_commits
CREATE TABLE IF NOT EXISTS "scm_commits" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "commit_hash" text NOT NULL,
  "branch" text NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "author" text,
  "metadata" jsonb,
  "changes" text[] DEFAULT ARRAY[]::text[] NOT NULL,
  "related_spec_id" text,
  "test_results" text[] DEFAULT ARRAY[]::text[],
  "validation_results" jsonb,
  "pr_url" text,
  "provider" text,
  "status" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: scm_commits captured in backup_1758393701919_postgres.json

-- Schema for table: session_checkpoint_jobs
CREATE TABLE IF NOT EXISTS "session_checkpoint_jobs" (
  "job_id" text NOT NULL,
  "session_id" text NOT NULL,
  "payload" jsonb NOT NULL,
  "status" text NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "last_error" text,
  "queued_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("job_id")
);

-- Data for table: session_checkpoint_jobs captured in backup_1758393701919_postgres.json

-- Schema for table: sessions
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "agent_type" character varying(50) NOT NULL,
  "user_id" character varying(255),
  "start_time" timestamp with time zone NOT NULL,
  "end_time" timestamp with time zone,
  "status" character varying(20) DEFAULT 'active'::character varying,
  "metadata" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: sessions captured in backup_1758393701919_postgres.json

-- Schema for table: test_coverage
CREATE TABLE IF NOT EXISTS "test_coverage" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "test_id" character varying(255) NOT NULL,
  "suite_id" uuid,
  "lines" double precision DEFAULT 0,
  "branches" double precision DEFAULT 0,
  "functions" double precision DEFAULT 0,
  "statements" double precision DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: test_coverage captured in backup_1758393701919_postgres.json

-- Schema for table: test_performance
CREATE TABLE IF NOT EXISTS "test_performance" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "test_id" character varying(255) NOT NULL,
  "suite_id" uuid,
  "memory_usage" integer,
  "cpu_usage" double precision,
  "network_requests" integer,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: test_performance captured in backup_1758393701919_postgres.json

-- Schema for table: test_results
CREATE TABLE IF NOT EXISTS "test_results" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "suite_id" uuid,
  "test_id" character varying(255) NOT NULL,
  "test_suite" character varying(255),
  "test_name" character varying(255) NOT NULL,
  "status" character varying(20) NOT NULL,
  "duration" integer,
  "error_message" text,
  "stack_trace" text,
  "coverage" jsonb,
  "performance" jsonb,
  "timestamp" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: test_results captured in backup_1758393701919_postgres.json

-- Schema for table: test_suites
CREATE TABLE IF NOT EXISTS "test_suites" (
  "id" uuid DEFAULT uuid_generate_v4() NOT NULL,
  "suite_name" character varying(255) NOT NULL,
  "timestamp" timestamp with time zone NOT NULL,
  "framework" character varying(50),
  "total_tests" integer DEFAULT 0,
  "passed_tests" integer DEFAULT 0,
  "failed_tests" integer DEFAULT 0,
  "skipped_tests" integer DEFAULT 0,
  "duration" integer DEFAULT 0,
  "status" character varying(20) DEFAULT 'unknown'::character varying,
  "coverage" jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  PRIMARY KEY ("id")
);

-- Data for table: test_suites captured in backup_1758393701919_postgres.json

