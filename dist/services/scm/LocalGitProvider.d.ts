import { GitService } from "./GitService.js";
import { SCMProvider, SCMProviderPullRequestPayload, SCMProviderResult } from "./SCMProvider.js";
export interface LocalGitProviderOptions {
    remote?: string;
}
export declare class LocalGitProvider implements SCMProvider {
    private readonly git;
    private readonly options;
    readonly name = "local";
    constructor(git: GitService, options?: LocalGitProviderOptions);
    preparePullRequest(payload: SCMProviderPullRequestPayload): Promise<SCMProviderResult>;
    private buildLocalPullRequestUrl;
}
//# sourceMappingURL=LocalGitProvider.d.ts.map