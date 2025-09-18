import "fastify";
import type { AuthContext } from "../api/middleware/authentication.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
