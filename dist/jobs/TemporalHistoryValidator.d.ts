import { KnowledgeGraphService } from "../services/knowledge/KnowledgeGraphService.js";
export type TemporalValidationIssueType = "missing_previous" | "misordered_previous" | "unexpected_head";
export interface TemporalValidationIssue {
    entityId: string;
    versionId: string;
    type: TemporalValidationIssueType;
    expectedPreviousId?: string;
    actualPreviousId?: string | null;
    message?: string;
    repaired?: boolean;
}
export interface TemporalValidationReport {
    scannedEntities: number;
    inspectedVersions: number;
    repairedLinks: number;
    issues: TemporalValidationIssue[];
}
export interface TemporalValidationOptions {
    batchSize?: number;
    maxEntities?: number;
    timelineLimit?: number;
    autoRepair?: boolean;
    dryRun?: boolean;
    logger?: (message: string, context?: Record<string, unknown>) => void;
}
export declare class TemporalHistoryValidator {
    private readonly kgService;
    constructor(kgService: KnowledgeGraphService);
    validate(options?: TemporalValidationOptions): Promise<TemporalValidationReport>;
    private evaluateTimeline;
    private repairMissingLinks;
}
//# sourceMappingURL=TemporalHistoryValidator.d.ts.map