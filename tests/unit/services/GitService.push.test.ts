import { describe, it, expect, beforeEach, vi } from "vitest";
import { GitService } from "@memento/sync/scm/GitService";

const commandLog: Array<{ cmd: string; args: string[] }> = [];

vi.mock("child_process", () => {
  return {
    execFile: vi.fn(
      (
        command: string,
        args: string[],
        options: any,
        callback?: (
          error: Error | null,
          stdout?: string,
          stderr?: string
        ) => void
      ) => {
        let cb = callback;
        if (typeof options === "function") {
          cb = options as any;
        }
        const actualCallback = cb ?? (() => {});
        const actualArgs = Array.isArray(args) ? [...args] : [];
        commandLog.push({ cmd: command, args: actualArgs });
        const respond = (error: Error | null, stdout = "", stderr = "") => {
          setImmediate(() => actualCallback(error, stdout, stderr));
        };

        const joined = actualArgs.join(" ");
        if (joined === "rev-parse --is-inside-work-tree") {
          respond(null, "true\n", "");
          return;
        }
        if (actualArgs[0] === "push") {
          respond(null, "pushed\n", "");
          return;
        }
        if (actualArgs[0] === "rev-parse") {
          respond(null, "abc123\n", "");
          return;
        }

        respond(null, "", "");
      }
    ),
  };
});

beforeEach(() => {
  commandLog.length = 0;
  vi.clearAllMocks();
});

describe("GitService.push", () => {
  it("adds --set-upstream when branch lacks tracking remote", async () => {
    const hasUpstreamSpy = vi
      .spyOn(GitService.prototype as any, "hasUpstream")
      .mockResolvedValue(false);

    const service = new GitService("/repo");
    await service.push("origin", "feature/test");

    const pushInvocation = commandLog.find((entry) => entry.args[0] === "push");
    expect(pushInvocation?.args).toEqual([
      "push",
      "--set-upstream",
      "origin",
      "feature/test",
    ]);
    expect(hasUpstreamSpy).toHaveBeenCalledWith("feature/test");

    hasUpstreamSpy.mockRestore();
  });

  it("omits --set-upstream when tracking remote already exists", async () => {
    const hasUpstreamSpy = vi
      .spyOn(GitService.prototype as any, "hasUpstream")
      .mockResolvedValue(true);

    const service = new GitService("/repo");
    await service.push("origin", "feature/test");

    const pushInvocation = commandLog.find((entry) => entry.args[0] === "push");
    expect(pushInvocation?.args).toEqual(["push", "origin", "feature/test"]);
    expect(hasUpstreamSpy).toHaveBeenCalledWith("feature/test");

    hasUpstreamSpy.mockRestore();
  });
});
