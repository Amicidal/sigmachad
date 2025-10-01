/**
 * Assets Proxy Routes
 * Proxies external JS libraries through the API for same-origin loading,
 * with simple in-memory caching and multi-CDN fallback.
 */
import { FastifyInstance } from 'fastify';
import { request as httpsRequest } from 'https';
import { request as httpRequest } from 'http';
import fs from 'fs';
import path from 'path';

type FetchResult = { body: Buffer; contentType: string };

const memCache = new Map<string, FetchResult>();

function fetchUrl(url: string, timeoutMs = 10000): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const req = (isHttps ? httpsRequest : httpRequest)(url, { method: 'GET', timeout: timeoutMs }, (res) => {
      if (!res || (res.statusCode && res.statusCode >= 400)) {
        reject(new Error(`HTTP ${res?.statusCode || 0}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      res.on('end', () => {
        const body = Buffer.concat(chunks);
        const contentType = (res.headers['content-type'] as string) || 'application/javascript; charset=utf-8';
        resolve({ body, contentType });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      try { req.destroy(new Error('timeout')); } catch (e) { /* intentional no-op: non-critical */ void 0; }
      reject(new Error('timeout'));
    });
    req.end();
  });
}

async function fetchFromMirrors(key: string, mirrors: string[]): Promise<FetchResult> {
  if (memCache.has(key)) return memCache.get(key)!;
  let lastError: any;
  for (const url of mirrors) {
    try {
      const result = await fetchUrl(url);
      memCache.set(key, result);
      return result;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('All mirrors failed');
}

export async function registerAssetsProxyRoutes(app: FastifyInstance): Promise<void> {
  // Serve local static assets if present: ./public/assets/<name>
  app.get('/assets/local/:name', async (req, reply) => {
    try {
      const { name } = req.params as { name: string };
      const safe = name.replace(/[^a-zA-Z0-9._-]/g, '');
      const candidates = [
        path.resolve(process.cwd(), 'public', 'assets', safe),
        path.resolve(process.cwd(), 'assets', safe),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const body = fs.readFileSync(filePath);
          const contentType = safe.endsWith('.js') ? 'application/javascript; charset=utf-8' : 'application/octet-stream';
          reply.header('content-type', contentType).send(body);
          return;
        }
      }
      reply.status(404).send({ success: false, error: { code: 'ASSET_NOT_FOUND', message: 'Local asset not found' } });
    } catch (e) {
      reply.status(500).send({ success: false, error: { code: 'ASSET_READ_FAILED', message: 'Failed to read local asset' } });
    }
  });

  // Sigma.js
  app.get('/assets/sigma.js', async (_req, reply) => {
    try {
      const res = await fetchFromMirrors('sigma', [
        'https://unpkg.com/sigma/build/sigma.min.js',
        // fallback older v2 UMD if needed
        'https://unpkg.com/sigma@2.4.0/build/sigma.min.js',
      ]);
      reply.header('content-type', res.contentType).send(res.body);
    } catch (e) {
      reply.status(502).send({ success: false, error: { code: 'ASSET_FETCH_FAILED', message: 'Failed to fetch sigma.js' } });
    }
  });

  // Graphology UMD
  app.get('/assets/graphology.js', async (_req, reply) => {
    try {
      const res = await fetchFromMirrors('graphology', [
        'https://unpkg.com/graphology@0.25.3/dist/graphology.umd.min.js',
      ]);
      reply.header('content-type', res.contentType).send(res.body);
    } catch (e) {
      reply.status(502).send({ success: false, error: { code: 'ASSET_FETCH_FAILED', message: 'Failed to fetch graphology.js' } });
    }
  });

  // ForceAtlas2 for Graphology
  app.get('/assets/forceatlas2.js', async (_req, reply) => {
    try {
      const res = await fetchFromMirrors('forceatlas2', [
        'https://unpkg.com/graphology-layout-forceatlas2/umd/graphology-layout-forceatlas2.min.js',
        'https://unpkg.com/graphology-layout-forceatlas2/umd/graphology-layout-forceatlas2.js',
      ]);
      reply.header('content-type', res.contentType).send(res.body);
    } catch (e) {
      reply.status(502).send({ success: false, error: { code: 'ASSET_FETCH_FAILED', message: 'Failed to fetch forceatlas2.js' } });
    }
  });
}
