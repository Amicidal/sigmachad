import type { Integer } from 'neo4j-driver';

type Neo4jLikeInteger = Integer & {
  toNumber(): number;
};

/**
 * Type guard to detect Neo4j Integer values
 */
export const isNeo4jInteger = (value: unknown): value is Neo4jLikeInteger =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Partial<Neo4jLikeInteger>).toNumber === 'function' &&
  typeof (value as Partial<Neo4jLikeInteger>).toString === 'function' &&
  Object.prototype.hasOwnProperty.call(value, 'low') &&
  Object.prototype.hasOwnProperty.call(value, 'high');

/**
 * Converts Neo4j Integer compatible values to native numbers with bounds checking.
 */
export const fromNeo4jInteger = (value: unknown, fallback?: number): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    const numberValue = Number(value);
    if (!Number.isSafeInteger(numberValue)) {
      throw new RangeError('Neo4j integer value exceeds safe JavaScript range');
    }
    return numberValue;
  }

  if (isNeo4jInteger(value)) {
    const numberValue = value.toNumber();
    if (!Number.isSafeInteger(numberValue)) {
      throw new RangeError('Neo4j integer value exceeds safe JavaScript range');
    }
    return numberValue;
  }

  if (value == null && fallback !== undefined) {
    return fallback;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new TypeError('Unsupported Neo4j numeric value');
};

/**
 * Recursively normalises Neo4j integer values inside objects or arrays.
 */
export const normalizeNeo4jValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeNeo4jValue(item));
  }

  if (value && typeof value === 'object') {
    if (isNeo4jInteger(value)) {
      return fromNeo4jInteger(value);
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, inner]) => [
        key,
        normalizeNeo4jValue(inner),
      ])
    );
  }

  return value;
};

/**
 * Helper to extract a numeric field from a Neo4j result row.
 */
export const getNeo4jNumericField = (
  row: Record<string, unknown>,
  field: string,
  fallback = 0
): number => {
  if (!(field in row)) {
    return fallback;
  }

  try {
    // eslint-disable-next-line security/detect-object-injection
    return fromNeo4jInteger((row as Record<string, unknown>)[field], fallback);
  } catch {
    return fallback;
  }
};
