import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import type {
  SCMStatusSummary,
  SCMBranchInfo,
  SCMCommitLogEntry,
} from "../models/types.js";

const execFileAsync = promisify(execFile);
const FIELD_SEPARATOR = "\u001f";

export interface CommitInfo {
  hash: string;
  author: string;
  email?: string;
  date?: string;
}

export class GitService {
  constructor(private cwd: string = process.cwd()) {}

  private async runGit(
    args: string[],
    options: { maxBuffer?: number; env?: NodeJS.ProcessEnv } = {}
  ): Promise<string> {
    try {
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: options.maxBuffer ?? 4 * 1024 * 1024,
        env: { ...process.env, ...options.env },
      });
      return String(stdout ?? "");
    } catch (error: any) {
      const stderr = error?.stderr ? String(error.stderr).trim() : "";
      const stdout = error?.stdout ? String(error.stdout).trim() : "";
      const baseMessage = error instanceof Error ? error.message : "";
      const details = [stderr, stdout, baseMessage].filter(Boolean).join("\n");
      const command = ["git", ...args].join(" ");
      const message = details ? `${command}\n${details}` : command;
      const wrapped = new Error(`Git command failed: ${message}`);
      (wrapped as any).cause = error;
      throw wrapped;
    }
  }

  private resolvePath(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) {
      throw new Error("Empty path provided");
    }
    const absolute = path.isAbsolute(trimmed)
      ? trimmed
      : path.resolve(this.cwd, trimmed);
    const relative = path.relative(this.cwd, absolute);
    if (relative.startsWith("..")) {
      throw new Error(`Path ${input} is outside of the repository root`);
    }
    return relative.replace(/\\/g, "/");
  }

  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
        cwd: this.cwd,
      });
      return true;
    } catch {
      return false;
    }
  }

  async getLastCommitInfo(
    fileRelativePath: string
  ): Promise<CommitInfo | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = [
        "log",
        "-1",
        `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%ad`,
        "--",
        filePath,
      ];
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: 1024 * 1024,
      });
      const line = String(stdout || "").trim();
      if (!line) return null;
      const [hash, author, email, date] = line.split(FIELD_SEPARATOR);
      return { hash, author, email, date };
    } catch {
      return null;
    }
  }

  async getNumStatAgainstHEAD(
    fileRelativePath: string
  ): Promise<{ added: number; deleted: number } | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = ["diff", "--numstat", "HEAD", "--", filePath];
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: 1024 * 1024,
      });
      const line = String(stdout || "")
        .trim()
        .split("\n")
        .find(Boolean);
      if (!line) return null;
      const parts = line.split("\t");
      if (parts.length < 3) return null;
      const added = parseInt(parts[0], 10);
      const deleted = parseInt(parts[1], 10);
      return {
        added: Number.isFinite(added) ? added : 0,
        deleted: Number.isFinite(deleted) ? deleted : 0,
      };
    } catch {
      return null;
    }
  }

  async getUnifiedDiff(
    fileRelativePath: string,
    context: number = 3
  ): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = [
        "diff",
        `-U${Math.max(0, Math.min(20, context))}`,
        "--",
        filePath,
      ];
      const { stdout } = await execFileAsync("git", args, {
        cwd: this.cwd,
        maxBuffer: 4 * 1024 * 1024,
      });
      const diff = String(stdout || "").trim();
      return diff || null;
    } catch {
      return null;
    }
  }

  async getCurrentBranch(): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const output = await this.runGit(["rev-parse", "--abbrev-ref", "HEAD"]);
      const branch = output.trim();
      if (!branch || branch === "HEAD") {
        return null;
      }
      return branch;
    } catch {
      return null;
    }
  }

  async getRemoteUrl(remote: string): Promise<string | null> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const trimmed = remote.trim();
    if (!trimmed) {
      throw new Error("Remote name must not be empty");
    }

    try {
      const output = await this.runGit(["remote", "get-url", trimmed]);
      const url = output.trim();
      return url || null;
    } catch (error) {
      throw new Error(
        `Unable to resolve remote '${trimmed}': ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  async stageFiles(paths: string[]): Promise<string[]> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const unique = Array.from(
      new Set(
        paths.filter((value): value is string => typeof value === "string")
      )
    );

    if (!unique.length) {
      return [];
    }

    const relativePaths = unique.map((input) => this.resolvePath(input));

    // Validate all paths are git-tracked or new (error if outside)
    for (const relative of relativePaths) {
      const absolute = path.resolve(this.cwd, relative);
      if (!fs.existsSync(absolute)) {
        try {
          await this.runGit(["ls-files", "--error-unmatch", relative]);
        } catch (error) {
          console.warn(
            `⚠️ Staging untracked/missing file: ${relative} (will be added)`
          );
        }
      } else {
        // Check if tracked
        try {
          await this.runGit(["ls-files", "--cached", relative]);
        } catch {
          console.warn(`⚠️ Staging modified tracked file: ${relative}`);
        }
      }
    }

    await this.runGit(["add", "--", ...relativePaths]);
    return relativePaths;
  }

  async unstageFiles(paths: string[]): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const unique = Array.from(
      new Set(
        paths.filter((value): value is string => typeof value === "string")
      )
    );
    if (!unique.length) {
      return;
    }
    const relativePaths = unique.map((input) => this.resolvePath(input));
    await this.runGit(["reset", "--", ...relativePaths]);
  }

  async hasStagedChanges(): Promise<boolean> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const diff = await this.runGit(["diff", "--cached", "--name-only"]);
    return diff.trim().length > 0;
  }

  async getStagedFiles(): Promise<string[]> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const diff = await this.runGit(["diff", "--cached", "--name-only"]);
    return diff
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  async getCommitHash(ref: string = "HEAD"): Promise<string | null> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const output = await this.runGit(["rev-parse", ref]);
    const hash = output.trim();
    return hash || null;
  }

  async commit(
    title: string,
    body: string,
    options: {
      allowEmpty?: boolean;
      author?: { name: string; email?: string };
    } = {}
  ): Promise<string> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const args = ["commit", "--no-verify", "-m", title];
    if (body && body.trim().length) {
      args.push("-m", body.trim());
    }
    if (options.allowEmpty) {
      args.push("--allow-empty");
    }

    const envOverrides: NodeJS.ProcessEnv = {};
    if (options.author?.name) {
      envOverrides.GIT_AUTHOR_NAME = options.author.name;
      envOverrides.GIT_COMMITTER_NAME = options.author.name;
    }
    if (options.author?.email) {
      envOverrides.GIT_AUTHOR_EMAIL = options.author.email;
      envOverrides.GIT_COMMITTER_EMAIL = options.author.email;
    }

    await this.runGit(args, { env: envOverrides });
    const hash = await this.getCommitHash("HEAD");
    if (!hash) {
      throw new Error("Unable to determine commit hash after committing");
    }
    return hash;
  }

  private async branchExists(name: string): Promise<boolean> {
    try {
      await this.runGit(["show-ref", "--verify", `refs/heads/${name}`]);
      return true;
    } catch {
      return false;
    }
  }

  private async hasUpstream(branch: string): Promise<boolean> {
    const sanitized = branch.trim();
    if (!sanitized) {
      return false;
    }
    try {
      const output = await this.runGit([
        "rev-parse",
        "--abbrev-ref",
        `${sanitized}@{upstream}`,
      ]);
      return output.trim().length > 0;
    } catch {
      return false;
    }
  }

  async ensureBranch(
    name: string,
    from?: string,
    options?: { preservePaths?: string[] }
  ): Promise<void> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const sanitized = name.trim();
    if (!sanitized) {
      throw new Error("Branch name must not be empty");
    }

    const current = await this.getCurrentBranch();
    const exists = await this.branchExists(sanitized);

    if (exists) {
      if (current !== sanitized) {
        await this.switchWithStashSupport(sanitized, options?.preservePaths);
      }
      return;
    }

    const base = from ? from.trim() : current;
    const args = ["switch", "-c", sanitized];
    if (base && base.length) {
      args.push(base);
    }
    await this.runGit(args);
  }

  private async switchWithStashSupport(
    targetBranch: string,
    preservePaths?: string[]
  ): Promise<void> {
    try {
      await this.runGit(["switch", targetBranch]);
      return;
    } catch (error) {
      if (!this.isCheckoutConflictError(error)) {
        throw error;
      }
    }

    const stashRef = await this.stashWorkingChanges();
    let switched = false;
    try {
      await this.runGit(["switch", targetBranch]);
      switched = true;
    } catch (switchError) {
      await this.restoreStash(stashRef).catch(() => {});
      throw switchError;
    }

    if (switched) {
      if (preservePaths && preservePaths.length) {
        for (const candidate of preservePaths) {
          try {
            const relative = this.resolvePath(candidate);
            const absolute = path.resolve(this.cwd, relative);
            await fs.promises.rm(absolute, { force: true });
          } catch {
            // Ignore removal failures; stash pop may still succeed
          }
        }
      }
      let applied = false;
      try {
        await this.runGit(["stash", "apply", stashRef]);
        applied = true;
      } catch (popError) {
        const details =
          popError instanceof Error ? popError.message : String(popError ?? "");
        throw new Error(
          `Failed to reapply working changes after switching branches: ${details}. ` +
            `Stash ${stashRef} was kept for manual recovery.`
        );
      } finally {
        if (applied) {
          await this.runGit(["stash", "drop", stashRef]).catch(() => {});
        }
      }
    }
  }

  private async stashWorkingChanges(): Promise<string> {
    await this.runGit([
      "stash",
      "push",
      "--include-untracked",
      "--message",
      "memento-scm-service-temp",
    ]);
    return "stash@{0}";
  }

  private async restoreStash(ref: string): Promise<void> {
    await this.runGit(["stash", "pop", ref]);
  }

  private isCheckoutConflictError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }
    const message = error.message || "";
    return (
      message.includes("would be overwritten by checkout") ||
      message.includes("Please move or remove them before you switch branches")
    );
  }

  async getCommitDetails(ref: string): Promise<SCMCommitLogEntry | null> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const raw = await this.runGit([
      "show",
      "-s",
      `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%ad${FIELD_SEPARATOR}%s`,
      ref,
    ]);
    const line = raw.trim();
    if (!line) {
      return null;
    }
    const [hash, author, email, date, message] = line.split(FIELD_SEPARATOR);
    return {
      hash,
      author,
      email: email || undefined,
      date,
      message,
    };
  }

  async getFilesForCommit(commitHash: string): Promise<string[]> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }
    const raw = await this.runGit([
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commitHash,
    ]);
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  async push(
    remote: string,
    branch: string,
    options: { force?: boolean } = {}
  ): Promise<{ output: string }> {
    if (!(await this.isAvailable())) {
      throw new Error("Git repository is not available");
    }

    const sanitizedRemote = remote.trim();
    const sanitizedBranch = branch.trim();
    if (!sanitizedRemote) {
      throw new Error("Remote name must not be empty");
    }
    if (!sanitizedBranch) {
      throw new Error("Branch name must not be empty");
    }

    const args = ["push"];
    if (options.force) {
      args.push("--force-with-lease");
    }
    const hasTracking = await this.hasUpstream(sanitizedBranch);
    if (!hasTracking) {
      args.push("--set-upstream");
    }
    args.push(sanitizedRemote, sanitizedBranch);
    const output = await this.runGit(args);
    return { output };
  }

  async getStatusSummary(): Promise<SCMStatusSummary | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const raw = await this.runGit(["status", "--short", "--branch"]);
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (!lines.length) {
        return null;
      }

      const first = lines[0];
      let branch = "HEAD";
      let ahead = 0;
      let behind = 0;

      if (first.startsWith("##")) {
        const info = first.slice(2).trim();
        const headMatch = info.match(/^([^\.\s]+)/);
        if (headMatch) {
          branch = headMatch[1];
        }
        const aheadMatch = info.match(/ahead (\d+)/);
        const behindMatch = info.match(/behind (\d+)/);
        if (aheadMatch) ahead = Number.parseInt(aheadMatch[1], 10) || 0;
        if (behindMatch) behind = Number.parseInt(behindMatch[1], 10) || 0;
      }

      const staged: string[] = [];
      const unstaged: string[] = [];
      const untracked: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        if (line.startsWith("??")) {
          untracked.push(line.slice(3).trim());
          continue;
        }
        const status = line.slice(0, 2);
        const file = line.slice(3).trim();
        if (!file) continue;
        const stagedFlag = status[0];
        const unstagedFlag = status[1];
        if (stagedFlag && stagedFlag !== " ") {
          staged.push(file);
        }
        if (unstagedFlag && unstagedFlag !== " ") {
          unstaged.push(file);
        }
      }

      let lastCommit: SCMStatusSummary["lastCommit"] = null;
      try {
        const commitRaw = await this.runGit([
          "log",
          "-1",
          "--pretty=format:%H|%an|%ad|%s",
        ]);
        const [hash, author, date, title] = commitRaw.split("|");
        if (hash) {
          lastCommit = {
            hash,
            author: author || "",
            date,
            title: title || "",
          };
        }
      } catch {
        lastCommit = null;
      }

      const clean =
        staged.length === 0 && unstaged.length === 0 && untracked.length === 0;

      return {
        branch,
        clean,
        ahead,
        behind,
        staged,
        unstaged,
        untracked,
        lastCommit,
      };
    } catch {
      return null;
    }
  }

  async listBranches(): Promise<SCMBranchInfo[]> {
    try {
      if (!(await this.isAvailable())) return [];
      const current = await this.getCurrentBranch();
      const raw = await this.runGit([
        "for-each-ref",
        `--format=%(refname:short)${FIELD_SEPARATOR}%(objectname:short)${FIELD_SEPARATOR}%(authordate:iso8601)${FIELD_SEPARATOR}%(authorname)`,
        "refs/heads",
      ]);
      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      return lines.map((line) => {
        const [name, hash, date, author] = line.split(FIELD_SEPARATOR);
        return {
          name: name || "",
          isCurrent: current ? name === current : false,
          isRemote: false,
          upstream: null,
          lastCommit: hash
            ? {
                hash,
                title: "",
                author: author || undefined,
                date: date || undefined,
              }
            : null,
        } as SCMBranchInfo;
      });
    } catch {
      return [];
    }
  }

  async getCommitLog(
    options: {
      limit?: number;
      author?: string;
      path?: string;
      since?: string;
      until?: string;
    } = {}
  ): Promise<SCMCommitLogEntry[]> {
    try {
      if (!(await this.isAvailable())) return [];
      const args = ["log"];
      const limit = Math.max(1, Math.min(options.limit ?? 20, 200));
      args.push(`-${limit}`);
      args.push(
        `--pretty=format:%H${FIELD_SEPARATOR}%an${FIELD_SEPARATOR}%ae${FIELD_SEPARATOR}%ad${FIELD_SEPARATOR}%s${FIELD_SEPARATOR}%D`
      );
      if (options.author) {
        args.push(`--author=${options.author}`);
      }
      if (options.since) {
        args.push(`--since=${options.since}`);
      }
      if (options.until) {
        args.push(`--until=${options.until}`);
      }

      let includePath = false;
      if (options.path) {
        includePath = true;
      }

      if (includePath) {
        args.push("--");
        args.push(options.path as string);
      }

      const raw = await this.runGit(args, { maxBuffer: 8 * 1024 * 1024 });
      return raw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [hash, author, email, date, message, refs] =
            line.split(FIELD_SEPARATOR);
          return {
            hash,
            author,
            email: email || undefined,
            date,
            message,
            refs: refs
              ? refs
                  .split(",")
                  .map((ref) => ref.trim())
                  .filter(Boolean)
              : undefined,
          } as SCMCommitLogEntry;
        });
    } catch {
      return [];
    }
  }

  async getDiff(
    options: {
      from?: string;
      to?: string;
      files?: string[];
      context?: number;
    } = {}
  ): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const args = ["diff"];
      const context = options.context ?? 3;
      const normalizedContext = Math.max(0, Math.min(20, context));
      args.push(`-U${normalizedContext}`);

      if (options.from && options.to) {
        args.push(options.from, options.to);
      } else if (options.from) {
        args.push(options.from);
      } else if (options.to) {
        args.push(options.to);
      }

      if (options.files && options.files.length > 0) {
        args.push("--", ...options.files.filter(Boolean));
      }

      const diff = await this.runGit(args, { maxBuffer: 8 * 1024 * 1024 });
      const trimmed = diff.trim();
      return trimmed || null;
    } catch {
      return null;
    }
  }
}
