export interface TemporalValidationOptions {
    autoRepair: boolean;
    dryRun: boolean;
    batchSize: number;
    timelineLimit: number;
    logger?: (message: string, context?: Record<string, unknown>) => void;
}
export interface TemporalValidationReport {
    scannedEntities: number;
    inspectedVersions: number;
    repairedLinks: number;
    issues: Array<{
        repaired?: boolean;
        [key: string]: unknown;
    }>;
}
export interface ITemporalHistoryValidator {
    validate(options: TemporalValidationOptions): Promise<TemporalValidationReport>;
}
