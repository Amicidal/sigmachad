/**
 * Source Control Management Routes
 * Handles Git operations, commits, pull requests, and version control
 */

import { FastifyInstance } from "fastify";
import { KnowledgeGraphService } from "../../services/KnowledgeGraphService.js";
import { DatabaseService } from "../../services/DatabaseService.js";

export async function registerSCMRoutes(
  app: FastifyInstance,
  _kgService: KnowledgeGraphService,
  _dbService: DatabaseService
): Promise<void> {
  const respondNotImplemented = (reply: any, feature: string) => {
    reply.status(501).send({
      success: false,
      error: {
        code: 'NOT_IMPLEMENTED',
        message: `${feature} is not available in this build.`,
      },
    });
  };

  const routes: Array<{ method: 'get' | 'post'; url: string; feature: string }> = [
    { method: 'post', url: '/scm/commit-pr', feature: 'Commit and PR automation' },
    { method: 'get', url: '/scm/status', feature: 'Repository status inspection' },
    { method: 'post', url: '/scm/commit', feature: 'Commit creation' },
    { method: 'post', url: '/scm/push', feature: 'Push to remote repositories' },
    { method: 'get', url: '/scm/branches', feature: 'Branch listing' },
    { method: 'post', url: '/scm/branch', feature: 'Branch creation' },
    { method: 'get', url: '/scm/changes', feature: 'Repository change listing' },
    { method: 'get', url: '/diff', feature: 'Diff inspection' },
    { method: 'get', url: '/log', feature: 'Commit history retrieval' },
  ];

  for (const route of routes) {
    (app as any)[route.method](route.url, async (_request: any, reply: any) => {
      respondNotImplemented(reply, route.feature);
    });
  }
}
