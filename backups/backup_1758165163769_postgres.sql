-- PostgreSQL dump created by Memento Backup Service
-- Created: 2025-09-18T03:12:43.908Z

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

-- Data for table: documents
INSERT INTO documents VALUES ('3dd56730-2461-4ec9-bb31-df2efa119bd7', 'searchable_entity', '{"name":"AuthenticationService","content":"// AuthenticationService implementation\nclass AuthenticationService {\n  // Implementation details\n}","description":"service for handling authenticationservice operations"}', '{"type":"service","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.895Z"', '"2025-09-18T03:12:43.895Z"');
INSERT INTO documents VALUES ('4f61cca7-da14-4301-837e-a40217a5d3b7', 'searchable_entity', '{"name":"UserService","content":"// UserService implementation\nclass UserService {\n  // Implementation details\n}","description":"service for handling userservice operations"}', '{"type":"service","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.898Z"', '"2025-09-18T03:12:43.898Z"');
INSERT INTO documents VALUES ('5cd9209f-495b-4df4-8952-ac797d8e72b7', 'searchable_entity', '{"name":"AuthController","content":"// AuthController implementation\nclass AuthController {\n  // Implementation details\n}","description":"controller for handling authcontroller operations"}', '{"type":"controller","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.900Z"', '"2025-09-18T03:12:43.900Z"');
INSERT INTO documents VALUES ('80588d33-2f9a-4e8c-97da-cf202ae2a393', 'searchable_entity', '{"name":"UserController","content":"// UserController implementation\nclass UserController {\n  // Implementation details\n}","description":"controller for handling usercontroller operations"}', '{"type":"controller","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.901Z"', '"2025-09-18T03:12:43.901Z"');
INSERT INTO documents VALUES ('91346179-9848-482f-9150-84b15604813f', 'searchable_entity', '{"name":"JWTUtils","content":"// JWTUtils implementation\nclass JWTUtils {\n  // Implementation details\n}","description":"utility for handling jwtutils operations"}', '{"type":"utility","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.903Z"', '"2025-09-18T03:12:43.903Z"');
INSERT INTO documents VALUES ('076b321c-ac07-4e19-a8e8-27cf63c24b66', 'searchable_entity', '{"name":"PasswordValidator","content":"// PasswordValidator implementation\nclass PasswordValidator {\n  // Implementation details\n}","description":"utility for handling passwordvalidator operations"}', '{"type":"utility","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.905Z"', '"2025-09-18T03:12:43.905Z"');
INSERT INTO documents VALUES ('733eb2ff-ab3d-4cc4-90d0-8e0e3f12d8ba', 'searchable_entity', '{"name":"AuthMiddleware","content":"// AuthMiddleware implementation\nclass AuthMiddleware {\n  // Implementation details\n}","description":"middleware for handling authmiddleware operations"}', '{"type":"middleware","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.907Z"', '"2025-09-18T03:12:43.907Z"');
INSERT INTO documents VALUES ('a2892d88-8873-4fa3-9d22-27454c97fd51', 'searchable_entity', '{"name":"User","content":"// User implementation\nclass User {\n  // Implementation details\n}","description":"model for handling user operations"}', '{"type":"model","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.908Z"', '"2025-09-18T03:12:43.908Z"');
INSERT INTO documents VALUES ('7c7e4820-380d-426a-8e15-97415b6fe819', 'searchable_entity', '{"name":"AuthCredentials","content":"// AuthCredentials implementation\nclass AuthCredentials {\n  // Implementation details\n}","description":"model for handling authcredentials operations"}', '{"type":"model","language":"typescript","searchable":true}', '"2025-09-18T03:12:43.910Z"', '"2025-09-18T03:12:43.910Z"');
INSERT INTO documents VALUES ('24b5c6ef-fcb9-4951-b7ba-7feebb3b3c74', 'search_result', '{"clusters":[],"entities":[{"id":"5cd9209f-495b-4df4-8952-ac797d8e72b7","hash":"hash5cd9209f-495b-4df4-8952-ac797d8e72b7","path":"/src/AuthController.ts","type":"controller","created":"2025-09-18T03:12:43.916Z","language":"typescript","lastModified":"2025-09-18T03:12:43.916Z"},{"id":"3dd56730-2461-4ec9-bb31-df2efa119bd7","hash":"hash3dd56730-2461-4ec9-bb31-df2efa119bd7","kind":"class","name":"AuthenticationService","path":"/src/AuthenticationService.ts","type":"service","created":"2025-09-18T03:12:43.916Z","language":"typescript","lastModified":"2025-09-18T03:12:43.916Z"}],"relationships":[],"relevanceScore":0.85}', '{"query":"auth","timestamp":"2025-09-18T03:12:43.916Z","searchType":"semantic","resultCount":2}', '"2025-09-18T03:12:43.917Z"', '"2025-09-18T03:12:43.917Z"');
INSERT INTO documents VALUES ('4d159829-7f0e-4fef-9ffd-4fa8cf24cd60', 'search_result', '{"clusters":[],"entities":[{"id":"a2892d88-8873-4fa3-9d22-27454c97fd51","hash":"hasha2892d88-8873-4fa3-9d22-27454c97fd51","path":"/src/User.ts","type":"model","created":"2025-09-18T03:12:43.918Z","language":"typescript","lastModified":"2025-09-18T03:12:43.918Z"},{"id":"80588d33-2f9a-4e8c-97da-cf202ae2a393","hash":"hash80588d33-2f9a-4e8c-97da-cf202ae2a393","path":"/src/UserController.ts","type":"controller","created":"2025-09-18T03:12:43.918Z","language":"typescript","lastModified":"2025-09-18T03:12:43.918Z"},{"id":"4f61cca7-da14-4301-837e-a40217a5d3b7","hash":"hash4f61cca7-da14-4301-837e-a40217a5d3b7","kind":"class","name":"UserService","path":"/src/UserService.ts","type":"service","created":"2025-09-18T03:12:43.918Z","language":"typescript","lastModified":"2025-09-18T03:12:43.918Z"}],"relationships":[],"relevanceScore":0.85}', '{"query":"User","timestamp":"2025-09-18T03:12:43.918Z","searchType":"structural","resultCount":3}', '"2025-09-18T03:12:43.919Z"', '"2025-09-18T03:12:43.919Z"');
INSERT INTO documents VALUES ('20bf7073-3959-4b3d-8aa8-26402074d0a2', 'search_result', '{"clusters":[],"entities":[{"id":"733eb2ff-ab3d-4cc4-90d0-8e0e3f12d8ba","hash":"hash733eb2ff-ab3d-4cc4-90d0-8e0e3f12d8ba","path":"/src/AuthMiddleware.ts","type":"middleware","created":"2025-09-18T03:12:43.920Z","language":"typescript","lastModified":"2025-09-18T03:12:43.920Z"}],"relationships":[],"relevanceScore":0.85}', '{"query":"middleware","timestamp":"2025-09-18T03:12:43.920Z","searchType":"usage","resultCount":1}', '"2025-09-18T03:12:43.921Z"', '"2025-09-18T03:12:43.921Z"');

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

