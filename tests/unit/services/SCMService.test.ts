// @ts-nocheck
import { describe, it, expect, vi } from "vitest";
import {
  SCMService,
  ValidationError,
} from "@memento/sync/scm/SCMService";
import { SCMProviderNotConfiguredError } from "@memento/sync/scm/SCMProvider";

const createMockGitService = () => ({
  isAvailable: vi.fn().mockResolvedValue(true),
  getCurrentBranch: vi.fn().mockResolvedValue("main"),
  ensureBranch: vi.fn(),
  stageFiles: vi.fn(),
  hasStagedChanges: vi.fn(),
  commit: vi.fn(),
  unstageFiles: vi.fn(),
  getCommitDetails: vi.fn(),
  getFilesForCommit: vi.fn(),
  getStagedFiles: vi.fn().mockResolvedValue([]),
});

const createMockDatabaseService = () => ({
  isInitialized: vi.fn().mockReturnValue(true),
  initialize: vi.fn().mockResolvedValue(undefined),
  recordSCMCommit: vi.fn(),
});

describe("SCMService", () => {
  it("fails fast when PR creation requested without configured provider", async () => {
    const git = createMockGitService();
    const db = createMockDatabaseService();
    const kg = {} as any;
    const service = new SCMService(git as any, kg, db as any, undefined);

    const request = {
      title: "feat: add feature",
      description: "adds new feature",
      changes: ["src/index.ts"],
    };

    await expect(
      service.createCommitAndMaybePR(request as any)
    ).rejects.toBeInstanceOf(SCMProviderNotConfiguredError);

    expect(git.isAvailable).not.toHaveBeenCalled();
    expect(git.stageFiles).not.toHaveBeenCalled();
    expect(git.commit).not.toHaveBeenCalled();
  });

  it("rejects commit when unrelated files are already staged", async () => {
    const git = createMockGitService();
    git.getStagedFiles = vi.fn().mockResolvedValue(["src/unrelated.ts"]);

    const db = createMockDatabaseService();
    const kg = {} as any;
    const service = new SCMService(git as any, kg, db as any, undefined);

    const request = {
      title: "feat: scoped change",
      description: "update only target files",
      changes: ["src/index.ts"],
      createPR: false,
    };

    await expect(
      service.createCommitAndMaybePR(request as any)
    ).rejects.toBeInstanceOf(ValidationError);
    expect(git.stageFiles).not.toHaveBeenCalled();
  });
});
