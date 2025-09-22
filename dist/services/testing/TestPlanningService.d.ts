import { KnowledgeGraphService } from "../knowledge/KnowledgeGraphService.js";
import type { TestPlanRequest, TestPlanResponse } from "../../models/types.js";
export declare class SpecNotFoundError extends Error {
    readonly code = "SPEC_NOT_FOUND";
    constructor(specId: string);
}
export declare class TestPlanningValidationError extends Error {
    readonly code = "INVALID_TEST_PLAN_REQUEST";
    constructor(message: string);
}
export declare class TestPlanningService {
    private readonly kgService;
    constructor(kgService: KnowledgeGraphService);
    planTests(params: TestPlanRequest): Promise<TestPlanResponse>;
    private fetchSpec;
    private resolveRequestedTypes;
    private shouldIncludePerformance;
    private buildCriterionContexts;
    private attachSpecRelationships;
    private attachExistingTests;
    private buildPlan;
    private buildUnitTests;
    private buildIntegrationTests;
    private buildEndToEndTests;
    private buildPerformanceTests;
    private buildSecurityIntegration;
    private buildUnitAssertions;
    private buildIntegrationAssertions;
    private buildUnitDescription;
    private buildIntegrationDescription;
    private buildDataRequirements;
    private deriveScenarioDataRequirements;
    private estimateCoverage;
    private collectChangedFiles;
    private aggregateExistingCoverage;
    private extractCriterionId;
    private tokenize;
    private extractAcceptanceIds;
    private resolveCriterionContext;
    private computeTokenOverlap;
    private fetchEntities;
    private summarizeEntity;
    private buildEntityLabel;
    private buildTestLabel;
    private pickPrimaryTarget;
    private pickGlobalTarget;
    private truncate;
    private clamp;
}
//# sourceMappingURL=TestPlanningService.d.ts.map