import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { registerSCMRoutes } from "@memento/api/routes/scm";
import {
  createMockRequest,
  createMockReply,
  type MockFastifyRequest,
  type MockFastifyReply,
} from "../../test-utils.js";

const scmServiceMocks: {
  createCommitAndMaybePR: ReturnType<typeof vi.fn>;
  getStatus: ReturnType<typeof vi.fn>;
  push: ReturnType<typeof vi.fn>;
  listBranches: ReturnType<typeof vi.fn>;
  ensureBranch: ReturnType<typeof vi.fn>;
  listCommitRecords: ReturnType<typeof vi.fn>;
  getDiff: ReturnType<typeof vi.fn>;
  getCommitLog: ReturnType<typeof vi.fn>;
} = {
  createCommitAndMaybePR: vi.fn(),
  getStatus: vi.fn(),
  push: vi.fn(),
  listBranches: vi.fn(),
  ensureBranch: vi.fn(),
  listCommitRecords: vi.fn(),
  getDiff: vi.fn(),
  getCommitLog: vi.fn(),
};

var ExportedValidationError: any;

vi.mock("@memento/sync/scm/SCMService", () => {
  class MockValidationError extends Error {
    details: string[];

    constructor(details: string[]) {
      super(details.join("; "));
      this.name = "ValidationError";
      this.details = details;
    }
  }

  class MockSCMService {
    constructor() {
      scmServiceMocks.createCommitAndMaybePR.mockClear();
      scmServiceMocks.getStatus.mockClear();
      scmServiceMocks.push.mockClear();
      scmServiceMocks.listBranches.mockClear();
      scmServiceMocks.ensureBranch.mockClear();
      scmServiceMocks.listCommitRecords.mockClear();
      scmServiceMocks.getDiff.mockClear();
      scmServiceMocks.getCommitLog.mockClear();
    }

    createCommitAndMaybePR = scmServiceMocks.createCommitAndMaybePR;
    getStatus = scmServiceMocks.getStatus;
    push = scmServiceMocks.push;
    listBranches = scmServiceMocks.listBranches;
    ensureBranch = scmServiceMocks.ensureBranch;
    listCommitRecords = scmServiceMocks.listCommitRecords;
    getDiff = scmServiceMocks.getDiff;
    getCommitLog = scmServiceMocks.getCommitLog;
  }

  ExportedValidationError = MockValidationError;

  return {
    SCMService: MockSCMService,
    ValidationError: MockValidationError,
  };
});

describe("SCM Routes", () => {
  let mockApp: any;
  let mockRequest: MockFastifyRequest;
  let mockReply: MockFastifyReply;

  const createMockApp = () => {
    const routes = new Map<string, { options?: any; handler: Function }>();

    const registerRoute = (
      method: string,
      path: string,
      options: any,
      handler: Function
    ) => {
      const key = `${method}:${path}`;
      routes.set(key, { options, handler });
    };

    return {
      get: vi.fn((path: string, options: any, handler?: Function) => {
        if (typeof options === "function") {
          registerRoute("get", path, undefined, options);
        } else {
          registerRoute("get", path, options, handler as Function);
        }
      }),
      post: vi.fn((path: string, options: any, handler?: Function) => {
        if (typeof options === "function") {
          registerRoute("post", path, undefined, options);
        } else {
          registerRoute("post", path, options, handler as Function);
        }
      }),
      getRegisteredRoutes: () => routes,
    };
  };

  const getHandler = (
    method: "get" | "post",
    path: string
  ): { handler: Function; options?: any } => {
    const key = `${method}:${path}`;
    const entry = mockApp.getRegisteredRoutes().get(key);
    if (!entry) {
      const available = Array.from(
        mockApp.getRegisteredRoutes().keys()
      ).join(", ");
      throw new Error(`Route ${key} not registered. Available: ${available}`);
    }
    return entry;
  };

  beforeEach(async () => {
    Object.values(scmServiceMocks).forEach((mockFn) => mockFn.mockReset());
    mockApp = createMockApp();
    mockRequest = createMockRequest();
    mockReply = createMockReply();
    vi.spyOn(mockReply, "status");
    process.env.FEATURE_SCM = "true";
    await registerSCMRoutes(mockApp as any, {} as any, {} as any);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("registers all expected routes", () => {
    const routes = Array.from(mockApp.getRegisteredRoutes().keys());
    expect(routes).toEqual(
      expect.arrayContaining([
        "post:/scm/commit-pr",
        "post:/scm/commit",
        "get:/scm/status",
        "post:/scm/push",
        "get:/scm/branches",
        "post:/scm/branch",
        "get:/scm/changes",
        "get:/scm/diff",
        "get:/scm/log",
      ])
    );
  });

  it("handles commit-pr success flow", async () => {
    const responsePayload = {
      commitHash: "abc123",
      branch: "feature/test",
      status: "committed",
      provider: "local",
      retryAttempts: 0,
      escalationRequired: false,
      relatedArtifacts: {
        spec: null,
        tests: [],
        validation: null,
      },
    };
    scmServiceMocks.createCommitAndMaybePR.mockResolvedValue(responsePayload);

    const { handler } = getHandler("post", "/scm/commit-pr");
    mockRequest.body = {
      title: "feat: add route",
      description: "Adds SCM route",
      changes: ["src/api/routes/scm.ts"],
    };

    await handler(mockRequest, mockReply);

    expect(scmServiceMocks.createCommitAndMaybePR).toHaveBeenCalledWith({
      title: "feat: add route",
      description: "Adds SCM route",
      changes: ["src/api/routes/scm.ts"],
      createPR: true,
    });
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: responsePayload,
    });
  });

  it("returns validation error when SCM service rejects commit", async () => {
    const ValidationError = ExportedValidationError;
    if (!ValidationError) {
      throw new Error("ValidationError mock not initialized");
    }
    scmServiceMocks.createCommitAndMaybePR.mockRejectedValue(
      new ValidationError(["title is required"])
    );
    const { handler } = getHandler("post", "/scm/commit-pr");
    mockRequest.body = {
      title: "",
      description: "",
      changes: [],
    };

    await handler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
    });
  });

  it("normalizes commit-only requests", async () => {
    scmServiceMocks.createCommitAndMaybePR.mockResolvedValue({
      commitHash: "hash123",
      branch: "main",
      status: "committed",
      provider: "local",
      retryAttempts: 0,
      escalationRequired: false,
      relatedArtifacts: { spec: null, tests: [], validation: null },
    });
    const { handler } = getHandler("post", "/scm/commit");
    mockRequest.body = {
      message: "fix: bug",
      body: "Detailed description",
      files: ["src/app.ts"],
      branch: "main",
    };

    await handler(mockRequest, mockReply);

    expect(scmServiceMocks.createCommitAndMaybePR).toHaveBeenCalledWith({
      title: "fix: bug",
      description: "Detailed description",
      changes: ["src/app.ts"],
      branchName: "main",
      labels: [],
      relatedSpecId: undefined,
      testResults: [],
      validationResults: undefined,
      createPR: false,
    });
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("surfaces SCM service errors as 500", async () => {
    scmServiceMocks.createCommitAndMaybePR.mockRejectedValue(
      new Error("boom")
    );
    const { handler } = getHandler("post", "/scm/commit-pr");
    mockRequest.body = {
      title: "feat: add route",
      description: "Adds SCM route",
      changes: ["src/api/routes/scm.ts"],
    };

    await handler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: "SCM_ERROR" }),
    });
  });

  it("exposes repository status", async () => {
    const status = {
      branch: "main",
      clean: true,
      ahead: 0,
      behind: 0,
      staged: [],
      unstaged: [],
      untracked: [],
      lastCommit: null,
    };
    scmServiceMocks.getStatus.mockResolvedValue(status);

    const { handler } = getHandler("get", "/scm/status");

    await handler(mockRequest, mockReply);

    expect(mockReply.send).toHaveBeenCalledWith({ success: true, data: status });
  });

  it("returns 503 when status unavailable", async () => {
    scmServiceMocks.getStatus.mockResolvedValue(null);
    const { handler } = getHandler("get", "/scm/status");

    await handler(mockRequest, mockReply);

    expect(mockReply.status).toHaveBeenCalledWith(503);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: expect.objectContaining({ code: "SCM_UNAVAILABLE" }),
    });
  });

  it("lists commit records", async () => {
    const commits = [
      { commitHash: "abc", branch: "main", title: "feat", changes: [] },
    ];
    scmServiceMocks.listCommitRecords.mockResolvedValue(commits as any);
    const { handler } = getHandler("get", "/scm/changes");

    await handler(mockRequest, mockReply);

    expect(scmServiceMocks.listCommitRecords).toHaveBeenCalledWith(20);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: commits,
    });
  });

  it("delegates push requests to SCM service", async () => {
    scmServiceMocks.push.mockResolvedValue({
      remote: "origin",
      branch: "main",
      forced: false,
      pushed: true,
      timestamp: new Date().toISOString(),
    });
    const { handler } = getHandler("post", "/scm/push");
    mockRequest.body = { remote: "origin", branch: "main" };

    await handler(mockRequest, mockReply);

    expect(scmServiceMocks.push).toHaveBeenCalledWith({
      remote: "origin",
      branch: "main",
    });
    expect(mockReply.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("parses diff query parameters", async () => {
    scmServiceMocks.getDiff.mockResolvedValue("diff-content");
    const { handler } = getHandler("get", "/scm/diff");
    mockRequest.query = { files: "a.ts,b.ts", from: "main", to: "HEAD" };

    await handler(mockRequest, mockReply);

    expect(scmServiceMocks.getDiff).toHaveBeenCalledWith({
      files: ["a.ts", "b.ts"],
      from: "main",
      to: "HEAD",
      context: undefined,
    });
    expect(mockReply.send).toHaveBeenCalledWith({
      success: true,
      data: { diff: "diff-content" },
    });
  });
});
