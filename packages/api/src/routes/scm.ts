/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */

import { FastifyInstance } from "fastify";
import path from "path";
import { KnowledgeGraphService } from "../../../dist/services/knowledge/index.js";
import { DatabaseService } from "../../../dist/services/core/index.js";
import { GitService } from "../../../dist/services/synchronization/index.js";
import { SCMService, ValidationError } from "../../../dist/services/synchronization/index.js";
import { LocalGitProvider } from "../../../dist/services/synchronization/index.js";
import { SCMProviderNotConfiguredError } from "../../../dist/services/synchronization/index.js";
import type { CommitPRRequest } from "../../../dist/services/core/index.js";

const SCM_FEATURE_FLAG = String(process.env.FEATURE_SCM ?? "true").toLowerCase();
const SCM_FEATURE_ENABLED = !["0", "false", "off"].includes(SCM_FEATURE_FLAG);

type ReplyLike = {
  status: (code: number) => ReplyLike;
  send: (payload: any) => void;
};

type RequestLike = {
  body?: any;
  query?: any;
};

const respondNotImplemented = (
  reply: ReplyLike,
  message: string = "Feature is not available in this build."
): void => {
  reply.status(501).send({
    success: false,
    error: {
      code: "NOT_IMPLEMENTED",
      message,
    },
  });
};

const respondValidationError = (
  reply: ReplyLike,
  error: ValidationError
): void => {
  reply.status(400).send({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: error.message,
      details: error.details,
    },
  });
};

const respondServerError = (
  reply: ReplyLike,
  error: unknown,
  code: string = "SCM_ERROR"
): void => {
  const message =
    error instanceof Error ? error.message : "Unexpected SCM service error";
  reply.status(500).send({
    success: false,
    error: {
      code,
      message,
    },
  });
};

export async function registerSCMRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService
): Promise<void> {
  const gitWorkdirEnv = process.env.SCM_GIT_WORKDIR;
  const gitWorkdir = gitWorkdirEnv
    ? path.resolve(gitWorkdirEnv)
    : undefined;

  const gitService = new GitService(gitWorkdir);
  const remoteName = process.env.SCM_REMOTE || process.env.SCM_REMOTE_NAME;
  const provider =
    SCM_FEATURE_ENABLED && kgService && dbService
      ? new LocalGitProvider(gitService, { remote: remoteName })
      : null;

  const scmService =
    SCM_FEATURE_ENABLED && kgService && dbService
      ? new SCMService(
          gitService,
          kgService,
          dbService,
          provider ?? undefined
        )
      : null;

  const ensureService = (reply: ReplyLike): SCMService | null => {
    if (!SCM_FEATURE_ENABLED || !scmService) {
      respondNotImplemented(reply);
      return null;
    }
    return scmService;
  };

  app.post(
    "/scm/commit-pr",
    {
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
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      try {
        const payload = { ...(request.body as CommitPRRequest) };
        if (payload.createPR === undefined) {
          payload.createPR = true;
        }
        const result = await service.createCommitAndMaybePR(payload);
        reply.send({ success: true, data: result });
      } catch (error) {
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
    }
  );

  app.post(
    "/scm/commit",
    {
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
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      const body = request.body ?? {};
      const applyArray = (value: any): string[] =>
        Array.isArray(value)
          ? value
              .filter((item) => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean)
          : [];

      const commitRequest: CommitPRRequest = {
        title: String(body.title ?? body.message ?? ""),
        description: String(body.description ?? body.body ?? ""),
        changes: applyArray(body.changes).length
          ? applyArray(body.changes)
          : applyArray(body.files),
        branchName: body.branchName ?? body.branch ?? undefined,
        labels: applyArray(body.labels),
        relatedSpecId: body.relatedSpecId ?? undefined,
        testResults: applyArray(body.testResults),
        validationResults: body.validationResults,
        createPR: false,
      };

      try {
        const result = await service.createCommitAndMaybePR(commitRequest);
        reply.send({ success: true, data: result });
      } catch (error) {
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
    }
  );

  app.get("/scm/status", async (_request: RequestLike, reply: ReplyLike) => {
    const service = ensureService(reply);
    if (!service) return;

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
    } catch (error) {
      respondServerError(reply, error);
    }
  });

  app.post(
    "/scm/push",
    {
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
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      try {
        const result = await service.push(request.body ?? {});
        reply.send({ success: true, data: result });
      } catch (error) {
        respondServerError(reply, error);
      }
    }
  );

  app.get("/scm/branches", async (_request: RequestLike, reply: ReplyLike) => {
    const service = ensureService(reply);
    if (!service) return;

    try {
      const branches = await service.listBranches();
      reply.send({ success: true, data: branches });
    } catch (error) {
      respondServerError(reply, error);
    }
  });

  app.post(
    "/scm/branch",
    {
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
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      try {
        const { name, from } = request.body ?? {};
        const branch = await service.ensureBranch(String(name), from);
        reply.send({ success: true, data: branch });
      } catch (error) {
        if (error instanceof ValidationError) {
          respondValidationError(reply, error);
          return;
        }
        respondServerError(reply, error);
      }
    }
  );

  app.get(
    "/scm/changes",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", minimum: 1, maximum: 200, default: 20 },
          },
        },
      },
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      try {
        const rawLimit = Number(request.query?.limit ?? 20);
        const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
        const records = await service.listCommitRecords(limit);
        reply.send({ success: true, data: records });
      } catch (error) {
        respondServerError(reply, error);
      }
    }
  );

  app.get(
    "/scm/diff",
    {
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
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      try {
        const query = request.query ?? {};
        const files =
          typeof query.files === "string"
            ? query.files
                .split(",")
                .map((file: string) => file.trim())
                .filter(Boolean)
            : undefined;
        const diff = await service.getDiff({
          from: query.from,
          to: query.to,
          files,
          context: query.context,
        });
        reply.send({ success: true, data: { diff } });
      } catch (error) {
        respondServerError(reply, error);
      }
    }
  );

  app.get(
    "/scm/log",
    {
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
    },
    async (request: RequestLike, reply: ReplyLike) => {
      const service = ensureService(reply);
      if (!service) return;

      try {
        const query = request.query ?? {};
        let limitValue: number | undefined;
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
      } catch (error) {
        respondServerError(reply, error);
      }
    }
  );
}
