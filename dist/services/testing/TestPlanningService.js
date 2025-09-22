import { RelationshipType } from "../../models/relationships.js";
export class SpecNotFoundError extends Error {
    constructor(specId) {
        super(`Specification ${specId} was not found`);
        this.code = "SPEC_NOT_FOUND";
        this.name = "SpecNotFoundError";
    }
}
export class TestPlanningValidationError extends Error {
    constructor(message) {
        super(message);
        this.code = "INVALID_TEST_PLAN_REQUEST";
        this.name = "TestPlanningValidationError";
    }
}
export class TestPlanningService {
    constructor(kgService) {
        this.kgService = kgService;
    }
    async planTests(params) {
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
        const estimatedCoverage = this.estimateCoverage(criteria, plan, params.coverage);
        const changedFiles = this.collectChangedFiles(criteria);
        return {
            testPlan: plan,
            estimatedCoverage,
            changedFiles,
        };
    }
    async fetchSpec(specId) {
        if (!specId || typeof specId !== "string") {
            throw new TestPlanningValidationError("Specification ID is required for test planning");
        }
        const entity = await this.kgService.getEntity(specId);
        if (!entity || entity.type !== "spec") {
            throw new SpecNotFoundError(specId);
        }
        return entity;
    }
    resolveRequestedTypes(params) {
        const base = ["unit", "integration", "e2e"];
        if (params.testTypes && params.testTypes.length > 0) {
            const filtered = params.testTypes
                .map((type) => (base.includes(type) ? type : undefined))
                .filter((value) => Boolean(value));
            return new Set(filtered.length > 0 ? filtered : base);
        }
        return new Set(base);
    }
    shouldIncludePerformance(params, spec) {
        if (params.includePerformanceTests) {
            return true;
        }
        return spec.priority === "critical" || spec.priority === "high";
    }
    buildCriterionContexts(spec) {
        const contexts = [];
        const usedIds = new Set();
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
    async attachSpecRelationships(specId, criteria) {
        let relationships = [];
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
        }
        catch (error) {
            console.warn("Failed to load spec relationships for planning", error);
            relationships = [];
        }
        if (!relationships || relationships.length === 0) {
            return;
        }
        const targetIds = Array.from(new Set(relationships.map((rel) => rel.toEntityId).filter(Boolean)));
        const entities = await this.fetchEntities(targetIds);
        relationships.forEach((rel) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            if (!(rel === null || rel === void 0 ? void 0 : rel.toEntityId)) {
                return;
            }
            const entity = (_a = entities.get(rel.toEntityId)) !== null && _a !== void 0 ? _a : null;
            const summary = this.summarizeEntity(entity, rel.toEntityId);
            const acceptanceIds = this.extractAcceptanceIds(rel.metadata);
            const criterion = this.resolveCriterionContext(criteria, acceptanceIds, summary.label, summary.path, (_b = rel.metadata) === null || _b === void 0 ? void 0 : _b.rationale);
            criterion.relatedEntities.push({
                entityId: summary.id,
                label: summary.label,
                type: summary.type,
                path: summary.path,
                signature: summary.signature,
                relationshipType: rel.type,
                priority: typeof ((_c = rel.metadata) === null || _c === void 0 ? void 0 : _c.priority) === "string"
                    ? (_d = rel.metadata) === null || _d === void 0 ? void 0 : _d.priority
                    : undefined,
                impactLevel: typeof ((_e = rel.metadata) === null || _e === void 0 ? void 0 : _e.impactLevel) === "string"
                    ? (_f = rel.metadata) === null || _f === void 0 ? void 0 : _f.impactLevel
                    : undefined,
                rationale: typeof ((_g = rel.metadata) === null || _g === void 0 ? void 0 : _g.rationale) === "string"
                    ? (_h = rel.metadata) === null || _h === void 0 ? void 0 : _h.rationale
                    : undefined,
            });
        });
    }
    async attachExistingTests(specId, criteria) {
        let relationships = [];
        try {
            relationships = await this.kgService.getRelationships({
                toEntityId: specId,
                type: RelationshipType.VALIDATES,
                limit: 200,
            });
        }
        catch (error) {
            console.warn("Failed to load validating tests for spec", error);
            relationships = [];
        }
        if (!relationships || relationships.length === 0) {
            return;
        }
        const testIds = Array.from(new Set(relationships.map((rel) => rel.fromEntityId).filter(Boolean)));
        const tests = await this.fetchEntities(testIds);
        relationships.forEach((rel) => {
            var _a;
            if (!(rel === null || rel === void 0 ? void 0 : rel.fromEntityId)) {
                return;
            }
            const entity = tests.get(rel.fromEntityId);
            if (!entity || entity.type !== "test") {
                return;
            }
            const testEntity = entity;
            const label = this.buildTestLabel(testEntity);
            const acceptanceIds = this.extractAcceptanceIds(rel.metadata);
            const criterion = this.resolveCriterionContext(criteria, acceptanceIds, label, testEntity.path, (_a = testEntity.metadata) === null || _a === void 0 ? void 0 : _a.rationale);
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
    buildPlan(inputs) {
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
    buildUnitTests(inputs) {
        const specs = [];
        for (const criterion of inputs.criteria) {
            const existing = criterion.existingTests.filter((test) => test.testType === "unit");
            const primaryTarget = this.pickPrimaryTarget(criterion);
            const assertions = this.buildUnitAssertions(criterion, primaryTarget, existing);
            specs.push({
                name: `[${criterion.label}] Unit ${this.truncate(criterion.text, 40)}`,
                description: this.buildUnitDescription(inputs.spec, criterion, primaryTarget, existing),
                type: "unit",
                targetFunction: (primaryTarget === null || primaryTarget === void 0 ? void 0 : primaryTarget.signature) || (primaryTarget === null || primaryTarget === void 0 ? void 0 : primaryTarget.label),
                assertions,
                dataRequirements: this.buildDataRequirements(criterion.text, "unit"),
            });
        }
        return specs;
    }
    buildIntegrationTests(inputs) {
        const specs = [];
        for (const criterion of inputs.criteria) {
            const related = criterion.relatedEntities;
            const existing = criterion.existingTests.filter((test) => test.testType === "integration");
            const involved = related
                .map((entity) => entity.label)
                .filter(Boolean)
                .slice(0, 3);
            const assertions = this.buildIntegrationAssertions(criterion, related, existing);
            specs.push({
                name: `[${criterion.label}] Integration ${this.truncate(involved.join(" ↔ ") || criterion.text, 60)}`,
                description: this.buildIntegrationDescription(inputs.spec, criterion, involved, existing),
                type: "integration",
                targetFunction: involved.join(" & ") || inputs.spec.title,
                assertions,
                dataRequirements: this.buildDataRequirements(criterion.text, "integration"),
            });
        }
        if (inputs.includeSecurity) {
            specs.push(this.buildSecurityIntegration(inputs));
        }
        return specs;
    }
    buildEndToEndTests(inputs) {
        const specs = [];
        const happyPathAssertions = inputs.criteria.map((criterion) => `Satisfies ${criterion.label}: ${criterion.text.trim()}`);
        specs.push({
            name: `${inputs.spec.title} happy path flow`,
            description: `Exercise the primary workflow covering ${inputs.criteria.length} acceptance criteria for ${inputs.spec.title}.`,
            type: "e2e",
            targetFunction: inputs.spec.title,
            assertions: happyPathAssertions,
            dataRequirements: this.deriveScenarioDataRequirements(inputs.criteria),
        });
        const negativeCriteria = inputs.criteria.filter((criterion) => /invalid|error|denied|unauthorized|failure/i.test(criterion.text));
        if (negativeCriteria.length > 0) {
            specs.push({
                name: `${inputs.spec.title} resilience flow`,
                description: `Probe failure and rejection paths described in ${negativeCriteria.length} acceptance criteria to harden ${inputs.spec.title}.`,
                type: "e2e",
                targetFunction: inputs.spec.title,
                assertions: negativeCriteria.map((criterion) => `Handles rejection case for ${criterion.label}: ${criterion.text.trim()}`),
                dataRequirements: [
                    "Capture error telemetry and audit events",
                    "Simulate network and downstream service unavailability",
                ],
            });
        }
        return specs;
    }
    buildPerformanceTests(inputs) {
        const primaryTarget = this.pickGlobalTarget(inputs.criteria);
        const assertions = [
            `Throughput remains within baseline for ${(primaryTarget === null || primaryTarget === void 0 ? void 0 : primaryTarget.label) || inputs.spec.title}`,
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
                targetFunction: (primaryTarget === null || primaryTarget === void 0 ? void 0 : primaryTarget.label) || inputs.spec.title,
                assertions,
                dataRequirements,
            },
        ];
    }
    buildSecurityIntegration(inputs) {
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
    buildUnitAssertions(criterion, target, existing) {
        const assertions = [];
        assertions.push(`Implements acceptance criterion ${criterion.label}: ${criterion.text.trim()}`);
        if (target === null || target === void 0 ? void 0 : target.label) {
            assertions.push(`Covers ${target.label} core behaviour and edge conditions`);
        }
        if (/invalid|error|reject|fail/i.test(criterion.text)) {
            assertions.push("Asserts error or rejection paths for invalid inputs");
        }
        if (existing.length > 0) {
            assertions.push(`Reference existing unit coverage: ${existing
                .map((test) => test.label)
                .join(", ")}`);
        }
        else {
            assertions.push("Establishes regression harness for new functionality");
        }
        return assertions;
    }
    buildIntegrationAssertions(criterion, related, existing) {
        const assertions = [];
        if (related.length > 1) {
            assertions.push(`Coordinates ${related
                .slice(0, 3)
                .map((entity) => entity.label)
                .join(", ")} end-to-end`);
        }
        else if (related.length === 1) {
            assertions.push(`Integrates ${related[0].label} with dependent services`);
        }
        else {
            assertions.push("Traverses primary integration path defined by the spec");
        }
        assertions.push(`Verifies cross-cutting requirements for ${criterion.label}: ${criterion.text.trim()}`);
        if (existing.length > 0) {
            assertions.push(`Review existing integration suites: ${existing
                .map((test) => test.label)
                .join(", ")}`);
        }
        else {
            assertions.push("Document integration contract assumptions and fixtures");
        }
        return assertions;
    }
    buildUnitDescription(spec, criterion, target, existing) {
        var _a;
        const fragments = [];
        fragments.push(`Validate acceptance criterion ${criterion.label} for ${spec.title}.`);
        if (target === null || target === void 0 ? void 0 : target.label) {
            fragments.push(`Focus on ${target.label} (${(_a = target.path) !== null && _a !== void 0 ? _a : "unknown path"}).`);
        }
        if (existing.length > 0) {
            const flaky = existing.filter((test) => typeof test.flakyScore === "number" && test.flakyScore > 0.25);
            if (flaky.length > 0) {
                fragments.push(`Stabilize existing coverage (flaky tests: ${flaky
                    .map((test) => test.label)
                    .join(", ")}).`);
            }
            else {
                fragments.push(`Extend assertions beyond ${existing
                    .map((test) => test.label)
                    .join(", ")}.`);
            }
        }
        else {
            fragments.push("Provides first-pass regression safety net.");
        }
        return fragments.join(" ");
    }
    buildIntegrationDescription(spec, criterion, involved, existing) {
        const fragments = [];
        fragments.push(`Exercise system collaboration for ${spec.title}.`);
        if (involved.length > 0) {
            fragments.push(`Cover integration between ${involved.join(", ")}.`);
        }
        const hasExisting = existing.length > 0;
        if (hasExisting) {
            fragments.push(`Update existing suites (${existing
                .map((test) => test.label)
                .join(", ")}) with new scenarios.`);
        }
        else {
            fragments.push("Introduce integration fixtures and data orchestration.");
        }
        fragments.push(`Anchor around ${criterion.label}: ${criterion.text.trim()}.`);
        return fragments.join(" ");
    }
    buildDataRequirements(criterionText, level) {
        const requirements = [];
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
            requirements.push(level === "unit"
                ? "Supply representative inputs and edge values."
                : "Provision upstream and downstream fixtures mirroring production.");
        }
        return requirements;
    }
    deriveScenarioDataRequirements(criteria) {
        const requirements = new Set();
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
    estimateCoverage(criteria, plan, requestedCoverage) {
        var _a, _b, _c, _d, _e, _f, _g;
        const existingCoverage = this.aggregateExistingCoverage(criteria);
        const plannedWeights = plan.unitTests.length * 4 +
            plan.integrationTests.length * 6 +
            plan.e2eTests.length * 8 +
            plan.performanceTests.length * 5;
        const baseLines = (_a = existingCoverage.lines) !== null && _a !== void 0 ? _a : 55;
        const baseBranches = (_b = existingCoverage.branches) !== null && _b !== void 0 ? _b : 48;
        const baseFunctions = (_c = existingCoverage.functions) !== null && _c !== void 0 ? _c : 60;
        const baseStatements = (_d = existingCoverage.statements) !== null && _d !== void 0 ? _d : 58;
        const projection = {
            lines: this.clamp(baseLines + plannedWeights * 0.6, 0, 98),
            branches: this.clamp(baseBranches + plannedWeights * 0.5, 0, 96),
            functions: this.clamp(baseFunctions + plannedWeights * 0.55, 0, 97),
            statements: this.clamp(baseStatements + plannedWeights * 0.6, 0, 98),
        };
        const coverage = {
            lines: Math.round(Math.max((_e = requestedCoverage === null || requestedCoverage === void 0 ? void 0 : requestedCoverage.minLines) !== null && _e !== void 0 ? _e : 0, projection.lines)),
            branches: Math.round(Math.max((_f = requestedCoverage === null || requestedCoverage === void 0 ? void 0 : requestedCoverage.minBranches) !== null && _f !== void 0 ? _f : 0, projection.branches)),
            functions: Math.round(Math.max((_g = requestedCoverage === null || requestedCoverage === void 0 ? void 0 : requestedCoverage.minFunctions) !== null && _g !== void 0 ? _g : 0, projection.functions)),
            statements: Math.round(projection.statements),
        };
        return coverage;
    }
    collectChangedFiles(criteria) {
        const paths = new Set();
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
    aggregateExistingCoverage(criteria) {
        var _a, _b, _c, _d;
        const totals = { lines: 0, branches: 0, functions: 0, statements: 0 };
        let count = 0;
        for (const criterion of criteria) {
            for (const test of criterion.existingTests) {
                if (test.coverage) {
                    totals.lines += (_a = test.coverage.lines) !== null && _a !== void 0 ? _a : 0;
                    totals.branches += (_b = test.coverage.branches) !== null && _b !== void 0 ? _b : 0;
                    totals.functions += (_c = test.coverage.functions) !== null && _c !== void 0 ? _c : 0;
                    totals.statements += (_d = test.coverage.statements) !== null && _d !== void 0 ? _d : 0;
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
    extractCriterionId(text, index, usedIds) {
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
    tokenize(text) {
        if (!text) {
            return [];
        }
        return Array.from(text.toLowerCase().matchAll(/[a-z0-9]{4,}/g)).map((match) => match[0]);
    }
    extractAcceptanceIds(metadata) {
        const ids = new Set();
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
    resolveCriterionContext(criteria, acceptanceIds, contextLabel, contextPath, rationale) {
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
        const contextTokens = this.tokenize(`${contextLabel !== null && contextLabel !== void 0 ? contextLabel : ""} ${contextPath !== null && contextPath !== void 0 ? contextPath : ""} ${rationale !== null && rationale !== void 0 ? rationale : ""}`);
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
    computeTokenOverlap(a, b) {
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
    async fetchEntities(ids) {
        const uniqueIds = Array.from(new Set(ids));
        const results = await Promise.all(uniqueIds.map(async (id) => {
            try {
                const entity = await this.kgService.getEntity(id);
                return { id, entity: entity !== null && entity !== void 0 ? entity : undefined };
            }
            catch (error) {
                console.warn(`Failed to fetch entity ${id} for test planning`, error);
                return { id, entity: undefined };
            }
        }));
        const map = new Map();
        for (const result of results) {
            if (result.entity) {
                map.set(result.id, result.entity);
            }
        }
        return map;
    }
    summarizeEntity(entity, fallbackId) {
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
            type: entity === null || entity === void 0 ? void 0 : entity.type,
            path: entity === null || entity === void 0 ? void 0 : entity.path,
            signature: entity === null || entity === void 0 ? void 0 : entity.signature,
        };
    }
    buildEntityLabel(entity) {
        const anyEntity = entity;
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
    buildTestLabel(test) {
        const base = this.buildEntityLabel(test);
        return test.testType ? `${base} (${test.testType})` : base;
    }
    pickPrimaryTarget(criterion) {
        if (criterion.relatedEntities.length === 0) {
            return null;
        }
        const preferred = criterion.relatedEntities.find((entity) => { var _a; return ["function", "method", "symbol"].includes(((_a = entity.type) !== null && _a !== void 0 ? _a : "").toLowerCase()); });
        return preferred !== null && preferred !== void 0 ? preferred : criterion.relatedEntities[0];
    }
    pickGlobalTarget(criteria) {
        for (const criterion of criteria) {
            const target = this.pickPrimaryTarget(criterion);
            if (target) {
                return target;
            }
        }
        return null;
    }
    truncate(text, length) {
        if (!text) {
            return "";
        }
        const clean = text.replace(/\s+/g, " ").trim();
        if (clean.length <= length) {
            return clean;
        }
        return `${clean.slice(0, length - 1)}…`;
    }
    clamp(value, min, max) {
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
//# sourceMappingURL=TestPlanningService.js.map