import { RelationshipType } from "../../models/relationships.js";
import { SCMProviderNotConfiguredError, } from "./SCMProvider.js";
export class ValidationError extends Error {
    constructor(details) {
        super(details.join("; "));
        this.name = "ValidationError";
        this.details = details;
    }
}
export class SCMService {
    constructor(git, kgService, dbService, provider) {
        this.git = git;
        this.kgService = kgService;
        this.dbService = dbService;
        this.provider = provider;
        this.gitMutex = Promise.resolve();
    }
    async runWithGitLock(operation) {
        let release = () => { };
        const next = new Promise((resolve) => {
            release = resolve;
        });
        const previous = this.gitMutex;
        this.gitMutex = previous.then(() => next);
        await previous;
        try {
            return await operation();
        }
        finally {
            release();
        }
    }
    async createCommitAndMaybePR(request) {
        const normalized = this.validateCommitRequest(request);
        const shouldCreatePR = request.createPR !== false;
        if (shouldCreatePR && !this.provider) {
            throw new SCMProviderNotConfiguredError();
        }
        return this.runWithGitLock(async () => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            if (!(await this.git.isAvailable())) {
                throw new Error("Git repository is not available");
            }
            const startingBranch = await this.git.getCurrentBranch();
            const branch = (request.branchName && request.branchName.trim()) ||
                (await this.git.getCurrentBranch()) ||
                "main";
            await this.git.ensureBranch(branch, startingBranch !== null && startingBranch !== void 0 ? startingBranch : undefined, {
                preservePaths: normalized.changes,
            });
            const existingStaged = await this.git.getStagedFiles();
            if (existingStaged.length) {
                const normalizePath = (value) => value.replace(/\\/g, "/").replace(/^\.\//, "");
                const requestedChanges = new Set(normalized.changes.map((change) => normalizePath(change)));
                const conflicting = existingStaged
                    .map((path) => normalizePath(path))
                    .filter((path) => !requestedChanges.has(path));
                if (conflicting.length) {
                    throw new ValidationError([
                        conflicting.length === 1
                            ? `Staged change '${conflicting[0]}' is not included in this request. Unstage it or add it to the changes array before retrying.`
                            : `Staged changes [${conflicting
                                .slice(0, 5)
                                .join(", ")}${conflicting.length > 5 ? ", …" : ""}] are not included in this request. Unstage them or add them to the changes array before retrying.`,
                    ]);
                }
            }
            let stagedFiles = [];
            let commitHash = null;
            let providerResult = null;
            let providerError = null;
            let providerAttempts = 0;
            try {
                try {
                    stagedFiles = await this.git.stageFiles(normalized.changes);
                }
                catch (error) {
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
                    commitHash = await this.git.commit(normalized.title, normalized.description, { author });
                }
                catch (error) {
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
                const commitAuthor = (_a = commitDetails === null || commitDetails === void 0 ? void 0 : commitDetails.author) !== null && _a !== void 0 ? _a : author.name;
                const commitAuthorEmail = (_b = commitDetails === null || commitDetails === void 0 ? void 0 : commitDetails.email) !== null && _b !== void 0 ? _b : author.email;
                const validationResults = this.normalizeValidationResults(request.validationResults);
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
                const metadata = {
                    labels,
                    createPR: shouldCreatePR,
                    relatedSpecId: request.relatedSpecId,
                    requestedChanges: normalized.changes,
                    stagedFiles,
                    commitSummary: normalized.title,
                    commitAuthor,
                    commitAuthorEmail,
                };
                const providerName = (_d = (_c = this.provider) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "local";
                metadata.provider = providerName;
                const createdAt = (commitDetails === null || commitDetails === void 0 ? void 0 : commitDetails.date)
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
                    providerResult = (_e = providerOutcome.result) !== null && _e !== void 0 ? _e : null;
                    providerError = (_f = providerOutcome.error) !== null && _f !== void 0 ? _f : null;
                    providerAttempts = providerOutcome.attempts;
                    metadata.providerAttempts = providerAttempts;
                    if (providerOutcome.errorHistory.length) {
                        metadata.providerErrorHistory = providerOutcome.errorHistory;
                    }
                    if (providerResult === null || providerResult === void 0 ? void 0 : providerResult.provider) {
                        metadata.provider = providerResult.provider;
                    }
                    if (providerResult === null || providerResult === void 0 ? void 0 : providerResult.remote) {
                        metadata.remote = providerResult.remote;
                    }
                    if (providerResult === null || providerResult === void 0 ? void 0 : providerResult.message) {
                        metadata.providerMessage = providerResult.message;
                    }
                    if (providerResult === null || providerResult === void 0 ? void 0 : providerResult.metadata) {
                        metadata.providerMetadata = providerResult.metadata;
                    }
                    if (providerError) {
                        metadata.escalationRequired = true;
                        metadata.escalationReason =
                            "SCM provider failed after retry attempts";
                        metadata.providerFailure = this.serializeProviderError(providerError, providerAttempts);
                    }
                }
                if (typeof metadata.providerAttempts === "undefined") {
                    metadata.providerAttempts = providerAttempts;
                }
                const status = providerError
                    ? "failed"
                    : shouldCreatePR
                        ? (providerResult === null || providerResult === void 0 ? void 0 : providerResult.pushed)
                            ? "pending"
                            : "committed"
                        : "committed";
                const commitRecord = {
                    commitHash,
                    branch,
                    title: normalized.title,
                    description: normalized.description || undefined,
                    author: commitAuthor,
                    changes: filesForRecord,
                    relatedSpecId: request.relatedSpecId,
                    testResults,
                    validationResults: validationResults !== null && validationResults !== void 0 ? validationResults : undefined,
                    prUrl: providerResult === null || providerResult === void 0 ? void 0 : providerResult.prUrl,
                    provider: (_g = providerResult === null || providerResult === void 0 ? void 0 : providerResult.provider) !== null && _g !== void 0 ? _g : ((_j = (_h = this.provider) === null || _h === void 0 ? void 0 : _h.name) !== null && _j !== void 0 ? _j : "local"),
                    status,
                    metadata,
                    createdAt,
                    updatedAt: createdAt,
                };
                await this.dbService.recordSCMCommit(commitRecord);
                const changeEntityId = `change:${commitHash}`;
                const changeEntity = {
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
                    ? (await this.safeGetEntity(request.relatedSpecId))
                    : null;
                const testEntities = [];
                for (const testId of testResults) {
                    const entity = await this.safeGetEntity(testId);
                    if (entity && entity.type === "test") {
                        testEntities.push(entity);
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
                    prUrl: providerResult === null || providerResult === void 0 ? void 0 : providerResult.prUrl,
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
                        validation: validationResults !== null && validationResults !== void 0 ? validationResults : null,
                    },
                };
            }
            catch (error) {
                if (!commitHash && stagedFiles.length) {
                    try {
                        await this.git.unstageFiles(stagedFiles);
                    }
                    catch (_k) {
                        /* ignore unstage errors */
                    }
                }
                throw error;
            }
            finally {
                if (startingBranch && startingBranch !== branch) {
                    try {
                        await this.git.ensureBranch(startingBranch);
                    }
                    catch (restoreError) {
                        console.warn("SCMService: failed to restore original branch", restoreError);
                    }
                }
            }
        });
    }
    async getStatus() {
        return this.git.getStatusSummary();
    }
    async listBranches() {
        return this.git.listBranches();
    }
    async ensureBranch(name, from) {
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
    async push(options = {}) {
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
            let commitHash = null;
            try {
                commitHash = await this.git.getCommitHash(branch);
            }
            catch (_a) {
                try {
                    commitHash = await this.git.getCommitHash('HEAD');
                }
                catch (_b) {
                    commitHash = null;
                }
            }
            return {
                remote,
                branch,
                forced: Boolean(options.force),
                pushed: true,
                commitHash: commitHash !== null && commitHash !== void 0 ? commitHash : undefined,
                provider: "local",
                message: result.output.trim() || "Push completed.",
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Push failed: ${error.message}`);
            }
            throw error;
        }
    }
    async getDiff(options = {}) {
        return this.git.getDiff(options);
    }
    async getCommitLog(options = {}) {
        return this.git.getCommitLog(options);
    }
    async getCommitRecord(commitHash) {
        return this.dbService.getSCMCommitByHash(commitHash);
    }
    async listCommitRecords(limit = 50) {
        return this.dbService.listSCMCommits(limit);
    }
    validateCommitRequest(request) {
        const errors = [];
        if (!request || typeof request !== "object") {
            errors.push("request body must be an object");
            throw new ValidationError(errors);
        }
        const title = typeof request.title === "string" ? request.title.trim() : "";
        if (!title) {
            errors.push("title is required");
        }
        const description = typeof request.description === "string"
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
    normalizeValidationResults(raw) {
        if (raw === undefined || raw === null) {
            return null;
        }
        if (typeof raw === "string") {
            try {
                return JSON.parse(raw);
            }
            catch (_a) {
                return { raw };
            }
        }
        if (typeof raw === "object") {
            return raw;
        }
        return null;
    }
    resolveAuthor() {
        const name = process.env.GIT_AUTHOR_NAME ||
            process.env.GITHUB_ACTOR ||
            process.env.USER ||
            "memento-bot";
        const emailFromEnv = process.env.GIT_AUTHOR_EMAIL ||
            (process.env.GITHUB_ACTOR
                ? `${process.env.GITHUB_ACTOR}@users.noreply.github.com`
                : undefined);
        const email = emailFromEnv && emailFromEnv.trim().length
            ? emailFromEnv.trim()
            : "memento-bot@example.com";
        return { name, email };
    }
    async safeGetEntity(entityId) {
        try {
            return await this.kgService.getEntity(entityId);
        }
        catch (error) {
            console.warn("SCMService: failed to fetch entity", entityId, error);
            return null;
        }
    }
    async safeCreateChange(change) {
        try {
            await this.kgService.createEntity(change);
        }
        catch (error) {
            console.warn("SCMService: failed to record change entity", error);
        }
    }
    async safeCreateRelationship(rel) {
        try {
            await this.kgService.createRelationship(rel);
        }
        catch (error) {
            console.warn("SCMService: failed to record relationship", error);
        }
    }
    getProviderRetryLimit() {
        const raw = process.env.SCM_PROVIDER_MAX_RETRIES;
        const parsed = raw ? Number.parseInt(raw, 10) : NaN;
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
        return 2;
    }
    getProviderRetryDelay() {
        const raw = process.env.SCM_PROVIDER_RETRY_DELAY_MS;
        const parsed = raw ? Number.parseInt(raw, 10) : NaN;
        if (Number.isFinite(parsed) && parsed >= 0) {
            return parsed;
        }
        return 500;
    }
    async sleep(ms) {
        if (ms <= 0) {
            return;
        }
        await new Promise((resolve) => setTimeout(resolve, ms));
    }
    async executeProviderWithRetry(payload) {
        const maxAttempts = Math.max(1, this.getProviderRetryLimit());
        const delayMs = this.getProviderRetryDelay();
        const errorHistory = [];
        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
            try {
                const result = await this.provider.preparePullRequest(payload);
                return {
                    result,
                    attempts: attempt,
                    errorHistory,
                };
            }
            catch (error) {
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
    serializeProviderError(error, attempt) {
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
//# sourceMappingURL=SCMService.js.map