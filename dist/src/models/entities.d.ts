/**
 * Knowledge Graph Entity Types for Memento
 * Based on the comprehensive knowledge graph design
 */
export interface CodebaseEntity {
    id: string;
    path: string;
    hash: string;
    language: string;
    lastModified: Date;
    created: Date;
    metadata?: Record<string, any>;
}
export interface File extends CodebaseEntity {
    type: "file";
    extension: string;
    size: number;
    lines: number;
    isTest: boolean;
    isConfig: boolean;
    dependencies: string[];
}
export interface Directory extends CodebaseEntity {
    type: "directory";
    children: string[];
    depth: number;
}
export interface Module extends CodebaseEntity {
    type: "module";
    name: string;
    version: string;
    packageJson: any;
    entryPoint: string;
}
export interface Symbol extends CodebaseEntity {
    type: "symbol";
    name: string;
    kind: "function" | "class" | "interface" | "typeAlias" | "variable" | "property" | "method" | "unknown";
    signature: string;
    docstring: string;
    visibility: "public" | "private" | "protected";
    isExported: boolean;
    isDeprecated: boolean;
    location?: {
        line: number;
        column: number;
        start: number;
        end: number;
    };
}
export interface FunctionSymbol extends Symbol {
    kind: "function";
    parameters: FunctionParameter[];
    returnType: string;
    isAsync: boolean;
    isGenerator: boolean;
    complexity: number;
    calls: string[];
}
export interface FunctionParameter {
    name: string;
    type: string;
    defaultValue?: string;
    optional: boolean;
}
export interface ClassSymbol extends Symbol {
    kind: "class";
    extends: string[];
    implements: string[];
    methods: string[];
    properties: string[];
    isAbstract: boolean;
}
export interface InterfaceSymbol extends Symbol {
    kind: "interface";
    extends: string[];
    methods: string[];
    properties: string[];
}
export interface TypeAliasSymbol extends Symbol {
    kind: "typeAlias";
    aliasedType: string;
    isUnion: boolean;
    isIntersection: boolean;
}
export interface Test extends CodebaseEntity {
    type: "test";
    testType: "unit" | "integration" | "e2e";
    targetSymbol: string;
    framework: string;
    coverage: CoverageMetrics;
    status: "passing" | "failing" | "skipped" | "unknown";
    flakyScore: number;
    lastRunAt?: Date;
    lastDuration?: number;
    executionHistory: TestExecution[];
    performanceMetrics: TestPerformanceMetrics;
    dependencies: string[];
    tags: string[];
}
export interface CoverageMetrics {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
}
export interface TestExecution {
    id: string;
    timestamp: Date;
    status: "passed" | "failed" | "skipped" | "error";
    duration: number;
    errorMessage?: string;
    stackTrace?: string;
    coverage?: CoverageMetrics;
    performance?: TestPerformanceData;
    environment?: Record<string, any>;
}
export interface TestPerformanceData {
    memoryUsage?: number;
    cpuUsage?: number;
    networkRequests?: number;
    databaseQueries?: number;
    fileOperations?: number;
}
export interface TestPerformanceMetrics {
    averageExecutionTime: number;
    p95ExecutionTime: number;
    successRate: number;
    trend: "improving" | "stable" | "degrading";
    benchmarkComparisons: TestBenchmark[];
    historicalData: TestHistoricalData[];
}
export interface TestBenchmark {
    benchmark: string;
    value: number;
    status: "above" | "below" | "at";
    threshold: number;
}
export interface TestHistoricalData {
    timestamp: Date;
    executionTime: number;
    successRate: number;
    coveragePercentage: number;
}
export interface Spec extends CodebaseEntity {
    type: "spec";
    title: string;
    description: string;
    acceptanceCriteria: string[];
    status: "draft" | "approved" | "implemented" | "deprecated";
    priority: "low" | "medium" | "high" | "critical";
    assignee?: string;
    tags?: string[];
    updated: Date;
}
export interface Change {
    id: string;
    type: "change";
    changeType: "create" | "update" | "delete" | "rename" | "move";
    entityType: string;
    entityId: string;
    timestamp: Date;
    author?: string;
    commitHash?: string;
    diff?: string;
    previousState?: any;
    newState?: any;
    sessionId?: string;
    specId?: string;
}
export interface Session {
    id: string;
    type: "session";
    startTime: Date;
    endTime?: Date;
    agentType: string;
    userId?: string;
    changes: string[];
    specs: string[];
    status: "active" | "completed" | "failed";
    metadata?: Record<string, any>;
}
export interface DocumentationNode extends CodebaseEntity {
    type: "documentation";
    title: string;
    content: string;
    docType: "readme" | "api-docs" | "design-doc" | "architecture" | "user-guide";
    businessDomains: string[];
    stakeholders: string[];
    technologies: string[];
    status: "active" | "deprecated" | "draft";
}
export interface BusinessDomain {
    id: string;
    type: "businessDomain";
    name: string;
    description: string;
    parentDomain?: string;
    criticality: "core" | "supporting" | "utility";
    stakeholders: string[];
    keyProcesses: string[];
    extractedFrom: string[];
}
export interface SemanticCluster {
    id: string;
    type: "semanticCluster";
    name: string;
    description: string;
    businessDomainId: string;
    clusterType: "feature" | "module" | "capability" | "service";
    cohesionScore: number;
    lastAnalyzed: Date;
    memberEntities: string[];
}
export interface SecurityIssue {
    id: string;
    type: "securityIssue";
    tool: string;
    ruleId: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    title: string;
    description: string;
    cwe?: string;
    owasp?: string;
    affectedEntityId: string;
    lineNumber: number;
    codeSnippet: string;
    remediation: string;
    status: "open" | "fixed" | "accepted" | "false-positive";
    discoveredAt: Date;
    lastScanned: Date;
    confidence: number;
}
export interface Vulnerability {
    id: string;
    type: "vulnerability";
    packageName: string;
    version: string;
    vulnerabilityId: string;
    severity: "critical" | "high" | "medium" | "low" | "info";
    description: string;
    cvssScore: number;
    affectedVersions: string;
    fixedInVersion: string;
    publishedAt: Date;
    lastUpdated: Date;
    exploitability: "high" | "medium" | "low";
}
export type Entity = File | Directory | Module | Symbol | FunctionSymbol | ClassSymbol | InterfaceSymbol | TypeAliasSymbol | Test | Spec | Change | Session | DocumentationNode | BusinessDomain | SemanticCluster | SecurityIssue | Vulnerability;
export declare const isFile: (entity: Entity | null | undefined) => entity is File;
export declare const isDirectory: (entity: Entity | null | undefined) => entity is Directory;
export declare const isSymbol: (entity: Entity | null | undefined) => entity is Symbol;
export declare const isFunction: (entity: Entity | null | undefined) => entity is FunctionSymbol;
export declare const isClass: (entity: Entity | null | undefined) => entity is ClassSymbol;
export declare const isInterface: (entity: Entity | null | undefined) => entity is InterfaceSymbol;
export declare const isTest: (entity: Entity | null | undefined) => entity is Test;
export declare const isSpec: (entity: Entity | null | undefined) => entity is Spec;
export { RelationshipType } from "./relationships";
//# sourceMappingURL=entities.d.ts.map