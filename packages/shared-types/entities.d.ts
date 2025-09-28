import type { SecuritySeverity } from './security';
export interface CodebaseEntity {
    id: string;
    type: string;
    path: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}
export type Entity = File | Directory | Module | Symbol | FunctionSymbol | ClassSymbol | InterfaceSymbol | TypeAliasSymbol | Test | Spec | Change | Session | Version | Checkpoint | DocumentationNode | BusinessDomain | SemanticCluster | SecurityIssueEntity;
export interface File extends CodebaseEntity {
    type: 'file';
    extension: string;
    size: number;
    lines: number;
    isTest: boolean;
    isConfig: boolean;
    dependencies: string[];
}
export interface Symbol extends CodebaseEntity {
    type: 'symbol';
    name: string;
    kind: 'function' | 'class' | 'interface' | 'typeAlias' | 'variable' | 'property' | 'method' | 'unknown';
    signature: string;
    docstring: string;
    visibility: 'public' | 'private' | 'protected';
    isExported: boolean;
    isDeprecated: boolean;
    location?: {
        line: number;
        column: number;
        start: number;
        end: number;
    };
}
export interface FunctionParameter {
    name: string;
    type: string;
    optional: boolean;
    defaultValue?: string;
}
export interface ClassSymbol extends Symbol {
    kind: 'class';
    extends?: string[];
    implements?: string[];
    methods: string[];
    properties: string[];
    constructors: string[];
    isAbstract: boolean;
}
export interface InterfaceSymbol extends Symbol {
    kind: 'interface';
    extends?: string[];
    methods: string[];
    properties: string[];
}
export interface TypeAliasSymbol extends Symbol {
    kind: 'typeAlias';
    aliasedType: string;
}
export interface FunctionSymbol extends Symbol {
    kind: 'function';
    parameters: FunctionParameter[];
    returnType: string;
    isAsync: boolean;
    isGenerator: boolean;
    complexity: number;
    calls: string[];
}
export interface CoverageMetrics {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
}
export interface TestExecution {
    timestamp: Date;
    duration: number;
    status: 'passed' | 'failed' | 'skipped';
    error?: string;
    coverage?: CoverageMetrics;
}
export interface TestPerformanceMetrics {
    averageDuration: number;
    p95Duration: number;
    slowestRuns: number[];
    fastestRuns: number[];
}
export interface Test extends CodebaseEntity {
    type: 'test';
    testType: 'unit' | 'integration' | 'e2e';
    targetSymbol: string;
    framework: string;
    coverage: CoverageMetrics;
    status: 'passing' | 'failing' | 'skipped' | 'unknown';
    flakyScore: number;
    lastRunAt?: Date;
    lastDuration?: number;
    executionHistory: TestExecution[];
    performanceMetrics: TestPerformanceMetrics;
    dependencies: string[];
    tags: string[];
}
export interface Session {
    id: string;
    type: 'session';
    startTime: Date;
    endTime?: Date;
    agentType: string;
    userId?: string;
    changes: string[];
    specs: string[];
    status: 'active' | 'completed' | 'failed';
    metadata?: Record<string, any>;
}
export interface Spec extends CodebaseEntity {
    type: 'spec';
    title: string;
    description: string;
    acceptanceCriteria: string[];
    status: 'draft' | 'approved' | 'implemented' | 'deprecated';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string;
    tags?: string[];
    updated: Date;
}
export interface Change {
    id: string;
    type: 'change';
    changeType: 'create' | 'update' | 'delete' | 'rename' | 'move';
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
export interface Directory extends CodebaseEntity {
    type: 'directory';
    children: string[];
    fileCount: number;
    subdirectoryCount: number;
}
export interface Module extends CodebaseEntity {
    type: 'module';
    exports: string[];
    imports: string[];
    dependencies: string[];
    isEntryPoint: boolean;
}
export interface Version {
    id: string;
    type: 'version';
    entityId: string;
    hash: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface Checkpoint {
    id: string;
    type: 'checkpoint';
    checkpointId: string;
    timestamp: Date;
    hops: number;
    seedEntities: string[];
    metadata?: Record<string, any>;
}
export interface DocumentationNode extends CodebaseEntity {
    type: 'documentation';
    title: string;
    content: string;
}
export interface BusinessDomain {
    id: string;
    type: 'businessDomain';
    name: string;
    description?: string;
}
export interface SemanticCluster {
    id: string;
    type: 'semanticCluster';
    name: string;
    description?: string;
}
export interface SecurityIssueEntity extends CodebaseEntity {
    type: 'security-issue';
    severity: SecuritySeverity;
    ruleId: string;
    description: string;
    remediation: string;
    cwe?: string;
    owasp?: string;
    confidence: number;
    status: 'open' | 'closed' | 'suppressed';
    discoveredAt: Date;
    lastScanned: Date;
    affectedFile?: string;
    lineNumber?: number;
}
