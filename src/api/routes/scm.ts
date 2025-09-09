/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";

interface CommitPRRequest {
  title: string;
  description: string;
  changes: string[];
  relatedSpecId?: string;
  testResults?: string[];
  validationResults?: string;
  createPR?: boolean;
  branchName?: string;
  labels?: string[];
}

interface CommitPRResponse {
  commitHash: string;
  prUrl?: string;
  branch: string;
  relatedArtifacts: {
    spec?: any;
    tests?: any[];
    validation?: any;
  };
}

export async function registerSCMRoutes(
  app: FastifyInstance,
  kgService: KnowledgeGraphService,
  dbService: DatabaseService
): Promise<void> {
  // POST /api/scm/commit-pr - Create commit and/or pull request
  app.post("/scm/commit-pr", async (request, reply) => {
    try {
      const params: CommitPRRequest = request.body as CommitPRRequest;

      // Manual validation for required fields
      if (!params.title || !params.description || !params.changes) {
        return reply.status(400).send({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            details: [
              {
                field: "title",
                message: "must have required property 'title'",
                code: "required",
              },
              {
                field: "description",
                message: "must have required property 'description'",
                code: "required",
              },
              {
                field: "changes",
                message: "must have required property 'changes'",
                code: "required",
              },
            ].filter((detail) => {
              if (detail.field === "title" && !params.title) return true;
              if (detail.field === "description" && !params.description)
                return true;
              if (detail.field === "changes" && !params.changes) return true;
              return false;
            }),
          },
        });
      }

      // TODO: Implement Git operations and PR creation
      const relatedArtifacts: any = {};

      // Look up related spec if provided
      if (params.relatedSpecId) {
        try {
          const specEntity = await kgService.getEntity(params.relatedSpecId);
          if (specEntity) {
            relatedArtifacts.spec = specEntity;
          }
        } catch (error) {
          // Ignore lookup errors for now
        }
      }

      // Look up related tests if provided
      if (params.testResults && params.testResults.length > 0) {
        try {
          const testEntities = [];
          for (const testId of params.testResults) {
            const testEntity = await kgService.getEntity(testId);
            if (testEntity) {
              testEntities.push(testEntity);
            }
          }
          relatedArtifacts.tests = testEntities;
        } catch (error) {
          // Ignore lookup errors for now
          relatedArtifacts.tests = [];
        }
      }

      // Include validation results if provided
      if (params.validationResults) {
        try {
          relatedArtifacts.validation = JSON.parse(params.validationResults);
        } catch (error) {
          relatedArtifacts.validation = params.validationResults;
        }
      }

      // Generate unique commit hash
      const commitHash =
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

      const result: CommitPRResponse = {
        commitHash,
        prUrl: params.createPR
          ? "https://github.com/example/pr/123"
          : undefined,
        branch: params.branchName || "feature/new-changes",
        relatedArtifacts,
      };

      reply.send({
        success: true,
        data: result,
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: "COMMIT_PR_FAILED",
          message: "Failed to create commit or pull request",
        },
      });
    }
  });

  // GET /api/scm/status - Get Git repository status
  app.get("/scm/status", async (request, reply) => {
    try {
      // TODO: Get Git status
      const status = {
        branch: "main",
        ahead: 0,
        behind: 0,
        staged: [],
        modified: [],
        untracked: [],
        lastCommit: {
          hash: "abc123",
          message: "Last commit message",
          author: "Author Name",
          date: new Date().toISOString(),
        },
      };

      reply.send({
        success: true,
        data: status,
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: "STATUS_FAILED",
          message: "Failed to get repository status",
        },
      });
    }
  });

  // POST /api/scm/commit - Create a commit
  app.post(
    "/scm/commit",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            message: { type: "string" },
            files: { type: "array", items: { type: "string" } },
            amend: { type: "boolean", default: false },
          },
          required: ["message"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { message, files, amend } = request.body as {
          message: string;
          files?: string[];
          amend?: boolean;
        };

        // TODO: Create Git commit
        const commit = {
          hash: "def456",
          message,
          files: files || [],
          author: "Author Name",
          date: new Date().toISOString(),
        };

        reply.send({
          success: true,
          data: commit,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "COMMIT_FAILED",
            message: "Failed to create commit",
          },
        });
      }
    }
  );

  // POST /api/scm/push - Push commits to remote
  app.post(
    "/scm/push",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            branch: { type: "string" },
            remote: { type: "string", default: "origin" },
            force: { type: "boolean", default: false },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { branch, remote, force } = request.body as {
          branch?: string;
          remote?: string;
          force?: boolean;
        };

        // TODO: Push to remote repository
        const result = {
          pushed: true,
          branch: branch || "main",
          remote: remote || "origin",
          commits: 1,
        };

        reply.send({
          success: true,
          data: result,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "PUSH_FAILED",
            message: "Failed to push commits",
          },
        });
      }
    }
  );

  // GET /api/scm/branches - List branches
  app.get("/scm/branches", async (request, reply) => {
    try {
      // TODO: List Git branches
      const branches = [
        { name: "main", current: true, remote: "origin/main" },
        { name: "develop", current: false, remote: "origin/develop" },
      ];

      reply.send({
        success: true,
        data: branches,
      });
    } catch (error) {
      reply.status(500).send({
        success: false,
        error: {
          code: "BRANCHES_FAILED",
          message: "Failed to list branches",
        },
      });
    }
  });

  // POST /api/scm/branch - Create new branch
  app.post(
    "/scm/branch",
    {
      schema: {
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            from: { type: "string", default: "main" },
          },
          required: ["name"],
        },
      },
    },
    async (request, reply) => {
      try {
        const { name, from } = request.body as {
          name: string;
          from?: string;
        };

        // TODO: Create new Git branch
        const branch = {
          name,
          from: from || "main",
          created: new Date().toISOString(),
        };

        reply.send({
          success: true,
          data: branch,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "BRANCH_FAILED",
            message: "Failed to create branch",
          },
        });
      }
    }
  );

  // GET /api/scm/changes - List recent changes
  app.get("/scm/changes", async (_request, reply) => {
    // Placeholder for recent changes listing
    reply.send({ success: true, data: [] });
  });

  // GET /api/scm/diff - Get diff between commits/branches
  app.get(
    "/diff",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            from: { type: "string" },
            to: { type: "string", default: "HEAD" },
            files: { type: "string" }, // comma-separated
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { from, to, files } = request.query as {
          from?: string;
          to?: string;
          files?: string;
        };

        // TODO: Get Git diff
        const diff = {
          from: from || "HEAD~1",
          to: to || "HEAD",
          files: files?.split(",") || [],
          changes: [],
          stats: {
            insertions: 0,
            deletions: 0,
            files: 0,
          },
        };

        reply.send({
          success: true,
          data: diff,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "DIFF_FAILED",
            message: "Failed to get diff",
          },
        });
      }
    }
  );

  // GET /api/scm/log - Get commit history
  app.get(
    "/log",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 20 },
            since: { type: "string", format: "date-time" },
            author: { type: "string" },
            path: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { limit, since, author, path } = request.query as {
          limit?: number;
          since?: string;
          author?: string;
          path?: string;
        };

        // TODO: Get Git commit log
        const commits: any[] = [];

        reply.send({
          success: true,
          data: commits,
        });
      } catch (error) {
        reply.status(500).send({
          success: false,
          error: {
            code: "LOG_FAILED",
            message: "Failed to get commit history",
          },
        });
      }
    }
  );
}
