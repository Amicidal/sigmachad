export interface SCMProviderPushOptions {
    remote?: string;
    force?: boolean;
}
export interface SCMProviderPullRequestPayload {
    branch: string;
    baseBranch?: string | null;
    commitHash: string;
    title: string;
    description?: string;
    changes: string[];
    metadata?: Record<string, unknown>;
    push?: SCMProviderPushOptions;
}
export interface SCMProviderResult {
    provider: string;
    remote?: string;
    pushed: boolean;
    message?: string;
    prUrl?: string;
    metadata?: Record<string, unknown>;
}
export interface SCMProvider {
    readonly name: string;
    preparePullRequest(payload: SCMProviderPullRequestPayload): Promise<SCMProviderResult>;
}
export declare class SCMProviderError extends Error {
    constructor(message: string);
}
export declare class SCMProviderNotConfiguredError extends SCMProviderError {
    constructor();
}
//# sourceMappingURL=SCMProvider.d.ts.map