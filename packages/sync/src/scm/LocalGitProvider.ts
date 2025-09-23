import { GitService } from "./GitService.js";
import {
  SCMProvider,
  SCMProviderPullRequestPayload,
  SCMProviderResult,
  SCMProviderError,
} from "./SCMProvider.js";

export interface LocalGitProviderOptions {
  remote?: string;
}

export class LocalGitProvider implements SCMProvider {
  public readonly name = "local";

  constructor(
    private readonly git: GitService,
    private readonly options: LocalGitProviderOptions = {}
  ) {}

  async preparePullRequest(
    payload: SCMProviderPullRequestPayload
  ): Promise<SCMProviderResult> {
    const remoteName = payload.push?.remote || this.options.remote || "origin";

    let remoteUrl: string | null = null;
    try {
      remoteUrl = await this.git.getRemoteUrl(remoteName);
    } catch (error) {
      throw new SCMProviderError(
        `Remote '${remoteName}' is not configured: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    if (!remoteUrl) {
      throw new SCMProviderError(
        `Remote '${remoteName}' URL could not be determined`
      );
    }

    const pushResult = await this.git.push(remoteName, payload.branch, {
      force: payload.push?.force,
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
          force: payload.push?.force || false,
        },
      },
    };
  }

  private buildLocalPullRequestUrl(
    remoteUrl: string,
    branch: string,
    commitHash: string
  ): string {
    const cleanedRemote = remoteUrl.replace(/\.git$/i, "");
    const encodedBranch = encodeURIComponent(branch);
    return `${cleanedRemote}#${encodedBranch}:${commitHash}`;
  }
}
