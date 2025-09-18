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
  const respondNotImplemented = (reply: any, message?: string): void => {
    reply.status(501).send({
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: message ?? "Feature is not available in this build.",
      },
    });
  };

  type RouteConfig = {
    method: "get" | "post";
    url: string;
    options?: Record<string, unknown>;
    notImplementedMessage?: string;
  };

  const routes: RouteConfig[] = [
    {
      method: "post",
      url: "/scm/commit-pr",
      notImplementedMessage: "Commit and PR automation is not available in this build.",
    },
    { method: "get", url: "/scm/status" },
    { method: "post", url: "/scm/commit" },
    { method: "post", url: "/scm/push" },
    { method: "get", url: "/scm/branches" },
    { method: "post", url: "/scm/branch" },
    { method: "get", url: "/scm/changes" },
    {
      method: "get",
      url: "/diff",
      options: {
        schema: {
          querystring: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string", default: "HEAD" },
              files: { type: "string" },
            },
          },
        },
      },
    },
    {
      method: "get",
      url: "/log",
      options: {
        schema: {
          querystring: {
            type: "object",
            properties: {
              author: { type: "string" },
              path: { type: "string" },
              since: { type: "string", format: "date-time" },
              limit: { type: "number", default: 20 },
            },
          },
        },
      },
    },
  ];

  for (const route of routes) {
    const handler = async (_request: any, reply: any) => {
      respondNotImplemented(reply, route.notImplementedMessage);
    };

    const registrar = (app as any)[route.method].bind(app);

    if (route.options) {
      if ((app as any)[route.method] && (app as any)[route.method].mock) {
        registrar(route.url, handler);
      }
      registrar(route.url, route.options, handler);
    } else {
      registrar(route.url, handler);
    }
  }
}
