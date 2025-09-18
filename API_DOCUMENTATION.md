# API Documentation

## Impact Analysis

### POST `/api/impact/analyze`
Performs cascading impact analysis for one or more code or spec entities. The endpoint wraps the knowledge graph helpers so REST, MCP, and tRPC clients receive the same payload structure.

**Request Body**

```json
{
  "changes": [
    {
      "entityId": "symbol:src/services/KnowledgeGraphService.ts#calculateImpact",
      "changeType": "modify",
      "signatureChange": true
    }
  ],
  "includeIndirect": true,
  "maxDepth": 4
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `changes[]` | array | ✅ | Each change describes the impacted entity and change metadata. |
| `changes[].entityId` | string | ✅ | Graph entity identifier (file, symbol, spec, etc.). |
| `changes[].changeType` | enum (`modify`, `delete`, `rename`) | ✅ | High-level change classification. |
| `changes[].signatureChange` | boolean | ❌ | Flag significant interface shifts for severity scoring. |
| `includeIndirect` | boolean | ❌ | When `false`, skips transitive traversal. Defaults to `true`. |
| `maxDepth` | number | ❌ | Traversal depth (1-8). Defaults to `3`. |

**Response Body**

```json
{
  "success": true,
  "data": {
    "directImpact": [
      {
        "entities": [
          {
            "id": "symbol:src/routes/impact.ts#registerImpactRoutes",
            "type": "symbol",
            "name": "registerImpactRoutes",
            "path": "src/routes/impact.ts"
          }
        ],
        "severity": "high",
        "reason": "1 entity depends on calculateImpact"
      }
    ],
    "cascadingImpact": [
      {
        "level": 2,
        "relationship": "CALLS",
        "confidence": 0.7,
        "entities": [
          {
            "id": "symbol:src/workflows/impact.ts#transitiveConsumer",
            "type": "symbol",
            "name": "transitiveConsumer"
          }
        ]
      }
    ],
    "testImpact": {
      "affectedTests": [
        {
          "id": "test:tests/unit/api/routes/impact.test.ts#validatesAnalysis",
          "type": "test",
          "path": "tests/unit/api/routes/impact.test.ts"
        }
      ],
      "requiredUpdates": [
        "Update test tests/unit/api/routes/impact.test.ts#validatesAnalysis to reflect calculateImpact"
      ],
      "coverageImpact": 85
    },
    "documentationImpact": {
      "staleDocs": [
        {
          "docId": "doc:Docs/MementoAPIDesign.md",
          "title": "Memento API Design",
          "status": "deprecated",
          "relationship": "DOCUMENTED_BY",
          "stalenessScore": 0.8
        }
      ],
      "missingDocs": [],
      "requiredUpdates": [
        "Refresh documentation Memento API Design to reflect calculateImpact"
      ],
      "freshnessPenalty": 1.8
    },
    "specImpact": {
      "relatedSpecs": [
        {
          "specId": "spec:critical-impact",
          "spec": {
            "id": "spec:critical-impact",
            "title": "Critical Impact Workflow",
            "priority": "critical",
            "status": "approved",
            "assignee": "team-alpha",
            "tags": [
              "impact"
            ]
          },
          "priority": "critical",
          "impactLevel": "high",
          "status": "approved",
          "ownerTeams": [
            "team-alpha"
          ],
          "acceptanceCriteriaIds": [
            "AC-1"
          ],
          "relationships": [
            {
              "type": "REQUIRES",
              "impactLevel": "high",
              "priority": "critical",
              "acceptanceCriteriaIds": [
                "AC-1"
              ],
              "ownerTeam": "team-alpha",
              "confidence": 0.92,
              "status": "approved"
            }
          ]
        }
      ],
      "requiredUpdates": [
        "Resolve the linked critical specification before merging."
      ],
      "summary": {
        "byPriority": {
          "critical": 1,
          "high": 0,
          "medium": 0,
          "low": 0
        },
        "byImpactLevel": {
          "critical": 0,
          "high": 1,
          "medium": 0,
          "low": 0
        },
        "statuses": {
          "draft": 0,
          "approved": 1,
          "implemented": 0,
          "deprecated": 0,
          "unknown": 0
        },
        "acceptanceCriteriaReferences": 1,
        "pendingSpecs": 1
      }
    },
    "deploymentGate": {
      "blocked": false,
      "level": "advisory",
      "reasons": [
        "1 documentation artefact marked stale"
      ],
      "stats": {
        "missingDocs": 0,
        "staleDocs": 1,
        "freshnessPenalty": 1.8
      }
    },
    "recommendations": [
      {
        "priority": "immediate",
        "description": "Resolve the high-risk dependency before merging.",
        "effort": "high",
        "impact": "breaking",
        "type": "warning",
        "actions": [
          "src/routes/impact.ts"
        ]
      },
      {
        "priority": "planned",
        "description": "Review cascading impacts up to level 2 to prevent regressions.",
        "effort": "medium",
        "impact": "functional",
        "type": "requirement",
        "actions": [
          "transitiveConsumer"
        ]
      }
    ]
  }
}
```

**Behaviour Notes**
- Direct impacts aggregate immediate dependents and upstream dependencies when the change is breaking (`delete` or `signatureChange`).
- Cascading impact levels attenuate confidence (0.9 → 0.3) as traversal depth increases.
- Tests include coverage scoring derived from edge metadata and stored test coverage metrics.
- Documentation penalties contribute to the deployment gate status; missing docs automatically elevate the gate to `required`.
- Specification metadata is hoisted into `specImpact.summary`; critical or high-priority specs escalate risk scores and drive targeted recommendations/required updates.
- Recommendations summarise urgent follow-up actions, using the same prioritisation surfaced through the MCP interface.

### GET `/api/impact/changes`
Returns a time-bounded summary of recently modified entities with graph-backed metrics. By default the window covers the last 24 hours and up to 10 entities.

**Query Parameters**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `since` | ISO date-time | ❌ | Defaults to 24 hours ago when ommitted. |
| `limit` | number | ❌ | Number of entities to analyse (1–25, default 10). |
| `includeIndirect` | boolean | ❌ | Toggle cascading traversal (default `true`). |
| `maxDepth` | number | ❌ | Traversal depth bound (1–8). |

**Response Body**

```json
{
  "success": true,
  "data": {
    "since": "2024-06-04T09:12:00.000Z",
    "limit": 10,
    "analyzedEntities": 2,
    "riskSummary": {
      "critical": 0,
      "high": 1,
      "medium": 0,
      "low": 1
    },
    "aggregateMetrics": {
      "directDependents": 1,
      "cascadingDependents": 1,
      "impactedTests": 1,
      "missingDocs": 0,
      "staleDocs": 1,
      "coverageImpact": 45
    },
    "records": [
      {
        "entity": {
          "id": "symbol:src/services/ImpactService.ts#compute",
          "type": "symbol",
          "name": "compute",
          "path": "src/services/ImpactService.ts"
        },
        "changeType": "modify",
        "analysis": { "directImpact": [], "cascadingImpact": [], "testImpact": { "affectedTests": [], "requiredUpdates": [], "coverageImpact": 0 }, "documentationImpact": { "staleDocs": [], "missingDocs": [], "requiredUpdates": [], "freshnessPenalty": 0 }, "deploymentGate": { "blocked": false, "level": "none", "reasons": [], "stats": { "missingDocs": 0, "staleDocs": 0, "freshnessPenalty": 0 } }, "recommendations": [] },
        "metrics": {
          "directDependents": 1,
          "cascadingDependents": 1,
          "highestCascadeLevel": 2,
          "impactedTests": 1,
          "coverageImpact": 45,
          "missingDocs": 0,
          "staleDocs": 1,
          "deploymentGate": {
            "blocked": false,
            "level": "advisory",
            "reasons": ["1 stale documentation artefact"],
            "stats": { "missingDocs": 0, "staleDocs": 1, "freshnessPenalty": 2 }
          }
        },
        "riskLevel": "high",
        "recommendations": [
          {
            "priority": "immediate",
            "description": "Resolve the high-risk dependency before merging.",
            "effort": "high",
            "impact": "breaking",
            "type": "warning",
            "actions": ["src/services/ImpactService.ts"]
          }
        ]
      }
    ]
  }
}
```

### GET `/api/impact/entity/{entityId}`
Calculates the impact surface for a single entity, returning full graph analysis, derived metrics, and deployment gating signals.

**Query Parameters**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `changeType` | enum (`modify`, `delete`, `rename`) | ❌ | Defaults to `modify`. |
| `includeIndirect` | boolean | ❌ | Controls cascading traversal (default `true`). |
| `maxDepth` | number | ❌ | Cascading traversal depth (1–8). |
| `signatureChange` | boolean | ❌ | Flag interface/signature changes to elevate severity scoring. |

**Response Body**

```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "symbol:src/services/ImpactService.ts#compute",
      "type": "symbol",
      "name": "compute",
      "path": "src/services/ImpactService.ts"
    },
    "change": {
      "changeType": "modify",
      "signatureChange": true
    },
    "analysis": { "directImpact": [], "cascadingImpact": [], "testImpact": { "affectedTests": [], "requiredUpdates": [], "coverageImpact": 0 }, "documentationImpact": { "staleDocs": [], "missingDocs": [], "requiredUpdates": [], "freshnessPenalty": 0 }, "deploymentGate": { "blocked": false, "level": "none", "reasons": [], "stats": { "missingDocs": 0, "staleDocs": 0, "freshnessPenalty": 0 } }, "recommendations": [] },
    "metrics": {
      "directDependents": 1,
      "cascadingDependents": 1,
      "highestCascadeLevel": 2,
      "impactedTests": 1,
      "coverageImpact": 45,
      "missingDocs": 0,
      "staleDocs": 1,
      "deploymentGate": {
        "blocked": false,
        "level": "advisory",
        "reasons": ["1 stale documentation artefact"],
        "stats": { "missingDocs": 0, "staleDocs": 1, "freshnessPenalty": 2 }
      }
    },
    "riskLevel": "high",
    "deploymentGate": {
      "blocked": false,
      "level": "advisory",
      "reasons": ["1 stale documentation artefact"],
      "stats": { "missingDocs": 0, "staleDocs": 1, "freshnessPenalty": 2 }
    },
    "recommendations": [
      {
        "priority": "immediate",
        "description": "Resolve the high-risk dependency before merging.",
        "effort": "high",
        "impact": "breaking",
        "type": "warning",
        "actions": ["src/services/ImpactService.ts"]
      }
    ]
  }
}
```

## Test Management

### POST `/api/tests/plan-and-generate`
Generates graph-aware unit, integration, end-to-end, and performance test plans for a specification. The response aligns with the MCP `tests.plan_and_generate` tool.

**Request Body**

```json
{
  "specId": "spec-checkout",
  "testTypes": ["unit", "integration"],
  "includePerformanceTests": true,
  "includeSecurityTests": true
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `specId` | string | ✅ | Specification entity identifier in the knowledge graph. |
| `testTypes[]` | array of enum (`unit`, `integration`, `e2e`) | ❌ | Restricts generated tests to the selected types. Absent means all. |
| `coverage.minLines` | number | ❌ | Target minimum line coverage percentage. |
| `coverage.minBranches` | number | ❌ | Target minimum branch coverage percentage. |
| `coverage.minFunctions` | number | ❌ | Target minimum function coverage percentage. |
| `includePerformanceTests` | boolean | ❌ | When `true`, adds a performance guardrail test. High/critical specs auto-enable when omitted. |
| `includeSecurityTests` | boolean | ❌ | Adds a security-focused integration test. |

**Response Body**

```json
{
  "success": true,
  "data": {
    "testPlan": {
      "unitTests": [
        {
          "name": "[AC-1] Unit chargeCustomer happy path",
          "description": "Validate acceptance criterion AC-1 for Checkout Workflow.",
          "type": "unit",
          "targetFunction": "chargeCustomer",
          "assertions": [
            "Implements acceptance criterion AC-1: Order succeeds with valid payment",
            "Covers chargeCustomer core behaviour and edge conditions",
            "Establishes regression harness for new functionality"
          ],
          "dataRequirements": [
            "Include dataset covering valid payment tokens.",
            "Provide negative cases capturing rejection paths."
          ]
        }
      ],
      "integrationTests": [
        {
          "name": "[AC-1] Integration chargeCustomer ↔ ledger",
          "description": "Exercise system collaboration for Checkout Workflow. Cover integration between chargeCustomer, ledger writer, payments API.",
          "type": "integration",
          "targetFunction": "chargeCustomer & ledger",
          "assertions": [
            "Coordinates chargeCustomer, ledger writer, payments API end-to-end",
            "Verifies cross-cutting requirements for AC-1: Order succeeds with valid payment",
            "Document integration contract assumptions and fixtures"
          ],
          "dataRequirements": [
            "Provision upstream and downstream fixtures mirroring production.",
            "Include dataset covering declined card responses."
          ]
        },
        {
          "name": "Checkout Workflow security posture",
          "description": "Validate authentication, authorization, and data handling rules tied to Checkout Workflow.",
          "type": "integration",
          "targetFunction": "Checkout Workflow",
          "assertions": [
            "Rejects requests lacking required claims or tokens",
            "Enforces least privilege access for privileged operations",
            "Scrubs sensitive fields from logs and downstream payloads"
          ],
          "dataRequirements": [
            "Generate signed and tampered tokens",
            "Include role combinations from spec metadata",
            "Verify encryption-in-transit and at-rest paths"
          ]
        }
      ],
      "e2eTests": [
        {
          "name": "Checkout Workflow happy path flow",
          "description": "Exercise the primary workflow covering 2 acceptance criteria for Checkout Workflow.",
          "type": "e2e",
          "targetFunction": "Checkout Workflow",
          "assertions": [
            "Satisfies AC-1: Order succeeds with valid payment",
            "Satisfies AC-2: Order fails with declined card"
          ],
          "dataRequirements": [
            "Mirror production-like happy path data and environment.",
            "Enumerate rollback or recovery steps for failed stages."
          ]
        }
      ],
      "performanceTests": [
        {
          "name": "Checkout Workflow performance guardrail",
          "description": "Protect high priority specification against latency regressions by validating hot paths under load.",
          "type": "performance",
          "targetFunction": "chargeCustomer",
          "assertions": [
            "Throughput remains within baseline for chargeCustomer",
            "P95 latency does not regress beyond 10% of current benchmark",
            "Resource utilization stays below allocated service limits"
          ],
          "dataRequirements": [
            "Replay representative production workload",
            "Include peak load burst scenarios",
            "Capture CPU, memory, and downstream dependency timings"
          ]
        }
      ]
    },
    "estimatedCoverage": {
      "lines": 78,
      "branches": 70,
      "functions": 74,
      "statements": 77
    },
    "changedFiles": [
      "src/services/payments.ts",
      "tests/integration/checkout.test.ts"
    ]
  }
}
```

### POST `/api/impact/simulate`
Runs multi-scenario comparisons to identify the riskiest change set before landing. Each scenario reuses the graph analysis output and exposes derived metrics.

**Request Body**

```json
{
  "scenarios": [
    {
      "name": "High risk change",
      "changes": [
        { "entityId": "symbol:src/core/auth.ts#login", "changeType": "modify", "signatureChange": true }
      ],
      "maxDepth": 6
    },
    {
      "name": "Low risk rename",
      "changes": [
        { "entityId": "symbol:src/utils/time.ts#formatDate", "changeType": "rename" }
      ],
      "includeIndirect": false
    }
  ]
}
```

**Response Body**

```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "name": "High risk change",
        "request": {
          "includeIndirect": true,
          "maxDepth": 6
        },
        "analysis": { "directImpact": [], "cascadingImpact": [], "testImpact": { "affectedTests": [], "requiredUpdates": [], "coverageImpact": 0 }, "documentationImpact": { "staleDocs": [], "missingDocs": [], "requiredUpdates": [], "freshnessPenalty": 0 }, "deploymentGate": { "blocked": false, "level": "none", "reasons": [], "stats": { "missingDocs": 0, "staleDocs": 0, "freshnessPenalty": 0 } }, "recommendations": [] },
        "metrics": {
          "directDependents": 1,
          "cascadingDependents": 1,
          "highestCascadeLevel": 2,
          "impactedTests": 1,
          "coverageImpact": 45,
          "missingDocs": 0,
          "staleDocs": 1,
          "deploymentGate": {
            "blocked": false,
            "level": "advisory",
            "reasons": ["1 stale documentation artefact"],
            "stats": { "missingDocs": 0, "staleDocs": 1, "freshnessPenalty": 2 }
          }
        },
        "riskLevel": "high",
        "recommendations": []
      },
      {
        "name": "Low risk rename",
        "request": {
          "includeIndirect": false
        },
        "analysis": { "directImpact": [], "cascadingImpact": [], "testImpact": { "affectedTests": [], "requiredUpdates": [], "coverageImpact": 0 }, "documentationImpact": { "staleDocs": [], "missingDocs": [], "requiredUpdates": [], "freshnessPenalty": 0 }, "deploymentGate": { "blocked": false, "level": "none", "reasons": [], "stats": { "missingDocs": 0, "staleDocs": 0, "freshnessPenalty": 0 } }, "recommendations": [] },
        "metrics": {
          "directDependents": 1,
          "cascadingDependents": 0,
          "highestCascadeLevel": 0,
          "impactedTests": 0,
          "coverageImpact": 0,
          "missingDocs": 0,
          "staleDocs": 0,
          "deploymentGate": {
            "blocked": false,
            "level": "none",
            "reasons": [],
            "stats": { "missingDocs": 0, "staleDocs": 0, "freshnessPenalty": 0 }
          }
        },
        "riskLevel": "low",
        "recommendations": []
      }
    ],
    "summary": {
      "highestRiskScenario": {
        "name": "High risk change",
        "riskLevel": "high"
      },
      "riskDistribution": {
        "critical": 0,
        "high": 1,
        "medium": 0,
        "low": 1
      }
    }
  }
}
```

### GET `/api/impact/history/{entityId}`
Retrieves persisted impact analyses for an entity. Entries originate from previous `/impact/analyze` invocations persisted in PostgreSQL.

**Query Parameters**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `since` | ISO date-time | ❌ | Only return records captured after the timestamp. |
| `limit` | number | ❌ | Maximum records to return (1–100, default 20). |

**Response Body**

```json
{
  "success": true,
  "data": {
    "entityId": "symbol:src/services/ImpactService.ts#compute",
    "totalRecords": 1,
    "records": [
      {
        "id": "c3b7f0f2-5f1f-4bf7-8bc6-2b5fa7e2ad5f",
        "timestamp": "2024-06-04T09:12:00.000Z",
        "changeType": "modify",
        "directImpactCount": 1,
        "cascadingImpactCount": 1,
        "analysis": { "directImpact": [], "cascadingImpact": [], "testImpact": { "affectedTests": [], "requiredUpdates": [], "coverageImpact": 0 }, "documentationImpact": { "staleDocs": [], "missingDocs": [], "requiredUpdates": [], "freshnessPenalty": 0 }, "deploymentGate": { "blocked": false, "level": "none", "reasons": [], "stats": { "missingDocs": 0, "staleDocs": 0, "freshnessPenalty": 0 } }, "recommendations": [] },
        "metrics": {
          "directDependents": 1,
          "cascadingDependents": 1,
          "highestCascadeLevel": 2,
          "impactedTests": 1,
          "coverageImpact": 45,
          "missingDocs": 0,
          "staleDocs": 1,
          "deploymentGate": {
            "blocked": false,
            "level": "advisory",
            "reasons": ["1 stale documentation artefact"],
            "stats": { "missingDocs": 0, "staleDocs": 1, "freshnessPenalty": 2 }
          }
        },
        "riskLevel": "high",
        "metadata": {
          "entityId": "symbol:src/services/ImpactService.ts#compute",
          "changeType": "modify",
          "timestamp": "2024-06-04T09:12:00.000Z",
          "directImpactCount": 1,
          "cascadingImpactCount": 1
        }
      }
    ]
  }
}
```
