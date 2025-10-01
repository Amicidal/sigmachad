import { KnowledgeGraphService } from "@memento/knowledge";
import { RelationshipType } from "@memento/core";
import type { GraphRelationship } from "@memento/shared-types";
import type {
  TestPlanRequest,
  TestPlanResponse,
  TestSpec,
} from "@memento/shared-types";
import type {
  CoverageMetrics,
  Entity,
  Spec,
  Test,
} from "@memento/shared-types";

export class SpecNotFoundError extends Error {
  public readonly code = "SPEC_NOT_FOUND";

  constructor(specId: string) {
    super(`Specification ${specId} was not found`);
    this.name = "SpecNotFoundError";
  }
}

export class TestPlanningValidationError extends Error {
  public readonly code = "INVALID_TEST_PLAN_REQUEST";

  constructor(message: string) {
    super(message);
    this.name = "TestPlanningValidationError";
  }
}

type SupportedTestType = "unit" | "integration" | "e2e" | "performance";

type CriterionContext = {
  id: string;
  label: string;
  index: number;
  text: string;
  tokens: string[];
  relatedEntities: RelatedEntityContext[];
  existingTests: ExistingTestContext[];
};

type RelatedEntityContext = {
  entityId: string;
  label: string;
  type?: string;
  path?: string;
  signature?: string;
  relationshipType: RelationshipType;
  priority?: string;
  impactLevel?: string;
  rationale?: string;
};

type ExistingTestContext = {
  id: string;
  label: string;
  path?: string;
  testType: "unit" | "integration" | "e2e";
  coverage?: CoverageMetrics;
  flakyScore?: number;
  targetSymbol?: string;
};

interface PlanningInputs {
  spec: Spec;
  criteria: CriterionContext[];
  requestedTypes: Set<SupportedTestType>;
  includePerformance: boolean;
  includeSecurity: boolean;
}

export class TestPlanningService {
  constructor(private readonly kgService: KnowledgeGraphService) {}

  async planTests(params: TestPlanRequest): Promise<TestPlanResponse> {
    const spec = await this.fetchSpec(params.specId);

    const requestedTypes = this.resolveRequestedTypes(params);
    const includePerformance = this.shouldIncludePerformance(params, spec);
    const includeSecurity = params.includeSecurityTests === true;

    const criteria = this.buildCriterionContexts(spec);
    await this.attachSpecRelationships(spec.id, criteria);
    await this.attachExistingTests(spec.id, criteria);

    const plan = this.buildPlan({
      spec,
      criteria,
      requestedTypes,
      includePerformance,
      includeSecurity,
    });

    const estimatedCoverage = this.estimateCoverage(
      criteria,
      plan,
      params.coverage
    );

    const changedFiles = this.collectChangedFiles(criteria);

    return {
      testPlan: plan,
      estimatedCoverage,
      changedFiles,
    };
  }

  private async fetchSpec(specId: string): Promise<Spec> {
    if (!specId || typeof specId !== "string") {
      throw new TestPlanningValidationError(
        "Specification ID is required for test planning"
      );
    }

    const entity = await this.kgService.getEntity(specId);

    if (!entity || entity.type !== "spec") {
      throw new SpecNotFoundError(specId);
    }

    return entity as Spec;
  }

  private resolveRequestedTypes(params: TestPlanRequest): Set<SupportedTestType> {
    const base = ["unit", "integration", "e2e"] as const;
    type BaseTestType = typeof base[number];

    if (params.testTypes && params.testTypes.length > 0) {
      const filtered = params.testTypes
        .map((type) => (base.includes(type as BaseTestType) ? (type as BaseTestType) : undefined))
        .filter((value): value is BaseTestType => Boolean(value));
      return new Set(filtered.length > 0 ? (filtered as SupportedTestType[]) : (base as unknown as SupportedTestType[]));
    }

    return new Set(base as unknown as SupportedTestType[]);
  }

  private shouldIncludePerformance(
    params: TestPlanRequest,
    spec: Spec
  ): boolean {
    if (params.includePerformanceTests) {
      return true;
    }

    return spec.priority === "critical" || spec.priority === "high";
  }

  private buildCriterionContexts(spec: Spec): CriterionContext[] {
    const contexts: CriterionContext[] = [];
    const usedIds = new Set<string>();

    const criteria = Array.isArray(spec.acceptanceCriteria)
      ? spec.acceptanceCriteria
      : [];

    criteria.forEach((text, index) => {
      const id = this.extractCriterionId(text, index, usedIds);
      const label = id || `AC-${index + 1}`;
      const tokens = this.tokenize(text);

      contexts.push({
        id,
        label,
        index,
        text,
        tokens,
        relatedEntities: [],
        existingTests: [],
      });
    });

    if (contexts.length === 0) {
      contexts.push({
        id: "AC-1",
        label: "AC-1",
        index: 0,
        text: spec.description || spec.title,
        tokens: this.tokenize(spec.description || spec.title),
        relatedEntities: [],
        existingTests: [],
      });
    }

    return contexts;
  }

  private async attachSpecRelationships(
    specId: string,
    criteria: CriterionContext[]
  ): Promise<void> {
    let relationships: GraphRelationship[] = [];
    try {
      relationships = await this.kgService.getRelationships({
        fromEntityId: specId,
        type: [
          RelationshipType.REQUIRES,
          RelationshipType.IMPACTS,
          RelationshipType.IMPLEMENTS_SPEC,
        ],
        limit: 500,
      });
    } catch (error) {
      console.warn("Failed to load spec relationships for planning", error);
      relationships = [];
    }

    if (!relationships || relationships.length === 0) {
      return;
    }

    const targetIds = Array.from(
      new Set(relationships.map((rel) => rel.toEntityId).filter(Boolean))
    );

    const entities = await this.fetchEntities(targetIds);

    relationships.forEach((rel) => {
      if (!rel?.toEntityId) {
        return;
      }

      const entity = entities.get(rel.toEntityId) ?? null;
      const summary = this.summarizeEntity(entity, rel.toEntityId);

      const acceptanceIds = this.extractAcceptanceIds(rel.metadata);
      const criterion = this.resolveCriterionContext(
        criteria,
        acceptanceIds,
        summary.label,
        summary.path,
        rel.metadata?.rationale
      );

      criterion.relatedEntities.push({
        entityId: summary.id,
        label: summary.label,
        type: summary.type,
        path: summary.path,
        signature: summary.signature,
        relationshipType: rel.type,
        priority:
          typeof rel.metadata?.priority === "string"
            ? rel.metadata?.priority
            : undefined,
        impactLevel:
          typeof rel.metadata?.impactLevel === "string"
            ? rel.metadata?.impactLevel
            : undefined,
        rationale:
          typeof rel.metadata?.rationale === "string"
            ? rel.metadata?.rationale
            : undefined,
      });
    });
  }

  private async attachExistingTests(
    specId: string,
    criteria: CriterionContext[]
  ): Promise<void> {
    let relationships: GraphRelationship[] = [];
    try {
      relationships = await this.kgService.getRelationships({
        toEntityId: specId,
        type: RelationshipType.VALIDATES,
        limit: 200,
      });
    } catch (error) {
      console.warn("Failed to load validating tests for spec", error);
      relationships = [];
    }

    if (!relationships || relationships.length === 0) {
      return;
    }

    const testIds = Array.from(
      new Set(relationships.map((rel) => rel.fromEntityId).filter(Boolean))
    );

    const tests = await this.fetchEntities(testIds);

    relationships.forEach((rel) => {
      if (!rel?.fromEntityId) {
        return;
      }

      const entity = tests.get(rel.fromEntityId);
      if (!entity || entity.type !== "test") {
        return;
      }

      const testEntity = entity as Test;
      const label = this.buildTestLabel(testEntity);
      const acceptanceIds = this.extractAcceptanceIds(rel.metadata);

      const criterion = this.resolveCriterionContext(
        criteria,
        acceptanceIds,
        label,
        testEntity.path,
        testEntity.metadata?.rationale
      );

      criterion.existingTests.push({
        id: testEntity.id,
        label,
        path: testEntity.path,
        testType: testEntity.testType,
        coverage: testEntity.coverage,
        flakyScore: testEntity.flakyScore,
        targetSymbol: testEntity.targetSymbol,
      });
    });
  }

  private buildPlan(inputs: PlanningInputs): TestPlanResponse["testPlan"] {
    const unitTests = inputs.requestedTypes.has("unit")
      ? this.buildUnitTests(inputs)
      : [];
    const integrationTests = inputs.requestedTypes.has("integration")
      ? this.buildIntegrationTests(inputs)
      : [];
    const e2eTests = inputs.requestedTypes.has("e2e")
      ? this.buildEndToEndTests(inputs)
      : [];
    const performanceTests = inputs.includePerformance
      ? this.buildPerformanceTests(inputs)
      : [];

    return {
      unitTests,
      integrationTests,
      e2eTests,
      performanceTests,
    };
  }

  private buildUnitTests(inputs: PlanningInputs): TestSpec[] {
    const specs: TestSpec[] = [];

    for (const criterion of inputs.criteria) {
      const existing = criterion.existingTests.filter(
        (test) => test.testType === "unit"
      );

      const primaryTarget = this.pickPrimaryTarget(criterion);
      const assertions = this.buildUnitAssertions(criterion, primaryTarget, existing);

      specs.push({
        name: `[${criterion.label}] Unit ${this.truncate(criterion.text, 40)}`,
        description: this.buildUnitDescription(
          inputs.spec,
          criterion,
          primaryTarget,
          existing
        ),
        type: "unit",
        targetFunction: primaryTarget?.signature || primaryTarget?.label,
        assertions,
        dataRequirements: this.buildDataRequirements(criterion.text, "unit"),
      });
    }

    return specs;
  }

  private buildIntegrationTests(inputs: PlanningInputs): TestSpec[] {
    const specs: TestSpec[] = [];

    for (const criterion of inputs.criteria) {
      const related = criterion.relatedEntities;
      const existing = criterion.existingTests.filter(
        (test) => test.testType === "integration"
      );

      const involved = related
        .map((entity) => entity.label)
        .filter(Boolean)
        .slice(0, 3);

      const assertions = this.buildIntegrationAssertions(
        criterion,
        related,
        existing
      );

      specs.push({
        name: `[${criterion.label}] Integration ${this.truncate(
          involved.join(" ↔ ") || criterion.text,
          60
        )}`,
        description: this.buildIntegrationDescription(
          inputs.spec,
          criterion,
          involved,
          existing
        ),
        type: "integration",
        targetFunction: involved.join(" & ") || inputs.spec.title,
        assertions,
        dataRequirements: this.buildDataRequirements(
          criterion.text,
          "integration"
        ),
      });
    }

    if (inputs.includeSecurity) {
      specs.push(this.buildSecurityIntegration(inputs));
    }

    return specs;
  }

  private buildEndToEndTests(inputs: PlanningInputs): TestSpec[] {
    const specs: TestSpec[] = [];

    const happyPathAssertions = inputs.criteria.map((criterion) =>
      `Satisfies ${criterion.label}: ${criterion.text.trim()}`
    );

    specs.push({
      name: `${inputs.spec.title} happy path flow`,
      description: `Exercise the primary workflow covering ${inputs.criteria.length} acceptance criteria for ${inputs.spec.title}.`,
      type: "e2e",
      targetFunction: inputs.spec.title,
      assertions: happyPathAssertions,
      dataRequirements: this.deriveScenarioDataRequirements(inputs.criteria),
    });

    const negativeCriteria = inputs.criteria.filter((criterion) =>
      /invalid|error|denied|unauthorized|failure/i.test(criterion.text)
    );

    if (negativeCriteria.length > 0) {
      specs.push({
        name: `${inputs.spec.title} resilience flow`,
        description: `Probe failure and rejection paths described in ${negativeCriteria.length} acceptance criteria to harden ${inputs.spec.title}.`,
        type: "e2e",
        targetFunction: inputs.spec.title,
        assertions: negativeCriteria.map((criterion) =>
          `Handles rejection case for ${criterion.label}: ${criterion.text.trim()}`
        ),
        dataRequirements: [
          "Capture error telemetry and audit events",
          "Simulate network and downstream service unavailability",
        ],
      });
    }

    return specs;
  }

  private buildPerformanceTests(inputs: PlanningInputs): TestSpec[] {
    const primaryTarget = this.pickGlobalTarget(inputs.criteria);
    const assertions: string[] = [
      `Throughput remains within baseline for ${primaryTarget?.label || inputs.spec.title}`,
      "P95 latency does not regress beyond 10% of current benchmark",
      "Resource utilization stays below allocated service limits",
    ];

    const dataRequirements = [
      "Replay representative production workload",
      "Include peak load burst scenarios",
      "Capture CPU, memory, and downstream dependency timings",
    ];

    return [
      {
        name: `${inputs.spec.title} performance guardrail`,
        description: `Protect ${inputs.spec.priority} priority specification against latency regressions by validating hot paths under load.`,
        type: "performance",
        targetFunction: primaryTarget?.label || inputs.spec.title,
        assertions,
        dataRequirements,
      },
    ];
  }

  private buildSecurityIntegration(inputs: PlanningInputs): TestSpec {
    return {
      name: `${inputs.spec.title} security posture`,
      description: `Validate authentication, authorization, and data handling rules tied to ${inputs.spec.title}.`,
      type: "integration",
      targetFunction: inputs.spec.title,
      assertions: [
        "Rejects requests lacking required claims or tokens",
        "Enforces least privilege access for privileged operations",
        "Scrubs sensitive fields from logs and downstream payloads",
      ],
      dataRequirements: [
        "Generate signed and tampered tokens",
        "Include role combinations from spec metadata",
        "Verify encryption-in-transit and at-rest paths",
      ],
    };
  }

  private buildUnitAssertions(
    criterion: CriterionContext,
    target: RelatedEntityContext | null,
    existing: ExistingTestContext[]
  ): string[] {
    const assertions: string[] = [];
    assertions.push(
      `Implements acceptance criterion ${criterion.label}: ${criterion.text.trim()}`
    );

    if (target?.label) {
      assertions.push(
        `Covers ${target.label} core behaviour and edge conditions`
      );
    }

    if (/invalid|error|reject|fail/i.test(criterion.text)) {
      assertions.push("Asserts error or rejection paths for invalid inputs");
    }

    if (existing.length > 0) {
      assertions.push(
        `Reference existing unit coverage: ${existing
          .map((test) => test.label)
          .join(", ")}`
      );
    } else {
      assertions.push("Establishes regression harness for new functionality");
    }

    return assertions;
  }

  private buildIntegrationAssertions(
    criterion: CriterionContext,
    related: RelatedEntityContext[],
    existing: ExistingTestContext[]
  ): string[] {
    const assertions: string[] = [];

    if (related.length > 1) {
      assertions.push(
        `Coordinates ${related
          .slice(0, 3)
          .map((entity) => entity.label)
          .join(", ")} end-to-end`
      );
    } else if (related.length === 1) {
      assertions.push(`Integrates ${related[0].label} with dependent services`);
    } else {
      assertions.push("Traverses primary integration path defined by the spec");
    }

    assertions.push(
      `Verifies cross-cutting requirements for ${criterion.label}: ${criterion.text.trim()}`
    );

    if (existing.length > 0) {
      assertions.push(
        `Review existing integration suites: ${existing
          .map((test) => test.label)
          .join(", ")}`
      );
    } else {
      assertions.push("Document integration contract assumptions and fixtures");
    }

    return assertions;
  }

  private buildUnitDescription(
    spec: Spec,
    criterion: CriterionContext,
    target: RelatedEntityContext | null,
    existing: ExistingTestContext[]
  ): string {
    const fragments: string[] = [];
    fragments.push(
      `Validate acceptance criterion ${criterion.label} for ${spec.title}.`
    );

    if (target?.label) {
      fragments.push(`Focus on ${target.label} (${target.path ?? "unknown path"}).`);
    }

    if (existing.length > 0) {
      const flaky = existing.filter((test) =>
        typeof test.flakyScore === "number" && test.flakyScore > 0.25
      );
      if (flaky.length > 0) {
        fragments.push(
          `Stabilize existing coverage (flaky tests: ${flaky
            .map((test) => test.label)
            .join(", ")}).`
        );
      } else {
        fragments.push(
          `Extend assertions beyond ${existing
            .map((test) => test.label)
            .join(", ")}.`
        );
      }
    } else {
      fragments.push("Provides first-pass regression safety net.");
    }

    return fragments.join(" ");
  }

  private buildIntegrationDescription(
    spec: Spec,
    criterion: CriterionContext,
    involved: string[],
    existing: ExistingTestContext[]
  ): string {
    const fragments: string[] = [];
    fragments.push(`Exercise system collaboration for ${spec.title}.`);

    if (involved.length > 0) {
      fragments.push(`Cover integration between ${involved.join(", ")}.`);
    }

    const hasExisting = existing.length > 0;
    if (hasExisting) {
      fragments.push(
        `Update existing suites (${existing
          .map((test) => test.label)
          .join(", ")}) with new scenarios.`
      );
    } else {
      fragments.push("Introduce integration fixtures and data orchestration.");
    }

    fragments.push(`Anchor around ${criterion.label}: ${criterion.text.trim()}.`);

    return fragments.join(" ");
  }

  private buildDataRequirements(
    criterionText: string,
    level: "unit" | "integration"
  ): string[] {
    const requirements: string[] = [];
    const normalized = criterionText.toLowerCase();

    const withMatch = criterionText.match(/(?:with|including) ([^.;]+)/i);
    if (withMatch) {
      requirements.push(`Include dataset covering ${withMatch[1].trim()}.`);
    }

    if (/invalid|error|reject|denied/.test(normalized)) {
      requirements.push("Provide negative cases capturing rejection paths.");
    }

    if (/audit|logging|telemetry/.test(normalized)) {
      requirements.push("Capture log and telemetry assertions.");
    }

    if (/concurrent|parallel|simultaneous/.test(normalized)) {
      requirements.push("Simulate concurrent execution to expose race conditions.");
    }

    if (requirements.length === 0) {
      requirements.push(
        level === "unit"
          ? "Supply representative inputs and edge values."
          : "Provision upstream and downstream fixtures mirroring production."
      );
    }

    return requirements;
  }

  private deriveScenarioDataRequirements(
    criteria: CriterionContext[]
  ): string[] {
    const requirements = new Set<string>();

    if (criteria.some((criterion) => /payment|transaction/i.test(criterion.text))) {
      requirements.add("Seed transactional data with rollback verification.");
    }
    if (criteria.some((criterion) => /authentication|login|oauth|jwt/i.test(criterion.text))) {
      requirements.add("Generate authenticated and unauthenticated user personas.");
    }
    if (criteria.some((criterion) => /notification|email|webhook/i.test(criterion.text))) {
      requirements.add("Stub external notification channels and verify dispatch.");
    }
    if (criteria.some((criterion) => /analytics|metrics|report/i.test(criterion.text))) {
      requirements.add("Collect analytics events and validate aggregation outputs.");
    }

    if (requirements.size === 0) {
      requirements.add("Mirror production-like happy path data and environment.");
    }

    requirements.add("Enumerate rollback or recovery steps for failed stages.");

    return Array.from(requirements);
  }

  private estimateCoverage(
    criteria: CriterionContext[],
    plan: TestPlanResponse["testPlan"],
    requestedCoverage?: TestPlanRequest["coverage"]
  ): CoverageMetrics {
    const existingCoverage = this.aggregateExistingCoverage(criteria);
    const plannedWeights =
      plan.unitTests.length * 4 +
      plan.integrationTests.length * 6 +
      plan.e2eTests.length * 8 +
      plan.performanceTests.length * 5;

    const baseLines = existingCoverage.lines ?? 55;
    const baseBranches = existingCoverage.branches ?? 48;
    const baseFunctions = existingCoverage.functions ?? 60;
    const baseStatements = existingCoverage.statements ?? 58;

    const projection = {
      lines: this.clamp(baseLines + plannedWeights * 0.6, 0, 98),
      branches: this.clamp(baseBranches + plannedWeights * 0.5, 0, 96),
      functions: this.clamp(baseFunctions + plannedWeights * 0.55, 0, 97),
      statements: this.clamp(baseStatements + plannedWeights * 0.6, 0, 98),
    };

    const coverage = {
      lines: Math.round(
        Math.max(requestedCoverage?.minLines ?? 0, projection.lines)
      ),
      branches: Math.round(
        Math.max(requestedCoverage?.minBranches ?? 0, projection.branches)
      ),
      functions: Math.round(
        Math.max(requestedCoverage?.minFunctions ?? 0, projection.functions)
      ),
      statements: Math.round(projection.statements),
    } satisfies CoverageMetrics;

    return coverage;
  }

  private collectChangedFiles(criteria: CriterionContext[]): string[] {
    const paths = new Set<string>();

    for (const criterion of criteria) {
      for (const entity of criterion.relatedEntities) {
        if (entity.path) {
          paths.add(entity.path);
        }
      }
      for (const test of criterion.existingTests) {
        if (test.path) {
          paths.add(test.path);
        }
      }
    }

    return Array.from(paths).sort();
  }

  private aggregateExistingCoverage(
    criteria: CriterionContext[]
  ): Partial<CoverageMetrics> {
    const totals = { lines: 0, branches: 0, functions: 0, statements: 0 };
    let count = 0;

    for (const criterion of criteria) {
      for (const test of criterion.existingTests) {
        if (test.coverage) {
          totals.lines += test.coverage.lines ?? 0;
          totals.branches += test.coverage.branches ?? 0;
          totals.functions += test.coverage.functions ?? 0;
          totals.statements += test.coverage.statements ?? 0;
          count += 1;
        }
      }
    }

    if (count === 0) {
      return {};
    }

    return {
      lines: totals.lines / count,
      branches: totals.branches / count,
      functions: totals.functions / count,
      statements: totals.statements / count,
    };
  }

  private extractCriterionId(
    text: string,
    index: number,
    usedIds: Set<string>
  ): string {
    const defaultId = `AC-${index + 1}`;
    if (!text || typeof text !== "string") {
      usedIds.add(defaultId);
      return defaultId;
    }

    const explicitMatch = text.match(/([A-Z]{2,}-\d{1,4})/i);
    if (explicitMatch) {
      const candidate = explicitMatch[1].toUpperCase();
      if (!usedIds.has(candidate)) {
        usedIds.add(candidate);
        return candidate;
      }
    }

    let finalId = defaultId;
    while (usedIds.has(finalId)) {
      finalId = `${defaultId}-${usedIds.size + 1}`;
    }
    usedIds.add(finalId);
    return finalId;
  }

  private tokenize(text: string): string[] {
    if (!text) {
      return [];
    }

    return Array.from(text.toLowerCase().matchAll(/[a-z0-9]{4,}/g)).map(
      (match) => match[0]
    );
  }

  private extractAcceptanceIds(metadata: Record<string, any> | undefined): string[] {
    const ids = new Set<string>();
    if (!metadata) {
      return [];
    }

    const single = metadata.acceptanceCriteriaId;
    if (typeof single === "string" && single.trim().length > 0) {
      ids.add(single.trim());
    }
    const multiple = metadata.acceptanceCriteriaIds;
    if (Array.isArray(multiple)) {
      for (const value of multiple) {
        if (typeof value === "string" && value.trim().length > 0) {
          ids.add(value.trim());
        }
      }
    }

    if (ids.size > 0) {
      return Array.from(ids);
    }

    const rationale = metadata.rationale;
    if (typeof rationale === "string") {
      const matches = rationale.match(/([A-Z]{2,}-\d{1,4})/gi);
      if (matches) {
        for (const match of matches) {
          ids.add(match.toUpperCase());
        }
      }
    }

    return Array.from(ids);
  }

  private resolveCriterionContext(
    criteria: CriterionContext[],
    acceptanceIds: string[],
    contextLabel: string,
    contextPath?: string,
    rationale?: string
  ): CriterionContext {
    if (criteria.length === 1) {
      return criteria[0];
    }

    const normalizedIds = acceptanceIds.map((id) => id.toUpperCase());
    if (normalizedIds.length > 0) {
      for (const id of normalizedIds) {
        const found = criteria.find((criterion) => criterion.id === id);
        if (found) {
          return found;
        }
      }
    }

    const contextTokens = this.tokenize(
      `${contextLabel ?? ""} ${contextPath ?? ""} ${rationale ?? ""}`
    );

    let bestScore = -1;
    let bestCriterion = criteria[0];

    for (const criterion of criteria) {
      const score = this.computeTokenOverlap(criterion.tokens, contextTokens);
      if (score > bestScore) {
        bestScore = score;
        bestCriterion = criterion;
      }
    }

    return bestCriterion;
  }

  private computeTokenOverlap(a: string[], b: string[]): number {
    if (a.length === 0 || b.length === 0) {
      return 0;
    }

    const aSet = new Set(a);
    let overlap = 0;
    for (const token of b) {
      if (aSet.has(token)) {
        overlap += 1;
      }
    }
    return overlap;
  }

  private async fetchEntities(ids: string[]): Promise<Map<string, Entity>> {
    const uniqueIds = Array.from(new Set(ids));
    const results = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const entity = await this.kgService.getEntity(id);
          return { id, entity: entity ?? undefined };
        } catch (error) {
          console.warn(`Failed to fetch entity ${id} for test planning`, error);
          return { id, entity: undefined };
        }
      })
    );

    const map = new Map<string, Entity>();
    for (const result of results) {
      if (result.entity) {
        map.set(result.id, result.entity as Entity);
      }
    }
    return map;
  }

  private summarizeEntity(entity: Entity | null, fallbackId: string) {
    if (!entity) {
      return {
        id: fallbackId,
        label: fallbackId,
        type: undefined,
        path: undefined,
        signature: undefined,
      };
    }

    const label = this.buildEntityLabel(entity);

    return {
      id: entity.id,
      label,
      type: (entity as any)?.type,
      path: (entity as any)?.path,
      signature: (entity as any)?.signature,
    };
  }

  private buildEntityLabel(entity: Entity): string {
    const anyEntity = entity as any;
    if (typeof anyEntity.name === "string" && anyEntity.name.length > 0) {
      return anyEntity.name;
    }
    if (typeof anyEntity.title === "string" && anyEntity.title.length > 0) {
      return anyEntity.title;
    }
    if (typeof anyEntity.path === "string" && anyEntity.path.length > 0) {
      const segments = anyEntity.path.split("/");
      return segments[segments.length - 1] || anyEntity.path;
    }
    return entity.id;
  }

  private buildTestLabel(test: Test): string {
    const base = this.buildEntityLabel(test);
    return test.testType ? `${base} (${test.testType})` : base;
  }

  private pickPrimaryTarget(
    criterion: CriterionContext
  ): RelatedEntityContext | null {
    if (criterion.relatedEntities.length === 0) {
      return null;
    }

    const preferred = criterion.relatedEntities.find((entity) =>
      ["function", "method", "symbol"].includes((entity.type ?? "").toLowerCase())
    );

    return preferred ?? criterion.relatedEntities[0];
  }

  private pickGlobalTarget(
    criteria: CriterionContext[]
  ): RelatedEntityContext | null {
    for (const criterion of criteria) {
      const target = this.pickPrimaryTarget(criterion);
      if (target) {
        return target;
      }
    }
    return null;
  }

  private truncate(text: string, length: number): string {
    if (!text) {
      return "";
    }
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= length) {
      return clean;
    }
    return `${clean.slice(0, length - 1)}…`;
  }

  private clamp(value: number, min: number, max: number): number {
    if (Number.isNaN(value)) {
      return min;
    }
    if (value < min) {
      return min;
    }
    if (value > max) {
      return max;
    }
    return value;
  }
}
