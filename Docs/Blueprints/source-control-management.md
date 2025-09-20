# Source Control Management Blueprint

## 1. Overview
The SCM surface automates commit creation, pull-request scaffolding, branch management, and diff/log retrieval so AI-driven workflows can land code safely. The Fastify router exposes `/api/v1/scm/*` endpoints which now orchestrate real git operations through `GitService`, persist commit metadata, and publish provenance into the knowledge graph.

## 2. Current Behaviour (2025-09-19)
- `/api/v1/scm/commit-pr` stages requested paths, creates a commit, persists metadata to Postgres (`scm_commits`), materialises change entities/relationships in the knowledge graph, and optionally asks the configured SCM provider to push and create a PR payload. Responses include commit status, provider details, retry metadata, and linked artifacts (spec/tests/validation).
- Companion endpoints (`/scm/commit`, `/scm/push`, `/scm/branch`, `/scm/status`, `/scm/changes`, `/scm/diff`, `/scm/log`) delegate to `SCMService` and enforce Fastify schemas for request/response validation.
- A feature flag (`FEATURE_SCM` / `SCM_FEATURE_FLAG`) can disable the surface. When disabled the handlers return a structured `NOT_IMPLEMENTED` payload so existing callers can detect availability.
- The default provider is `LocalGitProvider`, which pushes to a configured remote and synthesises a PR URL (`<remote>#<branch>:<hash>`). GitHub/GitLab adapters are not yet implemented; see follow-up plan in `TODO.md`.

## 3. Implementation Notes
- `SCMService.createCommitAndMaybePR` serialises git access with a mutex to avoid concurrent branch switches, captures author info from environment (`GIT_AUTHOR_*`, `GITHUB_ACTOR`), and records provider attempts/errors for downstream automation.
- Commit metadata is stored in Postgres (`scm_commits`) with JSONB metadata for provider diagnostics and validation/test linkage. `DatabaseService` exposes helpers for listing and querying these records to power `/scm/changes`.
- Knowledge graph entities use `change:${commitHash}` as the canonical ID and create `MODIFIED_IN` edges back to related specs/tests when they exist.
- Provider orchestration supports configurable retry/backoff (`SCM_PROVIDER_MAX_RETRIES`, `SCM_PROVIDER_RETRY_DELAY_MS`). When retries exhaust, the API marks the response as `failed` with `escalationRequired=true` and surfaces the serialized provider errors.
- Integration tests spin up ephemeral git repositories to exercise staging, commit, push, and failure flows. Use them as references when extending provider behaviour.

## 4. Known Gaps & Follow-up Work
1. Implement hosted SCM adapters (GitHub, GitLab) that can:
   - push feature branches using provider credentials
   - create merge/pull requests with metadata captured in `SCMService`
   - honour token scopes and provider-specific validation semantics
2. Extend Postgres schema to capture provider PR identifiers/status and sync updates (merged/closed) back into the knowledge graph.
3. Expand documentation with end-to-end examples once hosted providers exist, including troubleshooting for provider escalations.
