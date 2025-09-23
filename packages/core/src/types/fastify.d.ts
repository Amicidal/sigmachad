import "fastify";
import type { AuthContext } from "@memento/api";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
