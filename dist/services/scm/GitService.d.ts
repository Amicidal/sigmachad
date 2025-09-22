import type { SCMStatusSummary, SCMBranchInfo, SCMCommitLogEntry } from "../models/types.js";
export interface CommitInfo {
    hash: string;
    author: string;
    email?: string;
    date?: string;
}
export declare class GitService {
    private cwd;
    constructor(cwd?: string);
    private runGit;
    private resolvePath;
    isAvailable(): Promise<boolean>;
    getLastCommitInfo(fileRelativePath: string): Promise<CommitInfo | null>;
    getNumStatAgainstHEAD(fileRelativePath: string): Promise<{
        added: number;
        deleted: number;
    } | null>;
    getUnifiedDiff(fileRelativePath: string, context?: number): Promise<string | null>;
    getCurrentBranch(): Promise<string | null>;
    getRemoteUrl(remote: string): Promise<string | null>;
    stageFiles(paths: string[]): Promise<string[]>;
    unstageFiles(paths: string[]): Promise<void>;
    hasStagedChanges(): Promise<boolean>;
    getStagedFiles(): Promise<string[]>;
    getCommitHash(ref?: string): Promise<string | null>;
    commit(title: string, body: string, options?: {
        allowEmpty?: boolean;
        author?: {
            name: string;
            email?: string;
        };
    }): Promise<string>;
    private branchExists;
    private hasUpstream;
    ensureBranch(name: string, from?: string, options?: {
        preservePaths?: string[];
    }): Promise<void>;
    private switchWithStashSupport;
    private stashWorkingChanges;
    private restoreStash;
    private isCheckoutConflictError;
    getCommitDetails(ref: string): Promise<SCMCommitLogEntry | null>;
    getFilesForCommit(commitHash: string): Promise<string[]>;
    push(remote: string, branch: string, options?: {
        force?: boolean;
    }): Promise<{
        output: string;
    }>;
    getStatusSummary(): Promise<SCMStatusSummary | null>;
    listBranches(): Promise<SCMBranchInfo[]>;
    getCommitLog(options?: {
        limit?: number;
        author?: string;
        path?: string;
        since?: string;
        until?: string;
    }): Promise<SCMCommitLogEntry[]>;
    getDiff(options?: {
        from?: string;
        to?: string;
        files?: string[];
        context?: number;
    }): Promise<string | null>;
}
//# sourceMappingURL=GitService.d.ts.map