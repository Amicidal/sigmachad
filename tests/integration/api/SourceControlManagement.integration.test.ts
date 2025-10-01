/**
 * Integration tests for Source Control Management API endpoints
 * Tests commit/PR creation, branch management, and SCM integration
 * with knowledge graph and testing artifacts
 */

import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { execFile } from "child_process";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { v4 as uuidv4 } from "uuid";
import { expectSuccess } from "../../test-utils/assertions";
import { FastifyInstance } from "fastify";
import { APIGateway } from "@memento/api/APIGateway";
import { KnowledgeGraphService } from "@memento/knowledge";
import { DatabaseService } from "@memento/database/DatabaseService";
import { TestEngine } from "@memento/testing/TestEngine";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  clearTestData,
  checkDatabaseHealth,
} from "../../test-utils/database-helpers.js";
import { CodebaseEntity } from "@memento/shared-types";

const execFileAsync = promisify(execFile);

type GitWorkspace = {
  workdir: string;
  initialCommit: string;
  defaultBranch: string;
  remoteDir: string;
  remoteName: string;
};

async function runGit(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return String(stdout ?? "");
  } catch (error: any) {
    const stderr = error?.stderr ? String(error.stderr).trim() : "";
    const stdout = error?.stdout ? String(error.stdout).trim() : "";
    const details = [stderr, stdout].filter(Boolean).join("\n");
    throw new Error(`git ${args.join(" ")} failed${details ? `:\n${details}` : ""}`);
  }
}

async function createTempGitWorkspace(): Promise<GitWorkspace> {
  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "memento-scm-"));
  await runGit(["init"], workdir);
  await runGit(["config", "user.name", "Integration Bot"], workdir);
  await runGit(["config", "user.email", "integration@example.com"], workdir);

  await fs.mkdir(path.join(workdir, "docs"), { recursive: true });
  await fs.writeFile(path.join(workdir, "docs", ".keep"), "placeholder\n", "utf8");
  await runGit(["add", "."], workdir);
  await runGit(["commit", "-m", "chore: initial commit"], workdir);

  const initialCommit = (await runGit(["rev-parse", "HEAD"], workdir)).trim();
  const defaultBranch = (
    await runGit(["rev-parse", "--abbrev-ref", "HEAD"], workdir)
  ).trim();

  const remoteDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "memento-scm-remote-")
  );
  await runGit(["init", "--bare"], remoteDir);
  await runGit(["remote", "add", "origin", remoteDir], workdir);
  await runGit(["push", "-u", "origin", defaultBranch], workdir);

  return {
    workdir,
    initialCommit,
    defaultBranch,
    remoteDir,
    remoteName: "origin",
  };
}

async function resetGitWorkspace(workspace: GitWorkspace): Promise<void> {
  const { workdir, initialCommit, defaultBranch, remoteName } = workspace;
  await runGit(["switch", "-f", defaultBranch], workdir);
  await runGit(["reset", "--hard", initialCommit], workdir);
  await runGit(["clean", "-fd"], workdir);

  const branchesRaw = await runGit(["branch"], workdir);
  const branches = branchesRaw
    .split("\n")
    .map((line) => line.replace("*", "").trim())
    .filter(Boolean)
    .filter((branch) => branch !== defaultBranch);

  for (const branch of branches) {
    await runGit(["branch", "-D", branch], workdir);
  }

  // Delete remote branches created during tests
  try {
    const remoteRefs = await runGit([
      "ls-remote",
      "--heads",
      remoteName,
    ], workdir);
    const remoteBranches = remoteRefs
      .split("\n")
      .map((line) => line.split("\t")[1])
      .filter(Boolean)
      .map((ref) => ref.replace("refs/heads/", ""));
    for (const remoteBranch of remoteBranches) {
      if (remoteBranch === defaultBranch) continue;
      try {
        await runGit([
          "push",
          remoteName,
          "--delete",
          remoteBranch,
        ], workdir);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore remote cleanup issues */
  }

  // Force update default branch on remote to initial commit
  try {
    await runGit(
      [
        "push",
        "--force",
        remoteName,
        `${defaultBranch}:${defaultBranch}`,
      ],
      workdir
    );
  } catch {
    /* ignore force push issues */
  }
}

async function writeChange(
  workspace: GitWorkspace,
  relativePath: string,
  content: string
): Promise<void> {
  const targetPath = path.join(workspace.workdir, relativePath);
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, content, "utf8");
}

describe("Source Control Management API Integration", () => {
  let dbService: DatabaseService;
  let kgService: KnowledgeGraphService;
  let testEngine: TestEngine;
  let apiGateway: APIGateway;
  let app: FastifyInstance;
  let gitWorkspace: GitWorkspace;
  let previousGitWorkdirEnv: string | undefined;
  let previousAuthorName: string | undefined;
  let previousAuthorEmail: string | undefined;

  beforeAll(async () => {
    gitWorkspace = await createTempGitWorkspace();
    previousGitWorkdirEnv = process.env.SCM_GIT_WORKDIR;
    previousAuthorName = process.env.GIT_AUTHOR_NAME;
    previousAuthorEmail = process.env.GIT_AUTHOR_EMAIL;
    process.env.SCM_GIT_WORKDIR = gitWorkspace.workdir;
    process.env.GIT_AUTHOR_NAME = "Integration Bot";
    process.env.GIT_AUTHOR_EMAIL = "integration@example.com";

    // Setup test database
    dbService = await setupTestDatabase();
    const isHealthy = await checkDatabaseHealth(dbService);
    if (!isHealthy) {
      throw new Error(
        "Database health check failed - cannot run integration tests"
      );
    }

    // Create services
    kgService = new KnowledgeGraphService(dbService.getConfig().neo4j);
    testEngine = new TestEngine(kgService, dbService);

    // Create API Gateway
    apiGateway = new APIGateway(kgService, dbService);
    app = apiGateway.getApp();

    // Start the server
    await apiGateway.start();
  }, 30000);

  afterAll(async () => {
    if (apiGateway) {
      await apiGateway.stop();
    }
    if (dbService && dbService.isInitialized()) {
      await cleanupTestDatabase(dbService);
    }
    if (gitWorkspace?.workdir) {
      await fs.rm(gitWorkspace.workdir, { recursive: true, force: true });
    }
    if (gitWorkspace?.remoteDir) {
      await fs.rm(gitWorkspace.remoteDir, { recursive: true, force: true });
    }
    if (previousGitWorkdirEnv !== undefined) {
      process.env.SCM_GIT_WORKDIR = previousGitWorkdirEnv;
    } else {
      delete process.env.SCM_GIT_WORKDIR;
    }
    if (previousAuthorName !== undefined) {
      process.env.GIT_AUTHOR_NAME = previousAuthorName;
    } else {
      delete process.env.GIT_AUTHOR_NAME;
    }
    if (previousAuthorEmail !== undefined) {
      process.env.GIT_AUTHOR_EMAIL = previousAuthorEmail;
    } else {
      delete process.env.GIT_AUTHOR_EMAIL;
    }
  }, 10000);

  beforeEach(async () => {
    if (dbService && dbService.isInitialized()) {
      await clearTestData(dbService);
    }
    if (gitWorkspace) {
      await resetGitWorkspace(gitWorkspace);
    }
  });

  describe("POST /api/v1/scm/commit-pr", () => {
    it("should create commit with linked artifacts", async () => {
      // Setup test data: spec, tests, and code changes
      const specEntity: CodebaseEntity = {
        id: "feature-spec",
        path: "docs/features/user-auth.md",
        hash: "spec123",
        language: "markdown",
        lastModified: new Date(),
        created: new Date(),
        type: "spec",
        title: "User Authentication Feature",
        description: "Implement secure user authentication",
        acceptanceCriteria: [
          "Users can register with email/password",
          "Users can login with valid credentials",
          "Invalid login attempts are rejected",
        ],
        status: "approved",
        priority: "high",
      };

      const testEntity: CodebaseEntity = {
        id: "auth-tests",
        path: "src/services/__tests__/AuthService.test.ts",
        hash: "test123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "test",
        testType: "unit",
        targetSymbol: "auth-service",
      };

      const codeEntity: CodebaseEntity = {
        id: "auth-service",
        path: "src/services/AuthService.ts",
        hash: "code123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "class",
        name: "AuthService",
        signature: "class AuthService",
      };

      // Create entities
      await kgService.createEntity(specEntity);
      await kgService.createEntity(testEntity);
      await kgService.createEntity(codeEntity);

      await writeChange(
        gitWorkspace,
        "src/services/AuthService.ts",
        `export const authService = '${uuidv4()}';\n`
      );
      await writeChange(
        gitWorkspace,
        "src/services/__tests__/AuthService.test.ts",
        `export const authServiceTest = '${uuidv4()}';\n`
      );
      await writeChange(
        gitWorkspace,
        "docs/features/user-auth.md",
        `# User Authentication\n\nToken: ${uuidv4()}\n`
      );

      // Test commit/PR creation
      const commitRequest = {
        title: "feat: implement user authentication",
        description:
          "Add secure user authentication with JWT tokens\n\n- Email/password registration\n- Login with credential validation\n- JWT token generation\n\nRelated to: #123",
        changes: [
          "src/services/AuthService.ts",
          "src/services/__tests__/AuthService.test.ts",
          "docs/features/user-auth.md",
        ],
        relatedSpecId: specEntity.id,
        testResults: [testEntity.id],
        createPR: true,
        branchName: "feature/user-auth",
        labels: ["enhancement", "security", "user-facing"],
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(commitRequest),
      });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload || "{}");
      expectSuccess(body);

      expect(body.data).toEqual(
        expect.objectContaining({
          commitHash: expect.any(String),
          branch: expect.any(String),
          status: expect.stringMatching(/committed|pending|failed/),
          provider: expect.any(String),
          retryAttempts: expect.any(Number),
          escalationRequired: expect.any(Boolean),
          relatedArtifacts: expect.any(Object),
        })
      );

      if (commitRequest.createPR) {
        expect(body.data.prUrl).toEqual(expect.any(String));
      }

      expect(body.data.relatedArtifacts).toEqual(
        expect.objectContaining({
          spec: expect.any(Object),
          tests: expect.any(Array),
        })
      );

      expect(body.data.relatedArtifacts.spec.id).toBe(specEntity.id);
      expect(body.data.relatedArtifacts.spec.title).toBe(specEntity.title);
      expect(body.data.status).toBe("pending");
      expect(body.data.escalationRequired).toBe(false);
    });

    it("should handle commit-only requests without PR creation", async () => {
      // Setup minimal test data
      const codeEntity: CodebaseEntity = {
        id: "simple-fix",
        path: "src/utils/helpers.ts",
        hash: "fix123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "function",
        name: "formatDate",
        signature: "function formatDate(date: Date): string",
      };

      await kgService.createEntity(codeEntity);

      await writeChange(
        gitWorkspace,
        "src/utils/helpers.ts",
        `export const formatDate = () => '${uuidv4()}';\n`
      );

      const commitOnlyRequest = {
        title: "fix: correct date formatting in helper function",
        description: "Fix date formatting bug in formatDate utility function",
        changes: ["src/utils/helpers.ts"],
        createPR: false,
        branchName: "main",
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(commitOnlyRequest),
      });
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload || "{}");
      expectSuccess(body);
      expect(body.data.commitHash).toEqual(expect.any(String));
      expect(body.data.prUrl).toBeUndefined();
      expect(body.data.branch).toBe(commitOnlyRequest.branchName);
      expect(body.data.status).toBe("committed");
      expect(body.data.provider).toBe("local");
      expect(body.data.retryAttempts).toBe(0);
      expect(body.data.escalationRequired).toBe(false);
    });

    it("escalates for manual intervention when provider push fails", async () => {
      const remoteName = gitWorkspace.remoteName;
      const workdir = gitWorkspace.workdir;

      const codeEntity: CodebaseEntity = {
        id: "provider-failure",
        path: "src/utils/provider-failure.ts",
        hash: "provider123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "function",
        name: "providerFailure",
        signature: "function providerFailure(): void",
      };

      await kgService.createEntity(codeEntity);

      await writeChange(
        gitWorkspace,
        "src/utils/provider-failure.ts",
        `export const providerFailure = '${uuidv4()}';\n`
      );

      await runGit(['remote', 'remove', remoteName], workdir).catch(() => {});

      const commitRequest = {
        title: "feat: simulate provider failure",
        description: "Trigger provider escalation path",
        changes: ["src/utils/provider-failure.ts"],
        createPR: true,
        branchName: "feature/provider-failure",
      };

      let responseBody: any;
      try {
        const response = await app.inject({
          method: "POST",
          url: "/api/v1/scm/commit-pr",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify(commitRequest),
        });

        expect(response.statusCode).toBe(200);
        responseBody = JSON.parse(response.payload || "{}");
        expectSuccess(responseBody);
        expect(responseBody.data.status).toBe("failed");
        expect(responseBody.data.escalationRequired).toBe(true);
        expect(responseBody.data.providerError).toEqual(
          expect.objectContaining({ message: expect.any(String) })
        );
        expect(responseBody.data.retryAttempts).toBeGreaterThanOrEqual(1);
        expect(responseBody.data.prUrl).toBeUndefined();

        const records = await dbService.listSCMCommits(10);
        const record = records.find(
          (entry) => entry.commitHash === responseBody.data.commitHash
        );
        expect(record).toBeDefined();
        expect(record?.status).toBe("failed");
        expect(record?.metadata?.escalationRequired).toBe(true);
      } finally {
        // Restore remote for subsequent tests
        try {
          await runGit(['remote', 'add', remoteName, gitWorkspace.remoteDir], workdir);
        } catch {
          await runGit(['remote', 'set-url', remoteName, gitWorkspace.remoteDir], workdir).catch(() => {});
        }
        await runGit(['fetch', remoteName], workdir).catch(() => {});

        // Ensure response body is defined for TypeScript narrowing in assertions above
        void responseBody;
      }
    });

    it("should validate commit request parameters", async () => {
      // Test with missing required fields
      const invalidRequest = {
        description: "Missing title and changes",
        createPR: true,
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(invalidRequest),
      });
      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.payload || "{}");
      expect(body.success).toBe(false);
      expect(body.error).toEqual(expect.any(Object));
      expect(["VALIDATION_ERROR", "FST_ERR_VALIDATION"]).toContain(
        body.error.code
      );
    });

    it("should handle validation results in commit creation", async () => {
      // Setup test data with validation results
      const specEntity: CodebaseEntity = {
        id: "validation-spec",
        path: "docs/features/data-validation.md",
        hash: "valspec123",
        language: "markdown",
        lastModified: new Date(),
        created: new Date(),
        type: "spec",
        title: "Data Validation Enhancement",
        description: "Add comprehensive data validation",
        acceptanceCriteria: [
          "All inputs are validated",
          "Error messages are clear",
        ],
        status: "approved",
        priority: "medium",
      };

      const testEntity: CodebaseEntity = {
        id: "validation-tests",
        path: "src/utils/__tests__/validation.test.ts",
        hash: "valtest123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "test",
        testType: "unit",
        targetSymbol: "validation-utils",
      };

      await kgService.createEntity(specEntity);
      await kgService.createEntity(testEntity);

      await writeChange(
        gitWorkspace,
        "src/utils/validation.ts",
        `export const validationUtil = () => '${uuidv4()}';\n`
      );
      await writeChange(
        gitWorkspace,
        "src/utils/__tests__/validation.test.ts",
        `export const validationUtilTest = '${uuidv4()}';\n`
      );

      // Mock validation results (in a real scenario, these would come from the validation API)
      const validationResults = {
        overall: {
          passed: true,
          score: 95,
          duration: 1250,
        },
        typescript: {
          errors: 0,
          warnings: 2,
          passed: true,
        },
        eslint: {
          errors: 0,
          warnings: 1,
          passed: true,
        },
        tests: {
          passed: 15,
          failed: 0,
          skipped: 0,
          coverage: 92,
        },
      };

      const commitWithValidationRequest = {
        title: "feat: add data validation utilities",
        description:
          "Implement comprehensive input validation with error handling",
        changes: [
          "src/utils/validation.ts",
          "src/utils/__tests__/validation.test.ts",
        ],
        relatedSpecId: specEntity.id,
        testResults: [testEntity.id],
        validationResults: JSON.stringify(validationResults),
        createPR: true,
        branchName: "feature/data-validation",
        labels: ["enhancement", "validation"],
      };

      const response = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(commitWithValidationRequest),
      });
      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.payload || "{}");
      expectSuccess(body);
      expect(body.data.relatedArtifacts).toEqual(
        expect.objectContaining({
          validation: expect.any(Object),
        })
      );
      expect(body.data.relatedArtifacts.validation.overall.passed).toBe(true);
      expect(body.data.relatedArtifacts.validation.overall.score).toBe(95);
      expect(body.data.status).toBe("pending");
      expect(body.data.retryAttempts).toBeGreaterThanOrEqual(1);
      expect(body.data.escalationRequired).toBe(false);
    });

    it("should handle concurrent commit requests", async () => {
      // Setup multiple independent changes
      const commitRequests = [];
      for (let i = 0; i < 3; i++) {
        const codeEntity: CodebaseEntity = {
          id: `concurrent-feature-${i}`,
          path: `src/features/feature${i}.ts`,
          hash: `feat${i}23`,
          language: "typescript",
          lastModified: new Date(),
          created: new Date(),
          type: "symbol",
          kind: "function",
          name: `feature${i}`,
          signature: `function feature${i}(): void`,
        };

        await kgService.createEntity(codeEntity);

        await writeChange(
          gitWorkspace,
          `src/features/feature${i}.ts`,
          `export const feature${i} = '${uuidv4()}';\n`
        );

        commitRequests.push({
          title: `feat: implement feature ${i}`,
          description: `Add feature ${i} functionality`,
          changes: [`src/features/feature${i}.ts`],
          createPR: false,
          branchName: `feature/feature-${i}`,
        });
      }

      // Execute concurrent commit requests
      const responses = await Promise.all(
        commitRequests.map((request) =>
          app.inject({
            method: "POST",
            url: "/api/v1/scm/commit-pr",
            headers: {
              "content-type": "application/json",
            },
            payload: JSON.stringify(request),
          })
        )
      );

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload || "{}");
        expectSuccess(body);
        expect(body.data.commitHash).toEqual(expect.any(String));
        expect(body.data.status).toBe("committed");
        expect(body.data.escalationRequired).toBe(false);
      });

      // All commits should have unique hashes
      const commitHashes = responses
        .map((r) => JSON.parse(r.payload || "{}").data.commitHash);

      const uniqueHashes = new Set(commitHashes);
      expect(uniqueHashes.size).toBe(commitHashes.length);
    });

    it("should handle branch naming conflicts gracefully", async () => {
      // Setup test data
      const codeEntity: CodebaseEntity = {
        id: "branch-conflict-test",
        path: "src/utils/branch-test.ts",
        hash: "branch123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "function",
        name: "branchTest",
        signature: "function branchTest(): void",
      };

      await kgService.createEntity(codeEntity);

      await writeChange(
        gitWorkspace,
        "src/utils/branch-test.ts",
        `export const branchTest = '${uuidv4()}';\n`
      );

      // First commit to create the branch
      const firstCommitRequest = {
        title: "feat: initial branch commit",
        description: "Create initial commit on feature branch",
        changes: ["src/utils/branch-test.ts"],
        createPR: false,
        branchName: "feature/test-branch",
      };

      const firstResponse = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(firstCommitRequest),
      });
      expect(firstResponse.statusCode).toBe(200);

      await writeChange(
        gitWorkspace,
        "src/utils/branch-test.ts",
        `export const branchTest = '${uuidv4()}';\n`
      );

      const secondCommitRequest = {
        title: "feat: additional changes to branch",
        description: "Add more changes to existing branch",
        changes: ["src/utils/branch-test.ts"],
        createPR: false,
        branchName: "feature/test-branch",
      };

      const secondResponse = await app.inject({
        method: "POST",
        url: "/api/v1/scm/commit-pr",
        headers: {
          "content-type": "application/json",
        },
        payload: JSON.stringify(secondCommitRequest),
      });
      expect(secondResponse.statusCode).toBe(200);

      const firstBody = JSON.parse(firstResponse.payload || "{}");
      const secondBody = JSON.parse(secondResponse.payload || "{}");

      expect(firstBody.data.commitHash).not.toBe(
        secondBody.data.commitHash
      );
      expect(firstBody.data.branch).toBe(secondBody.data.branch);
      expect(firstBody.data.status).toBe("committed");
      expect(secondBody.data.status).toBe("committed");
      expect(firstBody.data.escalationRequired).toBe(false);
      expect(secondBody.data.escalationRequired).toBe(false);
    });

    it("should support different commit message formats", async () => {
      const codeEntity: CodebaseEntity = {
        id: "commit-format-test",
        path: "src/utils/format-test.ts",
        hash: "format123",
        language: "typescript",
        lastModified: new Date(),
        created: new Date(),
        type: "symbol",
        kind: "function",
        name: "formatTest",
        signature: "function formatTest(): void",
      };

      await kgService.createEntity(codeEntity);

      // Test different conventional commit formats
      const commitFormats = [
        {
          title: "feat: add new formatting utility",
          description: "Add utility function for text formatting",
        },
        {
          title: "fix: correct formatting bug",
          description:
            "Fix bug in formatDate function\n\n- Handle null dates\n- Add timezone support",
        },
        {
          title: "refactor: simplify format logic",
          description:
            "Simplify the text formatting logic for better readability",
        },
        {
          title: "docs: update formatting documentation",
          description: "Update README with formatting examples",
        },
      ];

      const responses: Array<{ statusCode: number; payload: string }> = [];
      for (const format of commitFormats) {
        await writeChange(
          gitWorkspace,
          "src/utils/format-test.ts",
          `export const formatTest = '${uuidv4()}';\n`
        );

        const response = await app.inject({
          method: "POST",
          url: "/api/v1/scm/commit-pr",
          headers: {
            "content-type": "application/json",
          },
          payload: JSON.stringify({
            ...format,
            changes: ["src/utils/format-test.ts"],
            createPR: false,
          }),
        });
        responses.push({ statusCode: response.statusCode, payload: response.payload });
      }

      responses.forEach((response) => {
        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.payload || "{}");
        expectSuccess(body);
        expect(body.data.status).toBe("committed");
        expect(body.data.escalationRequired).toBe(false);
      });
    });
  });
});
