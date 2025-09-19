-- PostgreSQL dump created by Memento Backup Service
-- Created: 2025-09-19T01:23:04.490Z

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
INSERT INTO documents VALUES ('f3f03a76-af6a-4d7f-b7e3-8a9a37d7648a', 'spec', '{"title":"User Registration Feature","description":"Allow users to register with email and password validation","acceptanceCriteria":["User can provide email and password","System validates email format","System validates password strength","System creates user account","System sends confirmation email","User can confirm email address"]}', '{"tags":["authentication","user-management","frontend"],"status":"implemented","updated":"2025-09-19T01:23:04.488Z","assignee":"john.doe@company.com","priority":"high"}', '"2025-09-19T01:23:04.489Z"', '"2025-09-19T01:23:04.489Z"');

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

-- Schema for table: maintenance_backups
CREATE TABLE IF NOT EXISTS maintenance_backups (
  id text NOT NULL,
  type text NOT NULL,
  recorded_at timestamp with time zone NOT NULL,
  size_bytes bigint,
  checksum text,
  status text NOT NULL,
  components jsonb NOT NULL,
  storage_provider text,
  destination text,
  labels ARRAY,
  metadata jsonb NOT NULL,
  error text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Data for table: maintenance_backups
INSERT INTO maintenance_backups VALUES ('backup_1758244820111', 'full', '"2025-09-19T01:20:20.115Z"', 446141, '475097aba21fb677a784485b2e9da899b91ab8368ecd6257cd88aa7942e15765', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820111","size":446141,"type":"full","status":"completed","checksum":"475097aba21fb677a784485b2e9da899b91ab8368ecd6257cd88aa7942e15765","timestamp":"2025-09-19T01:20:20.115Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.213Z"', '"2025-09-19T01:20:20.213Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820217', 'incremental', '"2025-09-19T01:20:20.219Z"', 498011, 'e5922756b62a3011ea24bfd222f93aabbba55c9658e504e1cb7696a0193fd150', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820217","size":498011,"type":"incremental","status":"completed","checksum":"e5922756b62a3011ea24bfd222f93aabbba55c9658e504e1cb7696a0193fd150","timestamp":"2025-09-19T01:20:20.219Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.300Z"', '"2025-09-19T01:20:20.300Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820302', 'full', '"2025-09-19T01:20:20.303Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820302","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:20.303Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:20.305Z"', '"2025-09-19T01:20:20.305Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820307', 'full', '"2025-09-19T01:20:20.308Z"', 708652, '2ebcf48e4665c21271ed01e364f4307da7d4aea79b29f6f89bddfc23578b4e1b', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820307","size":708652,"type":"full","status":"completed","checksum":"2ebcf48e4665c21271ed01e364f4307da7d4aea79b29f6f89bddfc23578b4e1b","timestamp":"2025-09-19T01:20:20.308Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.404Z"', '"2025-09-19T01:20:20.404Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820406', 'full', '"2025-09-19T01:20:20.406Z"', NULL, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'completed', '{"config":false,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820406","size":0,"type":"full","status":"completed","checksum":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","timestamp":"2025-09-19T01:20:20.406Z","components":{"config":false,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:20.408Z"', '"2025-09-19T01:20:20.408Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820410', 'full', '"2025-09-19T01:20:20.412Z"', 1121757, '84c251f6d582950b4d6d1329820e599dcb68dbafd57846a7ef2e4ffefadc5153', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820410","size":1121757,"type":"full","status":"completed","checksum":"84c251f6d582950b4d6d1329820e599dcb68dbafd57846a7ef2e4ffefadc5153","timestamp":"2025-09-19T01:20:20.412Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.502Z"', '"2025-09-19T01:20:20.502Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820504', 'full', '"2025-09-19T01:20:20.505Z"', 1272244, '2279c21d66dff9dcdcf408f1a21efda2103fb794cd3d1eed7e06c09578738da4', 'completed', '{"config":true,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820504","size":1272244,"type":"full","status":"completed","checksum":"2279c21d66dff9dcdcf408f1a21efda2103fb794cd3d1eed7e06c09578738da4","timestamp":"2025-09-19T01:20:20.505Z","components":{"config":true,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.600Z"', '"2025-09-19T01:20:20.600Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820602', 'full', '"2025-09-19T01:20:20.603Z"', 1323277, '9dafeeac678f3832b89891a02c893cfaf673ba961bdb0fccdd39186a8ad1b4b6', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820602","size":1323277,"type":"full","status":"completed","checksum":"9dafeeac678f3832b89891a02c893cfaf673ba961bdb0fccdd39186a8ad1b4b6","timestamp":"2025-09-19T01:20:20.603Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.699Z"', '"2025-09-19T01:20:20.699Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244820707', 'full', '"2025-09-19T01:20:20.708Z"', 1376189, '06cbae2a97bdbd69c1b1aa671394d36cf6f7ffb59d853928348261e442bc758f', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244820707","size":1376189,"type":"full","status":"completed","checksum":"06cbae2a97bdbd69c1b1aa671394d36cf6f7ffb59d853928348261e442bc758f","timestamp":"2025-09-19T01:20:20.708Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:20.815Z"', '"2025-09-19T01:20:20.815Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821036', 'full', '"2025-09-19T01:20:21.038Z"', 1526375, 'a69d5caad80e8a0e4f5a830f58154c37635d3c92b98fa91cc671c3bb047bfa91', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821036","size":1526375,"type":"full","status":"completed","checksum":"a69d5caad80e8a0e4f5a830f58154c37635d3c92b98fa91cc671c3bb047bfa91","timestamp":"2025-09-19T01:20:21.038Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:21.145Z"', '"2025-09-19T01:20:21.145Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244835658', 'full', '"2025-09-19T01:20:35.660Z"', 191588, 'd6d47040a313c41b1fbfc1781ec7f0439d49391475acccaf68618cf8c6b7530e', 'completed', '{"config":true,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/Users/Coding/Desktop/sigmachad/backups', './backups', '[]', '{"id":"backup_1758244835658","size":191588,"type":"full","status":"completed","checksum":"d6d47040a313c41b1fbfc1781ec7f0439d49391475acccaf68618cf8c6b7530e","timestamp":"2025-09-19T01:20:35.660Z","components":{"config":true,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:35.739Z"', '"2025-09-19T01:20:35.739Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821146', 'full', '"2025-09-19T01:20:21.147Z"', 1917392, '7397635fa76170491e9b06904c1e9766ca6c38c0e17113c2187f69e212ee46dd', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821146","size":1917392,"type":"full","status":"completed","checksum":"7397635fa76170491e9b06904c1e9766ca6c38c0e17113c2187f69e212ee46dd","timestamp":"2025-09-19T01:20:21.147Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:21.400Z"', '"2025-09-19T01:20:21.400Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821422', 'full', '"2025-09-19T01:20:21.426Z"', 1631704, 'e5106ed1ee4e58703b155602224ce18905d3e3fd5e7e803f3870d6eb19bbcd8e', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821422","size":1631704,"type":"full","status":"completed","checksum":"e5106ed1ee4e58703b155602224ce18905d3e3fd5e7e803f3870d6eb19bbcd8e","timestamp":"2025-09-19T01:20:21.426Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:21.533Z"', '"2025-09-19T01:20:21.533Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821546', 'full', '"2025-09-19T01:20:21.548Z"', 1717311, 'dbed302858e40b68595fcdd65115bffee90b713bb9d3c348c3446b8f4712aa22', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821546","size":1717311,"type":"full","status":"completed","checksum":"dbed302858e40b68595fcdd65115bffee90b713bb9d3c348c3446b8f4712aa22","timestamp":"2025-09-19T01:20:21.548Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:21.657Z"', '"2025-09-19T01:20:21.657Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821665', 'full', '"2025-09-19T01:20:21.666Z"', 1771183, '3c6d228a66c98e6f665ba0b33088631074f60508b98aa9e4bff4c56a6ed96870', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821665","size":1771183,"type":"full","status":"completed","checksum":"3c6d228a66c98e6f665ba0b33088631074f60508b98aa9e4bff4c56a6ed96870","timestamp":"2025-09-19T01:20:21.666Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:21.773Z"', '"2025-09-19T01:20:21.773Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821776', 'full', '"2025-09-19T01:20:21.776Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/concurrent_2', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/concurrent_2', '[]', '{"id":"backup_1758244821776","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:21.776Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.778Z"', '"2025-09-19T01:20:21.785Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821810', 'full', '"2025-09-19T01:20:21.812Z"', 1952084, '0df3860694bebcbce84acafb7a1d45e97ddf7d408ffd96fa03aacbe88db6da2a', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821810","size":1952084,"type":"full","status":"completed","checksum":"0df3860694bebcbce84acafb7a1d45e97ddf7d408ffd96fa03aacbe88db6da2a","timestamp":"2025-09-19T01:20:21.812Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:21.936Z"', '"2025-09-19T01:20:21.936Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821939', 'full', '"2025-09-19T01:20:21.939Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_0', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_0', '[]', '{"id":"backup_1758244821939","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:21.939Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.941Z"', '"2025-09-19T01:20:21.941Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821940', 'full', '"2025-09-19T01:20:21.941Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_1', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_1', '[]', '{"id":"backup_1758244821940","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:21.941Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.942Z"', '"2025-09-19T01:20:21.942Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821942', 'full', '"2025-09-19T01:20:21.942Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_2', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_2', '[]', '{"id":"backup_1758244821942","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:21.942Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.944Z"', '"2025-09-19T01:20:21.944Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821944', 'full', '"2025-09-19T01:20:21.944Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_3', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_3', '[]', '{"id":"backup_1758244821944","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:21.944Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.946Z"', '"2025-09-19T01:20:21.946Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821946', 'full', '"2025-09-19T01:20:21.946Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_4', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/perf_4', '[]', '{"id":"backup_1758244821946","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:21.946Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.947Z"', '"2025-09-19T01:20:21.947Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244822088', 'full', '"2025-09-19T01:20:22.089Z"', 385, 'c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8', 'completed', '{"config":true,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244822088","size":385,"type":"full","status":"completed","checksum":"c95ddb23527a0669b1d3dc953e217983373ed4ce073b8d6c9925f7f41ceb10a8","timestamp":"2025-09-19T01:20:22.089Z","components":{"config":true,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:22.094Z"', '"2025-09-19T01:20:22.094Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244822097', 'full', '"2025-09-19T01:20:22.097Z"', NULL, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'completed', '{"config":false,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/list_0', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/list_0', '[]', '{"id":"backup_1758244822097","size":0,"type":"full","status":"completed","checksum":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","timestamp":"2025-09-19T01:20:22.097Z","components":{"config":false,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:22.098Z"', '"2025-09-19T01:20:22.098Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821949', 'full', '"2025-09-19T01:20:21.949Z"', NULL, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'completed', '{"config":false,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/cleanup_9', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/cleanup_2', '[]', '{"id":"backup_1758244821949","size":0,"type":"full","status":"completed","checksum":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","timestamp":"2025-09-19T01:20:21.949Z","components":{"config":false,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:21.951Z"', '"2025-09-19T01:20:21.951Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244822098', 'full', '"2025-09-19T01:20:22.098Z"', NULL, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'completed', '{"config":false,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/list_1', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/list_1', '[]', '{"id":"backup_1758244822098","size":0,"type":"full","status":"completed","checksum":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","timestamp":"2025-09-19T01:20:22.098Z","components":{"config":false,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:22.099Z"', '"2025-09-19T01:20:22.099Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244822099', 'full', '"2025-09-19T01:20:22.099Z"', NULL, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'completed', '{"config":false,"qdrant":false,"falkordb":false,"postgres":false}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/list_2', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups/list_2', '[]', '{"id":"backup_1758244822099","size":0,"type":"full","status":"completed","checksum":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","timestamp":"2025-09-19T01:20:22.099Z","components":{"config":false,"qdrant":false,"falkordb":false,"postgres":false}}', NULL, '"2025-09-19T01:20:22.101Z"', '"2025-09-19T01:20:22.101Z"');
INSERT INTO maintenance_backups VALUES ('backup_1758244821955', 'full', '"2025-09-19T01:20:21.957Z"', 1893370, '74e1dd2e47500d3d513f951e3bab68f4580594e7baf24df01240ecc989ded105', 'completed', '{"config":false,"qdrant":true,"falkordb":true,"postgres":true}', 'local:/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '/var/folders/8l/x4pmfm1n1tq57z_shgbvrctw0000gp/T/backup-service-integration-tests/backups', '[]', '{"id":"backup_1758244821955","size":1893370,"type":"full","status":"completed","checksum":"74e1dd2e47500d3d513f951e3bab68f4580594e7baf24df01240ecc989ded105","timestamp":"2025-09-19T01:20:21.957Z","components":{"config":false,"qdrant":true,"falkordb":true,"postgres":true}}', NULL, '"2025-09-19T01:20:22.081Z"', '"2025-09-19T01:20:22.081Z"');

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

