import { GitService } from "./GitService.js";
import { KnowledgeGraphService } from "@memento/knowledge";
import { DatabaseService } from "@memento/core";
import type {
  CommitPRRequest,
  CommitPRResponse,
  SCMCommitRecord,
  SCMStatusSummary,
  SCMBranchInfo,
  SCMPushResult,
  SCMCommitLogEntry,
  ValidationResult,
} from "@memento/core";
import { RelationshipType } from "@memento/graph";
import type { GraphRelationship } from "@memento/graph";
import type { Change, Entity, Test, Spec } from "@memento/graph";
import {
  SCMProvider,
  SCMProviderResult,
  SCMProviderNotConfiguredError,
  SCMProviderPullRequestPayload,
} from "./SCMProvider.js";

type CommitValidation = {
  title: string;
  description: string;
  changes: string[];
};

export class ValidationError extends Error {
  public readonly details: string[];

  constructor(details: string[]) {
    super(details.join("; "));
    this.name = "ValidationError";
    this.details = details;
  }
}

export class SCMService {
  constructor(
    private readonly git: GitService,
    private readonly kgService: KnowledgeGraphService,
    private readonly dbService: DatabaseService,
    private readonly provider?: SCMProvider
  ) {}

  private gitMutex: Promise<void> = Promise.resolve();

  private async runWithGitLock<T>(operation: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.gitMutex;
    this.gitMutex = previous.then(() => next);

    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }

  async createCommitAndMaybePR(
    request: CommitPRRequest
  ): Promise<CommitPRResponse> {
    const normalized = this.validateCommitRequest(request);
    const shouldCreatePR = request.createPR !== false;

    if (shouldCreatePR && !this.provider) {
      throw new SCMProviderNotConfiguredError();
    }

    return this.runWithGitLock(async () => {
      if (!(await this.git.isAvailable())) {
        throw new Error("Git repository is not available");
      }

      const startingBranch = await this.git.getCurrentBranch();
      const branch =
        (request.branchName && request.branchName.trim()) ||
        (await this.git.getCurrentBranch()) ||
        "main";

      await this.git.ensureBranch(branch, startingBranch ?? undefined, {
        preservePaths: normalized.changes,
      });

      const existingStaged = await this.git.getStagedFiles();
      if (existingStaged.length) {
        const normalizePath = (value: string): string =>
          value.replace(/\\/g, "/").replace(/^\.\//, "");
        const requestedChanges = new Set(
          normalized.changes.map((change) => normalizePath(change))
        );
        const conflicting = existingStaged
          .map((path) => normalizePath(path))
          .filter((path) => !requestedChanges.has(path));

        if (conflicting.length) {
          throw new ValidationError([
            conflicting.length === 1
              ? `Staged change '${conflicting[0]}' is not included in this request. Unstage it or add it to the changes array before retrying.`
              : `Staged changes [${conflicting
                  .slice(0, 5)
                  .join(", ")}${
                  conflicting.length > 5 ? ", …" : ""
                }] are not included in this request. Unstage them or add them to the changes array before retrying.`,
          ]);
        }
      }

      let stagedFiles: string[] = [];
      let commitHash: string | null = null;
      let providerResult: SCMProviderResult | null = null;
      let providerError: unknown = null;
      let providerAttempts = 0;

      try {
        try {
          stagedFiles = await this.git.stageFiles(normalized.changes);
        } catch (error) {
          if (error instanceof Error) {
            throw new ValidationError([error.message]);
          }
          throw error;
        }

        const hasStagedChanges = await this.git.hasStagedChanges();
        if (!hasStagedChanges) {
          await this.git.unstageFiles(stagedFiles);
          throw new ValidationError([
            "No staged changes detected. Ensure the specified files include modifications.",
          ]);
        }

        const author = this.resolveAuthor();
        try {
          commitHash = await this.git.commit(
            normalized.title,
            normalized.description,
            { author }
          );
        } catch (error) {
          await this.git.unstageFiles(stagedFiles);
          if (error instanceof Error && /nothing to commit/i.test(error.message)) {
            throw new ValidationError([
              "No staged changes detected. Ensure the specified files include modifications.",
            ]);
          }
          throw error;
        }

        const commitDetails = await this.git.getCommitDetails(commitHash);
        const committedFiles = await this.git.getFilesForCommit(commitHash);
        const filesForRecord = committedFiles.length ? committedFiles : stagedFiles;
        const commitAuthor = commitDetails?.author ?? author.name;
        const commitAuthorEmail = commitDetails?.email ?? author.email;

        const validationResults = this.normalizeValidationResults(
          request.validationResults
        );

        const testResults = Array.isArray(request.testResults)
          ? request.testResults
              .filter((id) => typeof id === "string" && id.trim())
              .map((id) => id.trim())
          : [];

        const labels = Array.isArray(request.labels)
          ? request.labels
              .filter((label) => typeof label === "string" && label.trim())
              .map((label) => label.trim())
          : [];

        const metadata: Record<string, unknown> = {
          labels,
          createPR: shouldCreatePR,
          relatedSpecId: request.relatedSpecId,
          requestedChanges: normalized.changes,
          stagedFiles,
          commitSummary: normalized.title,
          commitAuthor,
          commitAuthorEmail,
        };

        const providerName = this.provider?.name ?? "local";
        metadata.provider = providerName;

        const createdAt = commitDetails?.date
          ? new Date(commitDetails.date)
          : new Date();

        if (!this.dbService.isInitialized()) {
          await this.dbService.initialize();
        }

        if (shouldCreatePR && this.provider) {
          const providerOutcome = await this.executeProviderWithRetry({
            branch,
            baseBranch: startingBranch,
            commitHash,
            title: normalized.title,
            description: normalized.description,
            changes: filesForRecord,
            metadata,
          });
          providerResult = providerOutcome.result ?? null;
          providerError = providerOutcome.error ?? null;
          providerAttempts = providerOutcome.attempts;

          metadata.providerAttempts = providerAttempts;
          if (providerOutcome.errorHistory.length) {
            metadata.providerErrorHistory = providerOutcome.errorHistory;
          }

          if (providerResult?.provider) {
            metadata.provider = providerResult.provider;
          }
          if (providerResult?.remote) {
            metadata.remote = providerResult.remote;
          }
          if (providerResult?.message) {
            metadata.providerMessage = providerResult.message;
          }
          if (providerResult?.metadata) {
            metadata.providerMetadata = providerResult.metadata;
          }
          if (providerError) {
            metadata.escalationRequired = true;
            metadata.escalationReason =
              "SCM provider failed after retry attempts";
            metadata.providerFailure = this.serializeProviderError(
              providerError,
              providerAttempts
            );
          }
        }

        if (typeof metadata.providerAttempts === "undefined") {
          metadata.providerAttempts = providerAttempts;
        }

        const status: SCMCommitRecord["status"] = providerError
          ? "failed"
          : shouldCreatePR
          ? providerResult?.pushed
            ? "pending"
            : "committed"
          : "committed";

        const commitRecord: SCMCommitRecord = {
          commitHash,
          branch,
          title: normalized.title,
          description: normalized.description || undefined,
          author: commitAuthor,
          changes: filesForRecord,
          relatedSpecId: request.relatedSpecId,
          testResults,
          validationResults: validationResults ?? undefined,
          prUrl: providerResult?.prUrl,
          provider:
            providerResult?.provider ?? (this.provider?.name ?? "local"),
          status,
          metadata,
          createdAt,
          updatedAt: createdAt,
        };

        await this.dbService.recordSCMCommit(commitRecord);

        const changeEntityId = `change:${commitHash}`;
        const changeEntity: Change = {
          id: changeEntityId,
          type: "change",
          changeType: "update",
          entityType: "commit",
          entityId: commitHash,
          timestamp: createdAt,
          author: author.name,
          commitHash,
          newState: {
            branch,
            title: normalized.title,
            description: normalized.description,
            files: filesForRecord,
          },
          specId: request.relatedSpecId,
        };

        await this.safeCreateChange(changeEntity);

        const specEntity = request.relatedSpecId
          ? ((await this.safeGetEntity(request.relatedSpecId)) as Spec | null)
          : null;

        const testEntities: Test[] = [];
        for (const testId of testResults) {
          const entity = await this.safeGetEntity(testId);
          if (entity && (entity as Test).type === "test") {
            testEntities.push(entity as Test);
          }
        }

        const now = createdAt;
        if (specEntity) {
          await this.safeCreateRelationship({
            fromEntityId: specEntity.id,
            toEntityId: changeEntityId,
            type: RelationshipType.MODIFIED_IN,
            created: now,
            lastModified: now,
            version: 1,
            changeType: "update",
            commitHash,
            metadata: {
              branch,
              title: normalized.title,
            },
          });
        }

        for (const testEntity of testEntities) {
          await this.safeCreateRelationship({
            fromEntityId: testEntity.id,
            toEntityId: changeEntityId,
            type: RelationshipType.MODIFIED_IN,
            created: now,
            lastModified: now,
            version: 1,
            changeType: "update",
            commitHash,
            metadata: {
              branch,
            },
          });
        }

        return {
          commitHash,
          prUrl: providerResult?.prUrl,
          branch,
          status,
          provider: commitRecord.provider,
          retryAttempts: providerAttempts,
          escalationRequired: Boolean(providerError),
          escalationMessage: providerError
            ? "Automated PR creation failed; manual intervention required"
            : undefined,
          providerError: providerError
            ? this.serializeProviderError(providerError, providerAttempts)
            : undefined,
          relatedArtifacts: {
            spec: specEntity,
            tests: testEntities,
            validation: validationResults ?? null,
          },
        };
      } catch (error) {
        if (!commitHash && stagedFiles.length) {
          try {
            await this.git.unstageFiles(stagedFiles);
          } catch {
            /* ignore unstage errors */
          }
        }
        throw error;
      } finally {
        if (startingBranch && startingBranch !== branch) {
          try {
            await this.git.ensureBranch(startingBranch);
          } catch (restoreError) {
            console.warn(
              "SCMService: failed to restore original branch",
              restoreError
            );
          }
        }
      }
    });
  }

  async getStatus(): Promise<SCMStatusSummary | null> {
    return this.git.getStatusSummary();
  }

  async listBranches(): Promise<SCMBranchInfo[]> {
    return this.git.listBranches();
  }

  async ensureBranch(name: string, from?: string): Promise<SCMBranchInfo> {
    const sanitized = name.trim();
    if (!sanitized) {
      throw new ValidationError(["branch name is required"]);
    }

    await this.git.ensureBranch(sanitized, from);

    const branches = await this.listBranches();
    const existing = branches.find((branch) => branch.name === sanitized);
    if (existing) {
      return existing;
    }

    return {
      name: sanitized,
      isCurrent: true,
      isRemote: false,
      upstream: from ? from.trim() || null : null,
      lastCommit: null,
    };
  }

  async push(options: {
    remote?: string;
    branch?: string;
    force?: boolean;
  } = {}): Promise<SCMPushResult> {
    const branchInput = options.branch ? options.branch.trim() : undefined;
    const branch = branchInput && branchInput.length
      ? branchInput
      : await this.git.getCurrentBranch();

    if (!branch) {
      throw new Error("Unable to determine branch to push");
    }

    const remoteInput = options.remote ? options.remote.trim() : undefined;
    const remote = remoteInput && remoteInput.length ? remoteInput : "origin";

    try {
      const result = await this.git.push(remote, branch, {
        force: options.force,
      });
      let commitHash: string | null = null;
      try {
        commitHash = await this.git.getCommitHash(branch);
      } catch {
        try {
          commitHash = await this.git.getCommitHash('HEAD');
        } catch {
          commitHash = null;
        }
      }
      return {
        remote,
        branch,
        forced: Boolean(options.force),
        pushed: true,
        commitHash: commitHash ?? undefined,
        provider: "local",
        message: result.output.trim() || "Push completed.",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Push failed: ${error.message}`);
      }
      throw error;
    }
  }

  async getDiff(options: {
    from?: string;
    to?: string;
    files?: string[];
    context?: number;
  } = {}): Promise<string | null> {
    return this.git.getDiff(options);
  }

  async getCommitLog(options: {
    limit?: number;
    author?: string;
    path?: string;
    since?: string;
    until?: string;
  } = {}): Promise<SCMCommitLogEntry[]> {
    return this.git.getCommitLog(options);
  }

  async getCommitRecord(commitHash: string): Promise<SCMCommitRecord | null> {
    return this.dbService.getSCMCommitByHash(commitHash);
  }

  async listCommitRecords(limit: number = 50): Promise<SCMCommitRecord[]> {
    return this.dbService.listSCMCommits(limit);
  }

  private validateCommitRequest(request: CommitPRRequest): CommitValidation {
    const errors: string[] = [];

    if (!request || typeof request !== "object") {
      errors.push("request body must be an object");
      throw new ValidationError(errors);
    }

    const title = typeof request.title === "string" ? request.title.trim() : "";
    if (!title) {
      errors.push("title is required");
    }

    const description =
      typeof request.description === "string"
        ? request.description.trim()
        : "";

    const changesInput = Array.isArray(request.changes)
      ? request.changes
      : [];
    const changes = changesInput
      .filter((value) => typeof value === "string" && value.trim())
      .map((value) => value.trim());

    if (!changes.length) {
      errors.push("changes must include at least one file path");
    }

    if (errors.length) {
      throw new ValidationError(errors);
    }

    return { title, description, changes };
  }

  private normalizeValidationResults(
    raw: unknown
  ): ValidationResult | Record<string, unknown> | null {
    if (raw === undefined || raw === null) {
      return null;
    }

    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return { raw } as Record<string, unknown>;
      }
    }

    if (typeof raw === "object") {
      return raw as Record<string, unknown>;
    }

    return null;
  }

  private resolveAuthor(): { name: string; email: string } {
    const name =
      process.env.GIT_AUTHOR_NAME ||
      process.env.GITHUB_ACTOR ||
      process.env.USER ||
      "memento-bot";

    const emailFromEnv =
      process.env.GIT_AUTHOR_EMAIL ||
      (process.env.GITHUB_ACTOR
        ? `${process.env.GITHUB_ACTOR}@users.noreply.github.com`
        : undefined);

    const email = emailFromEnv && emailFromEnv.trim().length
      ? emailFromEnv.trim()
      : "memento-bot@example.com";

    return { name, email };
  }

  private async safeGetEntity(entityId: string): Promise<Entity | null> {
    try {
      return await this.kgService.getEntity(entityId);
    } catch (error) {
      console.warn("SCMService: failed to fetch entity", entityId, error);
      return null;
    }
  }

  private async safeCreateChange(change: Change): Promise<void> {
    try {
      await this.kgService.createEntity(change as Entity);
    } catch (error) {
      console.warn("SCMService: failed to record change entity", error);
    }
  }

  private async safeCreateRelationship(
    rel: Partial<GraphRelationship> & {
      fromEntityId: string;
      toEntityId: string;
      type: RelationshipType;
    }
  ): Promise<void> {
    try {
      await this.kgService.createRelationship(rel as GraphRelationship);
    } catch (error) {
      console.warn("SCMService: failed to record relationship", error);
    }
  }

  private getProviderRetryLimit(): number {
    const raw = process.env.SCM_PROVIDER_MAX_RETRIES;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
    return 2;
  }

  private getProviderRetryDelay(): number {
    const raw = process.env.SCM_PROVIDER_RETRY_DELAY_MS;
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
    return 500;
  }

  private async sleep(ms: number): Promise<void> {
    if (ms <= 0) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeProviderWithRetry(
    payload: SCMProviderPullRequestPayload
  ): Promise<{
    result: SCMProviderResult | null;
    error?: unknown;
    attempts: number;
    errorHistory: Array<{ attempt: number; error: ReturnType<typeof this.serializeProviderError> }>;
  }> {
    const maxAttempts = Math.max(1, this.getProviderRetryLimit());
    const delayMs = this.getProviderRetryDelay();
    const errorHistory: Array<{
      attempt: number;
      error: ReturnType<typeof this.serializeProviderError>;
    }> = [];

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await this.provider!.preparePullRequest(payload);
        return {
          result,
          attempts: attempt,
          errorHistory,
        };
      } catch (error) {
        const serialized = this.serializeProviderError(error, attempt);
        errorHistory.push({ attempt, error: serialized });

        if (attempt >= maxAttempts) {
          return {
            result: null,
            error,
            attempts: attempt,
            errorHistory,
          };
        }

        await this.sleep(delayMs * attempt);
      }
    }

    return {
      result: null,
      attempts: maxAttempts,
      errorHistory,
    };
  }

  private serializeProviderError(
    error: unknown,
    attempt?: number
  ): {
    message: string;
    code?: string;
    lastAttempt?: number;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.name || undefined,
        lastAttempt: attempt,
      };
    }

    if (typeof error === "string") {
      return {
        message: error,
        lastAttempt: attempt,
      };
    }

    return {
      message: "Unknown provider error",
      lastAttempt: attempt,
    };
  }
}
