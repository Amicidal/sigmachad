import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { registerGraphRoutes } from '@/api/routes/graph';

describe('/graph/modules/children query coercion', () => {
  let app: ReturnType<typeof Fastify>;
  const listModuleChildren = vi.fn(async () => ({ items: [], total: 0 }));

  beforeEach(async () => {
    app = Fastify();

    await registerGraphRoutes(
      app,
      {
        listModuleChildren,
      } as any,
      {} as any,
    );
  });

  afterEach(async () => {
    listModuleChildren.mockClear();
    await app.close();
  });

  it('accepts string boolean query values', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/graph/modules/children?modulePath=core&includeFiles=false&includeSymbols=true',
    });

    expect(response.statusCode).toBe(200);
    expect(listModuleChildren).toHaveBeenCalledWith('core', expect.objectContaining({
      includeFiles: false,
      includeSymbols: true,
    }));
  });
});
