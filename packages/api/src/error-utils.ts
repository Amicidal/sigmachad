export type ErrorWithCode = Error & { code?: string | number };

export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  return error instanceof Error ? error.message : fallback;
}

export function getErrorCode(error: unknown, fallback = 'UNKNOWN_ERROR'): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as Record<string, unknown>).code;
    if (typeof code === 'string' || typeof code === 'number') {
      return String(code);
    }
  }
  return fallback;
}

