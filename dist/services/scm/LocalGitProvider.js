import { SCMProviderError, } from "./SCMProvider.js";
export class LocalGitProvider {
    constructor(git, options = {}) {
        this.git = git;
        this.options = options;
        this.name = "local";
    }
    async preparePullRequest(payload) {
        var _a, _b, _c;
        const remoteName = ((_a = payload.push) === null || _a === void 0 ? void 0 : _a.remote) || this.options.remote || "origin";
        let remoteUrl = null;
        try {
            remoteUrl = await this.git.getRemoteUrl(remoteName);
        }
        catch (error) {
            throw new SCMProviderError(`Remote '${remoteName}' is not configured: ${error instanceof Error ? error.message : String(error)}`);
        }
        if (!remoteUrl) {
            throw new SCMProviderError(`Remote '${remoteName}' URL could not be determined`);
        }
        const pushResult = await this.git.push(remoteName, payload.branch, {
            force: (_b = payload.push) === null || _b === void 0 ? void 0 : _b.force,
        });
        const message = pushResult.output.trim();
        const url = this.buildLocalPullRequestUrl(remoteUrl, payload.branch, payload.commitHash);
        return {
            provider: this.name,
            remote: remoteName,
            pushed: true,
            message,
            prUrl: url,
            metadata: {
                remoteUrl,
                push: {
                    remote: remoteName,
                    branch: payload.branch,
                    force: ((_c = payload.push) === null || _c === void 0 ? void 0 : _c.force) || false,
                },
            },
        };
    }
    buildLocalPullRequestUrl(remoteUrl, branch, commitHash) {
        const cleanedRemote = remoteUrl.replace(/\.git$/i, "");
        const encodedBranch = encodeURIComponent(branch);
        return `${cleanedRemote}#${encodedBranch}:${commitHash}`;
    }
}
//# sourceMappingURL=LocalGitProvider.js.map