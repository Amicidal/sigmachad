/**
 * Lightweight API key registry to support scoped API keys with checksum validation.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { normalizeScopes } from './scopes.js';
import {
  ApiKeyRecord,
  ApiKeyRegistry,
  ApiKeyVerification,
  ApiKeyRegistryProvider,
} from '@memento/shared-types.js';

const DEFAULT_ALGORITHM = 'sha256';

const hashSecret = (
  secret: string,
  algorithm: ApiKeyRecord['algorithm']
): string => {
  const algo = algorithm ?? DEFAULT_ALGORITHM;
  return crypto.createHash(algo).update(secret).digest('hex');
};

const computeChecksum = (record: ApiKeyRecord): string => {
  const base = `${record.id}:${record.secretHash}:${
    record.algorithm ?? DEFAULT_ALGORITHM
  }`;
  return crypto.createHash('sha256').update(base).digest('hex');
};

let cachedSignature: string | null = null;
let cachedRegistry: ApiKeyRegistry | null = null;

let registryProvider: ApiKeyRegistryProvider | null = null;

const normaliseRegistryShape = (input: any): ApiKeyRegistry => {
  if (!input) {
    return { keys: [] };
  }

  if (Array.isArray(input)) {
    return { keys: input } as ApiKeyRegistry;
  }

  if (typeof input === 'object' && Array.isArray(input.keys)) {
    return input as ApiKeyRegistry;
  }

  return { keys: [] };
};

const normaliseAndFilter = (
  registry: ApiKeyRegistry | null
): ApiKeyRegistry => {
  const shaped = normaliseRegistryShape(registry);
  shaped.keys = Array.isArray(shaped.keys)
    ? shaped.keys.filter((record) => Boolean(record?.id && record?.secretHash))
    : [];
  return shaped;
};

const loadRegistryFromProvider = (): ApiKeyRegistry => {
  if (!registryProvider) {
    return { keys: [] };
  }
  try {
    const provided = registryProvider();
    return normaliseAndFilter(provided);
  } catch {
    return { keys: [] };
  }
};

const loadRegistryFromEnv = (): { source: string; signature: string } => {
  const base = process.env.API_KEY_REGISTRY || '';
  const registryPath = process.env.API_KEY_REGISTRY_PATH;

  if (!registryPath) {
    return { source: base, signature: `env:${base}` };
  }

  try {
    const absolutePath = path.resolve(registryPath);
    const stats = fs.statSync(absolutePath);
    const fileSignature = `file:${absolutePath}:${stats.mtimeMs}:${stats.size}`;
    const fileContents = fs.readFileSync(absolutePath, 'utf8');
    return { source: fileContents, signature: fileSignature };
  } catch {
    return { source: base, signature: `env:${base}` };
  }
};

const loadRegistry = (): ApiKeyRegistry => {
  if (registryProvider) {
    return loadRegistryFromProvider();
  }

  const { source, signature } = loadRegistryFromEnv();

  if (cachedRegistry && cachedSignature === signature) {
    return cachedRegistry;
  }

  try {
    const parsed = source ? JSON.parse(source) : { keys: [] };
    cachedRegistry = normaliseAndFilter(parsed);
    cachedSignature = signature;
  } catch {
    cachedRegistry = { keys: [] };
    cachedSignature = signature;
  }

  return cachedRegistry!;
};

export const setApiKeyRegistryProvider = (
  provider: ApiKeyRegistryProvider | null
) => {
  registryProvider = provider;
  cachedRegistry = null;
  cachedSignature = null;
};

export const clearApiKeyRegistryCache = () => {
  cachedRegistry = null;
  cachedSignature = null;
};

export const isApiKeyRegistryConfigured = (): boolean => {
  const registry = loadRegistry();
  return Array.isArray(registry.keys) && registry.keys.length > 0;
};

export const authenticateApiKey = (
  apiKeyHeader: string
): ApiKeyVerification => {
  let decoded: string;
  try {
    decoded = Buffer.from(apiKeyHeader, 'base64').toString('utf8');
  } catch {
    return {
      ok: false,
      errorCode: 'INVALID_API_KEY',
      message: 'API key is not valid base64',
    };
  }

  const [keyId, providedSecret] = decoded.split(':');
  if (!keyId || !providedSecret) {
    return {
      ok: false,
      errorCode: 'INVALID_API_KEY',
      message: 'API key must be formatted as <id>:<secret>',
    };
  }

  const registry = loadRegistry();
  const record = registry.keys.find((entry) => entry.id === keyId);
  if (!record) {
    return {
      ok: false,
      errorCode: 'INVALID_API_KEY',
      message: 'API key is not recognised',
    };
  }

  if (record.checksum) {
    const expectedChecksum = computeChecksum(record);
    if (expectedChecksum !== record.checksum) {
      return {
        ok: false,
        errorCode: 'CHECKSUM_MISMATCH',
        message: 'API key registry entry checksum mismatch',
      };
    }
  }

  const algorithm = record.algorithm ?? DEFAULT_ALGORITHM;
  const providedHash = hashSecret(providedSecret, algorithm);
  if (providedHash !== record.secretHash) {
    return {
      ok: false,
      errorCode: 'INVALID_API_KEY',
      message: 'API key secret does not match',
    };
  }

  const scopes = normalizeScopes(record.scopes ?? []);
  return {
    ok: true,
    record,
    scopes,
  };
};
