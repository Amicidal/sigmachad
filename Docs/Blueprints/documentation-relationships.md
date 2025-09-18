# Documentation Relationship Blueprint

## 1. Purpose & Scope
Documentation relationships bridge natural-language assets and the executable knowledge graph. The live implementation spans:
- `src/services/DocumentationParser.ts` for discovery, parsing, relationship emission, and freshness management.
- `src/services/KnowledgeGraphService.ts` for entity persistence, documentation-edge normalization, and embedding upkeep.
- Fastify routes in `src/api/routes/docs.ts` for orchestration (`/docs/sync`, search, parsing, validation) and post-sync symbol linking.

This blueprint captures the behaviour that currently ships so downstream tooling can rely on accurate contracts and metadata semantics.

## 2. System Overview
- **Discovery & ingestion**: `DocumentationParser.findDocumentationFiles` recursively walks the requested root, admitting `.md`, `.txt`, `.rst`, and `.adoc` files while skipping hidden folders, `node_modules`, and `dist`.
- **Parsing**: Markdown, plaintext, reStructuredText, and AsciiDoc flows share `ParsedDocument`. Heuristics infer `docType`, `docIntent`, stakeholders, technologies, and business domains. Title/heading extraction also captures section descriptors, code blocks, outbound links, and basic analytics (word/line counts). `inferDocLocale` inspects filename suffixes (`*.en.md`) and metadata fallbacks, defaulting to `en`.
- **Documentation nodes**: `createOrUpdateDocumentationNode` normalizes IDs as `doc_<basename>_<checksum8>` and upserts `DocumentationNode` entities with deterministic hashes, inferred intent, locale, and status set to `active`. Entities are written through `KnowledgeGraphService.createEntity`, which ensures embeddings land in the `documentation_embeddings` collection unless explicitly skipped.
- **Relationship emission**: The parser writes four edge shapes today:
  * `DESCRIBES_DOMAIN` for document → business domain.
  * `DOCUMENTED_BY` for semantic cluster → document.
  * `BELONGS_TO_DOMAIN` for semantic cluster → business domain.
  * `DOCUMENTS_SECTION` as self-edges for intra-document navigation.
  `KnowledgeGraphService.createRelationship` centralizes normalization (canonical IDs, intent, locale, coverage scope, strength, etc.) and drops low-confidence inferred edges below `noiseConfig.MIN_INFERRED_CONFIDENCE`.
- **Freshness lifecycle**: After syncing files, `applyFreshnessUpdates` updates `DOCUMENTATION_RELATIONSHIP_TYPES` edges with the current `lastValidated`, upgrades quality to `complete`, and marks untouched relationships as `outdated` when older than `DOC_FRESHNESS_MAX_AGE_DAYS` (default 14). Manual docs (`docSource = manual`) are excluded from stale flagging.
- **Cluster scaffolding**: Domains inferred from content are promoted to `BusinessDomain` nodes (auto-assigning `criticality` and `stakeholders`) and seed `SemanticCluster` nodes per domain, keeping `clusterType = "capability"` and `cohesionScore = 0.8`.
- **Domain heuristics**: `extractBusinessDomains` no longer relies on hard-coded domain names. Instead it harvests phrases from headings, "Business Domains" sections, and noun phrases that end with domain-like keywords (management, processing, services, security, etc.), trimming narrative tails and splitting connective lists so docs such as "Payment Processing" or "User authentication" map to canonical domain strings.
- **Signal extraction adapter**: `DocumentationIntelligenceProvider` (`src/services/DocumentationIntelligenceProvider.ts`) supplies business domains, stakeholders, technologies, and optional doc intent. The default implementation (`HeuristicDocumentationIntelligenceProvider`) preserves existing regex heuristics, while the `LLM_EXTRACTION_PROMPT` constant sketches the JSON contract for future Codex/Claude headless calls.
- **API surface**: `/docs/sync` drives the pipeline and then invokes heuristics to build `IMPLEMENTS_SPEC` edges from exported symbols into spec-like documents (design, architecture, API docs). Additional routes (`/docs/search`, `/docs/parse`, `/docs/validate`, `/docs/domains`, `/docs/clusters`, `/docs/business/impact/:domain`) serve read/search/governance functions against the normalized graph data.
- **Spec linkage heuristics**: Post-sync symbol linking enforces configurable thresholds from `src/config/noise.ts`, requiring either at least `DOC_LINK_MIN_OCCURRENCES` case-insensitive matches or a "strong" symbol name length, restricting matches to exported symbols and doc-type-specific symbol kinds (functions for API docs, classes/interfaces for design/architecture docs), boosting confidence when the match occurs in headings, and pruning prior edges that fall outside the allowed symbol set.

## Known Issues (integration coverage)
- Integration suites require FalkorDB, Qdrant, and PostgreSQL test services. When those containers are unavailable the documentation sync scenarios skip after setup, so ensure `docker-compose.test.yml` (or equivalent infrastructure) is running before depending on their assertions.
- Section self-edge emission (`DOCUMENTS_SECTION`) and freshness lifecycle updates currently rely on manual testing; expanding automated coverage would harden those behaviours against regressions.

## 3. Node & Relationship Types
**DocumentationNode** (`type = "documentation"`, `src/models/entities.ts:244`)
- Required fields: `id`, `path`, `hash`, `title`, `content`, `docType`, `businessDomains`, `stakeholders`, `technologies`, `status`, `docVersion`, `docHash`, `docIntent`, `docSource`.
- Optional metadata: `docLocale` (defaults to `en`), `lastIndexed`, language (currently hard-coded `markdown`).
- IDs derived from a content-based rolling checksum; both `docVersion` and `docHash` reuse the same 32-bit hexadecimal string.

**BusinessDomain**
- Auto-created for each extracted domain (`domain_<slug>`). Carries derived `criticality` (`core` for auth/payment/security terms, `supporting` for user/reporting/communication, otherwise `utility`), stakeholder rollups, and provenance via `extractedFrom`.

**SemanticCluster**
- Seeded one per domain as `cluster_<slug>`, labelled `clusterType = "capability"`, fixed `cohesionScore = 0.8`, and `businessDomainId` pointing at the matching domain node. Currently stores an empty `memberEntities` list; downstream enrichment is expected to populate membership.

**Relationships emitted today**
- `DESCRIBES_DOMAIN` (`doc → domain`): `confidence = 0.6`, `docIntent` propagated from parser, `sectionAnchor = "_root"`, normalized `domainPath`, `taxonomyVersion` (defaults `v1`), `lastValidated`/`updatedFromDocAt` stamped with the sync timestamp, and metadata echoing the same fields for auditability.
- `DOCUMENTED_BY` (`cluster → doc`): defaults to `confidence = 0.6`, sets `documentationQuality = "partial"` on creation, `coverageScope = "behavior"`, copies `docVersion`, `docHash`, `docIntent`, and pins `sectionAnchor = "_root"`.
- `BELONGS_TO_DOMAIN` (`cluster → domain`): similar metadata with `strength = 0.5` and normalized `domainPath`. `normalizeDocumentationEdge` will backfill missing strength to `0.5` and enforce bounds.
- `DOCUMENTS_SECTION` (`doc → doc` self-edge): up to 30 sections produced by `linkDocumentSections`. Each edge stores `sectionAnchor` (slugified heading), `sectionTitle`, optional `summary`, heading `level`, locale/intent/version/hash, and mirrors the payload inside `metadata` for compatibility. These edges enable downstream navigation and per-section governance.

**Relationships supported by the normalization layer**
- `GOVERNED_BY`, `DOMAIN_RELATED`, and `CLUSTER_MEMBER` are fully normalized in `KnowledgeGraphService.normalizeDocumentationEdge` (policy type, relationship type, similarity, etc.) even though the parser does not yet emit them. Producers can safely begin emitting these with consistent semantics.

**Normalization highlights (`src/services/KnowledgeGraphService.ts:430-620`)**
- Harmonizes `docIntent`, `docLocale`, `coverageScope`, `documentationQuality`, `domainPath`, `taxonomyVersion`, section anchors/titles, stakeholder/tag arrays, and optional policy metadata.
- Ensures date-like fields (`lastValidated`, `updatedFromDocAt`, `effectiveFrom`, `expiresAt`) serialize to ISO strings, dedupes evidence/locations, clamps confidence/strength, and injects default embedding versions when missing.
- Drops inferred relationships when `confidence < noiseConfig.MIN_INFERRED_CONFIDENCE`.

## 4. Ingestion Pipeline (`DocumentationParser.syncDocumentation`)
1. **File discovery** – `findDocumentationFiles` gathers eligible files under the provided root, respecting the supported extensions and skip rules.
2. **Parse & enrich** – `parseFile` dispatches to format-specific parsers, infers doc type/intent/locale, calculates a checksum, and augments metadata with headings, code blocks, outbound links, and file telemetry.
3. **Node upsert** – `createOrUpdateDocumentationNode` writes/updates the `DocumentationNode` entity and triggers embedding maintenance via the graph service.
4. **Domain extraction** – `extractAndCreateDomains` ensures matching `BusinessDomain` nodes exist, attaches `DESCRIBES_DOMAIN` edges, and persists normalized taxonomy paths and timestamps.
5. **Cluster seeding** – `updateSemanticClusters` creates/refreshes `SemanticCluster` nodes, links them back to the document (`DOCUMENTED_BY`), and binds them to domains (`BELONGS_TO_DOMAIN`).
6. **Section linking** – `linkDocumentSections` inspects parsed headings to add `DOCUMENTS_SECTION` self-edges with slugged anchors and optional content summaries.
7. **Freshness updates** – `applyFreshnessUpdates` marks all touched documentation edges as up-to-date (`documentationQuality = "complete"`, `lastValidated = lastIndexed`) and calls `markDocumentationAsStale` to downgrade untouched relationships to `outdated` based on the freshness window.
8. **Cluster refresh placeholder** – `refreshClusters` currently returns `0`, acting as a hook for future batch recomputation.
9. **Spec linking pass** – After the parser finishes, the `/docs/sync` route cross-references exported symbols (`KnowledgeGraphService.findEntitiesByType('symbol')`) against content for design/API/architecture docs and emits/prunes `IMPLEMENTS_SPEC` edges using the noise-configured thresholds.

## 5. Operational Considerations
- **Error handling**: Per-file parsing failures are collected in the sync result without aborting the overall run. Section-link failures log warnings but continue.
- **Relationship activity flags**: Documentation edges are created/updated with `active = true`. Freshness routines also reactivate edges when touched.
- **Manual documentation**: By design, `markDocumentationAsStale` skips documents whose `docSource` equals `manual`, preserving manual annotations from automated downgrades.
- **Extensibility**: The normalization layer already supports policy tagging, similarity scoring, and embedding versioning, so new producers should prefer emitting those fields rather than building parallel normalization.

## 6. Data Contracts
- **ParsedDocument (`DocumentationParser`)**:
  * Core fields: `title`, `content`, `businessDomains`, `stakeholders`, `technologies`, `docType`, `docIntent`, `docVersion`, `docHash`, `docSource`, `docLocale`, `lastIndexed`.
  * Metadata additives: headings list (`level`, `text`), extracted links (inline, reference, autolinks), code block descriptors (`lang`, `code`), RST sections, file telemetry (`filePath`, `fileSize`, `lastModified`, `checksum`), inferred locale/intent copies, and optional taxonomy hints.
  * Locale inference: matches `.<locale>.(md|txt|rst|adoc)` or reuses `metadata.language`; unspecified files fall back to `en`.
  * Checksum: simple 32-bit rolling hash reused for both `docVersion` and `docHash`, providing deterministic doc IDs for unchanged content.
- **SyncResult (`DocumentationParser.syncDocumentation`)**:
  * Aggregates `processedFiles`, `newDomains`, `updatedClusters`, `sectionsLinked`, and `errors` (per-file error strings).
  * Appends freshness metrics from `applyFreshnessUpdates` as `refreshedRelationships` and `staleRelationships`.
  * The `/docs/sync` route augments the response with `createdImplementsSpec` and `prunedImplementsSpec` counts from the symbol-linking pass.
- **SearchResult (`DocumentationParser.searchDocumentation`)**:
  * Each entry includes the `DocumentationNode`, a numeric `relevanceScore`, and up to five `matchedSections` capturing surrounding lines where the query text appears.

## 7. API Behaviour Notes
- **`POST /docs/sync`**: Requires `docsPath`. Returns the sync summary described above. Follows with symbol linking that filters exported symbols by doc type, uses word-boundary regex matching, boosts heading mentions, and prunes stale `IMPLEMENTS_SPEC` edges.
- **`GET /docs/:id`**: Fetches raw graph node data; responds `404` when absent.
- **`GET /docs/domains` & `GET /docs/domains/:domainName/entities`**: Use structural search to retrieve `businessDomain` or domain-matching documentation nodes, filtering by substring matches within `businessDomains`.
- **`GET /docs/clusters`**: Mirrors the domain endpoint but targets `semanticCluster` entities.
- **`GET /docs/business/impact/:domainName`**: Produces derived metrics (change velocity, risk level, mitigation suggestions) from domain-matched documentation; the metrics are heuristic and recomputed per request.
- **`POST /docs/parse`**: Parses ad-hoc content (markdown default) and echoes core metadata, optionally emitting entities/domains when flags are enabled. Metadata always includes format, content length, and `parsedAt` timestamp.
- **`GET /docs/search`**: Delegates to `DocumentationParser.searchDocumentation`, allowing optional `domain`, `type`, and `limit` filters. Scoring boosts title, domain, and technology matches above raw content occurrences.
- **`POST /docs/validate`**: Parses each requested file, runs lightweight checks (title presence, length heuristics, optional link/format checks), and returns per-file status with issue lists plus a summary block (counts and pass rate).

This blueprint now reflects the shipped behaviour and should be kept in sync with `DocumentationParser`, `KnowledgeGraphService`, and the `/docs` route implementations whenever relationship semantics evolve.
