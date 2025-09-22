export interface BackupMetricParams {
    status: "success" | "failure";
    durationMs: number;
    type: "full" | "incremental";
    storageProviderId: string;
    sizeBytes?: number;
}
export interface RestoreMetricParams {
    mode: "preview" | "apply";
    status: "success" | "failure";
    durationMs: number;
    requiresApproval: boolean;
    storageProviderId?: string;
    backupId?: string;
}
export interface MaintenanceTaskMetricParams {
    taskType: string;
    status: "success" | "failure";
    durationMs: number;
}
export interface RestoreApprovalMetricParams {
    status: "approved" | "rejected";
}
export declare class MaintenanceMetrics {
    private static instance;
    private readonly histogramBuckets;
    private backupCounters;
    private backupHistograms;
    private restoreCounters;
    private restoreHistograms;
    private taskCounters;
    private approvalCounters;
    private lastUpdated;
    private summary;
    static getInstance(): MaintenanceMetrics;
    recordBackup(params: BackupMetricParams): void;
    recordRestore(params: RestoreMetricParams): void;
    recordMaintenanceTask(params: MaintenanceTaskMetricParams): void;
    recordRestoreApproval(params: RestoreApprovalMetricParams): void;
    getSummary(): Record<string, unknown>;
    toPrometheus(): string;
    private incrementCounter;
    private observeHistogram;
    private renderHistograms;
    private promLabels;
    private labelKey;
    private getOrCreate;
    private touch;
}
//# sourceMappingURL=MaintenanceMetrics.d.ts.map