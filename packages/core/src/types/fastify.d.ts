import "fastify";
import type { AuthContext } from "@memento/shared-types";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
