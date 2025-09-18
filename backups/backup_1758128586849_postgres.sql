-- PostgreSQL dump created by Memento Backup Service
-- Created: 2025-09-17T17:03:07.189Z

-- Schema for table: changes
CREATE TABLE IF NOT EXISTS changes (
  id uuid NOT NULL,
  change_type character varying NOT NULL,
  entity_type character varying NOT NULL,
  entity_id character varying NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  author character varying,
  commit_hash character varying,
  diff text,
  previous_state jsonb,
  new_state jsonb,
  session_id uuid,
  spec_id uuid,
  created_at timestamp with time zone
);

-- Schema for table: coverage_history
CREATE TABLE IF NOT EXISTS coverage_history (
  entity_id uuid NOT NULL,
  lines_covered integer NOT NULL,
  lines_total integer NOT NULL,
  percentage double precision NOT NULL,
  timestamp timestamp with time zone
);

-- Schema for table: documents
CREATE TABLE IF NOT EXISTS documents (
  id uuid NOT NULL,
  type character varying NOT NULL,
  content jsonb,
  metadata jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Schema for table: flaky_test_analyses
CREATE TABLE IF NOT EXISTS flaky_test_analyses (
  id uuid NOT NULL,
  test_id character varying NOT NULL,
  test_name character varying NOT NULL,
  failure_count integer,
  flaky_score numeric,
  total_runs integer,
  failure_rate numeric,
  success_rate numeric,
  recent_failures integer,
  patterns jsonb,
  recommendations jsonb,
  analyzed_at timestamp with time zone
);

-- Schema for table: performance_metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  entity_id uuid NOT NULL,
  metric_type character varying NOT NULL,
  value double precision NOT NULL,
  timestamp timestamp with time zone
);

-- Schema for table: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id uuid NOT NULL,
  agent_type character varying NOT NULL,
  user_id character varying,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone,
  status character varying,
  metadata jsonb,
  created_at timestamp with time zone
);

-- Schema for table: test_coverage
CREATE TABLE IF NOT EXISTS test_coverage (
  id uuid NOT NULL,
  test_id character varying NOT NULL,
  suite_id uuid,
  lines double precision,
  branches double precision,
  functions double precision,
  statements double precision,
  created_at timestamp with time zone
);

-- Schema for table: test_performance
CREATE TABLE IF NOT EXISTS test_performance (
  id uuid NOT NULL,
  test_id character varying NOT NULL,
  suite_id uuid,
  memory_usage integer,
  cpu_usage double precision,
  network_requests integer,
  created_at timestamp with time zone
);

-- Schema for table: test_results
CREATE TABLE IF NOT EXISTS test_results (
  id uuid NOT NULL,
  suite_id uuid,
  test_id character varying NOT NULL,
  test_suite character varying,
  test_name character varying NOT NULL,
  status character varying NOT NULL,
  duration integer,
  error_message text,
  stack_trace text,
  coverage jsonb,
  performance jsonb,
  timestamp timestamp with time zone
);

-- Schema for table: test_suites
CREATE TABLE IF NOT EXISTS test_suites (
  id uuid NOT NULL,
  suite_name character varying NOT NULL,
  timestamp timestamp with time zone NOT NULL,
  framework character varying,
  total_tests integer,
  passed_tests integer,
  failed_tests integer,
  skipped_tests integer,
  duration integer,
  status character varying,
  coverage jsonb,
  created_at timestamp with time zone
);

