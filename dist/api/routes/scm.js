/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */
var _a;
import path from "path";
import { GitService } from "../../services/scm/GitService.js";
import { SCMService, ValidationError } from "../../services/scm/SCMService.js";
import { LocalGitProvider } from "../../services/scm/LocalGitProvider.js";
import { SCMProviderNotConfiguredError } from "../../services/scm/SCMProvider.js";
const SCM_FEATURE_FLAG = String((_a = process.env.FEATURE_SCM) !== null && _a !== void 0 ? _a : "true").toLowerCase();
const SCM_FEATURE_ENABLED = !["0", "false", "off"].includes(SCM_FEATURE_FLAG);
const respondNotImplemented = (reply, message = "Feature is not available in this build.") => {
    reply.status(501).send({
        success: false,
        error: {
            code: "NOT_IMPLEMENTED",
            message,
        },
    });
};
const respondValidationError = (reply, error) => {
    reply.status(400).send({
        success: false,
        error: {
            code: "VALIDATION_ERROR",
            message: error.message,
            details: error.details,
        },
    });
};
const respondServerError = (reply, error, code = "SCM_ERROR") => {
    const message = error instanceof Error ? error.message : "Unexpected SCM service error";
    reply.status(500).send({
        success: false,
        error: {
            code,
            message,
        },
    });
};
export async function registerSCMRoutes(app, kgService, dbService) {
    const gitWorkdirEnv = process.env.SCM_GIT_WORKDIR;
    const gitWorkdir = gitWorkdirEnv
        ? path.resolve(gitWorkdirEnv)
        : undefined;
    const gitService = new GitService(gitWorkdir);
    const remoteName = process.env.SCM_REMOTE || process.env.SCM_REMOTE_NAME;
    const provider = SCM_FEATURE_ENABLED && kgService && dbService
        ? new LocalGitProvider(gitService, { remote: remoteName })
        : null;
    const scmService = SCM_FEATURE_ENABLED && kgService && dbService
        ? new SCMService(gitService, kgService, dbService, provider !== null && provider !== void 0 ? provider : undefined)
        : null;
    const ensureService = (reply) => {
        if (!SCM_FEATURE_ENABLED || !scmService) {
            respondNotImplemented(reply);
            return null;
        }
        return scmService;
    };
    app.post("/scm/commit-pr", {
        schema: {
            body: {
                type: "object",
                required: ["title", "changes"],
                additionalProperties: false,
                properties: {
                    title: { type: "string", minLength: 1 },
                    description: { type: "string" },
                    changes: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                        minItems: 1,
                    },
                    relatedSpecId: { type: "string" },
                    testResults: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                    },
                    validationResults: {
                        anyOf: [{ type: "string" }, { type: "object" }],
                    },
                    createPR: { type: "boolean", default: true },
                    branchName: { type: "string", minLength: 1 },
                    labels: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                    },
                },
            },
        },
    }, async (request, reply) => {
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const payload = { ...request.body };
            if (payload.createPR === undefined) {
                payload.createPR = true;
            }
            const result = await service.createCommitAndMaybePR(payload);
            reply.send({ success: true, data: result });
        }
        catch (error) {
            if (error instanceof ValidationError) {
                respondValidationError(reply, error);
                return;
            }
            if (error instanceof SCMProviderNotConfiguredError) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: "SCM_PROVIDER_NOT_CONFIGURED",
                        message: error.message,
                    },
                });
                return;
            }
            respondServerError(reply, error);
        }
    });
    app.post("/scm/commit", {
        schema: {
            body: {
                type: "object",
                required: [],
                additionalProperties: false,
                properties: {
                    title: { type: "string" },
                    message: { type: "string" },
                    description: { type: "string" },
                    body: { type: "string" },
                    changes: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                    },
                    files: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                    },
                    branch: { type: "string" },
                    branchName: { type: "string" },
                    labels: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                    },
                    relatedSpecId: { type: "string" },
                    testResults: {
                        type: "array",
                        items: { type: "string", minLength: 1 },
                    },
                    validationResults: {
                        anyOf: [{ type: "string" }, { type: "object" }],
                    },
                },
            },
        },
    }, async (request, reply) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const service = ensureService(reply);
        if (!service)
            return;
        const body = (_a = request.body) !== null && _a !== void 0 ? _a : {};
        const applyArray = (value) => Array.isArray(value)
            ? value
                .filter((item) => typeof item === "string")
                .map((item) => item.trim())
                .filter(Boolean)
            : [];
        const commitRequest = {
            title: String((_c = (_b = body.title) !== null && _b !== void 0 ? _b : body.message) !== null && _c !== void 0 ? _c : ""),
            description: String((_e = (_d = body.description) !== null && _d !== void 0 ? _d : body.body) !== null && _e !== void 0 ? _e : ""),
            changes: applyArray(body.changes).length
                ? applyArray(body.changes)
                : applyArray(body.files),
            branchName: (_g = (_f = body.branchName) !== null && _f !== void 0 ? _f : body.branch) !== null && _g !== void 0 ? _g : undefined,
            labels: applyArray(body.labels),
            relatedSpecId: (_h = body.relatedSpecId) !== null && _h !== void 0 ? _h : undefined,
            testResults: applyArray(body.testResults),
            validationResults: body.validationResults,
            createPR: false,
        };
        try {
            const result = await service.createCommitAndMaybePR(commitRequest);
            reply.send({ success: true, data: result });
        }
        catch (error) {
            if (error instanceof ValidationError) {
                respondValidationError(reply, error);
                return;
            }
            if (error instanceof SCMProviderNotConfiguredError) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: "SCM_PROVIDER_NOT_CONFIGURED",
                        message: error.message,
                    },
                });
                return;
            }
            respondServerError(reply, error);
        }
    });
    app.get("/scm/status", async (_request, reply) => {
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const status = await service.getStatus();
            if (!status) {
                reply.status(503).send({
                    success: false,
                    error: {
                        code: "SCM_UNAVAILABLE",
                        message: "Git repository is not available",
                    },
                });
                return;
            }
            reply.send({ success: true, data: status });
        }
        catch (error) {
            respondServerError(reply, error);
        }
    });
    app.post("/scm/push", {
        schema: {
            body: {
                type: "object",
                additionalProperties: false,
                properties: {
                    remote: { type: "string" },
                    branch: { type: "string" },
                    force: { type: "boolean" },
                },
            },
        },
    }, async (request, reply) => {
        var _a;
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const result = await service.push((_a = request.body) !== null && _a !== void 0 ? _a : {});
            reply.send({ success: true, data: result });
        }
        catch (error) {
            respondServerError(reply, error);
        }
    });
    app.get("/scm/branches", async (_request, reply) => {
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const branches = await service.listBranches();
            reply.send({ success: true, data: branches });
        }
        catch (error) {
            respondServerError(reply, error);
        }
    });
    app.post("/scm/branch", {
        schema: {
            body: {
                type: "object",
                required: ["name"],
                additionalProperties: false,
                properties: {
                    name: { type: "string", minLength: 1 },
                    from: { type: "string" },
                },
            },
        },
    }, async (request, reply) => {
        var _a;
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const { name, from } = (_a = request.body) !== null && _a !== void 0 ? _a : {};
            const branch = await service.ensureBranch(String(name), from);
            reply.send({ success: true, data: branch });
        }
        catch (error) {
            if (error instanceof ValidationError) {
                respondValidationError(reply, error);
                return;
            }
            respondServerError(reply, error);
        }
    });
    app.get("/scm/changes", {
        schema: {
            querystring: {
                type: "object",
                properties: {
                    limit: { type: "number", minimum: 1, maximum: 200, default: 20 },
                },
            },
        },
    }, async (request, reply) => {
        var _a, _b;
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const rawLimit = Number((_b = (_a = request.query) === null || _a === void 0 ? void 0 : _a.limit) !== null && _b !== void 0 ? _b : 20);
            const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
            const records = await service.listCommitRecords(limit);
            reply.send({ success: true, data: records });
        }
        catch (error) {
            respondServerError(reply, error);
        }
    });
    app.get("/scm/diff", {
        schema: {
            querystring: {
                type: "object",
                properties: {
                    from: { type: "string" },
                    to: { type: "string" },
                    files: { type: "string" },
                    context: { type: "number", minimum: 0, maximum: 20, default: 3 },
                },
            },
        },
    }, async (request, reply) => {
        var _a;
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const query = (_a = request.query) !== null && _a !== void 0 ? _a : {};
            const files = typeof query.files === "string"
                ? query.files
                    .split(",")
                    .map((file) => file.trim())
                    .filter(Boolean)
                : undefined;
            const diff = await service.getDiff({
                from: query.from,
                to: query.to,
                files,
                context: query.context,
            });
            reply.send({ success: true, data: { diff } });
        }
        catch (error) {
            respondServerError(reply, error);
        }
    });
    app.get("/scm/log", {
        schema: {
            querystring: {
                type: "object",
                properties: {
                    author: { type: "string" },
                    path: { type: "string" },
                    since: { type: "string" },
                    until: { type: "string" },
                    limit: { type: "number", minimum: 1, maximum: 200, default: 20 },
                },
            },
        },
    }, async (request, reply) => {
        var _a;
        const service = ensureService(reply);
        if (!service)
            return;
        try {
            const query = (_a = request.query) !== null && _a !== void 0 ? _a : {};
            let limitValue;
            if (query.limit !== undefined) {
                const parsed = Number(query.limit);
                if (Number.isFinite(parsed)) {
                    const bounded = Math.max(1, Math.min(Math.floor(parsed), 200));
                    limitValue = bounded;
                }
            }
            const logs = await service.getCommitLog({
                author: query.author,
                path: query.path,
                since: query.since,
                until: query.until,
                limit: limitValue,
            });
            reply.send({ success: true, data: logs });
        }
        catch (error) {
            respondServerError(reply, error);
        }
    });
}
//# sourceMappingURL=scm.js.map