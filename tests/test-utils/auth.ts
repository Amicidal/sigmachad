import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtMintOptions {
  scopes?: string[];
  permissions?: string[];
  expiresIn?: string | number;
  payload?: Record<string, unknown>;
  issuer?: string;
}

export const defaultIssuer = 'memento-test';

export const mintAccessToken = (secret: string, options: JwtMintOptions = {}): string => {
  const {
    scopes = ['graph:read'],
    permissions = [],
    expiresIn = '1h',
    payload = {},
    issuer = defaultIssuer,
  } = options;

  const signOptions: SignOptions = {
    expiresIn,
    issuer,
  };

  return jwt.sign(
    {
      userId: 'test-user-123',
      role: 'user',
      scopes,
      permissions,
      ...payload,
    },
    secret,
    signOptions
  );
};

export const mintExpiredToken = (secret: string, options: JwtMintOptions = {}): string =>
  mintAccessToken(secret, {
    ...options,
    expiresIn: '-1h',
  });

export const mintTokenWithWrongSecret = (
  wrongSecret: string,
  options: JwtMintOptions = {}
): string => {
  const {
    scopes = ['graph:read'],
    permissions = [],
    expiresIn = '1h',
    payload = {},
    issuer = defaultIssuer,
  } = options;

  return jwt.sign(
    {
      userId: 'test-user-123',
      role: 'user',
      scopes,
      permissions,
      ...payload,
    },
    wrongSecret,
    { expiresIn, issuer }
  );
};

export const encodeApiKey = (id: string, secret: string): string =>
  Buffer.from(`${id}:${secret}`).toString('base64');

export interface ApiKeyRegistryInput {
  id: string;
  secret: string;
  scopes: string[];
  algorithm?: 'sha256' | 'sha512';
  lastRotatedAt?: string;
}

export const buildApiKeyRegistry = (records: ApiKeyRegistryInput[]) => {
  const now = new Date().toISOString();
  const payload = {
    version: 'test',
    updatedAt: now,
    keys: records.map((record) => {
      const algorithm = record.algorithm ?? 'sha256';
      const secretHash = crypto
        .createHash(algorithm)
        .update(record.secret)
        .digest('hex');
      const checksumBase = `${record.id}:${secretHash}:${algorithm}`;
      const checksum = crypto.createHash('sha256').update(checksumBase).digest('hex');
      return {
        id: record.id,
        secretHash,
        algorithm,
        scopes: record.scopes,
        lastRotatedAt: record.lastRotatedAt ?? now,
        checksum,
      };
    }),
  };

  return JSON.stringify(payload);
};

