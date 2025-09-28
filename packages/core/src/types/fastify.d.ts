import 'fastify';
import type { AuthContext } from '@shared-types';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext;
  }
}
