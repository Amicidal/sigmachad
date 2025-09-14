import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export interface CommitInfo {
  hash: string;
  author: string;
  email?: string;
  date?: string;
}

export class GitService {
  constructor(private cwd: string = process.cwd()) {}

  async isAvailable(): Promise<boolean> {
    try {
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], { cwd: this.cwd });
      return true;
    } catch {
      return false;
    }
  }

  async getLastCommitInfo(fileRelativePath: string): Promise<CommitInfo | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = ['log', '-1', '--pretty=format:%H|%an|%ae|%ad', '--', filePath];
      const { stdout } = await execFileAsync('git', args, { cwd: this.cwd, maxBuffer: 1024 * 1024 });
      const line = String(stdout || '').trim();
      if (!line) return null;
      const [hash, author, email, date] = line.split('|');
      return { hash, author, email, date };
    } catch {
      return null;
    }
  }

  async getNumStatAgainstHEAD(fileRelativePath: string): Promise<{ added: number; deleted: number } | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = ['diff', '--numstat', 'HEAD', '--', filePath];
      const { stdout } = await execFileAsync('git', args, { cwd: this.cwd, maxBuffer: 1024 * 1024 });
      const line = String(stdout || '').trim().split('\n').find(Boolean);
      if (!line) return null;
      const parts = line.split('\t');
      if (parts.length < 3) return null;
      const added = parseInt(parts[0], 10);
      const deleted = parseInt(parts[1], 10);
      return { added: Number.isFinite(added) ? added : 0, deleted: Number.isFinite(deleted) ? deleted : 0 };
    } catch {
      return null;
    }
  }

  async getUnifiedDiff(fileRelativePath: string, context: number = 3): Promise<string | null> {
    try {
      if (!(await this.isAvailable())) return null;
      const filePath = path.resolve(this.cwd, fileRelativePath);
      const args = ['diff', `-U${Math.max(0, Math.min(20, context))}`, '--', filePath];
      const { stdout } = await execFileAsync('git', args, { cwd: this.cwd, maxBuffer: 4 * 1024 * 1024 });
      const diff = String(stdout || '').trim();
      return diff || null;
    } catch {
      return null;
    }
  }
}
