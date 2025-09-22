import { GitService } from "./scm/GitService.js";
import { KnowledgeGraphService } from "./knowledge/KnowledgeGraphService.js";
import { DatabaseService } from "./core/DatabaseService.js";
import type { CommitPRRequest, CommitPRResponse, SCMCommitRecord, SCMStatusSummary, SCMBranchInfo, SCMPushResult, SCMCommitLogEntry } from "../models/types.js";
import { SCMProvider } from "./scm/SCMProvider.js";
export declare class ValidationError extends Error {
    readonly details: string[];
    constructor(details: string[]);
}
export declare class SCMService {
    private readonly git;
    private readonly kgService;
    private readonly dbService;
    private readonly provider?;
    constructor(git: GitService, kgService: KnowledgeGraphService, dbService: DatabaseService, provider?: SCMProvider);
    private gitMutex;
    private runWithGitLock;
    createCommitAndMaybePR(request: CommitPRRequest): Promise<CommitPRResponse>;
    getStatus(): Promise<SCMStatusSummary | null>;
    listBranches(): Promise<SCMBranchInfo[]>;
    ensureBranch(name: string, from?: string): Promise<SCMBranchInfo>;
    push(options?: {
        remote?: string;
        branch?: string;
        force?: boolean;
    }): Promise<SCMPushResult>;
    getDiff(options?: {
        from?: string;
        to?: string;
        files?: string[];
        context?: number;
    }): Promise<string | null>;
    getCommitLog(options?: {
        limit?: number;
        author?: string;
        path?: string;
        since?: string;
        until?: string;
    }): Promise<SCMCommitLogEntry[]>;
    getCommitRecord(commitHash: string): Promise<SCMCommitRecord | null>;
    listCommitRecords(limit?: number): Promise<SCMCommitRecord[]>;
    private validateCommitRequest;
    private normalizeValidationResults;
    private resolveAuthor;
    private safeGetEntity;
    private safeCreateChange;
    private safeCreateRelationship;
    private getProviderRetryLimit;
    private getProviderRetryDelay;
    private sleep;
    private executeProviderWithRetry;
    private serializeProviderError;
}
//# sourceMappingURL=SCMService.d.ts.map