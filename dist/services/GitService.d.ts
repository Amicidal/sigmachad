export interface CommitInfo {
    hash: string;
    author: string;
    email?: string;
    date?: string;
}
export declare class GitService {
    private cwd;
    constructor(cwd?: string);
    isAvailable(): Promise<boolean>;
    getLastCommitInfo(fileRelativePath: string): Promise<CommitInfo | null>;
    getNumStatAgainstHEAD(fileRelativePath: string): Promise<{
        added: number;
        deleted: number;
    } | null>;
    getUnifiedDiff(fileRelativePath: string, context?: number): Promise<string | null>;
}
//# sourceMappingURL=GitService.d.ts.map