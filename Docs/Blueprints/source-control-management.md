# Source Control Management Blueprint

## 1. Overview
The SCM surface is responsible for automating commit creation, pull request scaffolding, branch management, and diff/log retrieval so AI-driven workflows can land code safely. Today the Fastify router exposes `/api/v1/scm/*` endpoints, but most handlers are stubs that return `501 NOT_IMPLEMENTED`.

## 2. Current State & Gaps (2025-09-19)
- `/api/v1/scm/commit-pr` always responds with `{ success: false, error: { code: "NOT_IMPLEMENTED" } }`. There is no orchestration over git, no commit metadata persistence, and no graph integration beyond the tests seeding entities.
- Related endpoints (`/scm/commit`, `/scm/push`, `/scm/branch`, `/scm/status`, etc.) share the same stub handler. They provide neither validation nor structured responses beyond the generic 501 envelope.
- Integration tests previously assumed successful commits and branch management, masking the fact that no SCM automation exists. The suite now asserts the 501 envelope instead, ensuring we notice when real functionality lands.
- There is no abstraction for talking to git providers (local repo, GitHub, GitLab) or propagating commit artifacts into the knowledge graph / backup services.

## 3. Interim Behaviour
- Clients should treat the SCM APIs as non-functional placeholders. The only contract guaranteed at the moment is the structured error payload (`code: NOT_IMPLEMENTED`, descriptive `message`, `success: false`).
- Tests exercise the endpoints purely to ensure the gateway wiring and error formatting remain stable.

## 4. Next Steps
1. Design a git orchestration layer (local repo shell driver + provider adapters) that can stage diffs, create commits, and open PRs/merge requests.
2. Model commit metadata in Postgres and link produced commits back into the knowledge graph so downstream analytics can reason about code provenance.
3. Introduce request validation schemas for `/scm/commit-pr` to reject malformed payloads before orchestration runs.
4. Replace the 501 stubs with real handlers behind a feature flag, migrate integration tests to exercise the full workflow, then retire the fallback assertions.

