/**
 * SCM (Source Code Management) Provider Types
 * Interfaces and types for SCM operations like Git, GitHub, etc.
 */

export interface SCMProviderPushOptions {
  remote?: string;
  force?: boolean;
}

export interface SCMProviderPullRequestPayload {
  branch: string;
  baseBranch?: string | null;
  commitHash: string;
  title: string;
  description?: string;
  changes: string[];
  metadata?: Record<string, unknown>;
  push?: SCMProviderPushOptions;
}

export interface SCMProviderResult {
  provider: string;
  remote?: string;
  pushed: boolean;
  message?: string;
  prUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SCMProvider {
  readonly name: string;
  preparePullRequest(
    payload: SCMProviderPullRequestPayload
  ): Promise<SCMProviderResult>;
}

export class SCMProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SCMProviderError';
  }
}

export class SCMProviderNotConfiguredError extends SCMProviderError {
  constructor() {
    super('SCM provider is not configured for pull request creation');
    this.name = 'SCMProviderNotConfiguredError';
  }
}


